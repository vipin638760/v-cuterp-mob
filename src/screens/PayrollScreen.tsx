import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { PeriodBar, Period, periodPrefix, periodLabel, periodMonths, currentPeriod } from '../components/PeriodBar';
import { useApp } from '../store';
import { proRataSalary, staffAdvancesInMonth, staffIncentivesInPeriod } from '../lib/calculations';

export const PayrollScreen: React.FC = () => {
  const staff = useApp(s => s.staff);
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const advances = useApp(s => s.advances);
  const leaves = useApp(s => s.leaves);
  const settings = useApp(s => s.settings);
  const [period, setPeriod] = useState<Period>(currentPeriod());
  const prefix = periodPrefix(period);
  const months = useMemo(() => periodMonths(period), [period]);

  const rows = useMemo(() => staff
    .filter(st => !st.exit_date || st.exit_date >= months[0] + '-01')
    .map(st => {
      let salary = 0, advance = 0;
      months.forEach(mp => {
        salary += proRataSalary(st, mp, branches, settings, leaves);
        advance += staffAdvancesInMonth(st.id, mp, advances);
      });
      const incentive = staffIncentivesInPeriod(st.id, entries, prefix);
      const net = salary + incentive - advance;
      return { st, salary, incentive, advance, net };
    }), [staff, branches, entries, advances, leaves, settings, prefix, months]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.sm, paddingBottom: 80 }}>
      <PeriodBar value={period} onChange={setPeriod} />
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3, marginBottom: 4 }}>
        Payroll · {periodLabel(period)}
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
