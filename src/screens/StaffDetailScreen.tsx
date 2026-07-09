import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, radius, space } from '../theme';
import { StatCard } from '../components/StatCard';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { useApp } from '../store';
import { MONTHS, monthYM } from '../lib/constants';
import {
  proRataSalary, staffAdvancesInMonth, staffBillingInPeriod, staffIncentivesInPeriod,
  staffLeavesInMonth, staffStatusForMonth, effectiveBranchOnDate,
} from '../lib/calculations';

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(1, ...data);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 44 }}>
      {data.map((v, i) => (
        <View key={i} style={{
          flex: 1, height: Math.max(2, (v / max) * 44),
          backgroundColor: i === data.length - 1 ? colors.goldBright : colors.gold2,
          opacity: i === data.length - 1 ? 1 : 0.5, borderRadius: 2,
        }} />
      ))}
    </View>
  );
};

const Row: React.FC<{ label: string; value: string; tone?: 'gold' | 'green' | 'red' | 'muted' }> = ({ label, value, tone = 'muted' }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 }}>
    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 12 }}>{label}</Text>
    <Text style={{ fontFamily: fonts.serifSemiBold, fontSize: 14, color: tone === 'green' ? colors.green : tone === 'red' ? colors.red : tone === 'gold' ? colors.gold : colors.text }}>{value}</Text>
  </View>
);

export const StaffDetailScreen: React.FC = () => {
  const staff = useApp(s => s.staff);
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const leaves = useApp(s => s.leaves);
  const advances = useApp(s => s.advances);
  const settings = useApp(s => s.settings);
  const transfers = useApp(s => s.transfers);
  const user = useApp(s => s.user);
  const sid = useApp(s => s.selectedStaffId);

  const st = staff.find(x => x.id === sid) || null;
  const monthStr = monthYM();
  const [yr, mo] = monthStr.split('-').map(Number);
  const monthLabel = `${MONTHS[mo - 1]} ${yr}`;
  const isAdmin = user?.role === 'admin';

  const d = useMemo(() => {
    if (!st) return null;
    const billing = staffBillingInPeriod(st.id, entries, monthStr);
    const incentive = staffIncentivesInPeriod(st.id, entries, monthStr);
    const target = Number((st as any).target) || 0;
    const pct = target > 0 ? Math.min(100, Math.round((billing / target) * 100)) : 0;
    const salary = proRataSalary(st, monthStr, branches, settings, leaves);
    const advance = staffAdvancesInMonth(st.id, monthStr, advances);
    const net = salary + incentive - advance;
    const leaveDays = staffLeavesInMonth(st.id, monthStr, leaves);

    const monthEntries = entries.filter(e => e.date && e.date.startsWith(monthStr));
    let present = 0;
    monthEntries.forEach(e => {
      const sb: any = (e.staff_billing || []).find((x: any) => x.staff_id === st.id);
      if (sb && sb.present !== false) present += 1;
    });

    const days = new Date(yr, mo, 0).getDate();
    const daily = Array.from({ length: days }, () => 0);
    monthEntries.forEach(e => {
      const sb = (e.staff_billing || []).find((x: any) => x.staff_id === st.id);
      if (sb) { const dd = Number(e.date!.slice(8, 10)); daily[dd - 1] += Number(sb.billing) || 0; }
    });
    const lastDay = daily.reduce((acc, v, i) => (v > 0 ? i + 1 : acc), 0);
    const spark = daily.slice(0, Math.max(1, lastDay));

    const status = staffStatusForMonth(st, monthStr).status;
    const eff = effectiveBranchOnDate(st, monthStr + '-01', transfers) || st.branch_id;
    const home = branches.find(b => b.id === st.branch_id);
    const at = branches.find(b => b.id === eff);
    const loan = !!(eff && st.branch_id && eff !== st.branch_id);

    return { billing, incentive, target, pct, salary, advance, net, leaveDays, present, spark, status, home, at, loan };
  }, [st, entries, monthStr, branches, settings, leaves, advances, transfers, yr, mo]);

  if (!st || !d) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text3, fontSize: 15 }}>No staff selected</Text>
      </View>
    );
  }

  const initials = st.name.split(/\s+/).map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: 90 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{
          width: 54, height: 54, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
          backgroundColor: colors.bg3, borderWidth: 1, borderColor: d.loan ? colors.orange : colors.line2,
        }}>
          <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 20 }}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.serifSemiBold, fontSize: 22, color: colors.text }}>{st.name}</Text>
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, color: colors.text3, marginTop: 2 }}>
            {st.role || '—'} · {d.at?.name || '—'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            <Pill tone={d.status === 'inactive' ? 'red' : 'green'} text={d.status === 'inactive' ? 'Inactive' : 'Active'} />
            {d.loan && <Pill tone="orange" text={`Loan · ${d.home?.name || ''}`} />}
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label={`Billing · ${monthLabel}`} value={INR(d.billing)} tone="gold" />
        <StatCard label="Incentive" value={INR(d.incentive)} tone="green" />
      </View>

      {d.target > 0 && (
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>Target · {INR(d.target)}</Text>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1, color: d.pct >= 100 ? colors.green : colors.gold }}>{d.pct}%</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.bg4, overflow: 'hidden' }}>
            <View style={{ height: 8, width: `${d.pct}%`, borderRadius: 4, backgroundColor: d.pct >= 100 ? colors.green : colors.gold }} />
          </View>
        </View>
      )}

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Billing Trend · MTD</Text>
        <View style={{ backgroundColor: colors.bg2, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: 14 }}>
          <Sparkline data={d.spark} />
        </View>
      </View>

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Payroll · {monthLabel}</Text>
        <ListCard>
          <Row label="Salary (pro-rata)" value={isAdmin ? INR(d.salary) : '•••••'} />
          <Row label="Incentive" value={`+ ${INR(d.incentive)}`} tone="green" />
          <Row label="Advance taken" value={`− ${INR(d.advance)}`} tone="red" />
          <View style={{ height: 1, backgroundColor: colors.line2 }} />
          <Row label="Net pay" value={isAdmin ? INR(d.net) : '•••••'} tone="gold" />
        </ListCard>
      </View>

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Attendance · {monthLabel}</Text>
        <ListCard>
          <Row label="Days present" value={String(d.present)} />
          <Row label="Leave days" value={String(d.leaveDays)} tone={d.leaveDays > 0 ? 'red' : 'muted'} />
        </ListCard>
      </View>
    </ScrollView>
  );
};
