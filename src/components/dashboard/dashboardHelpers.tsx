import { BarChart2, Megaphone, BookOpen } from 'lucide-react';

export interface AnalyticsData {
  total_jobs: number;
  completed_jobs: number;
  total_revenue: number;
  total_outstanding_balance: number;
  upcoming_appointments: number;
  total_appointments: number;
  total_services: number;
  total_collections: number;
  total_branches: number;
  total_staff: number;
  total_customers?: number;
  recent_jobs?: {
    id: number;
    order_number?: string;
    total_amount: number | string;
    customer?: { name: string };
  }[];
  revenue_data?: { month: string; revenue: number }[];
}

export interface JobItem {
  id: number;
  order_number?: string;
  status: string;
  payment_status: string;
  balance?: string | number;
  due_date?: string;
  customer?: { name: string };
}

export interface StaffPresence {
  id: number;
  role: string;
  user: { name: string; last_seen_at?: string | null };
  _onlineSince: number; // epoch ms when last_seen_at was first within 5 min
}

export const TABS = [
  { id: 'dashboard', label: 'Dashboard',    icon: BarChart2 },
  { id: 'news',      label: 'System News',  icon: Megaphone },
  { id: 'welcome',   label: 'Welcome Guide', icon: BookOpen  },
] as const;
