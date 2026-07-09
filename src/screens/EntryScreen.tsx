import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { ChipGroup } from '../components/ChipGroup';
import { Pill } from '../components/Pill';
import { PrimaryButton } from '../components/PrimaryButton';
import { GhostButton } from '../components/GhostButton';
import { TextField } from '../components/TextField';
import { DatePicker } from '../components/DatePicker';
import { StaffBillingEditor } from '../components/StaffBillingEditor';
import { useApp } from '../store';
import { db } from '../lib/firebase';
import { todayYMD } from '../lib/constants';
import { computeCashInHand } from '../lib/calculations';
import type { DailyEntry, StaffBilling } from '../lib/types';

export const EntryScreen: React.FC = () => {
  const branches = useApp(s => s.branches);
  const staff = useApp(s => s.staff);
  const entries = useApp(s => s.entries);
  const setToast = useApp(s => s.setToast);
  const user = useApp(s => s.user)!;

  const [date, setDate] = useState<string>(todayYMD());
  const [branchId, setBranchId] = useState<string>(user.branch_id && user.branch_id !== 'all' ? user.branch_id : (branches[0]?.id || ''));
  const branch = branches.find(b => b.id === branchId);

  const existing = useMemo(() =>
    entries.find(e => e.branch_id === branchId && e.date === date),
    [entries, branchId, date]
  );

  const [form, setForm] = useState<DailyEntry>(() => existing || ({
    branch_id: branchId, date, cash: 0, upi: 0, card: 0, others: 0, petrol: 0,
    material_expense: 0, material_sale: 0, actual_cash: '', staff_billing: [],
    income: { cash: 0, upi: 0, card: 0 },
  } as DailyEntry));
  const [billingOpen, setBillingOpen] = useState(false);

  useEffect(() => {
    setForm(existing || ({
      branch_id: branchId, date, cash: 0, upi: 0, card: 0, others: 0, petrol: 0,
      material_expense: 0, material_sale: 0, actual_cash: '', staff_billing: [],
      income: { cash: 0, upi: 0, card: 0 },
    } as DailyEntry));
  }, [existing?.id, branchId, date]);

  const expectedCash = useMemo(() => computeCashInHand(form, { branch, staffList: staff }), [form, branch, staff]);
  const reconciliation = useMemo(() => {
    if (form.actual_cash === '' || form.actual_cash === null || form.actual_cash === undefined) return null;
    const diff = Number(form.actual_cash) - expectedCash;
    return diff;
  }, [form.actual_cash, expectedCash]);

  const num = (k: keyof DailyEntry) => (form[k] as any)?.toString?.() ?? '';
  const setNum = (k: keyof DailyEntry) => (s: string) => {
    const v = s.replace(/[^0-9]/g, '');
    setForm(prev => ({ ...prev, [k]: v === '' ? 0 : Number(v) } as any));
  };
  const setActual = (s: string) => {
    const v = s.replace(/[^0-9]/g, '');
    setForm(prev => ({ ...prev, actual_cash: v === '' ? '' : Number(v) }));
  };

  const save = async () => {
    try {
      const payload = {
        ...form,
        branch_id: branchId,
        date,
        cash_in_hand: expectedCash,
        income: { cash: form.cash || 0, upi: form.upi || 0, card: form.card || 0 },
      };
      if (existing?.id) {
        await updateDoc(doc(db, 'entries', existing.id), payload as any);
      } else {
        await addDoc(collection(db, 'entries'), payload as any);
      }
      setToast({ tone: 'green', text: 'Entry saved' });
    } catch {
      setToast({ tone: 'red', text: 'Save failed' });
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Branch</Text>
        <ChipGroup
          items={branches.map(b => ({ id: b.id, label: b.name }))}
          active={branchId}
          onChange={setBranchId}
        />
      </View>

      <ListCard>
        <DatePicker label="Date" value={date} onChange={setDate} />
      </ListCard>

      <ListCard>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 16, marginBottom: 12 }}>Income Today</Text>
        <View style={{ gap: 10 }}>
          <TextField label="Cash" value={num('cash')} onChangeText={setNum('cash')} keyboardType="number-pad" />
          <TextField label="UPI / Online" value={num('upi')} onChangeText={setNum('upi')} keyboardType="number-pad" />
          <TextField label="Card" value={num('card')} onChangeText={setNum('card')} keyboardType="number-pad" />
          <TextField label="Material Sale" value={num('material_sale')} onChangeText={setNum('material_sale')} keyboardType="number-pad" />
        </View>
      </ListCard>

      <ListCard>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 16, marginBottom: 12 }}>Expenses</Text>
        <View style={{ gap: 10 }}>
          <TextField label="Petrol" value={num('petrol')} onChangeText={setNum('petrol')} keyboardType="number-pad" />
          <TextField label="Material Expense" value={num('material_expense')} onChangeText={setNum('material_expense')} keyboardType="number-pad" />
          <TextField label="Others" value={num('others')} onChangeText={setNum('others')} keyboardType="number-pad" />
        </View>
      </ListCard>

      <ListCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 16 }}>Cash Reconciliation</Text>
          {reconciliation !== null && (
            <Pill
              tone={reconciliation === 0 ? 'green' : reconciliation > 0 ? 'orange' : 'red'}
              text={reconciliation === 0 ? '✓ MATCH' : reconciliation > 0 ? `▲ EXCESS ${INR(reconciliation)}` : `▼ DEFICIT ${INR(Math.abs(reconciliation))}`}
            />
          )}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>Cash in Hand (expected)</Text>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 22, marginTop: 4 }}>{INR(expectedCash)}</Text>
          </View>
        </View>
        <TextField
          label="Actual Cash Counted"
          value={form.actual_cash === '' || form.actual_cash === null || form.actual_cash === undefined ? '' : String(form.actual_cash)}
          onChangeText={setActual}
          keyboardType="number-pad"
          placeholder="Leave blank if not counted"
        />
      </ListCard>

      <ListCard>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 16 }}>Staff Billing</Text>
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>
            {(form.staff_billing || []).length} rows
          </Text>
        </View>
        {(form.staff_billing || []).slice(0, 4).map((r, i) => {
          const st = staff.find(s => s.id === r.staff_id);
          return (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
              <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.text2, fontSize: 12 }}>{st?.name || r.staff_id}</Text>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 12 }}>{INR(r.billing || 0)}</Text>
            </View>
          );
        })}
        {(form.staff_billing || []).length > 4 && (
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
            + {(form.staff_billing || []).length - 4} more
          </Text>
        )}
        <GhostButton
          label={(form.staff_billing || []).length === 0 ? 'Add Staff Billing' : 'Edit Staff Billing'}
          icon="edit"
          onPress={() => setBillingOpen(true)}
          fullWidth
          style={{ marginTop: 10 } as any}
        />
      </ListCard>

      <PrimaryButton label="Save Entry" onPress={save} icon="check" fullWidth />

      <StaffBillingEditor
        open={billingOpen}
        rows={form.staff_billing || []}
        branchId={branchId}
        branchType={branch?.type}
        date={date}
        onClose={() => setBillingOpen(false)}
        onSave={(rows: StaffBilling[]) => setForm(prev => ({ ...prev, staff_billing: rows }))}
      />
    </ScrollView>
  );
};
