'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { CreditCard, Check, X, ExternalLink, Calendar, ShoppingBag, User, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

interface PaymentItem {
  id: number;
  type: 'appointment' | 'catalog_order';
  customer_name: string;
  customer_email: string;
  itemName: string;
  payment_method: string;
  payment_reference: string;
  payment_receipt_path: string;
  amount: string | number;
  date: string;
  status: string;
  payment_status: string;
}

export default function PaymentQueuePage() {
  const { shop } = useAuthStore();
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchPayments = async () => {
    if (!shop) return;
    setLoading(true);
    try {
      // Fetch appointments and catalog orders
      const [appointmentsRes, ordersRes] = await Promise.all([
        api.get(`/shops/${shop.id}/appointments`),
        api.get(`/shops/${shop.id}/catalog-orders`)
      ]);

      const items: PaymentItem[] = [];

      // Map appointments with gcash/bank transfer payments
      if (appointmentsRes.data.success) {
        appointmentsRes.data.data.forEach((app: any) => {
          if (
            app.payment_method &&
            app.payment_method !== 'cash' &&
            app.payment_status === 'pending'
          ) {
            items.push({
              id: app.id,
              type: 'appointment',
              customer_name: app.customer?.name || 'Guest User',
              customer_email: app.customer?.email || '',
              itemName: `${app.appointment_type.toUpperCase()} - ${app.service?.name || 'General Consultation'}`,
              payment_method: app.payment_method,
              payment_reference: app.payment_reference || 'N/A',
              payment_receipt_path: app.payment_receipt_path || '',
              amount: app.service?.base_price || '0.00',
              date: app.scheduled_at,
              status: app.status,
              payment_status: app.payment_status,
            });
          }
        });
      }

      // Map catalog orders with gcash/bank transfer payments
      if (ordersRes.data.data) {
        ordersRes.data.data.forEach((ord: any) => {
          if (
            ord.payment_method &&
            ord.payment_method !== 'cash' &&
            ord.payment_status === 'pending'
          ) {
            items.push({
              id: ord.id,
              type: 'catalog_order',
              customer_name: ord.customer?.name || 'Guest User',
              customer_email: ord.customer?.email || '',
              itemName: ord.catalog_item?.title || 'Catalog Purchase',
              payment_method: ord.payment_method,
              payment_reference: ord.payment_reference || 'N/A',
              payment_receipt_path: ord.payment_receipt_path || '',
              amount: ord.total_amount,
              date: ord.created_at,
              status: ord.status,
              payment_status: ord.payment_status,
            });
          }
        });
      }

      setPayments(items);
      if (selectedPayment) {
        const updated = items.find(i => i.id === selectedPayment.id && i.type === selectedPayment.type);
        setSelectedPayment(updated || null);
      }
    } catch (err) {
      console.error('Failed to fetch payment queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (shop) {
      fetchPayments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop]);

  const handleVerify = async (item: PaymentItem, status: 'paid' | 'pending') => {
    if (!shop) return;
    setProcessingId(item.id);
    try {
      const endpoint = item.type === 'appointment'
        ? `/shops/${shop.id}/appointments/${item.id}/verify-payment`
        : `/shops/${shop.id}/catalog-orders/${item.id}/verify-payment`;

      await api.put(endpoint, { payment_status: status });
      
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
      
      if (selectedPayment?.id === item.id && selectedPayment.type === item.type) {
        setSelectedPayment(null);
      }
      fetchPayments();
    } catch (err) {
      console.error('Failed to verify payment:', err);
      alert('Failed to update payment verification. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 text-[#2D2A26]">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2A26]">Payment Verification Queue</h1>
        <p className="text-sm text-[#524A44] mt-1">Review manual GCash and Bank Transfer receipts submitted by customers</p>
      </div>

      {loading && payments.length === 0 ? (
        <div className="flex h-64 items-center justify-center bg-white rounded-2xl border border-[#EBE6E0]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8A7E72]"></div>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-[#EBE6E0]">
          <CreditCard className="mx-auto h-12 w-12 text-[#B8B2A9] mb-4" />
          <h3 className="text-md font-semibold text-[#2D2A26]">Payment Queue Clean!</h3>
          <p className="text-sm text-[#827A73] mt-1">There are no pending GCash or Bank receipts to verify right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* List Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-[#EBE6E0] overflow-hidden">
              <div className="p-4 border-b border-[#EBE6E0] bg-[#FAF6F3]">
                <h3 className="font-semibold text-sm">Pending Verification ({payments.length})</h3>
              </div>
              <div className="divide-y divide-[#EBE6E0]">
                {payments.map(item => (
                  <button
                    key={`${item.type}-${item.id}`}
                    onClick={() => setSelectedPayment(item)}
                    className={`w-full flex items-center justify-between p-4 text-left hover:bg-[#FAF6F3] transition-colors ${
                      selectedPayment?.id === item.id && selectedPayment.type === item.type
                        ? 'bg-[#F0EAE3]'
                        : ''
                    }`}
                  >
                    <div className="flex gap-4 items-center min-w-0">
                      <div className={`p-2.5 rounded-xl ${
                        item.type === 'appointment' ? 'bg-[#7A8B76]/10 text-[#7A8B76]' : 'bg-[#9A8073]/10 text-[#9A8073]'
                      }`}>
                        {item.type === 'appointment' ? <Calendar size={20} /> : <ShoppingBag size={20} />}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm text-[#2D2A26] truncate">{item.itemName}</h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[#827A73]">
                          <span className="font-medium text-[#2D2A26]">{item.customer_name}</span>
                          <span>•</span>
                          <span className="capitalize">{item.payment_method.replace('_', ' ')}</span>
                          <span>•</span>
                          <span className="font-mono text-zinc-600 font-bold">{item.payment_reference}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-sm">₱{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-[#A8A19A] mt-1">{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-1">
            {selectedPayment ? (
              <div className="bg-white rounded-2xl border border-[#EBE6E0] p-6 space-y-6 sticky top-24 shadow-sm">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${
                    selectedPayment.type === 'appointment' ? 'bg-[#7A8B76]/15 text-[#7A8B76]' : 'bg-[#9A8073]/15 text-[#9A8073]'
                  }`}>
                    {selectedPayment.type.replace('_', ' ')}
                  </span>
                  <h3 className="text-lg font-bold text-[#2D2A26]">{selectedPayment.itemName}</h3>
                </div>

                <div className="border-t border-b border-[#EBE6E0] py-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#827A73] flex items-center gap-1.5"><User size={16} /> Customer</span>
                    <span className="font-medium text-[#2D2A26]">{selectedPayment.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#827A73]">Email</span>
                    <span className="font-medium text-[#2D2A26] truncate max-w-[180px]">{selectedPayment.customer_email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#827A73]">Amount Paid</span>
                    <span className="font-bold text-[#2D2A26]">₱{Number(selectedPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#827A73]">Payment Method</span>
                    <span className="font-medium text-[#2D2A26] capitalize">{selectedPayment.payment_method.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#827A73]">Reference Code</span>
                    <span className="font-mono text-zinc-900 font-bold bg-zinc-100 px-1.5 py-0.5 rounded">{selectedPayment.payment_reference}</span>
                  </div>
                </div>

                {/* Receipt Image */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-[#827A73] block">Proof of Payment</span>
                  {selectedPayment.payment_receipt_path ? (
                    <div className="relative w-full aspect-3/4 rounded-xl overflow-hidden border border-[#EBE6E0] bg-zinc-50 group">
                      <Image
                        src={selectedPayment.payment_receipt_path}
                        alt="GCash Receipt Proof"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                      <a
                        href={selectedPayment.payment_receipt_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-3 right-3 bg-black/60 hover:bg-black text-white p-2 rounded-full transition-colors flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider"
                      >
                        <ExternalLink size={12} /> Open Link
                      </a>
                    </div>
                  ) : (
                    <div className="h-40 rounded-xl border border-dashed border-[#EBE6E0] flex items-center justify-center text-xs text-[#A8A19A]">
                      No receipt screenshot uploaded
                    </div>
                  )}
                </div>

                {/* Approval Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleVerify(selectedPayment, 'paid')}
                    disabled={processingId !== null}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm"
                  >
                    <Check size={16} /> Approve Payment
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to decline this receipt?')) {
                        setSelectedPayment(null);
                      }
                    }}
                    className="p-3 border border-[#EBE6E0] hover:bg-red-50 hover:text-red-600 rounded-xl text-[#827A73] transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-[#EBE6E0] p-12 text-center text-[#827A73] sticky top-24">
                Select a payment request to view reference receipts and details
              </div>
            )}
          </div>
        </div>
      )}

      {/* Success Modal Notification */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-[#EBE6E0] text-center max-w-sm w-full mx-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Payment Verified</h3>
              <p className="text-xs text-[#827A73] mt-1">The manual deposit has been verified and approved.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
