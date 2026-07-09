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

  // Branch teammates' targets (same shop).
  const peers = useMemo(() => {
    if (!me) return [];
    return staff
      .filter(s => s.branch_id === me.branch_id && (!s.exit_date || s.exit_date >= prefix.slice(0, 7) + '-01'))
      .map(s => {
        const b = staffBillingInPeriod(s.id, entries, prefix);
        const p = target > 0 ? Math.round((b / target) * 100) : 0;
        return { s, billing: b, pct: p, isMe: s.id === me.id };
      })
      .sort((a, x) => x.billing - a.billing);
  }, [staff, me, entries, prefix, target]);

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

      {peers.length > 1 && (
        <View>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>
            Branch Team · {branch?.name || ''}
          </Text>
          <View style={{ gap: 6 }}>
            {peers.map(({ s, billing: b, pct: p, isMe }) => (
              <ListCard key={s.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: isMe ? colors.gold : colors.text, fontSize: 14 }}>
                      {s.name}{isMe ? ' · you' : ''}
                    </Text>
                    <View style={{ width: '80%', height: 5, borderRadius: 3, backgroundColor: colors.bg4, overflow: 'hidden', marginTop: 4 }}>
                      <View style={{ height: 5, width: `${Math.min(100, p)}%`, borderRadius: 3, backgroundColor: p >= 100 ? colors.green : colors.gold }} />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 13 }}>{INR(b)}</Text>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, color: p >= 100 ? colors.green : colors.text3 }}>{p}%</Text>
                  </View>
                </View>
              </ListCard>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};
