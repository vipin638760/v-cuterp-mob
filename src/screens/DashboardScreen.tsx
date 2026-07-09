import React, { useMemo } from 'react';
import { ScrollView, Text, View, Pressable } from 'react-native';
import { colors, fonts, greetingForHour, INR, radius, space } from '../theme';
import { StatCard } from '../components/StatCard';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { Icon } from '../components/Icon';
import { useApp } from '../store';
import { todayYMD } from '../lib/constants';
import { computeCashInHand, effectiveBranchOnDate } from '../lib/calculations';

export const DashboardScreen: React.FC = () => {
  const user = useApp(s => s.user)!;
  const branches = useApp(s => s.branches);
  const staff = useApp(s => s.staff);
  const customers = useApp(s => s.customers);
  const entries = useApp(s => s.entries);
  const invoices = useApp(s => s.invoices);
  const transfers = useApp(s => s.transfers);
  const push = useApp(s => s.push);

  const today = todayYMD();
  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);
  const firstName = user.name.split(/\s+/)[0];

  const allowed = user.role === 'admin' || user.role === 'accountant';

  const branchScope = useMemo(() => {
    if (allowed) return branches.map(b => b.id);
    return user.branch_id ? [user.branch_id] : [];
  }, [allowed, branches, user.branch_id]);

  const todayInvoices = useMemo(() =>
    invoices.filter((i: any) => i.date === today && i.status === 'settled' && (allowed || branchScope.includes(i.branch_id))),
    [invoices, today, allowed, branchScope]
  );

  const revenue = useMemo(
    () => todayInvoices.reduce((s: number, i: any) => s + (Number(i.total) || 0), 0),
    [todayInvoices]
  );

  const cashInHand = useMemo(() => {
    const todayEntries = entries.filter(e => e.date === today && branchScope.includes(e.branch_id));
    return todayEntries.reduce((s, e) => {
      const branch = branches.find(b => b.id === e.branch_id);
      return s + computeCashInHand(e, { branch, staffList: staff });
    }, 0);
  }, [entries, today, branchScope, branches, staff]);

  const onDuty = useMemo(() => {
    return staff.filter(st => {
      if (st.exit_date && st.exit_date < today) return false;
      const eff = effectiveBranchOnDate(st, today, transfers);
      return eff && branchScope.includes(eff);
    }).length;
  }, [staff, transfers, today, branchScope]);

  const customersToday = useMemo(() => {
    const ids = new Set(todayInvoices.map((i: any) => i.customer_id).filter(Boolean));
    const walkins = todayInvoices.filter((i: any) => !i.customer_id).length;
    return ids.size + walkins;
  }, [todayInvoices]);

  const recentSettled = useMemo(() => {
    return [...todayInvoices].sort((a: any, b: any) => (b.settled_at || '').localeCompare(a.settled_at || '')).slice(0, 6);
  }, [todayInvoices]);

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: space.xl, paddingVertical: space.xl, gap: space.lg, paddingBottom: 40 }}>
      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 2.4, textTransform: 'uppercase', color: colors.text3 }}>
          {greeting}
        </Text>
        <Text style={{ fontFamily: fonts.serifSemiBold, fontSize: 32, color: colors.text, marginTop: 4 }}>
          {firstName} <Text style={{ fontSize: 28 }}>👋</Text>
        </Text>
        <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 12, marginTop: 4 }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="Revenue Today" value={INR(revenue)} tone="gold" />
        <StatCard label="Customers" value={String(customersToday)} tone="neutral" />
      </View>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <StatCard label="Cash in Hand" value={INR(cashInHand)} tone={cashInHand >= 0 ? 'green' : 'red'} />
        <StatCard label="On-Duty" value={String(onDuty)} tone="neutral" />
      </View>

      <View>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: colors.text3, marginBottom: 8 }}>
          Today's Activity
        </Text>
        {recentSettled.length === 0 ? (
          <ListCard>
            <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 12, textAlign: 'center', paddingVertical: 16 }}>
              No bills settled yet today
            </Text>
          </ListCard>
        ) : (
          <View style={{ gap: 8 }}>
            {recentSettled.map((inv: any) => {
              const branch = branches.find(b => b.id === inv.branch_id);
              return (
                <ListCard key={inv.id}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{
                      width: 36, height: 36, borderRadius: radius.md,
                      backgroundColor: colors.bg3,
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1, borderColor: colors.line,
                    }}>
                      <Icon name="check" size={16} color={colors.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>
                        {inv.invoice_no || (inv.walkin_no ? `Walk-in #${String(inv.walkin_no).padStart(3, '0')}` : 'Bill')}
                      </Text>
                      <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                        {branch?.name || inv.branch_id} · {(inv.payment_mode || 'cash').toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 16 }}>
                      {INR(inv.total)}
                    </Text>
                  </View>
                </ListCard>
              );
            })}
          </View>
        )}
      </View>

      {allowed && (
        <View style={{ flexDirection: 'row', gap: space.md, marginTop: 4 }}>
          <Pressable onPress={() => push('pos')} style={{ flex: 1 }}>
            <ListCard padding={16}>
              <Icon name="shopping-bag" size={20} color={colors.gold} />
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14, marginTop: 8 }}>Settle Bill</Text>
              <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>POS Terminal</Text>
            </ListCard>
          </Pressable>
          <Pressable onPress={() => push('daily-expenses')} style={{ flex: 1 }}>
            <ListCard padding={16}>
              <Icon name="file" size={20} color={colors.gold} />
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14, marginTop: 8 }}>Add Expense</Text>
              <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>Quick entry</Text>
            </ListCard>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
};
