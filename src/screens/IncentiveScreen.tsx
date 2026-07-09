import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { useApp } from '../store';
import { monthYM } from '../lib/constants';
import { staffBillingInPeriod, staffIncentivesInPeriod } from '../lib/calculations';

export const IncentiveScreen: React.FC = () => {
  const staff = useApp(s => s.staff);
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const settings = useApp(s => s.settings);
  const monthStr = monthYM();

  const rows = useMemo(() => staff.map(st => {
    const billing = staffBillingInPeriod(st.id, entries, monthStr);
    const incentive = staffIncentivesInPeriod(st.id, entries, monthStr);
    const branch = branches.find(b => b.id === st.branch_id);
    const target = branch?.type === 'unisex' ? (settings.unisex_target || 0) : (settings.mens_target || 0);
    const pct = target > 0 ? Math.round((billing / target) * 100) : 0;
    return { st, billing, incentive, target, pct };
  }).sort((a, b) => b.billing - a.billing), [staff, branches, entries, settings, monthStr]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.sm, paddingBottom: 80 }}>
      {rows.map(({ st, billing, incentive, target, pct }) => (
        <ListCard key={st.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{st.name}</Text>
            <Pill tone={pct >= 100 ? 'green' : pct >= 70 ? 'gold' : 'ghost'} text={`${pct}%`} />
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.bg3, overflow: 'hidden', marginBottom: 8 }}>
            <View style={{ width: `${Math.min(100, pct)}%`, height: 6, backgroundColor: pct >= 100 ? colors.green : colors.gold }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>
              {INR(billing)} / {INR(target)}
            </Text>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 13 }}>
              + {INR(incentive)}
            </Text>
          </View>
        </ListCard>
      ))}
    </ScrollView>
  );
};
