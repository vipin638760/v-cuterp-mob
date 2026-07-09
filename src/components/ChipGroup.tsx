import React from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';

interface ChipGroupProps {
  items: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export const ChipGroup: React.FC<ChipGroupProps> = ({ items, active, onChange }) => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
      {items.map(it => {
        const isActive = it.id === active;
        return (
          <Pressable key={it.id} onPress={() => onChange(it.id)}>
            <View style={{
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: isActive ? colors.gold : colors.line2,
              backgroundColor: isActive ? colors.gold : colors.bg2,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}>
              <Text style={{
                fontFamily: fonts.sansBold,
                fontSize: 10,
                letterSpacing: 1.4,
                textTransform: 'uppercase',
                color: isActive ? colors.bg : colors.text2,
              }}>{it.label}</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
