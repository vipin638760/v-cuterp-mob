import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors, fonts, radius } from '../theme';
import { Icon } from './Icon';

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (ymd: string) => void;
  mode?: 'date' | 'month';
  minimumDate?: Date;
  maximumDate?: Date;
}

const ymd = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parse = (s: string): Date => {
  if (!s) return new Date();
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1);
};

export const DatePicker: React.FC<DatePickerProps> = ({ label, value, onChange, minimumDate, maximumDate }) => {
  const [open, setOpen] = useState(false);
  const date = parse(value);

  const onPick = (_: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setOpen(false);
    if (selected) onChange(ymd(selected));
  };

  return (
    <View style={{ gap: 6 }}>
      {label && (
        <Text style={{
          fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.8,
          textTransform: 'uppercase', color: colors.text3,
        }}>{label}</Text>
      )}
      <Pressable onPress={() => setOpen(true)} style={{
        backgroundColor: colors.bg3,
        borderRadius: radius.sm,
        borderWidth: 1, borderColor: colors.line2,
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 12, minHeight: 44,
      }}>
        <Text style={{ flex: 1, fontFamily: fonts.sansMedium, color: colors.text, fontSize: 14 }}>
          {value || 'Pick date'}
        </Text>
        <Icon name="calendar" size={16} color={colors.text2} />
      </Pressable>
      {open && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          themeVariant="dark"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onPick}
        />
      )}
      {Platform.OS === 'ios' && open && (
        <Pressable onPress={() => setOpen(false)} style={{ alignSelf: 'flex-end', padding: 6 }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.gold, letterSpacing: 1.4 }}>DONE</Text>
        </Pressable>
      )}
    </View>
  );
};
