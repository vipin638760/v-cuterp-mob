import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { StatCard } from '../components/StatCard';
import { Pill } from '../components/Pill';
import { useApp } from '../store';

export const MaterialsScreen: React.FC = () => {
  const materials = useApp(s => s.materials);

  const summary = useMemo(() => {
    const low = materials.filter(m => (m.current_stock || 0) < (m.threshold || 0));
    const totalValue = materials.reduce((s, m) => s + (m.current_stock || 0) * (m.unit_cost || 0), 0);
    return { low, totalValue, count: materials.length };
  }, [materials]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="SKUs" value={String(summary.count)} tone="neutral" />
        <StatCard label="Stock Value" value={INR(summary.totalValue)} tone="gold" />
      </View>
      <StatCard label="Low Stock" value={String(summary.low.length)} tone={summary.low.length > 0 ? 'red' : 'green'} />

      {summary.low.length > 0 && (
        <View>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.red, marginBottom: 8 }}>
            Critical Items
          </Text>
          <View style={{ gap: 8 }}>
            {summary.low.map(m => (
              <ListCard key={m.id}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{m.name}</Text>
                    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                      {m.current_stock || 0}{m.unit ? ` ${m.unit}` : ''} / threshold {m.threshold || 0}
                    </Text>
                  </View>
                  <Pill tone="red" text="LOW" />
                </View>
              </ListCard>
            ))}
          </View>
        </View>
      )}

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>
          All Materials
        </Text>
        <View style={{ gap: 8 }}>
          {materials.map(m => (
            <ListCard key={m.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{m.name}</Text>
                  <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>
                    {m.supplier || '—'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>
                    {m.current_stock || 0}{m.unit ? ` ${m.unit}` : ''}
                  </Text>
                  <Text style={{ fontFamily: fonts.sansMedium, color: colors.gold, fontSize: 11 }}>
                    {INR(m.unit_cost || 0)}
                  </Text>
                </View>
              </View>
            </ListCard>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};
