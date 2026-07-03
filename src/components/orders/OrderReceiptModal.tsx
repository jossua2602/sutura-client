'use client';

import { X, Printer } from 'lucide-react';
import { CatalogOrder } from './orderHelpers';
import { useAuthStore } from '@/store/useAuthStore';

const peso = (v: string | number | null | undefined) =>
  `₱${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';

/**
 * Printable receipt for a Ready-to-Wear sale or a rental transaction.
 * Only #receipt-print-area is sent to the printer (see globals.css @media print).
 */
export default function OrderReceiptModal({
  order,
  onClose,
}: {
  readonly order: CatalogOrder;
  readonly onClose: () => void;
}) {
  const { shop } = useAuthStore();
  const isRental = !!order.rental_start_date || order.catalog_item?.listing_type === 'for_rent';
  const total = Number(order.total_amount ?? 0);
  const deposit = Number(order.security_deposit_amount ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div id="receipt-print-area" className="p-6 text-[#2D2A26]">
          <div className="text-center border-b border-dashed border-[#D1C7BD] pb-4 mb-4">
            <h2 className="text-xl font-bold tracking-tight">{shop?.name ?? 'Sutura Shop'}</h2>
            {shop?.address && (
              <p className="text-xs text-[#827A73] mt-0.5">
                {shop.address}{shop.city ? `, ${shop.city}` : ''}
              </p>
            )}
            <p className="mt-2 text-sm font-semibold uppercase tracking-widest">
              {isRental ? 'Rental Receipt' : 'Official Receipt'}
            </p>
          </div>

          <div className="text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-[#827A73]">Receipt No.</span><span className="font-semibold">RCPT-{String(order.id).padStart(5, '0')}</span></div>
            <div className="flex justify-between"><span className="text-[#827A73]">Date</span><span>{fmtDate(order.created_at)}</span></div>
            <div className="flex justify-between"><span className="text-[#827A73]">Customer</span><span className="font-medium">{order.customer?.name ?? 'Walk-in Guest'}</span></div>
            <div className="flex justify-between"><span className="text-[#827A73]">Transaction</span><span className="uppercase font-semibold">{isRental ? 'Rent' : 'Sale'}</span></div>
          </div>

          <div className="border-t border-dashed border-[#D1C7BD] my-4" />

          <div className="text-sm">
            <div className="flex justify-between font-medium">
              <span>{order.catalog_item?.name ?? 'Item'}</span>
              <span>{peso(total)}</span>
            </div>
            {isRental && order.rental_start_date && (
              <p className="text-xs text-[#827A73] mt-1">
                Rental period: {fmtDate(order.rental_start_date)} &rarr; {fmtDate(order.rental_end_date)}
              </p>
            )}
          </div>

          <div className="border-t border-dashed border-[#D1C7BD] my-4" />

          <div className="text-sm space-y-1.5">
            <div className="flex justify-between"><span className="text-[#827A73]">Total</span><span className="font-bold">{peso(total)}</span></div>
            {isRental && deposit > 0 && (
              <div className="flex justify-between"><span className="text-[#827A73]">Refundable Deposit</span><span>{peso(deposit)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-[#827A73]">Payment Status</span><span className="capitalize font-medium">{order.payment_status}</span></div>
            <div className="flex justify-between"><span className="text-[#827A73]">Fulfillment</span><span className="capitalize">{order.fulfillment_type || 'pickup'}</span></div>
            {order.delivery_address && (
              <div className="flex justify-between gap-4"><span className="text-[#827A73]">Deliver To</span><span className="text-right">{order.delivery_address}</span></div>
            )}
          </div>

          <p className="text-center text-xs text-[#827A73] mt-6 border-t border-dashed border-[#D1C7BD] pt-4">
            Thank you for your purchase!{isRental ? ' Please return the item on time to reclaim your deposit.' : ''}
          </p>
        </div>

        <div className="flex gap-2 p-4 border-t border-[#EBE6E0] no-print">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[#EBE6E0] text-sm font-semibold text-[#524A44] hover:bg-[#FAF6F3] transition-colors"
          >
            <X size={16} /> Close
          </button>
          <button
            onClick={() => globalThis.print()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-taupe hover:bg-taupe/90 text-white text-sm font-semibold transition-colors"
          >
            <Printer size={16} /> Print
          </button>
        </div>
      </div>
    </div>
  );
}
