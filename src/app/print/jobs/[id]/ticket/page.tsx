'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import QRCode from 'qrcode';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintAuthGuard } from '@/hooks/usePrintAuthGuard';

interface RosterItem { name?: string; print_name?: string; number?: string | number; size?: string; }

interface Job {
  id: number;
  order_number?: string;
  status: string;
  intake_channel: string;
  is_rush?: boolean;
  total_amount: string | number;
  balance?: string | number;
  due_date?: string;
  notes?: string;
  created_at: string;
  customer?: { id: number; name: string; phone?: string; email?: string; };
  service?: { name: string; };
  assigned_staff?: { name: string; };
  measurements?: {
    chest?: number; waist?: number; hip?: number; shoulder?: number;
    sleeve?: number; inseam?: number; neck?: number; thigh?: number;
    shirt_length?: number; pant_length?: number; notes?: string;
  };
  custom_order_data?: Record<string, unknown>;
  completion_photo_url?: string | null;
  reference_images?: string[] | null;
  material_source?: 'shop_supplied' | 'customer_supplied' | null;
}

export default function PrintWorkTicketPage() {
  usePrintAuthGuard();
  const { id } = useParams<{ id: string }>();
  const { shop } = useAuthStore();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!shop?.id || !id) return;
    api.get(`/shops/${shop.id}/jobs/${id}`)
      .then(res => { setJob(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shop?.id, id]);

  // QR links straight to this job's dashboard page — staff scan the tag on the
  // fabric bundle with their phone camera to jump to the status-update view,
  // instead of walking back to a shop computer to type it in.
  useEffect(() => {
    if (!job || typeof window === 'undefined') return;
    const url = `${window.location.origin}/dashboard/jobs/${job.id}`;
    QRCode.toDataURL(url, { width: 96, margin: 0, color: { dark: '#2D2A26', light: '#FFFFFF' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [job]);

  useEffect(() => {
    if (!loading && job) {
      setTimeout(() => window.print(), 400);
    }
  }, [loading, job]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500 text-sm animate-pulse">Preparing work ticket...</p>
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

  const total       = Number.parseFloat(String(job.total_amount || 0));
  const balance     = Number.parseFloat(String(job.balance      || 0));
  // job_orders has no standalone "downpayment" column — the amount paid so
  // far is always total minus the current balance, same as everywhere else
  // in the app (JobFinancialsCard, the downpayment gate banner, etc.).
  const dp          = total - balance;
  const roster      = (job.custom_order_data?.team_roster || job.custom_order_data?.roster) as RosterItem[] | undefined;
  const poNumber    = job.custom_order_data?.po_number as string | undefined;

  const customSpecs = job.custom_order_data
    ? Object.entries(job.custom_order_data).filter(([k]) =>
        !['team_roster', 'roster', 'po_number'].includes(k)
      )
    : [];

  const dueFmt = job.due_date
    ? new Date(job.due_date).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const createdFmt = new Date(job.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });

  const meas = job.measurements;

  return (
    <>
      {/* Print-specific global styles injected inline */}
      <style>{`
        @page { size: A4; margin: 18mm 16mm; }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        body { font-family: 'Arial', sans-serif; background: #fff; }
      `}</style>

      {/* Screen back button */}
      <div className="no-print fixed top-4 left-4 z-50 flex gap-3">
        <button onClick={() => window.history.back()} className="bg-white border border-gray-200 shadow text-sm px-4 py-2 rounded-lg font-medium hover:bg-gray-50">← Back</button>
        <button onClick={() => window.print()} className="bg-[#9A8073] text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-[#7A6560]">🖨 Print</button>
      </div>

      {/*
        ─── TICKET BODY ────────────────────────────────────────────────────
        globals.css's @media print rule hides `body *` by default and only
        un-hides #receipt-print-area (a pattern shared with OrderReceiptModal) —
        without this id, this whole standalone page prints/PDFs as a blank sheet.
      */}
      <div id="receipt-print-area" className="max-w-[780px] mx-auto p-8 text-[#1A1714] text-sm leading-relaxed">

        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-[#2D2A26] pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#2D2A26]">
              {shop?.name ?? 'SUTURA'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">Production Work Ticket</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="text-right">
              <p className="text-2xl font-black text-[#9A8073]">{job.order_number ?? `#${job.id}`}</p>
              {job.is_rush && (
                <span className="inline-block bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded mt-1">⚡ RUSH ORDER</span>
              )}
            </div>
            {job.completion_photo_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={job.completion_photo_url} alt="Completed garment" width={72} height={72} className="border border-gray-200 rounded object-cover" />
            )}
            {qrDataUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={qrDataUrl} alt="Scan to open this job" width={72} height={72} className="border border-gray-200 rounded" />
            )}
          </div>
        </div>

        {/* 2-column: Client + Order info */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Client Information</p>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="text-gray-500 pr-3 pb-1 font-medium w-28">Name</td><td className="font-bold pb-1">{job.customer?.name ?? '—'}</td></tr>
                <tr><td className="text-gray-500 pr-3 pb-1 font-medium">Phone</td><td className="pb-1">{job.customer?.phone ?? '—'}</td></tr>
                {job.customer?.email && !job.customer.email.startsWith('walkin_') && (
                  <tr><td className="text-gray-500 pr-3 font-medium">Email</td><td>{job.customer.email}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Order Details</p>
            <table className="w-full text-sm">
              <tbody>
                <tr><td className="text-gray-500 pr-3 pb-1 font-medium w-28">Service</td><td className="font-bold pb-1">{job.service?.name ?? '—'}</td></tr>
                <tr><td className="text-gray-500 pr-3 pb-1 font-medium">Channel</td><td className="pb-1 capitalize">{job.intake_channel?.replace('_', '-') ?? '—'}</td></tr>
                <tr><td className="text-gray-500 pr-3 pb-1 font-medium">Date In</td><td className="pb-1">{createdFmt}</td></tr>
                <tr><td className="text-gray-500 pr-3 pb-1 font-medium">Due Date</td><td className="font-bold text-red-700 pb-1">{dueFmt}</td></tr>
                {job.assigned_staff && <tr><td className="text-gray-500 pr-3 font-medium">Tailor</td><td>{job.assigned_staff.name}</td></tr>}
                {poNumber && <tr><td className="text-gray-500 pr-3 font-medium">PO #</td><td className="font-medium">{poNumber}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer-supplied material warning — do not cut from shop stock */}
        {job.material_source === 'customer_supplied' && (
          <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4 mb-6">
            <p className="text-sm font-black text-red-700 uppercase tracking-wide">
              ⚠ Customer-Supplied Fabric/Garment — Do Not Cut From Shop Stock
            </p>
            {job.reference_images && job.reference_images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {job.reference_images.map((url) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img key={url} src={url} alt="Customer's fabric/garment" width={88} height={88} className="border border-red-200 rounded object-cover" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Production Instructions (Cut Sheet) */}
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6">
          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">✂ Production Instructions / Cut Sheet</p>
          <p className="text-sm text-[#2D2A26] whitespace-pre-wrap leading-relaxed min-h-[60px]">
            {job.notes?.trim() || 'No specific instructions written. Proceed with standard production guidelines.'}
          </p>
        </div>

        {/* Measurements */}
        {meas && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Body Measurements (in cm)</p>
            <div className="grid grid-cols-4 gap-2">
              {([
                ['Chest',       meas.chest],
                ['Waist',       meas.waist],
                ['Hip',         meas.hip],
                ['Shoulder',    meas.shoulder],
                ['Sleeve',      meas.sleeve],
                ['Neck',        meas.neck],
                ['Inseam',      meas.inseam],
                ['Thigh',       meas.thigh],
                ['Shirt Length',meas.shirt_length],
                ['Pant Length', meas.pant_length],
              ] as [string, number | undefined][]).filter(([, v]) => v != null && v > 0).map(([label, val]) => (
                <div key={label} className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                  <p className="text-[9px] text-gray-400 uppercase font-bold">{label}</p>
                  <p className="text-base font-bold text-[#2D2A26]">{val}</p>
                </div>
              ))}
            </div>
            {meas.notes && (
              <p className="mt-2 text-xs text-gray-500 italic">Note: {meas.notes}</p>
            )}
          </div>
        )}

        {/* Custom Specs */}
        {customSpecs.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Custom Specifications</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {customSpecs.map(([label, value]) => (
                <div key={label} className="flex gap-2 border-b border-gray-100 py-1">
                  <span className="text-gray-500 capitalize font-medium w-32 shrink-0">{label.replaceAll('_', ' ')}</span>
                  <span className="text-[#2D2A26] font-semibold">{typeof value === 'string' || typeof value === 'number' ? String(value) : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Team Roster */}
        {roster && roster.length > 0 && (
          <div className="mb-6">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Team Roster / Size Sheet ({roster.length} pcs)</p>
            <table className="w-full border border-gray-200 rounded-lg text-xs">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-3 py-2 font-bold text-gray-600 border-b border-gray-200">#</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600 border-b border-gray-200">Name</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600 border-b border-gray-200">Print Name</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600 border-b border-gray-200">No.</th>
                  <th className="text-left px-3 py-2 font-bold text-gray-600 border-b border-gray-200">Size</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}>
                    <td className="px-3 py-1.5 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-1.5 font-medium">{r.name ?? '—'}</td>
                    <td className="px-3 py-1.5">{r.print_name ?? '—'}</td>
                    <td className="px-3 py-1.5">{r.number ?? '—'}</td>
                    <td className="px-3 py-1.5 font-bold">{r.size ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Financial Summary */}
        <div className="border-t-2 border-[#2D2A26] pt-4 mt-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Payment Summary</p>
          <div className="flex justify-end">
            <table className="text-sm">
              <tbody>
                <tr>
                  <td className="text-gray-500 pr-12 pb-1">Total Amount</td>
                  <td className="font-bold text-right pb-1">₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td className="text-gray-500 pr-12 pb-1">Downpayment Collected</td>
                  <td className="font-bold text-right text-green-700 pb-1">₱{dp.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr className="border-t border-gray-200">
                  <td className="text-gray-800 font-bold pr-12 pt-1">Balance Due</td>
                  <td className={`text-lg font-black text-right pt-1 ${balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    ₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Signature Footer */}
        <div className="grid grid-cols-3 gap-8 mt-10 pt-6 border-t border-gray-200">
          {['Prepared by', 'Checked by', 'Received by'].map(label => (
            <div key={label} className="text-center">
              <div className="border-b border-gray-400 h-10 mb-2" />
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[9px] text-gray-300 mt-6">
          Printed by SUTURA Shop Management System · {new Date().toLocaleString('en-PH')}
        </p>
      </div>
    </>
  );
}
