import { create } from 'zustand';
import type { Branch, Customer, DailyEntry, ExpenseEntry, Leave, Material, MenuItem, MonthlyExpense, PayrollAdvance, Role, Staff, Task, Transfer, User, GlobalSettings } from './lib/types';

export type Screen =
  | 'login'
  | 'dashboard'
  | 'pos'
  | 'entry'
  | 'pl'
  | 'branches'
  | 'customers'
  | 'staff'
  | 'materials'
  | 'material-master'
  | 'cash-collection'
  | 'op-expenses'
  | 'daily-expenses'
  | 'incentive'
  | 'menu-config'
  | 'taskpedia'
  | 'leaves'
  | 'payroll'
  | 'master-setup'
  | 'day-working'
  | 'my-target'
  | 'my-payroll'
  | 'apply-leave';

interface AppState {
  user: User | null;
  hydrated: boolean;
  drawerOpen: boolean;
  notificationsOpen: boolean;
  history: Screen[];
  selectedBranchId: string | null;
  toast: { tone: 'gold' | 'green' | 'red' | 'orange'; text: string } | null;

  branches: Branch[];
  staff: Staff[];
  menus: MenuItem[];
  customers: Customer[];
  entries: DailyEntry[];
  invoices: any[];
  expenses: ExpenseEntry[];
  monthlyExpenses: MonthlyExpense[];
  materials: Material[];
  leaves: Leave[];
  advances: PayrollAdvance[];
  tasks: Task[];
  transfers: Transfer[];
  settings: GlobalSettings;

  setUser: (u: User | null) => void;
  setHydrated: (v: boolean) => void;
  setDrawerOpen: (v: boolean) => void;
  setNotificationsOpen: (v: boolean) => void;
  push: (s: Screen) => void;
  pop: () => void;
  replace: (s: Screen) => void;
  setSelectedBranch: (id: string | null) => void;
  setToast: (t: AppState['toast']) => void;

  setBranches: (v: Branch[]) => void;
  setStaff: (v: Staff[]) => void;
  setMenus: (v: MenuItem[]) => void;
  setCustomers: (v: Customer[]) => void;
  setEntries: (v: DailyEntry[]) => void;
  setInvoices: (v: any[]) => void;
  setExpenses: (v: ExpenseEntry[]) => void;
  setMonthlyExpenses: (v: MonthlyExpense[]) => void;
  setMaterials: (v: Material[]) => void;
  setLeaves: (v: Leave[]) => void;
  setAdvances: (v: PayrollAdvance[]) => void;
  setTasks: (v: Task[]) => void;
  setTransfers: (v: Transfer[]) => void;
  setSettings: (v: GlobalSettings) => void;
}

export const useApp = create<AppState>((set) => ({
  user: null,
  hydrated: false,
  drawerOpen: false,
  notificationsOpen: false,
  history: ['dashboard'],
  selectedBranchId: null,
  toast: null,

  branches: [],
  staff: [],
  menus: [],
  customers: [],
  entries: [],
  invoices: [],
  expenses: [],
  monthlyExpenses: [],
  materials: [],
  leaves: [],
  advances: [],
  tasks: [],
  transfers: [],
  settings: {},

  setUser: (u) => set({ user: u }),
  setHydrated: (v) => set({ hydrated: v }),
  setDrawerOpen: (v) => set({ drawerOpen: v }),
  setNotificationsOpen: (v) => set({ notificationsOpen: v }),
  push: (s) => set((st) => ({ history: [...st.history, s], drawerOpen: false })),
  pop: () => set((st) => ({ history: st.history.length > 1 ? st.history.slice(0, -1) : st.history })),
  replace: (s) => set({ history: [s], drawerOpen: false }),
  setSelectedBranch: (id) => set({ selectedBranchId: id }),
  setToast: (t) => set({ toast: t }),

  setBranches: (v) => set({ branches: v }),
  setStaff: (v) => set({ staff: v }),
  setMenus: (v) => set({ menus: v }),
  setCustomers: (v) => set({ customers: v }),
  setEntries: (v) => set({ entries: v }),
  setInvoices: (v) => set({ invoices: v }),
  setExpenses: (v) => set({ expenses: v }),
  setMonthlyExpenses: (v) => set({ monthlyExpenses: v }),
  setMaterials: (v) => set({ materials: v }),
  setLeaves: (v) => set({ leaves: v }),
  setAdvances: (v) => set({ advances: v }),
  setTasks: (v) => set({ tasks: v }),
  setTransfers: (v) => set({ transfers: v }),
  setSettings: (v) => set({ settings: v }),
}));

export const currentScreen = (s: AppState): Screen => s.history[s.history.length - 1] || 'dashboard';

export const NAV_BY_ROLE: Record<Role, Screen[]> = {
  admin: [
    'dashboard', 'branches', 'cash-collection', 'incentive', 'entry', 'pos', 'customers',
    'menu-config', 'staff', 'materials', 'material-master', 'daily-expenses', 'op-expenses',
    'pl', 'leaves', 'payroll', 'taskpedia', 'master-setup',
  ],
  accountant: [
    'dashboard', 'branches', 'cash-collection', 'incentive', 'entry', 'pos', 'customers',
    'menu-config', 'staff', 'materials', 'daily-expenses', 'leaves', 'payroll', 'taskpedia',
  ],
  employee: ['dashboard', 'day-working', 'my-target', 'my-payroll', 'apply-leave'],
};

export const SCREEN_TITLES: Record<Screen, string> = {
  login: 'Sign In',
  dashboard: 'Dashboard',
  pos: 'POS Terminal',
  entry: 'Daily Business Entry',
  pl: 'P&L Analytics',
  branches: 'Branch Performance',
  customers: 'Customers',
  staff: 'Staff Management',
  materials: 'Materials',
  'material-master': 'Material Master',
  'cash-collection': 'Cash Collection',
  'op-expenses': 'Operational Expenses',
  'daily-expenses': 'Daily Expenses',
  incentive: 'Incentive Calculator',
  'menu-config': 'Menu Configuration',
  taskpedia: 'Taskpedia',
  leaves: 'Leave Management',
  payroll: 'Payroll',
  'master-setup': 'Master Setup',
  'day-working': 'Day Working',
  'my-target': 'My Target',
  'my-payroll': 'My Payroll',
  'apply-leave': 'Apply Leave',
};
