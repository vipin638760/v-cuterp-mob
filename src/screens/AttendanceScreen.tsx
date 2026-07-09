import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { colors, fonts, radius, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { StatCard } from '../components/StatCard';
import { Pill } from '../components/Pill';
import { PrimaryButton } from '../components/PrimaryButton';
import { Icon } from '../components/Icon';
import { useApp } from '../store';
import { db } from '../lib/firebase';
import { todayYMD, monthYM } from '../lib/constants';
import { effectiveBranchOnDate } from '../lib/calculations';

interface Att { id: string; date: string; status: string; marked_at?: string; branch_id?: string }

export const AttendanceScreen: React.FC = () => {
  const user = useApp(s => s.user)!;
  const staff = useApp(s => s.staff);
  const branches = useApp(s => s.branches);
  const transfers = useApp(s => s.transfers);
  const setToast = useApp(s => s.setToast);
  const me = staff.find(s => s.id === user.staff_id);

  const today = todayYMD();
  const monthStr = monthYM();
  const [records, setRecords] = useState<Att[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const atBranch = me ? (effectiveBranchOnDate(me, today, transfers) || me.branch_id || '') : '';
  const branch = branches.find(b => b.id === atBranch);

  const load = async () => {
    if (!me) { setLoading(false); return; }
    try {
      const snap = await getDocs(query(collection(db, 'attendance'), where('staff_id', '==', me.id)));
      const arr: Att[] = [];
      snap.forEach(d => arr.push({ id: d.id, ...(d.data() as any) }));
      arr.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      setRecords(arr);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [me?.id]);

  const todayRec = records.find(r => r.date === today);
  const monthDays = useMemo(() => records.filter(r => r.date.startsWith(monthStr) && r.status === 'present').length, [records, monthStr]);

  const markPresent = async () => {
    if (!me) { setToast({ tone: 'red', text: 'No linked staff' }); return; }
    if (todayRec) return;
    setBusy(true);
    try {
      await setDoc(doc(db, 'attendance', `${me.id}_${today}`), {
        staff_id: me.id,
        staff_name: me.name,
        branch_id: atBranch,
        date: today,
        status: 'present',
        marked_at: new Date().toISOString(),
      });
      setToast({ tone: 'green', text: 'Marked present' });
      await load();
    } catch { setToast({ tone: 'red', text: 'Failed to mark' }); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <ListCard>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: colors.text3 }}>Today · {today}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <View style={{
            width: 52, height: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center',
            backgroundColor: todayRec ? 'rgba(107,191,123,0.14)' : colors.bg3,
            borderWidth: 1, borderColor: todayRec ? colors.green : colors.line2,
          }}>
            <Icon name={todayRec ? 'check-circle' : 'clock'} size={24} color={todayRec ? colors.green : colors.text3} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 18 }}>
              {todayRec ? 'Present' : 'Not marked'}
            </Text>
            <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
              {branch?.name || atBranch || '—'}{todayRec?.marked_at ? ` · ${new Date(todayRec.marked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : ''}
            </Text>
          </View>
        </View>
        {!todayRec && (
          <View style={{ marginTop: 12 }}>
            <PrimaryButton label={busy ? 'Marking…' : 'Mark Present'} onPress={markPresent} disabled={busy} icon="check" fullWidth />
          </View>
        )}
      </ListCard>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="Present · This Month" value={String(monthDays)} tone="green" />
        <StatCard label="Total Logged" value={String(records.length)} tone="neutral" />
      </View>

      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 10, color: colors.text4 }}>
        Location check-in (geo-fence) coming soon.
      </Text>

      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>Recent</Text>
      {loading ? (
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 12, paddingVertical: 8 }}>Loading…</Text>
      ) : records.length === 0 ? (
        <ListCard><Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>No attendance yet</Text></ListCard>
      ) : (
        <View style={{ gap: 6 }}>
          {records.slice(0, 20).map(r => (
            <ListCard key={r.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 13 }}>{r.date}</Text>
                <Pill tone={r.status === 'present' ? 'green' : 'red'} text={r.status} />
              </View>
            </ListCard>
          ))}
        </View>
      )}
    </ScrollView>
  );
};
