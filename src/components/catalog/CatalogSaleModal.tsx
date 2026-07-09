import React, { useEffect, useState } from 'react';
import Modal from '@/components/Modal';
import { Loader2, Tag } from 'lucide-react';
import { CatalogItem, getActiveSale } from './catalogHelpers';

interface CatalogSaleModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly item: CatalogItem | null;
  readonly onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly error: string;
}

const defaultForm = { discountType: 'percent' as 'percent' | 'fixed', discountValue: '', startDate: '', endDate: '' };

export default function CatalogSaleModal({
  isOpen, onClose, item, onSubmit, isSubmitting, error,
}: CatalogSaleModalProps) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (!isOpen || !item) return;
    const activeSale = getActiveSale(item);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      discountType: activeSale ? 'fixed' : 'percent',
      discountValue: activeSale ? String(activeSale.sale) : '',
      startDate: item.sale_starts_at ? item.sale_starts_at.slice(0, 10) : '',
      endDate: item.sale_ends_at ? item.sale_ends_at.slice(0, 10) : '',
    });
  }, [isOpen, item]);

  const { discountType, discountValue, startDate, endDate } = form;
  const setDiscountType = (v: 'percent' | 'fixed') => setForm(prev => ({ ...prev, discountType: v }));
  const setDiscountValue = (v: string) => setForm(prev => ({ ...prev, discountValue: v }));
  const setStartDate = (v: string) => setForm(prev => ({ ...prev, startDate: v }));
  const setEndDate = (v: string) => setForm(prev => ({ ...prev, endDate: v }));

  if (!item) return null;

  const originalPrice = Number(item.price) || 0;
  const parsedValue = Number.parseFloat(discountValue);
  const hasValidValue = discountValue.trim() !== '' && !Number.isNaN(parsedValue) && parsedValue > 0;

  let previewSalePrice: number | null = null;
  if (hasValidValue) {
    previewSalePrice = discountType === 'percent'
      ? originalPrice * (1 - Math.min(parsedValue, 100) / 100)
      : parsedValue;
    previewSalePrice = Math.max(0, Math.round(previewSalePrice * 100) / 100);
  }
  const isValidSale = previewSalePrice !== null && previewSalePrice < originalPrice;

  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!isValidSale) return;
    onSubmit({
      sale_price: previewSalePrice,
      sale_starts_at: startDate || null,
      sale_ends_at: endDate || null,
    });
  };

  const handleRemoveSale = () => {
    onSubmit({ sale_price: null, sale_starts_at: null, sale_ends_at: null });
  };

  const currentlyHasSale = item.sale_price != null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Sale Price">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <p className="text-sm text-[#524A44]">
          <span className="font-semibold">{item.name}</span> — Original Price: ₱{originalPrice.toLocaleString()}
        </p>

        <div>
          <span className="block text-sm font-medium text-[#524A44] mb-1">Discount Type</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDiscountType('percent')}
              className={`py-2 rounded-lg border text-sm font-semibold transition-all ${
                discountType === 'percent' ? 'border-taupe bg-taupe/10 text-taupe' : 'border-[#EBE6E0] text-[#524A44] hover:border-taupe/40'
              }`}
            >
              Percentage (%)
            </button>
            <button
              type="button"
              onClick={() => setDiscountType('fixed')}
              className={`py-2 rounded-lg border text-sm font-semibold transition-all ${
                discountType === 'fixed' ? 'border-taupe bg-taupe/10 text-taupe' : 'border-[#EBE6E0] text-[#524A44] hover:border-taupe/40'
              }`}
            >
              Exact Price (₱)
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="discount_value" className="block text-sm font-medium text-[#524A44] mb-1">
            {discountType === 'percent' ? 'Discount Percentage' : 'Sale Price'}
          </label>
          <input
            id="discount_value"
            type="number"
            min="0"
            max={discountType === 'percent' ? 100 : undefined}
            step={discountType === 'percent' ? 1 : 0.01}
            value={discountValue}
            onChange={e => setDiscountValue(e.target.value)}
            placeholder={discountType === 'percent' ? 'e.g. 20' : `e.g. ${(originalPrice * 0.8).toFixed(0)}`}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="sale_start" className="block text-sm font-medium text-[#524A44] mb-1">
              Starts <span className="text-xs font-normal text-[#A8A19A]">(optional)</span>
            </label>
            <input
              id="sale_start"
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
            />
          </div>
          <div>
            <label htmlFor="sale_end" className="block text-sm font-medium text-[#524A44] mb-1">
              Ends <span className="text-xs font-normal text-[#A8A19A]">(optional — blank = no limit)</span>
            </label>
            <input
              id="sale_end"
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              min={startDate || undefined}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
            />
          </div>
        </div>

        {/* Live preview */}
        {hasValidValue && (
          <div className={`rounded-xl p-4 flex items-center justify-between ${isValidSale ? 'bg-rose-50 border border-rose-200' : 'bg-zinc-100 border border-zinc-200'}`}>
            <div className="flex items-center gap-2">
              <Tag size={16} className={isValidSale ? 'text-rose-600' : 'text-zinc-400'} />
              <div>
                <p className="text-xs text-[#827A73]">Customer will see</p>
                <p className="text-sm">
                  <span className="line-through text-[#A8A19A] mr-2">₱{originalPrice.toLocaleString()}</span>
                  <span className={`font-bold ${isValidSale ? 'text-rose-700' : 'text-zinc-500'}`}>
                    ₱{(previewSalePrice ?? 0).toLocaleString()}
                  </span>
                </p>
              </div>
            </div>
            {isValidSale ? (
              <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2 py-1 rounded-full">
                {Math.round(((originalPrice - (previewSalePrice ?? 0)) / originalPrice) * 100)}% OFF
              </span>
            ) : (
              <span className="text-xs font-semibold text-zinc-500">Must be lower than original price</span>
            )}
          </div>
        )}

        <div className="pt-2 flex justify-between gap-3">
          {currentlyHasSale ? (
            <button
              type="button"
              onClick={handleRemoveSale}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
            >
              Remove Sale
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidSale}
              className="bg-taupe hover:bg-taupe/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              Save Sale
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
