import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { useApp } from '../store';

const STATUS: { id: 'todo' | 'in_progress' | 'done'; label: string; tone: 'ghost' | 'gold' | 'green' }[] = [
  { id: 'todo', label: 'To Do', tone: 'ghost' },
  { id: 'in_progress', label: 'In Progress', tone: 'gold' },
  { id: 'done', label: 'Done', tone: 'green' },
];

export const TaskpediaScreen: React.FC = () => {
  const tasks = useApp(s => s.tasks);
  const staff = useApp(s => s.staff);

  const grouped = useMemo(() => {
    const m = { todo: [] as typeof tasks, in_progress: [] as typeof tasks, done: [] as typeof tasks };
    tasks.forEach(t => { m[t.status]?.push(t); });
    return m;
  }, [tasks]);

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.md, paddingBottom: 80 }}>
      {STATUS.map(s => (
        <View key={s.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Pill tone={s.tone} text={s.label} />
            <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>{grouped[s.id].length}</Text>
          </View>
          <View style={{ gap: 6 }}>
            {grouped[s.id].map(t => {
              const assignee = staff.find(st => st.id === t.assignee_id);
              return (
                <ListCard key={t.id}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{t.title}</Text>
                  {!!t.description && (
                    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 4 }}>{t.description}</Text>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    {assignee && <Pill tone="gold" text={assignee.name} />}
                    {!!t.due_date && <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 10 }}>Due {t.due_date}</Text>}
                  </View>
                </ListCard>
              );
            })}
            {grouped[s.id].length === 0 && (
              <Text style={{ fontFamily: fonts.sansMedium, color: colors.text4, fontSize: 11, paddingVertical: 8 }}>No tasks</Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  );
};
