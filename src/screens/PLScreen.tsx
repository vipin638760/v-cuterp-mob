import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { StatCard } from '../components/StatCard';
import { ListCard } from '../components/ListCard';
import { PeriodBar, Period, periodPrefix, periodMonths, currentPeriod } from '../components/PeriodBar';
import { useApp } from '../store';
import { branchIncomeInPeriod, getMonthlyFixed } from '../lib/calculations';

export const PLScreen: React.FC = () => {
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const expenses = useApp(s => s.expenses);
  const monthlyExpenses = useApp(s => s.monthlyExpenses);
  const settings = useApp(s => s.settings);

  const [period, setPeriod] = useState<Period>(currentPeriod());
  const prefix = periodPrefix(period);
  const months = useMemo(() => periodMonths(period), [period]);

  const totals = useMemo(() => {
    let revenue = 0;
    let fixed = 0;
    branches.forEach(b => {
      revenue += branchIncomeInPeriod(b.id, entries, prefix);
      months.forEach(mp => {
        const fx = getMonthlyFixed(b, mp, monthlyExpenses);
        fixed += Object.values(fx).reduce((s, v) => s + (v || 0), 0);
      });
    });
    const variable = expenses
      .filter(e => e.date && e.date.startsWith(prefix))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const onlinePart = entries
      .filter(e => e.date && e.date.startsWith(prefix))
      .reduce((s, e) => s + (Number((e as any).online) || 0), 0);
    const gst = Math.round(onlinePart * (settings.gst_pct || 0) / 100);
    const net = revenue - variable - fixed - gst;
    return { revenue, variable, fixed, gst, net };
  }, [branches, entries, expenses, monthlyExpenses, prefix, months, settings.gst_pct]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <PeriodBar value={period} onChange={setPeriod} />

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase', color: colors.text3 }}>Gross Revenue</Text>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 40, marginTop: 4 }}>{INR(totals.revenue)}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="Operating Cost" value={INR(totals.variable + totals.fixed)} tone="red" />
        <StatCard label="Net P&L" value={INR(totals.net)} tone={totals.net > 0 ? 'green' : 'red'} />
      </View>

      <ListCard>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 16, marginBottom: 8 }}>Cost Breakdown</Text>
        {([
          { k: 'Variable Expenses', v: totals.variable },
          { k: 'Fixed Expenses', v: totals.fixed },
          { k: 'GST Estimate', v: totals.gst },
        ]).map((row, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < 2 ? 1 : 0, borderColor: colors.line }}>
            <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.text2, fontSize: 13 }}>{row.k}</Text>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{INR(row.v)}</Text>
          </View>
        ))}
      </ListCard>

      <ListCard>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 16, marginBottom: 8 }}>Per-Branch Revenue</Text>
        {branches.map((b, i) => {
          const r = branchIncomeInPeriod(b.id, entries, prefix);
          return (
            <View key={b.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < branches.length - 1 ? 1 : 0, borderColor: colors.line }}>
              <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.text2, fontSize: 13 }}>{b.name}</Text>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{INR(r)}</Text>
            </View>
          );
        })}
      </ListCard>
    </ScrollView>
  );
};
