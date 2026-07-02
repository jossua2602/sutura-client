'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { RosterItem } from '@/components/jobs/jobTypes';

interface Customer {
  id: number | string;
  name: string;
}

interface Service {
  id: number;
  name: string;
}

interface Job {
  id: number;
  order_number: string;
  status: string;
  notes?: string;
  payment_status: string;
  balance: number | string;
  customer_id?: number | string;
  customer?: Customer;
  service?: Service;
  custom_order_data?: Record<string, unknown>;
  is_rush?: boolean;
  rush_fee?: number | string;
}

interface MeasurementData {
  id: number;
  profile_name: string;
  profile?: Record<string, string>;
  notes?: string;
}

export default function StaffJobUpdatePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const unwrappedParams = React.use(params);
  const id = unwrappedParams.id;

  const { shop } = useAuthStore();
  const router = useRouter();
  
  const [job, setJob] = useState<Job | null>(null);
  const [measurements, setMeasurements] = useState<MeasurementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (shop && id) {
      api.get(`/shops/${shop.id}/jobs/${id}`)
        .then(res => {
          const data = res.data.data;
          setJob(data);
          setStatus(data.status);
          setNotes(data.notes || '');
          
          if (data.customer_id) {
            api.get(`/shops/${shop.id}/measurements?customer_id=${data.customer_id}`)
              .then(mRes => {
                if (mRes.data.data.length > 0) {
                  setMeasurements(mRes.data.data[0]);
                }
              })
              .catch(err => console.error('Failed to fetch measurements', err))
              .finally(() => setLoading(false));
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [shop, id]);

  const handleUpdate = async () => {
    if (!shop || !job) return;
    setSaving(true);
    try {
      await api.put(`/shops/${shop.id}/jobs/${id}`, {
        status,
        notes,
        // Preserve financial fields to avoid nullifying them
        payment_status: job.payment_status,
        balance: job.balance,
      });
      const res = await api.get(`/shops/${shop.id}/jobs/${id}`);
      setJob(res.data.data);
    } catch (err) {
      console.error('Failed to update', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !job) {
    return (
      <div className="flex items-center justify-center py-12 text-[#A8A19A]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#827A73] hover:text-[#2D2A26] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight flex items-center gap-2">
              {job.order_number}
              {job.is_rush && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full animate-pulse border border-amber-200">
                  ⚡ Rush
                </span>
              )}
            </h1>
            <p className="text-[#827A73] text-sm mt-1">Update production status</p>
          </div>
        </div>
        <button
          onClick={handleUpdate}
          disabled={saving}
          className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
          Save Progress
        </button>
      </div>

      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Task Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#A8A19A] block mb-1">Customer</span>
            {job.customer ? (
              <Link 
                href={`/staff-dashboard/customers/${job.customer.id}`} 
                className="text-[#9A8073] hover:text-[#9A8073]/80 hover:underline font-semibold flex items-center gap-1.5"
              >
                {job.customer.name}
                <span className="text-[10px] text-[#A8A19A] font-normal">(View Profile)</span>
              </Link>
            ) : (
              <span className="text-[#524A44] font-medium">Unspecified</span>
            )}
          </div>
          <div>
            <span className="text-[#A8A19A] block mb-1">Service</span>
            <span className="text-[#524A44] font-medium">{job.service?.name}</span>
          </div>
          {job.is_rush && (
            <div>
              <span className="text-[#A8A19A] block mb-1">⚡ Rush Fee</span>
              <span className="text-[#B26959] font-semibold">₱{Number.parseFloat(job.rush_fee as string || '0').toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Custom Specifications Card */}
      {job.custom_order_data && Object.keys(job.custom_order_data).some(k => k !== 'roster' && k !== 'team_roster') ? (
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-medium text-[#2D2A26] mb-4">📋 Custom Specifications</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {Object.entries(job.custom_order_data)
              .filter(([label]) => label !== 'roster' && label !== 'team_roster')
              .map(([label, value]) => (
                <div key={label}>
                  <span className="text-[#A8A19A] block mb-1 capitalize">{label.replaceAll('_', ' ')}</span>
                  <span className="text-[#524A44] font-medium">{typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : '—'}</span>
                </div>
              ))}
          </div>
        </div>
      ) : null}

      {/* Team Roster / Size Sheet Table Card */}
      {(() => {
        const teamRoster = (job.custom_order_data?.team_roster || job.custom_order_data?.roster) as RosterItem[] | undefined;
        if (!teamRoster || teamRoster.length === 0) return null;
        return (
          <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">👕 Team Roster & Size Sheet</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-zinc-200">
                <thead>
                  <tr>
                    <th className="pb-2 font-semibold text-zinc-600 w-12">#</th>
                    <th className="pb-2 font-semibold text-zinc-600">Player/Employee Name</th>
                    <th className="pb-2 font-semibold text-zinc-600">Print Name / Nickname</th>
                    <th className="pb-2 font-semibold text-zinc-600 w-24">Number</th>
                    <th className="pb-2 font-semibold text-zinc-600 w-24">Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-150">
                  {teamRoster.map((row: RosterItem, idx: number) => (
                    <tr key={`${row.name}-${row.number}-${idx}`}>
                      <td className="py-2.5 text-zinc-500 font-mono">{idx + 1}</td>
                      <td className="py-2.5 font-medium text-zinc-800">{row.name || '—'}</td>
                      <td className="py-2.5 text-zinc-700">{row.print_name || '—'}</td>
                      <td className="py-2.5 font-mono text-zinc-600 font-bold">{row.number || '—'}</td>
                      <td className="py-2.5 text-zinc-700">
                        <span className="px-2 py-0.5 bg-zinc-100 rounded text-[10px] font-bold">{row.size}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right text-xs text-[#827A73] font-medium mt-4">
              Total Items: {teamRoster.length}
            </div>
          </div>
        );
      })()}

      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Update Status</h2>
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="job-status" className="text-sm font-medium text-[#524A44]">Phase</label>
            <select
              id="job-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
            >
              <option value="pending">Pending</option>
              <option value="cutting">Cutting</option>
              <option value="sewing">Sewing</option>
              <option value="fitting">Fitting</option>
              <option value="ready_for_pickup">Ready for Pickup</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="production-notes" className="text-sm font-medium text-[#524A44]">Production Notes</label>
            <textarea
              id="production-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
              placeholder="Add any specific notes about the garment's progress..."
            />
          </div>
        </div>
      </div>

      {/* Measurements Profile */}
      {measurements?.profile && (
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6">
          <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Customer Measurements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(measurements.profile).map(([key, val]) => (
              <div key={key} className="bg-[#FAF6F3] border border-[#EBE6E0] p-3 rounded-lg">
                <span className="text-xs text-[#A8A19A] block uppercase tracking-wider">{key.replaceAll('_', ' ')}</span>
                <span className="text-[#2D2A26] font-medium text-sm">{val} in</span>
              </div>
            ))}
          </div>
          {measurements.notes && (
            <div className="mt-4 p-4 bg-[#F0EAE3]/30 rounded-lg border border-[#EBE6E0]/50">
              <span className="text-xs text-[#A8A19A] block uppercase tracking-wider mb-1">Measurement Notes</span>
              <p className="text-sm text-[#524A44]">{measurements.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
