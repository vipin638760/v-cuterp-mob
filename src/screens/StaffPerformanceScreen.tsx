import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { colors, fonts, INR, radius, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { Icon } from '../components/Icon';
import { TextField } from '../components/TextField';
import { useApp } from '../store';
import { MONTHS, monthYM } from '../lib/constants';
import { proRataSalary, staffBillingInPeriod, staffIncentivesInPeriod, staffStatusForMonth } from '../lib/calculations';

type Show = 'all' | 'active' | 'inactive';
type TType = 'all' | 'mens' | 'unisex';
type Tgt = 'all' | 'met' | 'notmet';
type Sort = 'billing' | 'incentive' | 'pct' | 'name';

const Kpi: React.FC<{ label: string; value: string; sub?: string; tone?: string }> = ({ label, value, sub, tone }) => (
  <View style={{
    width: '48%', backgroundColor: colors.bg2, borderRadius: radius.lg,
    borderWidth: 1, borderColor: colors.line, padding: 12,
  }}>
    <Text style={{ fontFamily: fonts.sansBold, fontSize: 8, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.text3 }}>{label}</Text>
    <Text style={{ fontFamily: fonts.serifSemiBold, fontSize: 20, color: tone || colors.text, marginTop: 3 }}>{value}</Text>
    {!!sub && <Text style={{ fontFamily: fonts.sansMedium, fontSize: 9, color: colors.text4, marginTop: 1 }}>{sub}</Text>}
  </View>
);

const Chip: React.FC<{ on: boolean; label: string; onPress: () => void }> = ({ on, label, onPress }) => (
  <Pressable onPress={onPress} style={{
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.sm,
    backgroundColor: on ? colors.gold : colors.bg2,
    borderWidth: 1, borderColor: on ? 'transparent' : colors.line,
  }}>
    <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', color: on ? '#1a1208' : colors.text2 }}>{label}</Text>
  </Pressable>
);

export const StaffPerformanceScreen: React.FC = () => {
  const staff = useApp(s => s.staff);
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const settings = useApp(s => s.settings);
  const leaves = useApp(s => s.leaves);
  const user = useApp(s => s.user);
  const setSelectedStaff = useApp(s => s.setSelectedStaff);
  const push = useApp(s => s.push);

  const isAdmin = user?.role === 'admin';
  const monthStr = monthYM();
  const [yr, mo] = monthStr.split('-').map(Number);
  const monthLabel = `${MONTHS[mo - 1]} ${yr}`;

  const [q, setQ] = useState('');
  const [show, setShow] = useState<Show>('active');
  const [type, setType] = useState<TType>('all');
  const [tgtF, setTgtF] = useState<Tgt>('all');
  const [sortCol, setSortCol] = useState<Sort>('billing');

  const rows = useMemo(() => staff.map(s => {
    const status = staffStatusForMonth(s, monthStr).status;
    const billing = staffBillingInPeriod(s.id, entries, monthStr);
    const incentive = staffIncentivesInPeriod(s.id, entries, monthStr);
    const salary = proRataSalary(s, monthStr, branches, settings, leaves);
    const salaryFull = status !== 'inactive' ? (Number(s.salary) || 0) : 0;
    const tgt = Math.round(salary * 3); // 3× pro-rata salary
    const pct = tgt > 0 ? Math.round((billing / tgt) * 100) : 0;
    const shortfall = Math.max(0, tgt - billing);
    const branch = branches.find(b => b.id === s.branch_id);
    const btype = (branch?.type || 'mens').toLowerCase();
    return { s, status, billing, incentive, salary, salaryFull, tgt, pct, shortfall, branch, btype };
  }), [staff, entries, branches, settings, leaves, monthStr]);

  const isMet = (r: typeof rows[number]) => r.tgt > 0 && r.shortfall === 0;
  const isNotMet = (r: typeof rows[number]) => r.tgt > 0 && r.shortfall > 0;

  // KPI band follows type + search context (like the web), independent of show/target.
  const kpiBase = useMemo(() => {
    const term = q.trim().toLowerCase();
    return rows.filter(r =>
      (type === 'all' || r.btype === type) &&
      (!term || r.s.name.toLowerCase().includes(term) || (r.branch?.name || '').toLowerCase().includes(term) || (r.s.role || '').toLowerCase().includes(term)),
    );
  }, [rows, type, q]);

  const kpi = useMemo(() => {
    const active = kpiBase.filter(r => r.status !== 'inactive');
    return {
      total: kpiBase.length,
      active: active.length,
      inactive: kpiBase.length - active.length,
      billing: kpiBase.reduce((s, r) => s + r.billing, 0),
      incentive: kpiBase.reduce((s, r) => s + r.incentive, 0),
      salary: kpiBase.reduce((s, r) => s + r.salary, 0),
      full: kpiBase.reduce((s, r) => s + r.salaryFull, 0),
      target: kpiBase.reduce((s, r) => s + r.tgt, 0),
      shortfall: kpiBase.reduce((s, r) => s + r.shortfall, 0),
      met: kpiBase.filter(isMet).length,
      notMet: kpiBase.filter(isNotMet).length,
    };
  }, [kpiBase]);

  // Branch Targets — group by home branch, 3× shop salary.
  const branchTargets = useMemo(() => {
    const map = new Map<string, { name: string; type: string; staff: number; billing: number; target: number }>();
    kpiBase.filter(r => r.status !== 'inactive').forEach(r => {
      const id = r.s.branch_id || '—';
      const cur = map.get(id) || { name: r.branch?.name || id, type: r.btype, staff: 0, billing: 0, target: 0 };
      cur.staff += 1; cur.billing += r.billing; cur.target += r.tgt;
      map.set(id, cur);
    });
    const arr = [...map.values()].map(b => ({
      ...b, pct: b.target > 0 ? Math.round((b.billing / b.target) * 100) : 0, diff: b.billing - b.target,
    })).sort((a, b) => b.billing - a.billing);
    return { arr, met: arr.filter(b => b.diff >= 0 && b.target > 0).length, total: arr.length };
  }, [kpiBase]);

  const list = useMemo(() => {
    let l = kpiBase.filter(r =>
      (show === 'all' || (show === 'active' ? r.status !== 'inactive' : r.status === 'inactive')) &&
      (tgtF === 'all' || (tgtF === 'met' ? isMet(r) : isNotMet(r))),
    );
    l = [...l].sort((a, b) => {
      if (sortCol === 'name') return a.s.name.localeCompare(b.s.name);
      if (sortCol === 'incentive') return b.incentive - a.incentive;
      if (sortCol === 'pct') return b.pct - a.pct;
      return b.billing - a.billing;
    });
    return l;
  }, [kpiBase, show, tgtF, sortCol]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 90 }}>
      <View>
        <Text style={{ fontFamily: fonts.serifSemiBold, fontSize: 24, color: colors.text }}>Staff Performance</Text>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: colors.text3, marginTop: 2 }}>
          Per-stylist billing, incentives &amp; payroll · {monthLabel}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 }}>
        <Kpi label="Total Staff" value={String(kpi.total)} />
        <Kpi label="Active" value={String(kpi.active)} sub={`in ${MONTHS[mo - 1]}`} tone={colors.green} />
        <Kpi label="Inactive" value={String(kpi.inactive)} sub={`in ${MONTHS[mo - 1]}`} tone={colors.red} />
        <Kpi label="Total Billing" value={INR(kpi.billing)} tone={colors.gold} />
        <Kpi label="Total Incentive" value={INR(kpi.incentive)} tone={colors.gold} />
        {isAdmin && <Kpi label="Total Salary" value={INR(kpi.salary)} sub="after proration" />}
        {isAdmin && <Kpi label="Full Salary" value={INR(kpi.full)} sub="no proration" />}
        <Kpi label="Total Target" value={INR(kpi.target)} sub="3× salary till date" tone={colors.text2} />
        <Kpi label="Target Shortfall" value={INR(kpi.shortfall)} sub="below 3× salary" tone={colors.red} />
      </View>

      {/* Filters */}
      <TextField placeholder="Search name, branch or role" value={q} onChangeText={setQ} />
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Chip on={show === 'all'} label={`All ${kpi.total}`} onPress={() => setShow('all')} />
          <Chip on={show === 'active'} label={`Active ${kpi.active}`} onPress={() => setShow('active')} />
          <Chip on={show === 'inactive'} label={`Inactive ${kpi.inactive}`} onPress={() => setShow('inactive')} />
          <Chip on={type === 'mens'} label="Mens" onPress={() => setType(type === 'mens' ? 'all' : 'mens')} />
          <Chip on={type === 'unisex'} label="Unisex" onPress={() => setType(type === 'unisex' ? 'all' : 'unisex')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
          <Chip on={tgtF === 'met'} label={`Met ${kpi.met}`} onPress={() => setTgtF(tgtF === 'met' ? 'all' : 'met')} />
          <Chip on={tgtF === 'notmet'} label={`Not met ${kpi.notMet}`} onPress={() => setTgtF(tgtF === 'notmet' ? 'all' : 'notmet')} />
          <Chip on={sortCol === 'billing'} label="↓ Billing" onPress={() => setSortCol('billing')} />
          <Chip on={sortCol === 'incentive'} label="↓ Incentive" onPress={() => setSortCol('incentive')} />
          <Chip on={sortCol === 'pct'} label="↓ Target %" onPress={() => setSortCol('pct')} />
          <Chip on={sortCol === 'name'} label="Name" onPress={() => setSortCol('name')} />
        </View>
      </View>

      {/* Branch Targets */}
      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>
          Branch Targets · 3× shop salary · {branchTargets.met}/{branchTargets.total} met
        </Text>
        <View style={{ gap: 6 }}>
          {branchTargets.arr.map(b => (
            <ListCard key={b.name}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{b.name}</Text>
                  <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 10, marginTop: 1 }}>{b.staff} staff · {b.type.toUpperCase()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', width: 118 }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 13 }}>{INR(b.billing)}</Text>
                  <Text style={{ fontFamily: fonts.sansMedium, color: colors.text4, fontSize: 9 }}>target {INR(b.target)}</Text>
                  <View style={{ width: 110, height: 5, borderRadius: 3, backgroundColor: colors.bg4, overflow: 'hidden', marginTop: 3 }}>
                    <View style={{ height: 5, width: `${Math.min(100, b.pct)}%`, borderRadius: 3, backgroundColor: b.diff >= 0 ? colors.green : colors.gold }} />
                  </View>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, color: b.diff >= 0 ? colors.green : colors.red, marginTop: 2 }}>
                    {b.pct}% · {b.diff >= 0 ? `Met +${INR(b.diff)}` : `short ${INR(-b.diff)}`}
                  </Text>
                </View>
              </View>
            </ListCard>
          ))}
        </View>
      </View>

      {/* Staff list */}
      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>
          Staff · {list.length}
        </Text>
        <View style={{ gap: 6 }}>
          {list.map(r => (
            <Pressable key={r.s.id} onPress={() => { setSelectedStaff(r.s.id); push('staff-detail'); }}>
              <ListCard>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{r.s.name}</Text>
                    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 10, marginTop: 1 }}>
                      {r.s.role || '—'} · {r.branch?.name || r.s.branch_id}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', width: 108 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 13 }}>{INR(r.billing)}</Text>
                    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text4, fontSize: 9 }}>+{INR(r.incentive)} inc</Text>
                    {r.tgt > 0 && (
                      <>
                        <View style={{ width: 100, height: 5, borderRadius: 3, backgroundColor: colors.bg4, overflow: 'hidden', marginTop: 3 }}>
                          <View style={{ height: 5, width: `${Math.min(100, r.pct)}%`, borderRadius: 3, backgroundColor: r.shortfall === 0 ? colors.green : colors.gold }} />
                        </View>
                        <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, color: r.shortfall === 0 ? colors.green : colors.text3, marginTop: 2 }}>
                          {r.pct}% of 3×
                        </Text>
                      </>
                    )}
                  </View>
                  <Icon name="chevron-right" size={16} color={colors.text4} />
                </View>
              </ListCard>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};
