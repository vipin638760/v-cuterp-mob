import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { colors, fonts, INR, radius, space } from '../theme';
import { StatCard } from '../components/StatCard';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { Icon } from '../components/Icon';
import { PeriodBar, Period, periodPrefix, periodLabel, periodMonths, currentPeriod } from '../components/PeriodBar';
import { useApp } from '../store';
import {
  branchFinancialsForMonths, staffBillingInPeriod, staffIncentivesInPeriod, staffStatusForMonth,
} from '../lib/calculations';

const Sparkline: React.FC<{ data: number[] }> = ({ data }) => {
  const max = Math.max(1, ...data);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 46 }}>
      {data.map((v, i) => (
        <View key={i} style={{
          flex: 1,
          height: Math.max(2, (v / max) * 46),
          backgroundColor: i === data.length - 1 ? colors.goldBright : colors.gold2,
          opacity: i === data.length - 1 ? 1 : 0.55,
          borderRadius: 2,
        }} />
      ))}
    </View>
  );
};

export const OrgPulseScreen: React.FC = () => {
  const branches = useApp(s => s.branches);
  const staff = useApp(s => s.staff);
  const entries = useApp(s => s.entries);
  const expenses = useApp(s => s.expenses);
  const monthlyExpenses = useApp(s => s.monthlyExpenses);
  const settings = useApp(s => s.settings);
  const leaves = useApp(s => s.leaves);
  const setSelectedBranch = useApp(s => s.setSelectedBranch);
  const setSelectedStaff = useApp(s => s.setSelectedStaff);
  const push = useApp(s => s.push);

  const [period, setPeriod] = useState<Period>(currentPeriod());
  const prefix = periodPrefix(period);
  const months = useMemo(() => periodMonths(period), [period]);
  const monthLabel = periodLabel(period);

  const data = useMemo(() => {
    const perBranch = branches.map(b => ({
      b, ...branchFinancialsForMonths(b, months, entries, expenses, monthlyExpenses, staff, settings, leaves),
    }));
    const collection = perBranch.reduce((s, r) => s + r.revenue, 0);
    const net = perBranch.reduce((s, r) => s + r.net, 0);

    let incentive = 0;
    staff.forEach(st => { incentive += staffIncentivesInPeriod(st.id, entries, prefix); });

    const activeStaff = staff.filter(st => months.some(mp => staffStatusForMonth(st, mp).status !== 'inactive')).length;

    const ranked = [...perBranch].sort((a, b) => b.net - a.net);

    const stylists = staff
      .map(st => ({ st, billing: staffBillingInPeriod(st.id, entries, prefix) }))
      .filter(x => x.billing > 0)
      .sort((a, b) => b.billing - a.billing)
      .slice(0, 5);

    // Trend: daily bars for a month; monthly bars for a year.
    let spark: number[];
    if (period.mode === 'year') {
      spark = months.map(mp => entries.reduce((s, e) => {
        if (!e.date || !e.date.startsWith(mp)) return s;
        const matSale = (e.staff_billing || []).reduce((m: number, sb: any) => m + (Number(sb.material) || 0), 0);
        return s + (Number((e as any).online) || 0) + (Number(e.cash) || 0) + matSale;
      }, 0));
    } else {
      const [yr, mo] = prefix.split('-').map(Number);
      const days = new Date(yr, mo, 0).getDate();
      const daily = Array.from({ length: days }, () => 0);
      entries.forEach(e => {
        if (!e.date || !e.date.startsWith(prefix)) return;
        const dd = Number(e.date.slice(8, 10));
        const matSale = (e.staff_billing || []).reduce((m: number, sb: any) => m + (Number(sb.material) || 0), 0);
        daily[dd - 1] += (Number((e as any).online) || 0) + (Number(e.cash) || 0) + matSale;
      });
      const lastDay = daily.reduce((acc, v, i) => (v > 0 ? i + 1 : acc), 0);
      spark = daily.slice(0, Math.max(1, lastDay));
    }

    return { perBranch, collection, net, incentive, activeStaff, ranked, stylists, spark };
  }, [branches, staff, entries, expenses, monthlyExpenses, settings, leaves, prefix, months, period.mode]);

  const go = (id: string) => { setSelectedBranch(id); push('branch-detail'); };

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: 90 }}>
      <PeriodBar value={period} onChange={setPeriod} />

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase', color: colors.text3 }}>Network · {monthLabel}</Text>
        <Text style={{ fontFamily: fonts.serifSemiBold, fontSize: 30, color: colors.gold, marginTop: 2 }}>{INR(data.collection)}</Text>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, color: colors.text3 }}>Total collection · {branches.length} branches</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="Net P&amp;L" value={INR(data.net)} tone={data.net > 0 ? 'green' : 'red'} />
        <StatCard label="Incentive" value={INR(data.incentive)} tone="gold" />
      </View>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="Active Staff" value={String(data.activeStaff)} tone="neutral" />
        <StatCard label="Avg / Branch" value={INR(branches.length ? data.collection / branches.length : 0)} tone="neutral" />
      </View>

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Collection Trend · {period.mode === 'year' ? 'Monthly' : 'MTD'}</Text>
        <View style={{ backgroundColor: colors.bg2, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: 14 }}>
          <Sparkline data={data.spark} />
        </View>
      </View>

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Branches · by Net P&amp;L</Text>
        <View style={{ gap: 8 }}>
          {data.ranked.map(({ b, revenue, net }, i) => (
            <Pressable key={b.id} onPress={() => go(b.id)}>
              <ListCard>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text4, fontSize: 15, width: 22 }}>{i + 1}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 15 }}>{b.name}</Text>
                    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 1 }}>{INR(revenue)} collected</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: net > 0 ? colors.green : colors.red, fontSize: 15 }}>{INR(net)}</Text>
                    <Pill tone={net > 0 ? 'green' : 'red'} text={net > 0 ? 'Profit' : 'Loss'} />
                  </View>
                  <Icon name="chevron-right" size={16} color={colors.text4} />
                </View>
              </ListCard>
            </Pressable>
          ))}
        </View>
      </View>

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Top Stylists · {monthLabel}</Text>
        <View style={{ gap: 8 }}>
          {data.stylists.map(({ st, billing }, i) => {
            const branch = branches.find(b => b.id === st.branch_id);
            return (
              <Pressable key={st.id} onPress={() => { setSelectedStaff(st.id); push('staff-detail'); }}>
              <ListCard>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 30, height: 30, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line,
                  }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 13 }}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{st.name}</Text>
                    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>{branch?.name || st.branch_id}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 14 }}>{INR(billing)}</Text>
                  <Icon name="chevron-right" size={16} color={colors.text4} />
                </View>
              </ListCard>
              </Pressable>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};
