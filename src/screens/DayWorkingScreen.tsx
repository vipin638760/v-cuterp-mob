import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { TextField } from '../components/TextField';
import { PrimaryButton } from '../components/PrimaryButton';
import { Pill } from '../components/Pill';
import { useApp } from '../store';
import { db } from '../lib/firebase';
import { todayYMD } from '../lib/constants';
import { effectiveBranchOnDate } from '../lib/calculations';

export const DayWorkingScreen: React.FC = () => {
  const user = useApp(s => s.user)!;
  const staff = useApp(s => s.staff);
  const branches = useApp(s => s.branches);
  const transfers = useApp(s => s.transfers);
  const invoices = useApp(s => s.invoices);
  const setToast = useApp(s => s.setToast);
  const me = staff.find(s => s.id === user.staff_id);

  const today = todayYMD();
  const [service, setService] = useState('');
  const [amount, setAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'online' | 'card'>('cash');
  const [busy, setBusy] = useState(false);

  const myInvoices = useMemo(() =>
    invoices.filter((i: any) =>
      i.date === today && i.status === 'settled' &&
      (i.staff_split || []).some((s: any) => s.staff_id === user.staff_id)
    ), [invoices, user.staff_id, today]
  );
  const todayBilling = useMemo(() => {
    let s = 0;
    myInvoices.forEach((i: any) => {
      const r = (i.staff_split || []).find((x: any) => x.staff_id === user.staff_id);
      if (r) s += r.amount || 0;
    });
    return s;
  }, [myInvoices, user.staff_id]);

  const log = async () => {
    if (!service.trim() || !amount) { setToast({ tone: 'red', text: 'Service + amount required' }); return; }
    if (!me) { setToast({ tone: 'red', text: 'No linked staff' }); return; }
    setBusy(true);
    try {
      const at = effectiveBranchOnDate(me, today, transfers) || me.branch_id || '';
      await addDoc(collection(db, 'service_logs'), {
        staff_id: me.id,
        branch_id: at,
        home_branch_id: me.branch_id,
        loan_flag: at !== me.branch_id,
        date: today,
        service_name: service.trim(),
        amount: Number(amount) || 0,
        payment_mode: payMode,
        source: 'manual',
      });
      setService(''); setAmount('');
      setToast({ tone: 'green', text: 'Logged' });
    } catch { setToast({ tone: 'red', text: 'Save failed' }); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <ListCard>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>Today's Billing</Text>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 32, marginTop: 4 }}>{INR(todayBilling)}</Text>
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>{myInvoices.length} bills</Text>
      </ListCard>

      <ListCard>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14, marginBottom: 10 }}>Log Walk-in Service</Text>
        <View style={{ gap: 10 }}>
          <TextField label="Service" value={service} onChangeText={setService} placeholder="e.g. haircut" />
          <TextField label="Amount" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
          <View style={{ gap: 5 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.text3 }}>Payment</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['cash', 'online', 'card'] as const).map(m => (
                <Pressable key={m} onPress={() => setPayMode(m)} style={{
                  flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 8, borderWidth: 1,
                  borderColor: payMode === m ? colors.gold : colors.line2,
                  backgroundColor: payMode === m ? 'rgba(212,165,116,0.18)' : colors.bg3,
                }}>
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: payMode === m ? colors.gold : colors.text2 }}>{m}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <PrimaryButton label={busy ? 'Saving…' : 'Log Service'} onPress={log} disabled={busy} icon="plus" fullWidth />
        </View>
      </ListCard>

      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>
        POS Bills · {myInvoices.length}
      </Text>
      {myInvoices.map((i: any) => {
        const r = (i.staff_split || []).find((x: any) => x.staff_id === user.staff_id);
        const branch = branches.find(b => b.id === i.branch_id);
        const loan = i.branch_id !== me?.branch_id;
        return (
          <ListCard key={i.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 13 }}>
                  {i.invoice_no || `Walk-in #${String(i.walkin_no || 0).padStart(3, '0')}`}
                </Text>
                <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                  {branch?.name || ''}
                </Text>
              </View>
              {loan && <Pill tone="orange" text="LOAN" />}
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 14 }}>{INR(r?.amount || 0)}</Text>
            </View>
          </ListCard>
        );
      })}
    </ScrollView>
  );
};
