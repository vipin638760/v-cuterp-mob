import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { colors, fonts, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { GhostButton } from '../components/GhostButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { useApp } from '../store';
import { db } from '../lib/firebase';

export const LeavesScreen: React.FC = () => {
  const leaves = useApp(s => s.leaves);
  const staff = useApp(s => s.staff);
  const setToast = useApp(s => s.setToast);

  const grouped = useMemo(() => ({
    pending: leaves.filter(l => l.status === 'pending'),
    approved: leaves.filter(l => l.status === 'approved'),
    rejected: leaves.filter(l => l.status === 'rejected'),
  }), [leaves]);

  const decide = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'leaves', id), { status });
      setToast({ tone: 'green', text: status === 'approved' ? 'Approved' : 'Rejected' });
    } catch { setToast({ tone: 'red', text: 'Update failed' }); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>
        Pending · {grouped.pending.length}
      </Text>
      {grouped.pending.map(l => {
        const st = staff.find(s => s.id === l.staff_id);
        return (
          <ListCard key={l.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{st?.name || l.staff_id}</Text>
                <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                  {l.date} · {l.days}d · {l.type}
                </Text>
                {!!l.reason && <Text style={{ fontFamily: fonts.sansMedium, color: colors.text2, fontSize: 11, marginTop: 4 }}>"{l.reason}"</Text>}
              </View>
              <Pill tone="orange" text="PENDING" />
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <GhostButton label="Reject" tone="danger" onPress={() => decide(l.id!, 'rejected')} fullWidth style={{ flex: 1 } as any} />
              <PrimaryButton label="Approve" onPress={() => decide(l.id!, 'approved')} icon="check" fullWidth style={{ flex: 1 } as any} />
            </View>
          </ListCard>
        );
      })}
      {grouped.pending.length === 0 && (
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, textAlign: 'center', paddingVertical: 16 }}>All caught up</Text>
      )}

      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3, marginTop: 8 }}>
        Recent · {grouped.approved.length + grouped.rejected.length}
      </Text>
      {[...grouped.approved, ...grouped.rejected].slice(0, 20).map(l => {
        const st = staff.find(s => s.id === l.staff_id);
        return (
          <ListCard key={l.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{st?.name || l.staff_id}</Text>
                <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                  {l.date} · {l.days}d
                </Text>
              </View>
              <Pill tone={l.status === 'approved' ? 'green' : 'red'} text={l.status.toUpperCase()} />
            </View>
          </ListCard>
        );
      })}
    </ScrollView>
  );
};
