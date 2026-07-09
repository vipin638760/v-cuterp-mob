import React from 'react';
import { Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '../theme';

interface StatCardProps {
  label: string;
  value: string;
  delta?: string;
  tone?: 'gold' | 'green' | 'red' | 'neutral';
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, delta, tone = 'neutral', style }) => {
  const deltaColor = tone === 'green' ? colors.green : tone === 'red' ? colors.red : colors.text3;
  return (
    <View style={[{
      backgroundColor: colors.bg2,
      borderRadius: radius.xl,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.line,
      flex: 1,
      overflow: 'hidden',
    }, style]}>
      <View style={{
        position: 'absolute',
        top: -30,
        right: -30,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(212,165,116,0.06)',
      }} />
      <Text style={{
        fontSize: 9,
        color: colors.text3,
        letterSpacing: 1.8,
        textTransform: 'uppercase',
        fontFamily: fonts.sansBold,
        marginBottom: 6,
      }}>{label}</Text>
      <Text style={{
        fontFamily: fonts.serifSemiBold,
        fontSize: 28,
        color: colors.text,
        lineHeight: 32,
      }}>{value}</Text>
      {delta && (
        <Text style={{
          fontSize: 10,
          color: deltaColor,
          fontFamily: fonts.sansSemiBold,
          marginTop: 4,
        }}>{delta}</Text>
      )}
    </View>
  );
};
