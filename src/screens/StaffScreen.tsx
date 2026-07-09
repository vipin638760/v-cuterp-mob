import React, { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, radius, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { ChipGroup } from '../components/ChipGroup';
import { TextField } from '../components/TextField';
import { useApp } from '../store';
import { monthYM, todayYMD } from '../lib/constants';
import { effectiveBranchOnDate, staffBillingInPeriod, staffStatusForMonth } from '../lib/calculations';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'masters', label: 'Masters' },
  { id: 'loan', label: 'On Loan' },
  { id: 'inactive', label: 'Inactive' },
];

export const StaffScreen: React.FC = () => {
  const staff = useApp(s => s.staff);
  const branches = useApp(s => s.branches);
  const entries = useApp(s => s.entries);
  const transfers = useApp(s => s.transfers);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const today = todayYMD();
  const monthStr = monthYM();

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return staff.filter(st => {
      if (term && !st.name.toLowerCase().includes(term)) return false;
      const status = staffStatusForMonth(st, monthStr);
      const eff = effectiveBranchOnDate(st, today, transfers);
      const role = (st.role || '').toLowerCase();
      if (filter === 'masters') return role.includes('hairdresser') || role.includes('captain');
      if (filter === 'loan') return eff && st.branch_id && eff !== st.branch_id;
      if (filter === 'inactive') return status.status === 'inactive';
      return true;
    }).map(st => {
      const billing = staffBillingInPeriod(st.id, entries, monthStr);
      const eff = effectiveBranchOnDate(st, today, transfers);
      const home = branches.find(b => b.id === st.branch_id);
      const at = branches.find(b => b.id === eff || '');
      const loan = eff && st.branch_id && eff !== st.branch_id;
      return { st, billing, home, at, loan };
    });
  }, [staff, q, filter, transfers, branches, entries, today, monthStr]);

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.md, gap: space.sm }}>
        <TextField placeholder="Search staff" value={q} onChangeText={setQ} />
        <ChipGroup items={FILTERS} active={filter} onChange={setFilter} />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.sm, paddingBottom: 80 }}>
        {rows.map(({ st, billing, home, at, loan }) => (
          <ListCard key={st.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{
                width: 44, height: 44, borderRadius: radius.md,
                backgroundColor: colors.bg3,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: loan ? colors.orange : colors.line2,
              }}>
                <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 16 }}>
                  {st.name.split(/\s+/).map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 15 }}>{st.name}</Text>
                  {loan && <Pill tone="orange" text={`LOAN · ${home?.name || ''}`} />}
                </View>
                <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                  {st.role || '—'} · {at?.name || '—'}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', color: colors.text3 }}>MTD</Text>
                <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 14 }}>{INR(billing)}</Text>
              </View>
            </View>
          </ListCard>
        ))}
      </ScrollView>
    </View>
  );
};
