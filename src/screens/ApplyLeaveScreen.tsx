import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { colors, fonts, radius, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { TextField } from '../components/TextField';
import { DatePicker } from '../components/DatePicker';
import { PrimaryButton } from '../components/PrimaryButton';
import { Pill } from '../components/Pill';
import { useApp } from '../store';
import { db } from '../lib/firebase';
import { todayYMD } from '../lib/constants';
import type { Leave } from '../lib/types';

const TYPES: { id: Leave['type']; label: string }[] = [
  { id: 'casual', label: 'Casual' },
  { id: 'sick', label: 'Sick' },
  { id: 'unpaid', label: 'Unpaid' },
];

export const ApplyLeaveScreen: React.FC = () => {
  const user = useApp(s => s.user)!;
  const leaves = useApp(s => s.leaves);
  const setToast = useApp(s => s.setToast);

  const [date, setDate] = useState(todayYMD());
  const [days, setDays] = useState('1');
  const [type, setType] = useState<Leave['type']>('casual');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const myLeaves = useMemo(() =>
    leaves.filter(l => l.staff_id === user.staff_id).sort((a, b) => (b.date || '').localeCompare(a.date || '')),
    [leaves, user.staff_id]
  );

  const submit = async () => {
    if (!user.staff_id) { setToast({ tone: 'red', text: 'No linked staff' }); return; }
    if (!date || !reason.trim()) { setToast({ tone: 'red', text: 'Date + reason required' }); return; }
    setBusy(true);
    try {
      await addDoc(collection(db, 'leaves'), {
        staff_id: user.staff_id,
        date,
        days: Number(days) || 1,
        type,
        reason: reason.trim(),
        status: 'pending',
        source: 'employee',
        requested_at: new Date().toISOString(),
      });
      setReason(''); setDays('1');
      setToast({ tone: 'green', text: 'Leave requested' });
    } catch { setToast({ tone: 'red', text: 'Submit failed' }); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <ListCard>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 16, marginBottom: 10 }}>New Leave Request</Text>
        <View style={{ gap: 10 }}>
          <DatePicker label="Date" value={date} onChange={setDate} />
          <TextField label="Days" value={days} onChangeText={setDays} keyboardType="number-pad" />
          <View>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 6 }}>Type</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {TYPES.map(t => (
                <Pressable key={t.id} onPress={() => setType(t.id)} style={{
                  flex: 1, paddingVertical: 10, alignItems: 'center',
                  borderRadius: radius.sm, borderWidth: 1,
                  borderColor: type === t.id ? colors.gold : colors.line2,
                  backgroundColor: type === t.id ? 'rgba(212,165,116,0.18)' : colors.bg3,
                }}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: type === t.id ? colors.gold : colors.text2 }}>
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
          <TextField label="Reason" value={reason} onChangeText={setReason} placeholder="Brief reason" multiline numberOfLines={3} style={{ minHeight: 64 }} />
          <PrimaryButton label={busy ? 'Submitting…' : 'Submit Request'} onPress={submit} disabled={busy} icon="send" fullWidth />
        </View>
      </ListCard>

      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>
        My Leaves · {myLeaves.length}
      </Text>
      {myLeaves.map(l => (
        <ListCard key={l.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 13 }}>{l.date} · {l.days}d · {l.type}</Text>
              {!!l.reason && <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>{l.reason}</Text>}
            </View>
            <Pill tone={l.status === 'approved' ? 'green' : l.status === 'rejected' ? 'red' : 'orange'} text={l.status.toUpperCase()} />
          </View>
        </ListCard>
      ))}
    </ScrollView>
  );
};
