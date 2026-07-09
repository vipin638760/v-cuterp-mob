export type Role = 'admin' | 'accountant' | 'employee';

export interface User {
  id: string;
  name: string;
  role: Role;
  password?: string;
  branch_id?: string;
  staff_id?: string;
}

export interface Branch {
  id: string;
  name: string;
  prefix?: string;
  type?: 'mens' | 'unisex';
  shop_rent?: number;
  room_rent?: number;
  shop_elec?: number;
  room_elec?: number;
  wifi?: number;
  water?: number;
  petrol?: number;
  maid?: number;
  dust?: number;
}

export interface Staff {
  id: string;
  name: string;
  role?: string;
  salary?: number;
  incentive_pct?: number;
  branch_id?: string;
  join?: string;
  exit_date?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  group?: string;
  branch_type?: 'mens' | 'unisex' | 'both';
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  last_visit_date?: string;
  last_visit_branch_id?: string;
  last_visit_invoice?: string;
  visits?: number;
}

export interface InvoiceItem {
  service_id?: string;
  name: string;
  price: number;
  qty: number;
  staff_id?: string;
  home_branch_id?: string;
  loan_flag?: boolean;
}

export interface Invoice {
  id?: string;
  invoice_no?: string;
  walkin_no?: number;
  branch_id: string;
  date: string;
  status: 'draft' | 'settled';
  customer_id?: string | null;
  items: InvoiceItem[];
  total: number;
  payment_mode?: 'cash' | 'upi' | 'card';
  notes?: string;
  staff_split?: { staff_id: string; amount: number; home_branch_id?: string; loan_flag?: boolean }[];
  settled_at?: string;
}

export interface StaffBilling {
  staff_id: string;
  billing: number;
  incentive: number;
  mat_incentive?: number;
  tips?: number;
  tip_in?: 'cash' | 'online';
  tip_paid?: 'cash' | 'online';
  incentive_taken?: boolean;
  home_branch_id?: string;
  loan_flag?: boolean;
}

export interface DailyEntry {
  id?: string;
  branch_id: string;
  date: string;
  income?: { cash: number; upi: number; card: number };
  cash?: number;
  upi?: number;
  card?: number;
  others?: number;
  petrol?: number;
  material_expense?: number;
  material_sale?: number;
  cash_in_hand?: number;
  actual_cash?: number | null | '';
  staff_billing?: StaffBilling[];
  total_billing?: number;
  total_incentive?: number;
  notes?: string;
}

export interface ExpenseEntry {
  id?: string;
  branch_id: string;
  date: string;
  category: string;
  amount: number;
  note?: string;
}

export interface MonthlyExpense {
  id?: string;
  branch_id: string;
  month: string;
  shop_rent?: number;
  room_rent?: number;
  shop_elec?: number;
  room_elec?: number;
  wifi?: number;
  water?: number;
  petrol?: number;
  maid?: number;
  dust?: number;
}

export interface Material {
  id: string;
  name: string;
  unit?: string;
  current_stock?: number;
  threshold?: number;
  unit_cost?: number;
  supplier?: string;
}

export interface MaterialMove {
  id?: string;
  material_id: string;
  branch_id?: string;
  date: string;
  qty: number;
  type: 'in' | 'out' | 'sale';
  note?: string;
}

export interface Leave {
  id?: string;
  staff_id: string;
  date: string;
  days: number;
  type: 'casual' | 'sick' | 'unpaid';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  source?: 'employee' | 'admin';
  requested_at?: string;
}

export interface PayrollAdvance {
  id?: string;
  staff_id: string;
  amount: number;
  date: string;
  month_str?: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

export interface Task {
  id?: string;
  title: string;
  description?: string;
  image_url?: string;
  assignee_id: string;
  assigned_by_id: string;
  due_date?: string;
  status: 'todo' | 'in_progress' | 'done';
  started_at?: string;
  completed_at?: string;
  read_by_assignee?: boolean;
}

export interface ServiceLog {
  id?: string;
  staff_id: string;
  branch_id: string;
  home_branch_id?: string;
  loan_flag?: boolean;
  date: string;
  service_name: string;
  amount: number;
  source: 'pos' | 'manual';
  invoice_id?: string;
}

export interface GlobalSettings {
  gst_pct?: number;
  mens_incentive?: number;
  unisex_incentive?: number;
  mens_target?: number;
  unisex_target?: number;
  mens_leaves?: number;
  unisex_leaves?: number;
}

export interface Transfer {
  id?: string;
  staff_id: string;
  to_branch_id: string;
  start_date?: string;
  end_date?: string;
  status: 'active' | 'ended';
}
