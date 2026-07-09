import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { addDoc, collection } from 'firebase/firestore';
import { colors, fonts, INR, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { ChipGroup } from '../components/ChipGroup';
import { TextField } from '../components/TextField';
import { DatePicker } from '../components/DatePicker';
import { PrimaryButton } from '../components/PrimaryButton';
import { useApp } from '../store';
import { db } from '../lib/firebase';
import { todayYMD } from '../lib/constants';

export const DailyExpensesScreen: React.FC = () => {
  const branches = useApp(s => s.branches);
  const expenses = useApp(s => s.expenses);
  const setToast = useApp(s => s.setToast);
  const user = useApp(s => s.user)!;

  const [branchId, setBranchId] = useState(user.branch_id && user.branch_id !== 'all' ? user.branch_id : (branches[0]?.id || ''));
  const [date, setDate] = useState(todayYMD());
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const todays = useMemo(() => expenses.filter(e => e.branch_id === branchId && e.date === date), [expenses, branchId, date]);
  const totalToday = todays.reduce((s, e) => s + (e.amount || 0), 0);

  const add = async () => {
    if (!branchId || !category.trim() || !amount) {
      setToast({ tone: 'red', text: 'Branch, category, amount required' });
      return;
    }
    try {
      // Real `daily_expenses` docs key the category as `expense_type`.
      const branchName = branches.find(b => b.id === branchId)?.name || '';
      await addDoc(collection(db, 'daily_expenses'), {
        branch_id: branchId,
        branch_name: branchName,
        date,
        expense_type: category.trim(),
        amount: Number(amount) || 0,
        note: note.trim(),
        created_by: user.id,
        created_at: new Date().toISOString(),
      });
      setCategory(''); setAmount(''); setNote('');
      setToast({ tone: 'green', text: 'Added' });
    } catch {
      setToast({ tone: 'red', text: 'Save failed' });
    }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <ChipGroup items={branches.map(b => ({ id: b.id, label: b.name }))} active={branchId} onChange={setBranchId} />
      <DatePicker label="Date" value={date} onChange={setDate} />
      <TextField label="Category" value={category} onChangeText={setCategory} placeholder="e.g. tea, supplies" />
      <TextField label="Amount" value={amount} onChangeText={setAmount} keyboardType="number-pad" />
      <TextField label="Note" value={note} onChangeText={setNote} />
      <PrimaryButton label="Add Expense" onPress={add} icon="plus" fullWidth />

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>
          Today {INR(totalToday)} · {todays.length} entries
        </Text>
        <View style={{ gap: 6 }}>
          {todays.map(e => (
            <ListCard key={e.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 13 }}>{(e as any).expense_type || (e as any).category}</Text>
                  {!!e.note && <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>{e.note}</Text>}
                </View>
                <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 14 }}>{INR(e.amount)}</Text>
              </View>
            </ListCard>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};
