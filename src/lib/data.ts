import { useEffect } from 'react';
import { collection, onSnapshot, query, doc } from 'firebase/firestore';
import { db } from './firebase';
import { useApp } from '../store';

const SIMPLE_COLLECTIONS = [
  'branches', 'staff', 'menus', 'customers', 'entries', 'invoices',
  'daily_expenses', 'monthly_expenses', 'materials', 'leaves',
  'payroll_advances', 'taskpedia', 'staff_transfers',
] as const;

export const useFirestoreSubscriptions = (enabled: boolean): void => {
  const set = useApp.getState();

  useEffect(() => {
    if (!enabled) return;
    const unsubs: (() => void)[] = [];
    const dispatchMap: Record<string, (v: any[]) => void> = {
      branches: set.setBranches,
      staff: set.setStaff,
      menus: set.setMenus,
      customers: set.setCustomers,
      entries: set.setEntries,
      invoices: set.setInvoices,
      daily_expenses: set.setExpenses,
      monthly_expenses: set.setMonthlyExpenses,
      materials: set.setMaterials,
      leaves: set.setLeaves,
      payroll_advances: set.setAdvances,
      taskpedia: set.setTasks,
      staff_transfers: set.setTransfers,
    };

    // --- temporary on-device diagnostics (no cable available) ---
    const counts: Record<string, number> = {};
    let firstError = '';
    let summaryTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleSummary = () => {
      if (summaryTimer) clearTimeout(summaryTimer);
      summaryTimer = setTimeout(() => {
        if (firstError) return; // error toast already shown
        const nonzero = Object.entries(counts)
          .filter(([, n]) => n > 0)
          .map(([k, n]) => `${k}:${n}`)
          .join(' ');
        set.setToast({
          tone: nonzero ? 'green' : 'orange',
          text: nonzero ? `Loaded ${nonzero}` : 'Connected, all collections empty',
        });
      }, 3000);
    };
    const onErr = (name: string) => (e: any) => {
      const code = e?.code || e?.message || 'error';
      if (!firstError) {
        firstError = `${name}: ${code}`;
        set.setToast({ tone: 'red', text: `Firestore ${firstError}` });
      }
    };

    SIMPLE_COLLECTIONS.forEach(name => {
      const q = query(collection(db, name));
      const u = onSnapshot(q, snap => {
        const arr: any[] = [];
        snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
        counts[name] = arr.length;
        dispatchMap[name]?.(arr);
        scheduleSummary();
      }, onErr(name));
      unsubs.push(u);
    });

    const sg = onSnapshot(doc(db, 'settings', 'global'), d => {
      if (d.exists()) set.setSettings(d.data() as any);
    }, onErr('settings/global'));
    unsubs.push(sg);

    return () => { if (summaryTimer) clearTimeout(summaryTimer); unsubs.forEach(u => u()); };
  }, [enabled]);
};
