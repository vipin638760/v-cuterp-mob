import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { StatCard } from '../components/StatCard';
import { useApp } from '../store';

export const MaterialsScreen: React.FC = () => {
  const materials = useApp(s => s.materials);

  // Real `materials` docs track catalog + pricing, not live stock levels:
  // { name, group, unit, current_price, base_price, total_purchased,
  //   last_vendor, last_bill_date, gst_pct, archived }. There is no
  // per-branch stock count in this data model, so show the catalog.
  const { active, groups } = useMemo(() => {
    const active = materials.filter((m: any) => !m.archived);
    const groups = new Set(active.map((m: any) => m.group).filter(Boolean));
    return { active, groups };
  }, [materials]);

  const byGroup = useMemo(() => {
    const map: Record<string, any[]> = {};
    active.forEach((m: any) => {
      const g = m.group || 'Ungrouped';
      (map[g] ||= []).push(m);
    });
    Object.values(map).forEach(list => list.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [active]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="SKUs" value={String(active.length)} tone="gold" />
        <StatCard label="Groups" value={String(groups.size)} tone="neutral" />
      </View>

      {byGroup.map(([group, list]) => (
        <View key={group}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>
            {group} · {list.length}
          </Text>
          <View style={{ gap: 8 }}>
            {list.map((m: any) => (
              <ListCard key={m.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{m.name}</Text>
                    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                      {m.unit ? `per ${m.unit}` : ''}{m.last_vendor ? `${m.unit ? ' · ' : ''}${m.last_vendor}` : ''}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 14 }}>
                      {INR(m.current_price || 0)}
                    </Text>
                    {!!m.last_bill_date && (
                      <Text style={{ fontFamily: fonts.sansMedium, color: colors.text4, fontSize: 10, marginTop: 1 }}>
                        {m.last_bill_date}
                      </Text>
                    )}
                  </View>
                </View>
              </ListCard>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};
