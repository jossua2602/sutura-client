export interface Metrics {
  bust?: string;
  waist?: string;
  hips?: string;
  shoulder?: string;
  sleeve_length?: string;
  back_length?: string;
  inseam?: string;
  thigh?: string;
  neck?: string;
  chest?: string;
  [key: string]: string | undefined;
}

export interface MeasurementRecord {
  id: number;
  customer_id: number;
  profile_name: string;
  metrics: Metrics;
  notes: string | null;
  updated_at: string;
  customer: { id: number; name: string; email: string } | null;
}

export interface CustomerData {
  id: number;
  name: string;
}
