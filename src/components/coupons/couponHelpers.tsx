export interface Coupon {
  id: number;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: string;
  applies_to: 'all' | 'catalog' | 'services';
  usage_limit: number | null;
  used_count: number;
  starts_at: string | null;
  ends_at: string | null;
  is_active: boolean;
}

export const APPLIES_TO_LABELS: Record<Coupon['applies_to'], string> = {
  all: 'Catalog & Services',
  catalog: 'Design Catalog only',
  services: 'Services only',
};

export function formatDiscount(coupon: Pick<Coupon, 'discount_type' | 'discount_value'>): string {
  return coupon.discount_type === 'percent'
    ? `${Number(coupon.discount_value)}% off`
    : `₱${Number(coupon.discount_value).toLocaleString()} off`;
}

export function couponStatus(coupon: Coupon): { label: string; className: string } {
  const now = Date.now();
  if (!coupon.is_active) {
    return { label: 'Inactive', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' };
  }
  if (coupon.starts_at && now < new Date(coupon.starts_at).getTime()) {
    return { label: 'Scheduled', className: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
  if (coupon.ends_at && now > new Date(coupon.ends_at).getTime()) {
    return { label: 'Expired', className: 'bg-zinc-100 text-zinc-500 border-zinc-200' };
  }
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { label: 'Fully Redeemed', className: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  return { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
}
