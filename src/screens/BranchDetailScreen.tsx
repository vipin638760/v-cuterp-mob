import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { colors, fonts, INR, radius, space } from '../theme';
import { StatCard } from '../components/StatCard';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { useApp } from '../store';
import { MONTHS, monthYM } from '../lib/constants';
import {
  branchFinancials, effectiveCashInHand, staffBillingInPeriod, staffIncentivesInPeriod,
  staffStatusForMonth, effectiveBranchOnDate,
} from '../lib/calculations';

const Row: React.FC<{ label: string; value: string; tone?: 'gold' | 'green' | 'red' | 'muted' }> = ({ label, value, tone = 'muted' }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7 }}>
    <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 12 }}>{label}</Text>
    <Text style={{ fontFamily: fonts.serifSemiBold, fontSize: 14, color: tone === 'green' ? colors.green : tone === 'red' ? colors.red : tone === 'gold' ? colors.gold : colors.text }}>{value}</Text>
  </View>
);

export const BranchDetailScreen: React.FC = () => {
  const branches = useApp(s => s.branches);
  const staff = useApp(s => s.staff);
  const entries = useApp(s => s.entries);
  const expenses = useApp(s => s.expenses);
  const monthlyExpenses = useApp(s => s.monthlyExpenses);
  const settings = useApp(s => s.settings);
  const leaves = useApp(s => s.leaves);
  const transfers = useApp(s => s.transfers);
  const bid = useApp(s => s.selectedBranchId);

  const branch = branches.find(b => b.id === bid) || null;
  const monthStr = monthYM();
  const [yr, mo] = monthStr.split('-').map(Number);
  const monthLabel = `${MONTHS[mo - 1]} ${yr}`;

  const d = useMemo(() => {
    if (!branch) return null;
    const fin = branchFinancials(branch, monthStr, entries, expenses, monthlyExpenses, staff, settings, leaves);

    const monthEntries = entries.filter(e => e.branch_id === branch.id && e.date && e.date.startsWith(monthStr));
    const cashMTD = monthEntries.reduce((s, e) => s + effectiveCashInHand(e), 0);
    const dates = [...new Set(monthEntries.map(e => e.date))].sort();
    const lastDate = dates[dates.length - 1] || null;
    const lastCash = lastDate
      ? monthEntries.filter(e => e.date === lastDate).reduce((s, e) => s + effectiveCashInHand(e), 0)
      : 0;

    const team = staff
      .filter(st => {
        if (staffStatusForMonth(st, monthStr).status === 'inactive') return false;
        const eff = effectiveBranchOnDate(st, (lastDate || `${monthStr}-01`), transfers) || st.branch_id;
        return eff === branch.id;
      })
      .map(st => ({
        st,
        billing: staffBillingInPeriod(st.id, entries, monthStr),
        incentive: staffIncentivesInPeriod(st.id, entries, monthStr),
      }))
      .sort((a, b) => b.billing - a.billing);

    return { fin, cashMTD, lastCash, lastDate, team, days: dates.length };
  }, [branch, monthStr, entries, expenses, monthlyExpenses, staff, settings, leaves, transfers]);

  if (!branch || !d) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text3, fontSize: 15 }}>No branch selected</Text>
      </View>
    );
  }

  const { fin } = d;

  return (
    <ScrollView contentContainerStyle={{ padding: space.xl, gap: space.lg, paddingBottom: 90 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: fonts.serifSemiBold, fontSize: 26, color: colors.text }}>{branch.name}</Text>
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1, color: colors.text3, marginTop: 2 }}>
            {(branch.type || 'mens').toUpperCase()}{(branch as any).prefix ? ` · ${(branch as any).prefix}` : ''} · {monthLabel}
          </Text>
        </View>
        <Pill tone={fin.net > 0 ? 'green' : 'red'} text={fin.net > 0 ? 'Profit' : 'Loss'} />
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="Revenue (MTD)" value={INR(fin.revenue)} tone="gold" />
        <StatCard label="Net P&amp;L" value={INR(fin.net)} tone={fin.net > 0 ? 'green' : 'red'} />
      </View>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="Cash Collected" value={INR(d.cashMTD)} tone="neutral" />
        <StatCard label="Days Logged" value={String(d.days)} tone="neutral" />
      </View>

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>P&amp;L Breakdown</Text>
        <ListCard>
          <Row label="Collection" value={INR(fin.revenue)} tone="gold" />
          <View style={{ height: 1, backgroundColor: colors.line }} />
          <Row label="Variable expenses" value={`− ${INR(fin.variable)}`} tone="red" />
          <Row label="Fixed costs" value={`− ${INR(fin.fixed)}`} tone="red" />
          <Row label="GST (est.)" value={`− ${INR(fin.gst)}`} tone="red" />
          <Row label="Salary" value={`− ${INR(fin.salary)}`} tone="red" />
          <View style={{ height: 1, backgroundColor: colors.line2 }} />
          <Row label="Net P&L" value={INR(fin.net)} tone={fin.net > 0 ? 'green' : 'red'} />
        </ListCard>
      </View>

      {d.lastDate && (
        <View>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Cash · {d.lastDate}</Text>
          <ListCard>
            <Row label="Cash in hand (last logged day)" value={INR(d.lastCash)} tone={d.lastCash >= 0 ? 'green' : 'red'} />
          </ListCard>
        </View>
      )}

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>Team · {d.team.length}</Text>
        <View style={{ gap: 8 }}>
          {d.team.map(({ st, billing, incentive }) => (
            <ListCard key={st.id}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 30, height: 30, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg3, borderWidth: 1, borderColor: colors.line }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 13 }}>{(st.name || '?').slice(0, 1)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{st.name}</Text>
                  <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11 }}>{st.role || '—'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{INR(billing)}</Text>
                  <Text style={{ fontFamily: fonts.sansMedium, color: colors.gold, fontSize: 11 }}>+{INR(incentive)}</Text>
                </View>
              </View>
            </ListCard>
          ))}
          {d.team.length === 0 && (
            <ListCard><Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 12, textAlign: 'center', paddingVertical: 12 }}>No active staff mapped to this branch</Text></ListCard>
          )}
        </View>
      </View>
    </ScrollView>
  );
};
