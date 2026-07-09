import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { ChipGroup } from '../components/ChipGroup';
import { useApp } from '../store';
import { monthYM } from '../lib/constants';
import { getMonthlyFixed, proRataSalary } from '../lib/calculations';

export const OpExpensesScreen: React.FC = () => {
  const branches = useApp(s => s.branches);
  const expenses = useApp(s => s.expenses);
  const monthlyExpenses = useApp(s => s.monthlyExpenses);
  const staff = useApp(s => s.staff);
  const settings = useApp(s => s.settings);
  const leaves = useApp(s => s.leaves);
  const user = useApp(s => s.user)!;
  const isAdmin = user.role === 'admin';

  const [tab, setTab] = useState<'fixed' | 'variable' | 'total'>('fixed');
  const monthStr = monthYM();

  const rows = useMemo(() => branches.map(b => {
    const fx = getMonthlyFixed(b, monthStr, monthlyExpenses);
    const fixed = Object.values(fx).reduce((s, v) => s + (v || 0), 0);
    const variable = expenses
      .filter(e => e.branch_id === b.id && e.date && e.date.startsWith(monthStr))
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const salary = staff
      .filter(st => st.branch_id === b.id)
      .reduce((s, st) => s + proRataSalary(st, monthStr, branches, settings, leaves), 0);
    return { b, fixed, variable, salary };
  }), [branches, expenses, monthlyExpenses, staff, monthStr, settings, leaves]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <ChipGroup
        items={[{ id: 'fixed', label: 'Fixed' }, { id: 'variable', label: 'Variable' }, { id: 'total', label: 'Total' }]}
        active={tab}
        onChange={(id) => setTab(id as any)}
      />
      {rows.map(({ b, fixed, variable, salary }) => {
        const total = fixed + variable + (isAdmin ? salary : 0);
        const value = tab === 'fixed' ? fixed : tab === 'variable' ? variable : total;
        return (
          <ListCard key={b.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 15 }}>{b.name}</Text>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 18 }}>{INR(value)}</Text>
            </View>
            {tab === 'total' && (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 10 }}>Fixed {INR(fixed)}</Text>
                <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 10 }}>Var {INR(variable)}</Text>
                <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 10 }}>
                  Salary {isAdmin ? INR(salary) : '•••••'}
                </Text>
              </View>
            )}
          </ListCard>
        );
      })}
    </ScrollView>
  );
};
