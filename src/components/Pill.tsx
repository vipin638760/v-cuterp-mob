import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '../theme';

export type PillTone = 'gold' | 'green' | 'red' | 'orange' | 'ghost';

interface PillProps {
  tone?: PillTone;
  text: string;
  style?: ViewStyle;
}

const toneMap: Record<PillTone, { bg: string; fg: string; bd: string }> = {
  gold: { bg: 'rgba(212,165,116,0.14)', fg: colors.gold, bd: 'rgba(212,165,116,0.28)' },
  green: { bg: 'rgba(107,191,123,0.14)', fg: colors.green, bd: 'rgba(107,191,123,0.28)' },
  red: { bg: 'rgba(212,107,107,0.14)', fg: colors.red, bd: 'rgba(212,107,107,0.28)' },
  orange: { bg: 'rgba(224,149,90,0.14)', fg: colors.orange, bd: 'rgba(224,149,90,0.28)' },
  ghost: { bg: colors.bg3, fg: colors.text3, bd: colors.line },
};

export const Pill: React.FC<PillProps> = ({ tone = 'ghost', text, style }) => {
  const t = toneMap[tone];
  return (
    <View style={[{
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
      backgroundColor: t.bg,
      borderWidth: 1,
      borderColor: t.bd,
      alignSelf: 'flex-start',
    }, style]}>
      <Text style={{
        fontSize: 9,
        color: t.fg,
        fontFamily: fonts.sansBold,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
      }}>{text}</Text>
    </View>
  );
};
