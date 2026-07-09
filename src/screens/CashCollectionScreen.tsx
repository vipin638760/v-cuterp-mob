import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { DatePicker } from '../components/DatePicker';
import { useApp } from '../store';
import { todayYMD } from '../lib/constants';
import { computeCashInHand, effectiveCashInHand } from '../lib/calculations';

export const CashCollectionScreen: React.FC = () => {
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const staff = useApp(s => s.staff);
  const [date, setDate] = useState<string>(todayYMD());

  const rows = useMemo(() => branches.map(b => {
    const entry = entries.find(e => e.branch_id === b.id && e.date === date) || null;
    const expected = computeCashInHand(entry, { branch: b, staffList: staff });
    const actual = effectiveCashInHand(entry);
    const counted = entry?.actual_cash !== '' && entry?.actual_cash !== null && entry?.actual_cash !== undefined;
    const diff = counted ? actual - expected : null;
    return { b, expected, actual, diff, counted };
  }), [branches, entries, date, staff]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <DatePicker label="Date" value={date} onChange={setDate} />
      {rows.map(({ b, expected, actual, diff, counted }) => (
        <ListCard key={b.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 16 }}>{b.name}</Text>
            {!counted ? <Pill tone="ghost" text="NOT COUNTED" /> :
              diff === 0 ? <Pill tone="green" text="✓ MATCH" /> :
              diff! > 0 ? <Pill tone="orange" text="▲ EXCESS" /> :
              <Pill tone="red" text="▼ DEFICIT" />}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.text3 }}>Expected</Text>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 18 }}>{INR(expected)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.text3 }}>Counted</Text>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: counted ? colors.gold : colors.text3, fontSize: 18 }}>
                {counted ? INR(actual) : '—'}
              </Text>
            </View>
          </View>
          {counted && diff !== 0 && (
            <Text style={{ fontFamily: fonts.sansSemiBold, color: diff! > 0 ? colors.orange : colors.red, fontSize: 12, marginTop: 6 }}>
              {diff! > 0 ? `+ ${INR(diff!)}` : `- ${INR(Math.abs(diff!))}`}
            </Text>
          )}
        </ListCard>
      ))}
    </ScrollView>
  );
};
