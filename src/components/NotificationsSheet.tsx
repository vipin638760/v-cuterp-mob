import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, space } from '../theme';
import { Sheet } from './Sheet';
import { ListCard } from './ListCard';
import { Pill } from './Pill';
import { useApp } from '../store';

interface NotificationsSheetProps {
  open: boolean;
  onClose: () => void;
}

interface Notif {
  id: string;
  title: string;
  detail: string;
  ts: string;
  tone: 'gold' | 'green' | 'orange' | 'red' | 'ghost';
  pill: string;
}

const sortKey = (v: any): string => {
  if (!v) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return new Date(v).toISOString();
  if (v.toDate) try { return v.toDate().toISOString(); } catch { return ''; }
  if (v instanceof Date) return v.toISOString();
  return '';
};

export const NotificationsSheet: React.FC<NotificationsSheetProps> = ({ open, onClose }) => {
  const user = useApp(s => s.user);
  const leaves = useApp(s => s.leaves);
  const advances = useApp(s => s.advances);
  const tasks = useApp(s => s.tasks);
  const staff = useApp(s => s.staff);

  const list = useMemo<Notif[]>(() => {
    if (!user) return [];
    const out: Notif[] = [];

    if (user.role === 'admin' || user.role === 'accountant') {
      leaves.filter(l => l.status === 'pending').forEach(l => {
        const st = staff.find(s => s.id === l.staff_id);
        out.push({
          id: 'l_' + l.id, title: `Leave · ${st?.name || l.staff_id}`,
          detail: `${l.date} · ${l.days}d · ${l.type}`,
          ts: sortKey(l.requested_at), tone: 'orange', pill: 'PENDING',
        });
      });
      advances.filter(a => a.status === 'pending').forEach(a => {
        const st = staff.find(s => s.id === a.staff_id);
        out.push({
          id: 'a_' + a.id, title: `Advance · ${st?.name || a.staff_id}`,
          detail: `₹${(a.amount || 0).toLocaleString('en-IN')} · ${a.date}`,
          ts: sortKey(a.date), tone: 'gold', pill: 'PENDING',
        });
      });
    } else {
      const my = staff.find(s => s.id === user.staff_id);
      tasks.filter(t => t.assignee_id === user.staff_id && t.status !== 'done' && !t.read_by_assignee).forEach(t => {
        out.push({
          id: 't_' + t.id, title: t.title,
          detail: t.due_date ? `Due ${t.due_date}` : 'No deadline',
          ts: sortKey((t as any).created_at), tone: 'gold', pill: 'NEW',
        });
      });
      leaves.filter(l => l.staff_id === user.staff_id && l.status !== 'pending').slice(-5).forEach(l => {
        out.push({
          id: 'l_' + l.id, title: `Leave ${l.status === 'approved' ? 'approved' : 'rejected'}`,
          detail: `${l.date} · ${l.days}d`,
          ts: sortKey(l.requested_at), tone: l.status === 'approved' ? 'green' : 'red', pill: l.status.toUpperCase(),
        });
      });
    }
    return out.sort((a, b) => b.ts.localeCompare(a.ts));
  }, [user, leaves, advances, tasks, staff]);

  return (
    <Sheet open={open} onClose={onClose} title={`Notifications · ${list.length}`}>
      <ScrollView style={{ maxHeight: 520 }} contentContainerStyle={{ padding: space.xl, gap: 8 }}>
        {list.length === 0 && (
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, textAlign: 'center', paddingVertical: 32 }}>
            All caught up
          </Text>
        )}
        {list.map(n => (
          <ListCard key={n.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 13 }}>{n.title}</Text>
                <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>{n.detail}</Text>
              </View>
              <Pill tone={n.tone} text={n.pill} />
            </View>
          </ListCard>
        ))}
      </ScrollView>
    </Sheet>
  );
};
