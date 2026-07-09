'use client';

import React from 'react';
import { Loader2, Pencil, Trash2, Tag } from 'lucide-react';
import { Coupon, APPLIES_TO_LABELS, formatDiscount, couponStatus } from './couponHelpers';

interface CouponListViewProps {
  readonly coupons: Coupon[];
  readonly loading: boolean;
  readonly onEdit: (coupon: Coupon) => void;
  readonly onDelete: (id: number) => void;
}

export default function CouponListView({ coupons, loading, onEdit, onDelete }: CouponListViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-[#A8A19A]">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-16 bg-[#FAF6F3]/50 border border-dashed border-[#EBE6E0] rounded-2xl">
        <Tag size={28} className="mx-auto text-[#C5BDBA] mb-2" />
        <p className="text-sm text-[#827A73]">No coupons yet. Create one to run a sale campaign.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#FAF6F3] border-b border-[#EBE6E0] text-left">
              <th className="px-4 py-3 font-semibold text-[#827A73] text-xs uppercase tracking-wider">Code</th>
              <th className="px-4 py-3 font-semibold text-[#827A73] text-xs uppercase tracking-wider">Discount</th>
              <th className="px-4 py-3 font-semibold text-[#827A73] text-xs uppercase tracking-wider">Applies To</th>
              <th className="px-4 py-3 font-semibold text-[#827A73] text-xs uppercase tracking-wider">Usage</th>
              <th className="px-4 py-3 font-semibold text-[#827A73] text-xs uppercase tracking-wider">Window</th>
              <th className="px-4 py-3 font-semibold text-[#827A73] text-xs uppercase tracking-wider">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map(coupon => {
              const status = couponStatus(coupon);
              return (
                <tr key={coupon.id} className="border-b border-[#EBE6E0]/60 last:border-0 hover:bg-[#FAF6F3]/40">
                  <td className="px-4 py-3 font-mono font-semibold text-[#2D2A26]">{coupon.code}</td>
                  <td className="px-4 py-3 text-[#524A44]">{formatDiscount(coupon)}</td>
                  <td className="px-4 py-3 text-[#827A73]">{APPLIES_TO_LABELS[coupon.applies_to]}</td>
                  <td className="px-4 py-3 text-[#827A73]">
                    {coupon.used_count}{coupon.usage_limit != null ? ` / ${coupon.usage_limit}` : ' / ∞'}
                  </td>
                  <td className="px-4 py-3 text-[#827A73] text-xs">
                    {coupon.starts_at ? new Date(coupon.starts_at).toLocaleDateString() : 'Anytime'}
                    {' – '}
                    {coupon.ends_at ? new Date(coupon.ends_at).toLocaleDateString() : 'No expiry'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${status.className}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onEdit(coupon)}
                        title="Edit"
                        className="p-1.5 text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#F0EAE3] rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onDelete(coupon.id)}
                        title="Delete"
                        className="p-1.5 text-[#A8A19A] hover:text-[#B26959] hover:bg-[#B26959]/10 rounded-lg transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
