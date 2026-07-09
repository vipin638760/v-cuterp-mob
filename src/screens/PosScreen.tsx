import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import { colors, fonts, INR, radius, space } from '../theme';
import { ListCard } from '../components/ListCard';
import { Pill } from '../components/Pill';
import { ChipGroup } from '../components/ChipGroup';
import { PrimaryButton } from '../components/PrimaryButton';
import { Icon } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { TextField } from '../components/TextField';
import { BillPrintModal } from '../components/BillPrintModal';
import { useApp } from '../store';
import { db } from '../lib/firebase';
import { todayYMD, ddmmyy } from '../lib/constants';
import { effectiveBranchOnDate } from '../lib/calculations';
import { enqueueInvoice, isOnline, queuedCount, startQueueAutoFlush } from '../lib/offlineQueue';
import type { Invoice, InvoiceItem, Customer, Branch } from '../lib/types';

export const PosScreen: React.FC = () => {
  const user = useApp(s => s.user)!;
  const branches = useApp(s => s.branches);
  const menus = useApp(s => s.menus);
  const staff = useApp(s => s.staff);
  const customers = useApp(s => s.customers);
  const invoices = useApp(s => s.invoices);
  const transfers = useApp(s => s.transfers);
  const setToast = useApp(s => s.setToast);

  const [branchId, setBranchId] = useState<string>(user.branch_id && user.branch_id !== 'all' ? user.branch_id : (branches[0]?.id || ''));
  const [group, setGroup] = useState<string>('all');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card'>('upi');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<Invoice | null>(null);
  const [lastBranch, setLastBranch] = useState<Branch | null>(null);
  const [lastCustomer, setLastCustomer] = useState<Customer | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    queuedCount().then(setPendingCount);
    const unsub = startQueueAutoFlush(n => {
      setToast({ tone: 'green', text: `${n} queued bills synced` });
      queuedCount().then(setPendingCount);
    });
    return () => unsub();
  }, []);

  const branch = branches.find(b => b.id === branchId);
  const branchType = branch?.type || 'mens';

  const groups = useMemo(() => {
    const set = new Set<string>();
    menus.forEach(m => {
      if (!m.branch_type || m.branch_type === 'both' || m.branch_type === branchType) {
        if (m.group) set.add(m.group);
      }
    });
    return ['all', ...Array.from(set)];
  }, [menus, branchType]);

  const visibleMenus = useMemo(() => {
    return menus.filter(m => {
      if (m.branch_type && m.branch_type !== 'both' && m.branch_type !== branchType) return false;
      if (group !== 'all' && m.group !== group) return false;
      return true;
    });
  }, [menus, group, branchType]);

  const todayStaff = useMemo(() => {
    const today = todayYMD();
    return staff.filter(st => {
      if (st.exit_date && st.exit_date < today) return false;
      const eff = effectiveBranchOnDate(st, today, transfers);
      return !!eff;
    });
  }, [staff, transfers]);

  const total = useMemo(() => items.reduce((s, it) => s + (it.price * it.qty), 0), [items]);

  const addService = (m: typeof menus[number]) => {
    setItems(prev => [...prev, { service_id: m.id, name: m.name, price: m.price, qty: 1, staff_id: undefined }]);
  };
  const updateItem = (idx: number, patch: Partial<InvoiceItem>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...patch } : it));
  };
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers.slice(0, 30);
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || (c.phone || '').includes(q)
    ).slice(0, 30);
  }, [customers, search]);

  const settle = async () => {
    if (!branchId) { setToast({ tone: 'red', text: 'Pick a branch' }); return; }
    if (!items.length) { setToast({ tone: 'red', text: 'Cart empty' }); return; }
    if (items.some(it => !it.staff_id)) { setToast({ tone: 'red', text: 'Assign stylist to every item' }); return; }
    setBusy(true);
    try {
      const date = todayYMD();
      const settledToday = invoices.filter((i: any) =>
        i.date === date && i.branch_id === branchId && i.status === 'settled'
      );
      const seqRaw = settledToday.length + 1 + pendingCount;
      const seq = String(seqRaw).padStart(3, '0');
      const prefix = (branch?.prefix || (branch?.name || 'BR').slice(0, 3)).toUpperCase();
      const invoice_no = `${prefix}-${ddmmyy(date)}-${seq}`;
      const walkin_no = customer ? null : (settledToday.filter((i: any) => !i.customer_id).length + 1);

      const itemsWithHome = items.map(it => {
        const st = staff.find(s => s.id === it.staff_id);
        const home = st?.branch_id;
        return { ...it, home_branch_id: home, loan_flag: home && home !== branchId };
      });
      const staffSplitMap: Record<string, { amount: number; home_branch_id?: string; loan_flag?: boolean }> = {};
      itemsWithHome.forEach(it => {
        const k = it.staff_id!;
        const cur = staffSplitMap[k] || { amount: 0, home_branch_id: it.home_branch_id, loan_flag: it.loan_flag };
        cur.amount += it.price * it.qty;
        staffSplitMap[k] = cur;
      });
      const staff_split = Object.entries(staffSplitMap).map(([staff_id, v]) => ({ staff_id, ...v }));

      const settled_at = new Date().toISOString();
      const payload: any = {
        invoice_no, walkin_no, branch_id: branchId, date,
        status: 'settled',
        customer_id: customer?.id || null,
        items: itemsWithHome,
        total, payment_mode: paymentMode, staff_split, settled_at,
      };

      const customerPatch = customer ? {
        last_visit_date: date,
        last_visit_at: settled_at,
        last_visit_invoice: invoice_no,
        last_visit_branch_id: branchId,
      } : null;

      const online = await isOnline();
      if (online) {
        try {
          await addDoc(collection(db, 'invoices'), payload);
          if (customer && customerPatch) {
            await updateDoc(doc(db, 'customers', customer.id), customerPatch).catch(() => {});
          }
          setToast({ tone: 'green', text: `${invoice_no} settled` });
        } catch {
          await enqueueInvoice({ payload, customerUpdate: customer ? { id: customer.id, patch: customerPatch! } : undefined, enqueued_at: settled_at });
          setPendingCount(c => c + 1);
          setToast({ tone: 'orange', text: 'Saved offline · will sync' });
        }
      } else {
        await enqueueInvoice({ payload, customerUpdate: customer ? { id: customer.id, patch: customerPatch! } : undefined, enqueued_at: settled_at });
        setPendingCount(c => c + 1);
        setToast({ tone: 'orange', text: 'Offline · queued' });
      }

      const inv: Invoice = { ...payload };
      setLastInvoice(inv);
      setLastBranch(branch || null);
      setLastCustomer(customer);
      setPrintOpen(true);

      setItems([]);
      setCustomer(null);
    } catch {
      setToast({ tone: 'red', text: 'Settle failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={{ paddingHorizontal: space.xl, paddingTop: space.md, gap: space.sm }}>
        <ChipGroup
          items={branches.map(b => ({ id: b.id, label: b.name }))}
          active={branchId}
          onChange={setBranchId}
        />
        <ChipGroup
          items={groups.map(g => ({ id: g, label: g }))}
          active={group}
          onChange={setGroup}
        />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: space.xl, gap: space.sm }}>
        {visibleMenus.map(m => (
          <Pressable key={m.id} onPress={() => addService(m)}>
            <ListCard>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 15 }}>{m.name}</Text>
                  {m.group && <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>{m.group}</Text>}
                </View>
                <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 16 }}>{INR(m.price)}</Text>
                <Icon name="plus" size={18} color={colors.text2} />
              </View>
            </ListCard>
          </Pressable>
        ))}
        {visibleMenus.length === 0 && (
          <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, textAlign: 'center', paddingVertical: 24 }}>
            No services for this branch type
          </Text>
        )}
      </ScrollView>

      {items.length > 0 && (
        <View style={{
          backgroundColor: colors.bg2,
          borderTopWidth: 1, borderColor: colors.line2,
          paddingHorizontal: space.xl, paddingVertical: space.md, gap: space.sm,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>
              Cart · {items.length}
            </Text>
            <Pressable onPress={() => setPickerOpen(true)}>
              <Pill tone="gold" text={customer ? customer.name : 'Walk-in · pick customer'} />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 200 }}>
            {items.map((it, idx) => (
              <View key={idx} style={{ paddingVertical: 6, borderBottomWidth: 1, borderColor: colors.line }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ flex: 1, fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 13 }}>{it.name}</Text>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 13 }}>{INR(it.price * it.qty)}</Text>
                  <Pressable onPress={() => removeItem(idx)} hitSlop={6} style={{ paddingLeft: 8 }}>
                    <Icon name="x" size={14} color={colors.red} />
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {todayStaff.map(st => {
                      const home = st.branch_id;
                      const loan = home && home !== branchId;
                      const active = it.staff_id === st.id;
                      return (
                        <Pressable key={st.id} onPress={() => updateItem(idx, { staff_id: st.id })}>
                          <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 4,
                            paddingHorizontal: 8, paddingVertical: 4,
                            borderRadius: radius.sm,
                            borderWidth: 1,
                            borderColor: active ? colors.gold : colors.line2,
                            backgroundColor: active ? 'rgba(212,165,116,0.18)' : colors.bg3,
                          }}>
                            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 10, color: active ? colors.gold : colors.text2 }}>
                              {st.name}
                            </Text>
                            {loan && <Pill tone="orange" text="LOAN" />}
                          </View>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {(['cash', 'upi', 'card'] as const).map(m => (
              <Pressable key={m} onPress={() => setPaymentMode(m)} style={{
                flex: 1, paddingVertical: 8, alignItems: 'center',
                borderRadius: radius.sm, borderWidth: 1,
                borderColor: paymentMode === m ? colors.gold : colors.line2,
                backgroundColor: paymentMode === m ? 'rgba(212,165,116,0.18)' : colors.bg3,
              }}>
                <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: paymentMode === m ? colors.gold : colors.text2 }}>
                  {m}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.text3 }}>Total</Text>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold, fontSize: 26 }}>{INR(total)}</Text>
            </View>
            <PrimaryButton label={busy ? 'Settling…' : 'Settle & Print'} onPress={settle} disabled={busy} icon="check" />
          </View>
        </View>
      )}

      <BillPrintModal
        open={printOpen}
        invoice={lastInvoice}
        branch={lastBranch}
        customer={lastCustomer}
        onClose={() => setPrintOpen(false)}
      />

      {pendingCount > 0 && (
        <View style={{
          position: 'absolute', top: 8, right: 16,
          backgroundColor: colors.bg2, borderRadius: 12,
          paddingHorizontal: 8, paddingVertical: 4,
          borderWidth: 1, borderColor: colors.orange,
        }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1.4, color: colors.orange }}>
            {pendingCount} QUEUED
          </Text>
        </View>
      )}

      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Pick Customer">
        <View style={{ paddingHorizontal: space.xl, paddingVertical: space.md, gap: space.md }}>
          <TextField placeholder="Search name or phone" value={search} onChangeText={setSearch} />
          <Pressable onPress={() => { setCustomer(null); setPickerOpen(false); }}>
            <ListCard>
              <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.gold }}>Walk-in (no customer)</Text>
            </ListCard>
          </Pressable>
          <ScrollView style={{ maxHeight: 320 }}>
            {filteredCustomers.map(c => (
              <Pressable key={c.id} onPress={() => { setCustomer(c); setPickerOpen(false); }}>
                <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: colors.line }}>
                  <Text style={{ fontFamily: fonts.serifSemiBold, color: colors.text, fontSize: 14 }}>{c.name}</Text>
                  <Text style={{ fontFamily: fonts.sansMedium, color: colors.text3, fontSize: 11, marginTop: 2 }}>
                    {c.phone || '—'} {c.last_visit_date ? `· last ${c.last_visit_date}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Sheet>
    </View>
  );
};
