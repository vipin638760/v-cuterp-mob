import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { useApp } from '../store';

export const MenuConfigScreen: React.FC = () => {
  const menus = useApp(s => s.menus);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof menus>();
    menus.forEach(m => {
      const k = m.group || 'General';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    });
    return Array.from(map.entries());
  }, [menus]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      {grouped.map(([group, items]) => (
        <View key={group}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>
            {group} · {items.length}
          </Text>
          <View style={{ gap: 6 }}>
            {items.map(m => (
              <ListCard key={m.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{m.name}</Text>
                    {m.branch_type && m.branch_type !== 'both' && (
                      <Pill tone="ghost" text={m.branch_type.toUpperCase()} style={{ marginTop: 4 }} />
                    )}
                  </View>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 16 }}>{INR(m.price)}</Text>
                </View>
              </ListCard>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};
