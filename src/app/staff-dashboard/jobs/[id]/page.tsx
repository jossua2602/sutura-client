'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2, Save } from 'lucide-react';

export default function StaffJobUpdatePage({ params }: { params: { id: string } }) {
  const { shop , user } = useAuthStore();
  const router = useRouter();
  
  const [job, setJob] = useState<any>(null);
  const [measurements, setMeasurements] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (shop && params.id) {
      api.get(`/shops/${shop.id}/jobs/${params.id}`)
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
  }, [shop, params.id]);

  const handleUpdate = async () => {
    if (!shop) return;
    setSaving(true);
    try {
      await api.put(`/shops/${shop.id}/jobs/${params.id}`, {
        status,
        notes,
        // Preserve financial fields to avoid nullifying them
        payment_status: job.payment_status,
        balance: job.balance,
      });
      const res = await api.get(`/shops/${shop.id}/jobs/${params.id}`);
      setJob(res.data.data);
    } catch (err) {
      console.error('Failed to update', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
            <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">{job.order_number}</h1>
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

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Task Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#A8A19A] block mb-1">Customer</span>
            <span className="text-[#524A44] font-medium">{job.customer?.name}</span>
          </div>
          <div>
            <span className="text-[#A8A19A] block mb-1">Service</span>
            <span className="text-[#524A44] font-medium">{job.service?.name}</span>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Update Status</h2>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">Phase</label>
            <select
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
            <label className="text-sm font-medium text-[#524A44]">Production Notes</label>
            <textarea
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
      {measurements && (
        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Customer Measurements</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(measurements.profile).map(([key, val]: any) => (
              <div key={key} className="bg-[#FAF6F3] border border-[#EBE6E0] p-3 rounded-lg">
                <span className="text-xs text-[#A8A19A] block uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
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
