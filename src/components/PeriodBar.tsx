import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { colors, fonts, radius } from '../theme';
import { Icon } from './Icon';
import { MONTHS } from '../lib/constants';

export interface Period { mode: 'month' | 'year'; year: number; month: number } // month 1-12

export const periodPrefix = (p: Period): string =>
  p.mode === 'year' ? `${p.year}` : `${p.year}-${String(p.month).padStart(2, '0')}`;

export const periodLabel = (p: Period): string =>
  p.mode === 'year' ? `${p.year}` : `${MONTHS[p.month - 1]} ${p.year}`;

export const currentPeriod = (): Period => {
  const d = new Date();
  return { mode: 'month', year: d.getFullYear(), month: d.getMonth() + 1 };
};

// Month prefixes covered by a period: [YYYY-MM] for month mode; Jan..current
// (or Jan..Dec for a past year) for year mode.
export const periodMonths = (p: Period): string[] => {
  if (p.mode === 'month') return [periodPrefix(p)];
  const d = new Date();
  const last = p.year < d.getFullYear() ? 12 : d.getMonth() + 1;
  return Array.from({ length: last }, (_, i) => `${p.year}-${String(i + 1).padStart(2, '0')}`);
};

const Toggle: React.FC<{ on: boolean; label: string; onPress: () => void }> = ({ on, label, onPress }) => (
  <Pressable onPress={onPress} style={{
    flex: 1, paddingVertical: 8, borderRadius: radius.sm, alignItems: 'center',
    backgroundColor: on ? colors.gold : 'transparent',
  }}>
    <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: on ? '#1a1208' : colors.text2 }}>{label}</Text>
  </Pressable>
);

export const PeriodBar: React.FC<{ value: Period; onChange: (p: Period) => void }> = ({ value, onChange }) => {
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;

  const atMax = value.mode === 'year'
    ? value.year >= curY
    : (value.year > curY || (value.year === curY && value.month >= curM));

  const step = (dir: 1 | -1) => {
    if (value.mode === 'year') { onChange({ ...value, year: value.year + dir }); return; }
    let m = value.month + dir, y = value.year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    onChange({ ...value, year: y, month: m });
  };

  const setMode = (mode: 'month' | 'year') => {
    if (mode === value.mode) return;
    onChange({ ...value, mode, month: mode === 'month' ? Math.min(value.month, value.year === curY ? curM : 12) : value.month });
  };

  return (
    <View style={{ gap: 10 }}>
      <View style={{
        flexDirection: 'row', backgroundColor: colors.bg2, borderRadius: radius.md,
        borderWidth: 1, borderColor: colors.line, padding: 3,
      }}>
        <Toggle on={value.mode === 'month'} label="Monthly" onPress={() => setMode('month')} />
        <Toggle on={value.mode === 'year'} label="Yearly" onPress={() => setMode('year')} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        <Pressable onPress={() => step(-1)} hitSlop={10} style={{ padding: 6, borderRadius: radius.sm, backgroundColor: colors.bg3 }}>
          <Icon name="chevron-left" size={18} color={colors.text2} />
        </Pressable>
        <Text style={{ fontFamily: fonts.serifSemiBold, fontSize: 18, color: colors.gold, minWidth: 130, textAlign: 'center' }}>
          {periodLabel(value)}
        </Text>
        <Pressable onPress={() => !atMax && step(1)} hitSlop={10} disabled={atMax}
          style={{ padding: 6, borderRadius: radius.sm, backgroundColor: colors.bg3, opacity: atMax ? 0.35 : 1 }}>
          <Icon name="chevron-right" size={18} color={colors.text2} />
        </Pressable>
      </View>
    </View>
  );
};
