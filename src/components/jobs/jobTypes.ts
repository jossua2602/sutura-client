export interface RosterItem {
  name: string;
  number?: string | number;
  size: string;
  custom_details?: string;
}

export interface Job {
  id: number;
  order_number: string;
  order_type: string;
  status: string;
  payment_status: string;
  balance: number | string;
  total_amount: number | string;
  notes?: string;
  deadline?: string;
  due_date?: string;
  courier_name?: string;
  courier_tracking_number?: string;
  shipping_address?: string;
  customer?: { name: string; id: number };
  service?: { name: string; id: number };
  assigned_staff?: { name: string; id: number };
  staff_stages?: { id: number; pivot: { stage: string; completed_at?: string } }[];
  custom_order_data?: Record<string, unknown> | null;
  payments?: {
    id: number;
    amount: string | number;
    payment_method: string;
    created_at: string;
    notes?: string;
    recorded_by?: { name: string; id: number };
  }[];
  is_outsourced?: boolean;
  partner_shop_name?: string | null;
  is_rush?: boolean;
  rush_fee?: number | string;
}

export interface Staff {
  id: number;
  role: string;
  specialization?: string | string[];
  user: {
    id: number;
    name: string;
    email: string;
  };
}
