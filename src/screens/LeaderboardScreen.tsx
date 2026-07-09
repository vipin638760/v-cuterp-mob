import React, { useMemo } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { colors, fonts, INR, radius, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Icon } from '../components/Icon';
import { useApp } from '../store';
import { MONTHS, monthYM } from '../lib/constants';
import { staffBillingInPeriod, staffStatusForMonth } from '../lib/calculations';

// Mirrors the web ERP Leaderboard: staff ranked by monthly billing vs their
// target (default 50,000). Top 3 get a gold rank badge (on-brand — the design
// spec bans emoji, so no medal glyphs).
export const LeaderboardScreen: React.FC = () => {
  const staff = useApp(s => s.staff);
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const setSelectedStaff = useApp(s => s.setSelectedStaff);
  const push = useApp(s => s.push);

  const monthStr = monthYM();
  const [yr, mo] = monthStr.split('-').map(Number);
  const monthLabel = `${MONTHS[mo - 1]} ${yr}`;

  const rows = useMemo(() => staff
    .filter(s => staffStatusForMonth(s, monthStr).status !== 'inactive')
    .map(s => {
      const sale = staffBillingInPeriod(s.id, entries, monthStr);
      const tgt = Number((s as any).target) || 50000;
      const b = branches.find(x => x.id === s.branch_id);
      return { s, b, sale, tgt, pct: Math.min(Math.round((sale / tgt) * 100), 100) };
    })
    .sort((a, b) => b.sale - a.sale)
    .map((row, i) => ({ ...row, rank: i + 1 })),
  [staff, entries, branches, monthStr]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 90 }}>
      <View>
        <Text style={{ fontFamily: fonts.serifSemiBold, fontSize: 24, color: colors.gold }}>Leaderboard</Text>
        <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: colors.text3, marginTop: 2 }}>
          Staff performance vs monthly target · {monthLabel}
        </Text>
      </View>

      <View style={{ gap: 8 }}>
        {rows.map(({ s, b, sale, pct, rank }) => {
          const top3 = rank <= 3;
          return (
            <Pressable key={s.id} onPress={() => { setSelectedStaff(s.id); push('staff-detail'); }}>
              <ListCard>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center',
                    backgroundColor: top3 ? 'rgba(212,165,116,0.16)' : colors.bg3,
                    borderWidth: 1, borderColor: top3 ? colors.gold2 : colors.line,
                  }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, fontSize: top3 ? 16 : 13, color: top3 ? colors.goldBright : colors.text3 }}>
                      {rank}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: top3 ? colors.gold : colors.text, fontSize: 15 }}>{s.name}</Text>
                    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 1 }}>{b?.name || s.branch_id}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4, width: 96 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 15 }}>{INR(sale)}</Text>
                    <View style={{ width: 88, height: 5, borderRadius: 3, backgroundColor: colors.bg4, overflow: 'hidden' }}>
                      <View style={{ height: 5, width: `${pct}%`, borderRadius: 3, backgroundColor: pct >= 100 ? colors.green : colors.gold }} />
                    </View>
                    <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 0.6, color: pct >= 100 ? colors.green : colors.text3 }}>{pct}% of target</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color={colors.text4} />
                </View>
              </ListCard>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
};
