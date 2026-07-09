import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Pill } from '../components/Pill';
import { useApp } from '../store';
import { db } from '../lib/firebase';
import { todayYMD, monthYM } from '../lib/constants';

export const RequestAdvanceScreen: React.FC = () => {
  const user = useApp(s => s.user)!;
  const staff = useApp(s => s.staff);
  const advances = useApp(s => s.advances);
  const setToast = useApp(s => s.setToast);
  const me = staff.find(s => s.id === user.staff_id);

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const mine = useMemo(() =>
    advances.filter(a => a.staff_id === user.staff_id)
      .sort((a: any, b: any) => (b.date || b.requested_at || '').localeCompare(a.date || a.requested_at || '')),
    [advances, user.staff_id]);

  const pending = mine.filter((a: any) => a.status === 'pending').reduce((s, a) => s + (Number(a.amount) || 0), 0);

  const submit = async () => {
    const amt = Number(amount) || 0;
    if (amt <= 0) { setToast({ tone: 'red', text: 'Enter an amount' }); return; }
    if (!me) { setToast({ tone: 'red', text: 'No linked staff' }); return; }
    setBusy(true);
    try {
      const date = todayYMD();
      await addDoc(collection(db, 'payroll_advances'), {
        staff_id: me.id,
        staff_name: me.name,
        branch_id: me.branch_id,
        amount: amt,
        reason: reason.trim(),
        status: 'pending',
        date,
        month_str: monthYM(),
        requested_at: new Date().toISOString(),
      });
      setAmount(''); setReason('');
      setToast({ tone: 'green', text: 'Advance requested' });
    } catch { setToast({ tone: 'red', text: 'Request failed' }); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <ListCard>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 15, marginBottom: 10 }}>New Advance Request</Text>
        <View style={{ gap: 10 }}>
          <TextField label="Amount" value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder="₹" />
          <TextField label="Reason" value={reason} onChangeText={setReason} placeholder="Optional note" />
          <PrimaryButton label={busy ? 'Submitting…' : 'Request Advance'} onPress={submit} disabled={busy} icon="send" fullWidth />
        </View>
      </ListCard>

      {pending > 0 && (
        <ListCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.text3 }}>Pending Approval</Text>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.orange, fontSize: 18 }}>{INR(pending)}</Text>
          </View>
        </ListCard>
      )}

      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>My Requests · {mine.length}</Text>
      {mine.length === 0 ? (
        <ListCard><Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>No requests yet</Text></ListCard>
      ) : (
        <View style={{ gap: 6 }}>
          {mine.map((a: any) => (
            <ListCard key={a.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 15 }}>{INR(a.amount)}</Text>
                  <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 1 }}>
                    {a.date || (a.requested_at || '').slice(0, 10)}{a.reason ? ` · ${a.reason}` : ''}
                  </Text>
                </View>
                <Pill tone={a.status === 'approved' ? 'green' : a.status === 'rejected' ? 'red' : 'orange'} text={(a.status || 'pending').toUpperCase()} />
              </View>
            </ListCard>
          ))}
        </View>
      )}
    </ScrollView>
  );
};
