import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { colors, fonts, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { TextField } from '../components/TextField';
import { ChipGroup } from '../components/ChipGroup';
import { useApp } from '../store';
import { todayYMD } from '../lib/constants';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'frequent', label: 'Frequent' },
  { id: 'new', label: 'New' },
  { id: 'lapsed', label: 'Lapsed' },
];

export const CustomersScreen: React.FC = () => {
  const customers = useApp(s => s.customers);
  const branches = useApp(s => s.branches);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const today = new Date(todayYMD() + 'T00:00');
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return customers.filter(c => {
      if (term && !(c.name.toLowerCase().includes(term) || (c.phone || '').includes(term))) return false;
      const lv = c.last_visit_date ? new Date(c.last_visit_date + 'T00:00') : null;
      const days = lv ? Math.floor((today.getTime() - lv.getTime()) / 86400000) : Infinity;
      const visits = c.visits || 0;
      if (filter === 'frequent') return visits >= 4;
      if (filter === 'new') return !lv || days < 14;
      if (filter === 'lapsed') return days > 60;
      return true;
    }).sort((a, b) => (b.last_visit_date || '').localeCompare(a.last_visit_date || ''));
  }, [customers, q, filter, today]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.md, gap: space.sm }}>
        <TextField placeholder="Search name or phone" value={q} onChangeText={setQ} />
        <ChipGroup items={FILTERS} active={filter} onChange={setFilter} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.sm, paddingBottom: 80 }}>
        {filtered.map(c => {
          const branch = branches.find(b => b.id === c.last_visit_branch_id);
          const lv = c.last_visit_date ? new Date(c.last_visit_date + 'T00:00') : null;
          const days = lv ? Math.floor((today.getTime() - lv.getTime()) / 86400000) : null;
          return (
            <ListCard key={c.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: colors.bg3,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: colors.line2,
                }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 14 }}>
                    {c.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 15 }}>{c.name}</Text>
                  <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                    {c.phone || '—'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  {lv ? (
                    <>
                      <Text style={{ fontFamily: fonts.sansSemiBold, color: days! > 60 ? colors.red : days! > 30 ? colors.orange : colors.text2, fontSize: 11 }}>
                        {days}d ago
                      </Text>
                      <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 10 }}>{branch?.name || ''}</Text>
                    </>
                  ) : (
                    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>No visits yet</Text>
                  )}
                </View>
              </View>
            </ListCard>
          );
        })}
        {filtered.length === 0 && (
          <Text style={{ textAlign: 'center', color: colors.text3, fontFamily: fonts.sansMedium, paddingTop: 40 }}>
            No customers
          </Text>
        )}
      </ScrollView>
    </View>
  );
};
