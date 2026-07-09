import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { StatCard } from '../components/StatCard';
import { Pill } from '../components/Pill';
import { useApp } from '../store';
import { monthYM } from '../lib/constants';
import { proRataSalary, staffAdvancesInMonth, staffIncentivesInPeriod } from '../lib/calculations';

export const MyPayrollScreen: React.FC = () => {
  const user = useApp(s => s.user)!;
  const staff = useApp(s => s.staff);
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const advances = useApp(s => s.advances);
  const leaves = useApp(s => s.leaves);
  const settings = useApp(s => s.settings);

  const me = staff.find(s => s.id === user.staff_id);
  const monthStr = monthYM();

  const salary = useMemo(() => me ? proRataSalary(me, monthStr, branches, settings, leaves) : 0, [me, branches, settings, leaves, monthStr]);
  const incentive = useMemo(() => me ? staffIncentivesInPeriod(me.id, entries, monthStr) : 0, [me, entries, monthStr]);
  const advance = useMemo(() => me ? staffAdvancesInMonth(me.id, monthStr, advances) : 0, [me, advances, monthStr]);
  const net = salary + incentive - advance;
  const myAdvances = useMemo(() => advances.filter(a => a.staff_id === user.staff_id), [advances, user.staff_id]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <View style={{ alignItems: 'center', paddingVertical: 12 }}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase', color: colors.text3 }}>
          Estimated Net Pay · {monthStr}
        </Text>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 44, marginTop: 6 }}>{INR(net)}</Text>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="Salary" value={INR(salary)} tone="neutral" />
        <StatCard label="Incentive" value={INR(incentive)} tone="green" />
      </View>
      <StatCard label="Advances Taken" value={INR(advance)} tone={advance > 0 ? 'red' : 'neutral'} />

      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>
        Advance History
      </Text>
      {myAdvances.length === 0 && (
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, textAlign: 'center', paddingVertical: 16 }}>No advances</Text>
      )}
      {myAdvances.map(a => (
        <ListCard key={a.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 13 }}>{a.date}</Text>
              {!!a.reason && <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>{a.reason}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 14 }}>{INR(a.amount)}</Text>
              <Pill tone={a.status === 'approved' ? 'green' : a.status === 'rejected' ? 'red' : 'orange'} text={a.status.toUpperCase()} />
            </View>
          </View>
        </ListCard>
      ))}
    </ScrollView>
  );
};
