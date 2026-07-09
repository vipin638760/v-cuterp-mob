import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { StatCard } from '../components/StatCard';
import { Pill } from '../components/Pill';
import { PeriodBar, Period, periodPrefix, periodMonths, currentPeriod } from '../components/PeriodBar';
import { useApp } from '../store';
import { staffBillingInPeriod, staffIncentivesInPeriod } from '../lib/calculations';

export const MyTargetScreen: React.FC = () => {
  const user = useApp(s => s.user)!;
  const staff = useApp(s => s.staff);
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const settings = useApp(s => s.settings);

  const me = staff.find(s => s.id === user.staff_id);
  const branch = branches.find(b => b.id === me?.branch_id);
  const [period, setPeriod] = useState<Period>(currentPeriod());
  const prefix = periodPrefix(period);
  const nMonths = useMemo(() => periodMonths(period).length, [period]);

  const monthlyTarget = branch?.type === 'unisex' ? (settings.unisex_target || 0) : (settings.mens_target || 0);
  const target = monthlyTarget * nMonths; // scale target for year periods
  const billing = useMemo(() => me ? staffBillingInPeriod(me.id, entries, prefix) : 0, [me, entries, prefix]);
  const incentive = useMemo(() => me ? staffIncentivesInPeriod(me.id, entries, prefix) : 0, [me, entries, prefix]);
  const pct = target > 0 ? Math.round((billing / target) * 100) : 0;
  const remaining = Math.max(0, target - billing);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <PeriodBar value={period} onChange={setPeriod} />
      <View style={{ alignItems: 'center', paddingVertical: 12 }}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase', color: colors.text3 }}>
          Month-to-date Billing
        </Text>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 44, marginTop: 6 }}>{INR(billing)}</Text>
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 12, marginTop: 4 }}>of {INR(target)}</Text>
      </View>

      <View style={{ height: 12, borderRadius: 6, backgroundColor: colors.bg3, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, pct)}%`, height: 12, backgroundColor: pct >= 100 ? colors.green : colors.gold }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Pill tone={pct >= 100 ? 'green' : 'gold'} text={`${pct}%`} />
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>
          {remaining > 0 ? `${INR(remaining)} to go` : 'Target hit'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="Forecast Incentive" value={INR(incentive)} tone="gold" />
        <StatCard label="Days Left" value={String(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate())} tone="neutral" />
      </View>
    </ScrollView>
  );
};
