import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { colors, fonts, INR, radius, space } from '../theme';
import { Pill } from '../components/Pill';
import { Icon } from '../components/Icon';
import { PeriodBar, Period, periodMonths, currentPeriod } from '../components/PeriodBar';
import { useApp } from '../store';
import { branchFinancialsForMonths } from '../lib/calculations';

export const BranchesScreen: React.FC = () => {
  const branches = useApp(s => s.branches);
  const staff = useApp(s => s.staff);
  const entries = useApp(s => s.entries);
  const expenses = useApp(s => s.expenses);
  const monthlyExpenses = useApp(s => s.monthlyExpenses);
  const settings = useApp(s => s.settings);
  const leaves = useApp(s => s.leaves);
  const setSelectedBranch = useApp(s => s.setSelectedBranch);
  const push = useApp(s => s.push);
  const [period, setPeriod] = useState<Period>(currentPeriod());
  const months = useMemo(() => periodMonths(period), [period]);

  const rows = useMemo(() => branches.map(b => {
    const { revenue, net } = branchFinancialsForMonths(b, months, entries, expenses, monthlyExpenses, staff, settings, leaves);
    return { branch: b, revenue, n: net };
  }).sort((a, b) => b.n - a.n), [branches, staff, entries, expenses, monthlyExpenses, settings, leaves, months]);

  const go = (id: string) => { setSelectedBranch(id); push('branch-detail'); };

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <PeriodBar value={period} onChange={setPeriod} />
      {rows.map(({ branch: b, revenue, n }) => (
        <Pressable key={b.id} onPress={() => go(b.id)} style={{
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
            <Icon name="chevron-right" size={16} color={colors.text4} />
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
        </Pressable>
      ))}
    </ScrollView>
  );
};
