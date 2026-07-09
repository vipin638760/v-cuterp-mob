import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { useApp } from '../store';
import { monthYM } from '../lib/constants';
import { proRataSalary, staffAdvancesInMonth, staffIncentivesInPeriod } from '../lib/calculations';

export const PayrollScreen: React.FC = () => {
  const staff = useApp(s => s.staff);
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const advances = useApp(s => s.advances);
  const leaves = useApp(s => s.leaves);
  const settings = useApp(s => s.settings);
  const monthStr = monthYM();

  const rows = useMemo(() => staff
    .filter(st => !st.exit_date || st.exit_date >= monthStr + '-01')
    .map(st => {
      const salary = proRataSalary(st, monthStr, branches, settings, leaves);
      const incentive = staffIncentivesInPeriod(st.id, entries, monthStr);
      const advance = staffAdvancesInMonth(st.id, monthStr, advances);
      const net = salary + incentive - advance;
      return { st, salary, incentive, advance, net };
    }), [staff, branches, entries, advances, leaves, settings, monthStr]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.sm, paddingBottom: 80 }}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3, marginBottom: 4 }}>
        Payroll · {monthStr}
      </Text>
      {rows.map(({ st, salary, incentive, advance, net }) => (
        <ListCard key={st.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{st.name}</Text>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 18 }}>{INR(net)}</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            <Pill tone="ghost" text={`Salary ${INR(salary)}`} />
            <Pill tone="green" text={`Incentive ${INR(incentive)}`} />
            {advance > 0 && <Pill tone="red" text={`Advance ${INR(advance)}`} />}
          </View>
        </ListCard>
      ))}
    </ScrollView>
  );
};
