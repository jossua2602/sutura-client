import React, { useState } from 'react';
import Image from 'next/image';
import { MapPin, Receipt, ShieldCheck, Search, XCircle } from 'lucide-react';
import { CatalogOrder, StatusBadge } from './orderHelpers';
import OrderReceiptModal from './OrderReceiptModal';
import RentalStatusStepper from './RentalStatusStepper';

interface OrderListItemProps {
  readonly order: CatalogOrder;
  readonly activeTab: 'walkin' | 'online';
  readonly updating: number | null;
  readonly onUpdateStatus: (orderId: number, status: string, extra?: Record<string, string | number | boolean>) => Promise<void>;
}

export default function OrderListItem({
  order,
  activeTab,
  updating,
  onUpdateStatus,
}: Readonly<OrderListItemProps>) {
  const isUpdating = updating === order.id;
  const [showCourierForm, setShowCourierForm] = useState(false);
  const [courierName, setCourierName] = useState(order.courier_name || '');
  const [courierTracking, setCourierTracking] = useState(order.courier_tracking_number || '');
  const [showReceipt, setShowReceipt] = useState(false);
  const [showIdCaptureForm, setShowIdCaptureForm] = useState(false);
  const [idCaptured, setIdCaptured] = useState(false);
  const [idNotes, setIdNotes] = useState('');
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [deductionAmount, setDeductionAmount] = useState('0');

  return (
    <div className="rounded-xl border border-[#EBE6E0] bg-[#FAFAFA] hover:bg-white transition-colors text-[#2D2A26] overflow-hidden">
      {order.rental_start_date && (
        <div className="px-4 pt-3 pb-2 border-b border-[#EBE6E0]/70 bg-white/50">
          <RentalStatusStepper status={order.status} />
        </div>
      )}
      <div className="flex flex-col md:flex-row gap-6 p-4">
      {/* Image & Product Info */}
      <div className="flex gap-4 md:w-1/3">
        <div className="h-20 w-20 rounded-lg bg-[#EBE6E0] overflow-hidden shrink-0 relative">
          {order.catalog_item?.images?.[0]?.image_url ? (
            <Image src={order.catalog_item.images[0].image_url} alt="Product" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#9A8073]">No Image</div>
          )}
        </div>
        <div>
          <h4 className="font-medium text-[#2D2A26]">{order.catalog_item?.name || 'Unknown Product'}</h4>
          {order.selected_size && (
            <p className="text-xs font-semibold text-[#524A44] mt-0.5">Size: {order.selected_size}</p>
          )}
          <p className="text-sm font-semibold text-[#9A8073] mt-1">₱{Number.parseFloat(order.total_amount).toLocaleString()}</p>
          <div className="mt-2">
            <StatusBadge status={order.status} listingType={order.catalog_item?.listing_type} />
          </div>
        </div>
      </div>

      {/* Customer & Delivery Info */}
      <div className="md:w-1/3 space-y-2">
        <p className="text-sm">
          <span className="text-[#9A8073]">Customer: </span>
          <span className="font-medium text-[#2D2A26]">{order.customer?.name || 'Guest User'}</span>
        </p>
        <p className="text-sm">
          <span className="text-[#9A8073]">Payment: </span>
          <span className="font-medium text-[#2D2A26] capitalize">{order.payment_status}</span>
        </p>
        
        {order.rental_start_date && (
          <div className="mt-2 bg-[#9A8073]/5 border border-[#9A8073]/20 p-2.5 rounded-lg text-xs space-y-1">
            <p className="font-bold text-[#9A8073] uppercase tracking-wider text-[9px]">Rental Period</p>
            <p className="font-medium text-[#2D2A26]">
              📅 {new Date(order.rental_start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} to{' '}
              <span className="text-[#B26959] font-bold">
                {order.rental_end_date ? new Date(order.rental_end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </span>
            </p>
            {order.security_deposit_amount && (
              <p className="text-[11px] text-[#524A44]">
                Deposit: <span className="font-semibold text-zinc-950">₱{Number(order.security_deposit_amount).toLocaleString()}</span> (Refundable)
              </p>
            )}
            {order.valid_id_captured && (
              <p className="text-[11px] text-green-700 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 shrink-0" /> ID held{order.valid_id_notes ? `: ${order.valid_id_notes}` : ''}
              </p>
            )}
            {order.return_inspection_notes && (
              <p className="text-[11px] text-[#524A44] pt-1 border-t border-[#9A8073]/10">
                <span className="font-semibold">Return notes:</span> {order.return_inspection_notes}
              </p>
            )}
          </div>
        )}

        {order.fulfillment_type !== 'pickup' && order.status !== 'completed' && order.status !== 'out_for_delivery' && (
          <div className="mt-2 bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-xs text-[#826A50]">
            <p className="font-bold">🚚 Delivery Requested</p>
            <p className="text-[10px] mt-0.5">Please calculate shipping fee and contact the customer.</p>
          </div>
        )}

        {activeTab === 'online' && order.delivery_address && (
          <div className="space-y-1.5 mt-2 bg-white p-3 rounded-lg border border-[#EBE6E0]">
            <div className="flex gap-2 items-start">
              <MapPin className="w-4 h-4 text-[#9A8073] shrink-0 mt-0.5" />
              <span className="text-xs text-[#524A44]">{order.delivery_address}</span>
            </div>
            {(order.courier_name || order.courier_tracking_number) && (
              <div className="pt-1.5 border-t border-zinc-100 text-xs text-[#9A8073] flex flex-col gap-0.5">
                <span className="font-semibold text-zinc-950">Shipping Details:</span>
                <span>Courier: <strong className="text-zinc-800 font-bold">{order.courier_name || 'N/A'}</strong></span>
                <span>Tracking / Rider: <strong className="text-zinc-800 font-mono font-bold">{order.courier_tracking_number || 'N/A'}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="md:w-1/3 flex flex-col justify-center gap-2 items-end">
        <p className="text-xs text-[#9A8073] mb-2">{new Date(order.created_at).toLocaleString()}</p>

        <button
          onClick={() => setShowReceipt(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-[#D1C7BD] text-[#524A44] text-sm font-medium rounded-lg hover:bg-[#FAF6F3] transition-colors cursor-pointer"
        >
          <Receipt className="w-4 h-4" /> Print Receipt
        </button>

        {activeTab === 'online' && order.status === 'pending' && (
          order.catalog_item?.listing_type === 'for_rent' || order.fulfillment_type === 'pickup' ? (
            <button 
              onClick={() => onUpdateStatus(order.id, 'ready')}
              disabled={isUpdating}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer text-center"
            >
              {isUpdating ? 'Updating...' : 'Mark Ready for Pickup'}
            </button>
          ) : (
            <div className="w-full space-y-2">
              {showCourierForm ? (
                <div className="bg-white border border-[#EBE6E0] p-3 rounded-lg flex flex-col gap-2 w-64 shadow-xs">
                  <p className="text-[10px] font-bold text-[#9A8073] uppercase">Courier Details</p>
                  <input 
                    type="text" 
                    placeholder="Courier Name (e.g. Maxim)"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    className="w-full border border-[#EBE6E0] px-2 py-1 rounded text-xs focus:outline-none focus:border-[#9A8073]"
                  />
                  <input 
                    type="text" 
                    placeholder="Tracking / Rider Phone"
                    value={courierTracking}
                    onChange={(e) => setCourierTracking(e.target.value)}
                    className="w-full border border-[#EBE6E0] px-2 py-1 rounded text-xs focus:outline-none focus:border-[#9A8073]"
                  />
                  <div className="flex gap-1 justify-end">
                    <button 
                      onClick={() => setShowCourierForm(false)}
                      className="px-2 py-1 text-xs border border-[#EBE6E0] rounded hover:bg-zinc-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={async () => {
                        await onUpdateStatus(order.id, 'out_for_delivery', {
                          courier_name: courierName,
                          courier_tracking_number: courierTracking,
                        });
                        setShowCourierForm(false);
                      }}
                      className="px-2 py-1 text-xs bg-[#2D2A26] text-white rounded hover:bg-black cursor-pointer"
                    >
                      Ship Order
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setShowCourierForm(true)}
                  disabled={isUpdating}
                  className="w-full sm:w-auto px-4 py-2 bg-[#2D2A26] text-white text-sm font-medium rounded-lg hover:bg-[#1a1816] transition-colors disabled:opacity-50 cursor-pointer text-center"
                >
                  {isUpdating ? 'Updating...' : 'Send Out for Delivery'}
                </button>
              )}
            </div>
          )
        )}
        
        {order.status === 'pending' && (
          <button
            onClick={() => {
              if (window.confirm('Cancel this order? This voids a mistaken or duplicate entry — use it only before any prep/shipping has started.')) {
                onUpdateStatus(order.id, 'cancelled');
              }
            }}
            disabled={isUpdating}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 border border-[#B26959]/30 text-[#B26959] text-sm font-medium rounded-lg hover:bg-[#B26959]/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <XCircle className="w-4 h-4" /> Cancel Order
          </button>
        )}

        {activeTab === 'online' && order.status === 'out_for_delivery' && order.catalog_item?.listing_type !== 'for_rent' && (
          <button 
            onClick={() => onUpdateStatus(order.id, 'completed')}
            disabled={isUpdating}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer text-center"
          >
            {isUpdating ? 'Updating...' : 'Mark Delivered'}
          </button>
        )}

        {order.status === 'ready' && (
          order.catalog_item?.listing_type === 'for_rent' ? (
            showIdCaptureForm ? (
              <div className="bg-rose-50/60 border border-rose-200 p-3 rounded-xl flex flex-col gap-2 w-72 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-rose-700" />
                  </span>
                  <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Before Releasing the Gown</p>
                </div>
                <label className="flex items-start gap-2 text-xs text-[#524A44] cursor-pointer bg-white/70 p-2 rounded-lg border border-rose-100">
                  <input
                    type="checkbox"
                    checked={idCaptured}
                    onChange={(e) => setIdCaptured(e.target.checked)}
                    className="mt-0.5 accent-rose-600"
                  />
                  I have verified and captured/held a valid government ID from the customer.
                </label>
                <input
                  type="text"
                  placeholder="ID type / reference (e.g. Driver's License)"
                  value={idNotes}
                  onChange={(e) => setIdNotes(e.target.value)}
                  className="w-full bg-white border border-rose-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:border-rose-400"
                />
                <div className="flex gap-1 justify-end">
                  <button
                    onClick={() => setShowIdCaptureForm(false)}
                    className="px-2 py-1 text-xs border border-[#EBE6E0] rounded hover:bg-zinc-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!idCaptured || isUpdating}
                    onClick={async () => {
                      await onUpdateStatus(order.id, 'out_for_delivery', {
                        valid_id_captured: idCaptured,
                        valid_id_notes: idNotes,
                      });
                      setShowIdCaptureForm(false);
                    }}
                    className="px-2 py-1 text-xs bg-rose-700 text-white rounded hover:bg-rose-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Confirm & Release
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowIdCaptureForm(true)}
                disabled={isUpdating}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-[#2D2A26] text-white text-sm font-medium rounded-lg hover:bg-[#1a1816] transition-colors disabled:opacity-50 cursor-pointer text-center"
              >
                <ShieldCheck className="w-4 h-4" /> Confirm Gown Pickup
              </button>
            )
          ) : (
            <button
              onClick={() => onUpdateStatus(order.id, 'completed')}
              disabled={isUpdating}
              className="w-full sm:w-auto px-4 py-2 bg-[#2D2A26] text-white text-sm font-medium rounded-lg hover:bg-[#1a1816] transition-colors disabled:opacity-50 cursor-pointer text-center"
            >
              {isUpdating ? 'Updating...' : 'Confirm Pickup'}
            </button>
          )
        )}

        {order.catalog_item?.listing_type === 'for_rent' && order.status === 'out_for_delivery' && (
          <button
            onClick={() => onUpdateStatus(order.id, 'returned_pending_inspection')}
            disabled={isUpdating}
            className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 cursor-pointer text-center"
          >
            {isUpdating ? 'Updating...' : 'Mark as Returned'}
          </button>
        )}

        {order.status === 'returned_pending_inspection' && (
          showInspectionForm ? (
            <div className="bg-orange-50/60 border border-orange-200 p-3 rounded-xl flex flex-col gap-2 w-72 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
                  <Search className="w-3.5 h-3.5 text-orange-700" />
                </span>
                <p className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Return Inspection</p>
              </div>
              <textarea
                placeholder="Condition notes (e.g. minor stain, torn hem, needs dry cleaning). Leave blank if item is in good condition."
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                rows={3}
                className="w-full bg-white border border-orange-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:border-orange-400 resize-none"
              />
              <label className="text-[10px] font-semibold text-orange-700 uppercase">Deposit Deduction (₱)</label>
              <input
                type="number"
                min="0"
                max={order.security_deposit_amount ? Number(order.security_deposit_amount) : undefined}
                step="0.01"
                value={deductionAmount}
                onChange={(e) => setDeductionAmount(e.target.value)}
                className="w-full bg-white border border-orange-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:border-orange-400"
              />
              {order.security_deposit_amount ? (() => {
                const deposit = Number(order.security_deposit_amount);
                const deduction = Number.parseFloat(deductionAmount) || 0;
                const exceedsDeposit = deduction > deposit;
                return (
                  <p className={`text-[10px] p-1.5 rounded-lg border ${exceedsDeposit ? 'text-red-700 bg-red-50 border-red-200 font-semibold' : 'text-orange-800/80 bg-white/70 border-orange-100'}`}>
                    {exceedsDeposit
                      ? `Deduction cannot exceed the ₱${deposit.toLocaleString()} deposit held.`
                      : `Deposit held: ₱${deposit.toLocaleString()}. Refund to customer: ₱${(deposit - deduction).toLocaleString()}.`}
                  </p>
                );
              })() : null}
              <div className="flex gap-1 justify-end">
                <button
                  onClick={() => setShowInspectionForm(false)}
                  className="px-2 py-1 text-xs border border-[#EBE6E0] rounded hover:bg-zinc-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={isUpdating || (order.security_deposit_amount != null && (Number.parseFloat(deductionAmount) || 0) > Number(order.security_deposit_amount))}
                  onClick={async () => {
                    await onUpdateStatus(order.id, 'completed', {
                      return_inspection_notes: inspectionNotes,
                      deposit_deduction_amount: Number.parseFloat(deductionAmount) || 0,
                    });
                    setShowInspectionForm(false);
                  }}
                  className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Finalize Return
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowInspectionForm(true)}
              disabled={isUpdating}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 cursor-pointer text-center"
            >
              <Search className="w-4 h-4" /> Complete Inspection
            </button>
          )
        )}

        {order.status === 'completed' && (
          <div className="text-sm font-medium text-green-600 text-right">
            <p>{order.catalog_item?.listing_type === 'for_rent' ? 'Returned & Fulfilled' : 'Order Fulfilled'}</p>
            {order.catalog_item?.listing_type === 'for_rent' && order.deposit_deduction_amount !== null && Number(order.deposit_deduction_amount) > 0 && (
              <p className="text-xs text-[#B26959] font-normal mt-0.5">
                ₱{Number(order.deposit_deduction_amount).toLocaleString()} deducted from deposit
              </p>
            )}
          </div>
        )}

        {order.status === 'cancelled' && (
          <p className="text-sm font-medium text-[#B26959]">Order Cancelled</p>
        )}
      </div>
      </div>

      {showReceipt && <OrderReceiptModal order={order} onClose={() => setShowReceipt(false)} />}
    </div>
  );
}
