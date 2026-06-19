'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface CustomerData { id: number; name: string }
interface ServiceData { id: number; name: string }
interface StaffData { id: number; user: { id: number; name: string }, role: string }

export default function NewJobOrderPage() {
  const router = useRouter();
  const { shop , user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);

  const [formData, setFormData] = useState({
    customer_id: '',
    service_id: '',
    assigned_staff_id: '',
    total_amount: '',
    downpayment: '',
    due_date: '',
    notes: ''
  });

  useEffect(() => {
    if (shop) {
      Promise.all([
        api.get(`/shops/${shop.id}/customers`),
        api.get(`/shops/${shop.id}/services`),
        api.get(`/shops/${shop.id}/staff`)
      ]).then(([resCustomers, resServices, resStaff]) => {
        setCustomers(resCustomers.data.data);
        setServices(resServices.data.data);
        setStaff(resStaff.data.data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setError('Failed to load data.');
        setLoading(false);
      });
    } else if (user && !shop) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    
    setSubmitting(true);
    setError('');

    const balance = parseFloat(formData.total_amount) - parseFloat(formData.downpayment || '0');

    try {
      await api.post(`/shops/${shop.id}/jobs`, {
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        assigned_staff_id: formData.assigned_staff_id || null,
        total_amount: formData.total_amount,
        balance: balance,
        due_date: formData.due_date || null,
        notes: formData.notes
      });
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create job order.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading form data...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/jobs" className="p-2 bg-white shadow-sm border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#827A73] hover:text-[#2D2A26] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Create Job Order</h1>
          <p className="text-[#827A73] text-sm mt-1">Start a new garment production workflow.</p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
        {error && (
          <div className="mb-6 bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Customer <span className="text-[#B26959]">*</span></label>
              <select
                required
                value={formData.customer_id}
                onChange={e => setFormData({...formData, customer_id: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="" disabled>Select a customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Service Category <span className="text-[#B26959]">*</span></label>
              <select
                required
                value={formData.service_id}
                onChange={e => setFormData({...formData, service_id: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="" disabled>Select a service</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Assigned Staff</label>
              <select
                value={formData.assigned_staff_id}
                onChange={e => setFormData({...formData, assigned_staff_id: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="">Unassigned</option>
                {staff.map(s => (
                  <option key={s.id} value={s.user.id}>{s.user.name} ({s.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Due Date</label>
              <input 
                type="date" 
                value={formData.due_date}
                onChange={e => setFormData({...formData, due_date: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Total Amount (₱) <span className="text-[#B26959]">*</span></label>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                value={formData.total_amount}
                onChange={e => setFormData({...formData, total_amount: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] focus:outline-none focus:border-taupe"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Downpayment (₱)</label>
              <input 
                type="number" 
                min="0"
                step="0.01"
                value={formData.downpayment}
                onChange={e => setFormData({...formData, downpayment: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] focus:outline-none focus:border-taupe"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Notes & Instructions</label>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-taupe min-h-32 resize-y"
              placeholder="Enter measurements, specific requests, or design notes here..."
            />
          </div>

          <div className="pt-6 border-t border-[#EBE6E0] flex justify-end gap-4">
            <Link 
              href="/dashboard/jobs"
              className="px-6 py-2.5 rounded-lg font-medium text-[#827A73] hover:text-[#2D2A26] hover:bg-[#F0EAE3] transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={submitting}
              className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-[#9A8073]/20"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              Create Job Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
