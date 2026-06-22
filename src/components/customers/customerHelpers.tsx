export interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone: string;
  profile_picture: string;
  total_spend: number;
  active_jobs: number;
  completed_jobs: number;
  created_at: string;
}

export const isWalkInEmail = (email?: string) => 
  email ? (email.startsWith('walkin_') && email.endsWith('@sutura.com')) : false;
