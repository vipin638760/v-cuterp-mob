import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { useApp } from '../store';

export const MaterialMasterScreen: React.FC = () => {
  const materials = useApp(s => s.materials);
  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: 8, paddingBottom: 80 }}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3, marginBottom: 4 }}>
        SKU Master · {materials.length} items
      </Text>
      {materials.map(m => (
        <ListCard key={m.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{m.name}</Text>
              <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                {m.supplier || '—'} · {m.unit || 'unit'}
              </Text>
            </View>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 14 }}>{INR(m.unit_cost || 0)}</Text>
          </View>
        </ListCard>
      ))}
    </ScrollView>
  );
};
