import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';
import { Coupon } from './couponHelpers';

interface CouponFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingCoupon: Coupon | null;
  readonly onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly error: string;
}

const defaultForm = {
  code: '',
  discountType: 'percent' as 'percent' | 'fixed',
  discountValue: '',
  appliesTo: 'all' as Coupon['applies_to'],
  usageLimit: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
};

export default function CouponFormModal({
  isOpen, onClose, editingCoupon, onSubmit, isSubmitting, error,
}: CouponFormModalProps) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(editingCoupon ? {
      code: editingCoupon.code,
      discountType: editingCoupon.discount_type,
      discountValue: String(Number(editingCoupon.discount_value)),
      appliesTo: editingCoupon.applies_to,
      usageLimit: editingCoupon.usage_limit != null ? String(editingCoupon.usage_limit) : '',
      startsAt: editingCoupon.starts_at ? editingCoupon.starts_at.slice(0, 10) : '',
      endsAt: editingCoupon.ends_at ? editingCoupon.ends_at.slice(0, 10) : '',
      isActive: editingCoupon.is_active,
    } : defaultForm);
  }, [isOpen, editingCoupon]);

  const { code, discountType, discountValue, appliesTo, usageLimit, startsAt, endsAt, isActive } = form;

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onSubmit({
      code,
      discount_type: discountType,
      discount_value: Number.parseFloat(discountValue),
      applies_to: appliesTo,
      usage_limit: usageLimit.trim() === '' ? null : Number.parseInt(usageLimit, 10),
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      is_active: isActive,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingCoupon ? 'Edit Coupon' : 'Create Coupon'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <div>
          <label htmlFor="coupon_code" className="block text-sm font-medium text-[#524A44] mb-1">
            Coupon Code <span className="text-rose-500">*</span>
          </label>
          <input
            id="coupon_code"
            type="text"
            required
            value={code}
            onChange={e => setForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            placeholder="e.g. SAVE20"
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] font-mono uppercase focus:outline-none focus:border-taupe"
          />
          <p className="text-xs text-[#A8A19A] mt-1">What the customer types at checkout.</p>
        </div>

        <div>
          <span className="block text-sm font-medium text-[#524A44] mb-1">Discount Type</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, discountType: 'percent' }))}
              className={`py-2 rounded-lg border text-sm font-semibold transition-all ${
                discountType === 'percent' ? 'border-taupe bg-taupe/10 text-taupe' : 'border-[#EBE6E0] text-[#524A44] hover:border-taupe/40'
              }`}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, discountType: 'fixed' }))}
              className={`py-2 rounded-lg border text-sm font-semibold transition-all ${
                discountType === 'fixed' ? 'border-taupe bg-taupe/10 text-taupe' : 'border-[#EBE6E0] text-[#524A44] hover:border-taupe/40'
              }`}
            >
              Fixed Amount (₱)
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="coupon_value" className="block text-sm font-medium text-[#524A44] mb-1">
            {discountType === 'percent' ? 'Discount Percentage' : 'Discount Amount'} <span className="text-rose-500">*</span>
          </label>
          <input
            id="coupon_value"
            type="number"
            required
            min="0"
            max={discountType === 'percent' ? 100 : undefined}
            step={discountType === 'percent' ? 1 : 0.01}
            value={discountValue}
            onChange={e => setForm(prev => ({ ...prev, discountValue: e.target.value }))}
            placeholder={discountType === 'percent' ? 'e.g. 20' : 'e.g. 200'}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
          />
        </div>

        <div>
          <label htmlFor="coupon_applies_to" className="block text-sm font-medium text-[#524A44] mb-1">Applies To</label>
          <select
            id="coupon_applies_to"
            value={appliesTo}
            onChange={e => setForm(prev => ({ ...prev, appliesTo: e.target.value as Coupon['applies_to'] }))}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
          >
            <option value="all">Catalog & Services</option>
            <option value="catalog">Design Catalog only</option>
            <option value="services">Services only</option>
          </select>
        </div>

        <div>
          <label htmlFor="coupon_usage_limit" className="block text-sm font-medium text-[#524A44] mb-1">
            Usage Limit <span className="text-xs font-normal text-[#A8A19A]">(optional — blank = unlimited)</span>
          </label>
          <input
            id="coupon_usage_limit"
            type="number"
            min="1"
            value={usageLimit}
            onChange={e => setForm(prev => ({ ...prev, usageLimit: e.target.value }))}
            placeholder="e.g. 50"
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="coupon_starts" className="block text-sm font-medium text-[#524A44] mb-1">
              Starts <span className="text-xs font-normal text-[#A8A19A]">(optional)</span>
            </label>
            <input
              id="coupon_starts"
              type="date"
              value={startsAt}
              onChange={e => setForm(prev => ({ ...prev, startsAt: e.target.value }))}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
            />
          </div>
          <div>
            <label htmlFor="coupon_ends" className="block text-sm font-medium text-[#524A44] mb-1">
              Ends <span className="text-xs font-normal text-[#A8A19A]">(optional — blank = no expiry)</span>
            </label>
            <input
              id="coupon_ends"
              type="date"
              value={endsAt}
              onChange={e => setForm(prev => ({ ...prev, endsAt: e.target.value }))}
              min={startsAt || undefined}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
            />
          </div>
        </div>

        <label htmlFor="coupon_is_active" className="flex items-center gap-2 cursor-pointer">
          <input
            id="coupon_is_active"
            type="checkbox"
            checked={isActive}
            onChange={e => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
            className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
          />
          <span className="text-sm text-[#524A44]">Active (redeemable now)</span>
        </label>

        <div className="pt-2 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Cancel</button>
          <button
            type="submit"
            disabled={isSubmitting || !code.trim() || !discountValue.trim()}
            className="bg-taupe hover:bg-taupe/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {editingCoupon ? 'Save Changes' : 'Create Coupon'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
