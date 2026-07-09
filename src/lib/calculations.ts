import type { Branch, DailyEntry, ExpenseEntry, Leave, PayrollAdvance, Staff, Transfer, GlobalSettings, MonthlyExpense } from './types';

export const parseLocalDate = (ymd?: string | null): Date | null =>
  ymd ? new Date(ymd + 'T00:00') : null;

export interface BranchFinancials {
  revenue: number; fixed: number; variable: number; gst: number; salary: number; net: number;
}

// Single source of truth for a branch's month P&L, mirroring the web ERP:
// net = collection − variable − fixed − GST(on online) − salary.
export function branchFinancials(
  b: Branch,
  monthStr: string,
  entries: DailyEntry[],
  expenses: ExpenseEntry[],
  monthlyExpenses: MonthlyExpense[],
  staff: Staff[],
  settings: GlobalSettings,
  leaves: Leave[],
  includeSalary = true,
): BranchFinancials {
  const revenue = branchIncomeInPeriod(b.id, entries, monthStr);
  const fx = getMonthlyFixed(b, monthStr, monthlyExpenses);
  const fixed = Object.values(fx).reduce((s, v) => s + (v || 0), 0);
  const variable = expenses
    .filter(e => e.branch_id === b.id && e.date && e.date.startsWith(monthStr))
    .reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const online = entries
    .filter(e => e.branch_id === b.id && e.date && e.date.startsWith(monthStr))
    .reduce((s, e) => s + (Number((e as any).online) || 0), 0);
  const gst = Math.round(online * (settings.gst_pct || 0) / 100);
  const salary = includeSalary
    ? staff.filter(st => st.branch_id === b.id)
        .reduce((s, st) => s + proRataSalary(st, monthStr, [b], settings, leaves), 0)
    : 0;
  const net = revenue - variable - fixed - gst - salary;
  return { revenue, fixed, variable, gst, salary, net };
}

// Sum branchFinancials across several month prefixes (year-mode periods).
export function branchFinancialsForMonths(
  b: Branch,
  months: string[],
  entries: DailyEntry[],
  expenses: ExpenseEntry[],
  monthlyExpenses: MonthlyExpense[],
  staff: Staff[],
  settings: GlobalSettings,
  leaves: Leave[],
  includeSalary = true,
): BranchFinancials {
  return months.reduce<BranchFinancials>((acc, mp) => {
    const f = branchFinancials(b, mp, entries, expenses, monthlyExpenses, staff, settings, leaves, includeSalary);
    return {
      revenue: acc.revenue + f.revenue, fixed: acc.fixed + f.fixed, variable: acc.variable + f.variable,
      gst: acc.gst + f.gst, salary: acc.salary + f.salary, net: acc.net + f.net,
    };
  }, { revenue: 0, fixed: 0, variable: 0, gst: 0, salary: 0, net: 0 });
}

export function getMonthlyFixed(branch: Branch | null | undefined, monthStr: string, monthlyExpenses: MonthlyExpense[] = []) {
  const b: any = branch || {};
  const rec = monthlyExpenses.find(m => m.branch_id === b.id && m.month === monthStr);
  const fv = (recVal: any, branchVal: any) =>
    (recVal !== undefined && recVal !== null) ? Number(recVal) || 0 : (Number(branchVal) || 0);
  return {
    shop_rent: fv(rec?.shop_rent, b.shop_rent),
    room_rent: fv(rec?.room_rent, b.room_rent),
    shop_elec: fv(rec?.shop_elec, b.shop_elec),
    room_elec: fv(rec?.room_elec, b.room_elec),
    wifi: fv(rec?.wifi, b.wifi),
    water: fv(rec?.water, b.water),
    petrol: fv(rec?.petrol, b.petrol),
    maid: fv(rec?.maid, b.maid),
    dust: fv(rec?.dust, b.dust),
  };
}

export function computeCashInHand(
  entry: DailyEntry | null,
  opts: { branch?: Branch | null; staffList?: Staff[] } = {}
): number {
  if (!entry) return 0;
  const { branch = null, staffList = [] } = opts;
  const cash = Number(entry.cash) || 0;
  const sb = entry.staff_billing || [];
  const isUnisex = ((branch?.type) || '').toLowerCase() === 'unisex';
  let tipsInCash = 0, tipsPaidCash = 0, takenInc = 0;
  for (const r of sb) {
    const tips = Number(r.tips) || 0;
    if ((r.tip_in || 'online') === 'cash') tipsInCash += tips;
    if ((r.tip_paid || 'cash') === 'cash') tipsPaidCash += tips;
    let taken: boolean;
    if (r.incentive_taken !== undefined) {
      taken = r.incentive_taken !== false;
    } else {
      const staffRec = staffList.find(x => x.id === r.staff_id);
      const role = (staffRec?.role || '').toLowerCase();
      taken = isUnisex ? (role.includes('hairdresser') || role.includes('hair dresser')) : true;
    }
    if (taken) takenInc += (Number(r.incentive) || 0) + (Number(r.mat_incentive) || 0);
  }
  const others = Number(entry.others) || 0;
  const petrol = Number(entry.petrol) || 0;
  return cash + tipsInCash - tipsPaidCash - takenInc - others - petrol;
}

export function effectiveCashInHand(entry: DailyEntry | null): number {
  if (!entry) return 0;
  if (entry.actual_cash !== null && entry.actual_cash !== undefined && entry.actual_cash !== '') {
    return Number(entry.actual_cash) || 0;
  }
  return Number(entry.cash_in_hand) || 0;
}

export function effectiveBranchOnDate(st: Staff | null | undefined, dateStr: string, transfers: Transfer[] = []): string | null {
  if (!st) return null;
  const t = transfers.find(x =>
    x.staff_id === st.id && x.status === 'active' &&
    (!x.start_date || x.start_date <= dateStr) &&
    (!x.end_date || x.end_date >= dateStr)
  );
  return t ? t.to_branch_id : (st.branch_id || null);
}

export function staffAtBranchOnDate(branchId: string, dateStr: string, staffList: Staff[] = [], transfers: Transfer[] = []): Staff[] {
  return staffList.filter(s => effectiveBranchOnDate(s, dateStr, transfers) === branchId);
}

export function staffOverallStatus(st: Staff, forMonth?: string): 'active' | 'inactive' {
  if (!st.exit_date) return 'active';
  const exit = parseLocalDate(st.exit_date)!;
  if (forMonth) {
    const [yr, mo] = forMonth.split('-').map(Number);
    return exit < new Date(yr, mo - 1, 1) ? 'inactive' : 'active';
  }
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  return exit < todayStart ? 'inactive' : 'active';
}

export interface StaffMonthStatus {
  status: 'active' | 'partial' | 'inactive';
  daysWorked: number;
  calDays?: number;
  toDate?: boolean;
  joinedOn?: string;
  exitedOn?: string;
}

export function staffStatusForMonth(st: Staff, monthStr: string, opts: { capToYesterday?: boolean } = {}): StaffMonthStatus {
  const { capToYesterday = false } = opts;
  const [yr, mo] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const monthStart = new Date(yr, mo - 1, 1);
  let monthEnd = new Date(yr, mo, 0);
  let fullMonth = true;

  if (capToYesterday) {
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === yr && now.getMonth() + 1 === mo;
    if (isCurrentMonth) {
      const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      if (y < monthStart) return { status: 'active', daysWorked: 0, calDays: 0, toDate: true };
      if (y < monthEnd) { monthEnd = y; fullMonth = false; }
    }
  }

  const joinDate = parseLocalDate(st.join);
  const exitDate = parseLocalDate(st.exit_date);
  if (joinDate && joinDate > monthEnd) return { status: 'inactive', daysWorked: 0 };
  if (exitDate && exitDate < monthStart) return { status: 'inactive', daysWorked: 0 };

  if ((!joinDate || joinDate <= monthStart) && (!exitDate || exitDate >= monthEnd) && fullMonth) {
    return { status: 'active', daysWorked: daysInMonth };
  }

  const effStart = (joinDate && joinDate > monthStart) ? joinDate : monthStart;
  const effEnd = (exitDate && exitDate < monthEnd) ? exitDate : monthEnd;
  const calDays = Math.round((effEnd.getTime() - effStart.getTime()) / 86400000) + 1;
  const worked = Math.max(0, calDays);
  const spansFullWindow = (!joinDate || joinDate <= monthStart) && (!exitDate || exitDate >= monthEnd);
  return {
    status: spansFullWindow && !fullMonth ? 'active' : 'partial',
    daysWorked: worked,
    calDays,
    toDate: !fullMonth,
    joinedOn: st.join,
    exitedOn: st.exit_date,
  };
}

export function proRataSalary(
  st: Staff,
  monthStr: string,
  branches: Branch[] = [],
  globalSettings: GlobalSettings = {},
  leaves: Leave[] = []
): number {
  const salary = Number(st.salary) || 0;
  if (!salary) return 0;

  const [yr, mo] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(yr, mo, 0).getDate();
  const branch = branches.find(b => b.id === st.branch_id);
  let quotaPerMonth = branch && branch.type === 'unisex' ? 3 : 2;
  if (branch?.type === 'mens' && globalSettings.mens_leaves !== undefined) quotaPerMonth = globalSettings.mens_leaves;
  if (branch?.type === 'unisex' && globalSettings.unisex_leaves !== undefined) quotaPerMonth = globalSettings.unisex_leaves;

  const monthStart = new Date(yr, mo - 1, 1);
  const monthEnd = new Date(yr, mo, 0);
  const joinDate = parseLocalDate(st.join);
  const exitDate = parseLocalDate(st.exit_date);

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === yr && now.getMonth() + 1 === mo;
  let capEnd = monthEnd;
  if (isCurrentMonth) {
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (y < monthStart) return 0;
    if (y < monthEnd) capEnd = y;
  }

  const effectiveStart = (joinDate && joinDate > monthStart) ? joinDate : monthStart;
  const effectiveEnd = (exitDate && exitDate < capEnd) ? exitDate : capEnd;
  if (effectiveStart > effectiveEnd) return 0;

  const calDays = Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / 86400000) + 1;
  const proPaidLeave = Math.ceil(quotaPerMonth * calDays / daysInMonth);

  const approvedLeaves = leaves.filter(l =>
    l.staff_id === st.id && l.status === 'approved' && l.date && l.date.startsWith(monthStr)
  );
  const totalLeaveDays = approvedLeaves.reduce((s, l) => s + (Number(l.days) || 1), 0);
  const unpaidLeaveDays = Math.max(0, totalLeaveDays - proPaidLeave);
  const payableDays = Math.max(0, calDays - unpaidLeaveDays);
  return Math.round((salary / daysInMonth) * payableDays);
}

export function staffBillingInPeriod(sid: string, entries: DailyEntry[], filterPrefix: string): number {
  let billing = 0;
  entries.filter(e => e.date && e.date.startsWith(filterPrefix)).forEach(e => {
    const sb = (e.staff_billing || []).find(x => x.staff_id === sid);
    if (sb) billing += sb.billing || 0;
  });
  return billing;
}

export function staffIncentivesInPeriod(sid: string, entries: DailyEntry[], filterPrefix: string): number {
  let inc = 0;
  entries.filter(e => e.date && e.date.startsWith(filterPrefix)).forEach(e => {
    const sb = (e.staff_billing || []).find(x => x.staff_id === sid);
    if (sb) inc += (sb.incentive || 0) + (sb.mat_incentive || 0);
  });
  return inc;
}

// Branch collection = online + cash + material sale (sum of staff_billing[].material),
// matching the web ERP's cumulativeCollection/monthCollection. Entry docs store
// flat `online`/`cash` fields — NOT a nested `income` object.
export function branchIncomeInPeriod(bid: string, entries: DailyEntry[], filterPrefix: string): number {
  return entries.filter(e => e.date && e.branch_id === bid && e.date.startsWith(filterPrefix))
    .reduce((s, e) => {
      const matSale = (e.staff_billing || []).reduce((m: number, sb: any) => m + (Number(sb.material) || 0), 0);
      return s + (Number((e as any).online) || 0) + (Number(e.cash) || 0) + matSale;
    }, 0);
}

export function staffAdvancesInMonth(sid: string, monthStr: string, advances: PayrollAdvance[] = []): number {
  return advances
    .filter(a => a.staff_id === sid && a.status === 'approved' && (a.month_str === monthStr || (a.date && a.date.startsWith(monthStr))))
    .reduce((s, a) => s + (Number(a.amount) || 0), 0);
}

export function staffLeavesInMonth(sid: string, monthStr: string, leaves: Leave[] = []): number {
  return leaves
    .filter(l => l.staff_id === sid && l.status === 'approved' && l.date && l.date.startsWith(monthStr))
    .reduce((s, l) => s + (l.days || 1), 0);
}

export function makeFilterPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}
