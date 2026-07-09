'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintAuthGuard } from '@/hooks/usePrintAuthGuard';

interface Payment {
  id: number;
  amount: string | number;
  payment_method: string;
  reference?: string | null;
  created_at: string;
  notes?: string;
  recorded_by?: { name: string; id: number };
}

interface Job {
  id: number;
  order_number?: string;
  total_amount: string | number;
  balance?: string | number;
  customer?: { id: number; name: string; phone?: string; email?: string };
  service?: { name: string };
  payments?: Payment[];
}

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  bank_transfer: 'Bank Transfer',
};

export default function PaymentReceiptPage() {
  usePrintAuthGuard();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment');
  const { shop } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop?.id || !id) return;
    api.get(`/shops/${shop.id}/jobs/${id}`)
      .then(res => { setJob(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shop?.id, id]);

  useEffect(() => {
    if (!loading && job) {
      setTimeout(() => window.print(), 400);
    }
  }, [loading, job]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">Preparing receipt...</p>
      </div>
    );
  }
  if (!job) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm">Job not found.</p>
      </div>
    );
  }

  const total = Number.parseFloat(String(job.total_amount || 0));
  const payments = [...(job.payments || [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  // A single transaction's own receipt shows the running balance immediately
  // after IT was applied, not the job's current balance — those diverge the
  // moment a later payment gets logged, which is the whole point of being
  // able to re-print any past receipt on demand.
  const singlePayment = paymentId ? payments.find(p => String(p.id) === paymentId) : null;
  let runningPaidAtSingle = 0;
  if (singlePayment) {
    for (const p of payments) {
      runningPaidAtSingle += Number.parseFloat(String(p.amount));
      if (p.id === singlePayment.id) break;
    }
  }

  const totalPaidOverall = payments.reduce((sum, p) => sum + Number.parseFloat(String(p.amount)), 0);
  const currentBalance = Number.parseFloat(String(job.balance ?? (total - totalPaidOverall)));

  const fmtDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-PH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const money = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  return (
    <>
      <style>{`
        @page { size: A4; margin: 18mm 16mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body { font-family: 'Arial', sans-serif; background: #fff; }
      `}</style>

      <div className="no-print fixed top-4 left-4 z-50 flex gap-3">
        <button onClick={() => window.history.back()} className="bg-white border border-gray-200 shadow text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-50">← Back</button>
        <button onClick={() => window.print()} className="bg-[#9A8073] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#7A6560]">🖨 Print</button>
      </div>

      {/*
        globals.css's @media print rule hides `body *` by default and only
        un-hides #receipt-print-area (a pattern shared with OrderReceiptModal) —
        without this id, this whole standalone page prints/PDFs as a blank sheet.
      */}
      <div id="receipt-print-area" className="max-w-[780px] mx-auto p-8 text-[#1A1714] text-sm leading-relaxed">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#2D2A26] pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#2D2A26]">{shop?.name ?? 'SUTURA'}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {singlePayment ? 'Official Receipt' : 'Payment Statement'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-[#9A8073]">{job.order_number ?? `#${job.id}`}</p>
            {singlePayment && (
              <p className="text-xs text-gray-500 mt-1">Receipt for payment #{singlePayment.id}</p>
            )}
          </div>
        </div>

        {/* Client / Order info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Billed To</p>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="text-gray-500 pr-3 pb-1 font-medium w-28">Name</td><td className="font-bold pb-1">{job.customer?.name ?? '—'}</td></tr>
                <tr><td className="text-gray-500 pr-3 pb-1 font-medium">Phone</td><td className="pb-1">{job.customer?.phone ?? '—'}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Order Details</p>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="text-gray-500 pr-3 pb-1 font-medium w-28">Service</td><td className="font-bold pb-1">{job.service?.name ?? '—'}</td></tr>
                <tr><td className="text-gray-500 pr-3 pb-1 font-medium">Total Amount</td><td className="pb-1">{money(total)}</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {singlePayment ? (
          <>
            {/* Single Transaction Receipt */}
            <div className="bg-[#7A8B76]/10 border border-[#7A8B76]/30 rounded-lg p-5 mb-6">
              <p className="text-[10px] font-bold text-[#7A8B76] uppercase tracking-widest mb-3">Amount Received</p>
              <p className="text-3xl font-black text-[#2D2A26] mb-3">{money(Number.parseFloat(String(singlePayment.amount)))}</p>
              <table className="w-full text-sm">
                <tbody>
                  <tr><td className="text-gray-500 pr-3 pb-1 font-medium w-32">Date &amp; Time</td><td className="font-medium pb-1">{fmtDateTime(singlePayment.created_at)}</td></tr>
                  <tr><td className="text-gray-500 pr-3 pb-1 font-medium">Method</td><td className="pb-1">{METHOD_LABELS[singlePayment.payment_method] ?? singlePayment.payment_method}</td></tr>
                  {singlePayment.reference && (
                    <tr><td className="text-gray-500 pr-3 pb-1 font-medium">Reference #</td><td className="pb-1 font-mono">{singlePayment.reference}</td></tr>
                  )}
                  {singlePayment.recorded_by && (
                    <tr><td className="text-gray-500 pr-3 font-medium">Received By</td><td>{singlePayment.recorded_by.name}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t-2 border-[#2D2A26] pt-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Account Status After This Payment</p>
              <div className="flex justify-end">
                <table className="text-sm">
                  <tbody>
                    <tr><td className="text-gray-500 pr-12 pb-1">Total Amount</td><td className="font-bold text-right pb-1">{money(total)}</td></tr>
                    <tr><td className="text-gray-500 pr-12 pb-1">Paid to Date (as of this receipt)</td><td className="font-bold text-right text-green-700 pb-1">{money(runningPaidAtSingle)}</td></tr>
                    <tr className="border-t border-gray-200">
                      <td className="text-gray-800 font-bold pr-12 pt-1">Balance Remaining</td>
                      <td className={`text-lg font-black text-right pt-1 ${(total - runningPaidAtSingle) > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {money(Math.max(0, total - runningPaidAtSingle))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Full Payment Statement */}
            <div className="mb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Payment History ({payments.length})</p>
              {payments.length === 0 ? (
                <p className="text-sm text-gray-400 italic">No payments recorded yet.</p>
              ) : (
                <table className="w-full border border-gray-200 rounded-lg text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left px-3 py-2 font-bold text-gray-600 border-b border-gray-200">Date &amp; Time</th>
                      <th className="text-left px-3 py-2 font-bold text-gray-600 border-b border-gray-200">Method</th>
                      <th className="text-left px-3 py-2 font-bold text-gray-600 border-b border-gray-200">Reference</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-600 border-b border-gray-200">Amount</th>
                      <th className="text-right px-3 py-2 font-bold text-gray-600 border-b border-gray-200">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let running = 0;
                      return payments.map((p, i) => {
                        running += Number.parseFloat(String(p.amount));
                        return (
                          <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                            <td className="px-3 py-1.5">{fmtDateTime(p.created_at)}</td>
                            <td className="px-3 py-1.5">{METHOD_LABELS[p.payment_method] ?? p.payment_method}</td>
                            <td className="px-3 py-1.5 font-mono">{p.reference || '—'}</td>
                            <td className="px-3 py-1.5 text-right font-bold">{money(Number.parseFloat(String(p.amount)))}</td>
                            <td className="px-3 py-1.5 text-right">{money(Math.max(0, total - running))}</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              )}
            </div>

            <div className="border-t-2 border-[#2D2A26] pt-4">
              <div className="flex justify-end">
                <table className="text-sm">
                  <tbody>
                    <tr><td className="text-gray-500 pr-12 pb-1">Total Amount</td><td className="font-bold text-right pb-1">{money(total)}</td></tr>
                    <tr><td className="text-gray-500 pr-12 pb-1">Total Paid</td><td className="font-bold text-right text-green-700 pb-1">{money(totalPaidOverall)}</td></tr>
                    <tr className="border-t border-gray-200">
                      <td className="text-gray-800 font-bold pr-12 pt-1">Balance Due</td>
                      <td className={`text-lg font-black text-right pt-1 ${currentBalance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                        {money(currentBalance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <p className="text-center text-[9px] text-gray-300 mt-8">
          Printed by SUTURA Shop Management System · {new Date().toLocaleString('en-PH')}
        </p>
      </div>
    </>
  );
}
