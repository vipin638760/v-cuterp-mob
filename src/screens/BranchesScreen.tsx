import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, radius, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { Icon } from '../components/Icon';
import { useApp } from '../store';
import { monthYM } from '../lib/constants';
import { branchIncomeInPeriod, getMonthlyFixed } from '../lib/calculations';

export const BranchesScreen: React.FC = () => {
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const expenses = useApp(s => s.expenses);
  const monthlyExpenses = useApp(s => s.monthlyExpenses);
  const settings = useApp(s => s.settings);
  const monthStr = monthYM();

  const rows = useMemo(() => branches.map(b => {
    const revenue = branchIncomeInPeriod(b.id, entries, monthStr);
    const fx = getMonthlyFixed(b, monthStr, monthlyExpenses);
    const fixed = Object.values(fx).reduce((s, v) => s + (v || 0), 0);
    const variable = expenses
      .filter(e => e.branch_id === b.id && e.date && e.date.startsWith(monthStr))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const onlinePart = entries
      .filter(e => e.branch_id === b.id && e.date && e.date.startsWith(monthStr))
      .reduce((s, e) => s + (Number((e as any).online) || 0), 0);
    const gst = Math.round(onlinePart * (settings.gst_pct || 0) / 100);
    const n = revenue - variable - fixed - gst;
    return { branch: b, revenue, n };
  }), [branches, entries, expenses, monthlyExpenses, settings.gst_pct, monthStr]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      {rows.map(({ branch: b, revenue, n }) => (
        <View key={b.id} style={{
          backgroundColor: colors.bg2,
          borderRadius: radius.xl,
          padding: 16,
          borderWidth: 1,
          borderColor: n > 0 ? 'rgba(107,191,123,0.4)' : 'rgba(212,107,107,0.4)',
          shadowColor: n > 0 ? colors.green : colors.red,
          shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.3, shadowRadius: 12,
          gap: 8,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 18 }}>{b.name}</Text>
              <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                {(b.type || 'mens').toUpperCase()} {b.prefix ? `· ${b.prefix}` : ''}
              </Text>
            </View>
            <Pill tone={n > 0 ? 'green' : 'red'} text={n > 0 ? 'PROFIT' : 'LOSS'} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <View>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>Revenue (mtd)</Text>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 18 }}>{INR(revenue)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>Net P&L</Text>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: n > 0 ? colors.green : colors.red, fontSize: 18 }}>{INR(n)}</Text>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};
