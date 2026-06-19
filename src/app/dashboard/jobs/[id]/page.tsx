'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';

interface Job {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  balance: number | string;
  total_amount: number | string;
  notes?: string;
  deadline?: string;
  customer?: { name: string; id: number };
  service?: { name: string; id: number };
  assigned_staff?: { name: string; id: number };
  staff_stages?: { id: number; pivot: { stage: string; completed_at?: string } }[];
}

interface Staff {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const { shop } = useAuthStore();
  const router = useRouter();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Editable fields
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [balance, setBalance] = useState('');
  const [notes, setNotes] = useState('');

  // Staff Assignment
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<Record<string, string>>({
    cutting: '',
    sewing: '',
    finishing: ''
  });
  const [staffCompletions, setStaffCompletions] = useState<Record<string, string | null>>({
    cutting: null,
    sewing: null,
    finishing: null
  });
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    if (shop && params.id) {
      // Fetch Job Details
      api.get(`/shops/${shop.id}/jobs/${params.id}`)
        .then(res => {
          const data = res.data.data;
          setJob(data);
          setStatus(data.status);
          setPaymentStatus(data.payment_status);
          setBalance(data.balance);
          setNotes(data.notes || '');
          
          // Populate existing staff stages
          const assignments: Record<string, string> = { cutting: '', sewing: '', finishing: '' };
          const completions: Record<string, string | null> = { cutting: null, sewing: null, finishing: null };
          if (data.staff_stages) {
             data.staff_stages.forEach((staff: { id: number; pivot: { stage: string; completed_at?: string } }) => {
                assignments[staff.pivot.stage] = staff.id.toString();
                completions[staff.pivot.stage] = staff.pivot.completed_at || null;
             });
          }
          setStaffAssignments(assignments);
          setStaffCompletions(completions);
          
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });

      // Fetch Staff for assignment dropdown
      api.get(`/shops/${shop.id}/staff`)
        .then(res => {
          setAllStaff(res.data.data);
        })
        .catch(console.error);
    }
  }, [shop, params.id]);

  const handleUpdate = async () => {
    if (!shop) return;
    setSaving(true);
    try {
      await api.put(`/shops/${shop.id}/jobs/${params.id}`, {
        status,
        payment_status: paymentStatus,
        balance: parseFloat(balance),
        notes
      });
      // Refresh
      const res = await api.get(`/shops/${shop.id}/jobs/${params.id}`);
      setJob(res.data.data);
    } catch (err) {
      console.error('Failed to update', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!shop) return;
    setSavingStaff(true);
    try {
      const assignments = Object.entries(staffAssignments)
        .filter(([stage, userId]) => userId) // only non-empty
        .map(([stage, userId]) => ({ stage, user_id: userId }));

      await api.post(`/shops/${shop.id}/jobs/${params.id}/staff`, {
        assignments
      });
      
      const res = await api.get(`/shops/${shop.id}/jobs/${params.id}`);
      setJob(res.data.data);
      alert('Staff assigned successfully!');
    } catch (err: unknown) {
      console.error('Failed to update staff', err);
      alert('Failed to update staff assignments.');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleDelete = async () => {
    if (!shop || !job) return;
    setIsDeleting(true);
    try {
      await api.delete(`/shops/${shop.id}/jobs/${job.id}`);
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete job order.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#A8A19A]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading job order details...
      </div>
    );
  }

  if (!job) {
    return <div className="text-[#A8A19A]">Job Order not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <p className="text-[#827A73] text-sm mt-1">Manage lifecycle and financials</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#A8A19A] hover:text-[#B26959] transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Job Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#A8A19A] block mb-1">Customer</span>
                <span className="text-[#524A44] font-medium">{job.customer?.name}</span>
              </div>
              <div>
                <span className="text-[#A8A19A] block mb-1">Service</span>
                <span className="text-[#524A44] font-medium">{job.service?.name}</span>
              </div>
              <div>
                <span className="text-[#A8A19A] block mb-1">Assigned Staff</span>
                <span className="text-[#524A44] font-medium">{job.assigned_staff?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-[#A8A19A] block mb-1">Total Amount</span>
                <span className="text-[#524A44] font-medium">₱{parseFloat(job.total_amount as string).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-5">Production Timeline</h2>

            {(() => {
              const STAGES = [
                { key: 'pending',          label: 'Pending',     emoji: '🕐' },
                { key: 'cutting',          label: 'Cutting',     emoji: '✂️' },
                { key: 'sewing',           label: 'Sewing',      emoji: '🧵' },
                { key: 'fitting',          label: 'Fitting',     emoji: '📐' },
                { key: 'ready_for_pickup', label: 'Ready',       emoji: '📦' },
                { key: 'completed',        label: 'Completed',   emoji: '✅' },
              ];
              const cancelled = status === 'cancelled';
              const currentIdx = STAGES.findIndex(s => s.key === status);
              return (
                <div className="mb-6">
                  {cancelled ? (
                    <div className="flex items-center justify-center gap-3 py-4 bg-red-50 border border-red-200 rounded-xl">
                      <span className="text-xl">🚫</span>
                      <span className="text-sm font-semibold text-red-600">Order Cancelled</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {STAGES.map((stage, idx) => {
                        const isDone     = idx < currentIdx;
                        const isCurrent  = idx === currentIdx;
                        return (
                          <div key={stage.key} className="flex items-center flex-1 min-w-0">
                            <button
                              onClick={() => setStatus(stage.key)}
                              className="flex flex-col items-center gap-1.5 flex-1 min-w-0 group"
                              title={`Set to ${stage.label}`}
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all border-2 ${
                                isDone    ? 'bg-[#7A8B76] border-[#7A8B76] text-white' :
                                isCurrent ? 'bg-[#9A8073] border-[#9A8073] text-white shadow-lg ring-2 ring-[#9A8073]/30' :
                                            'bg-[#F0EAE3] border-[#EBE6E0] text-[#A8A19A] group-hover:border-[#9A8073]/40'
                              }`}>
                                {isDone ? '✓' : stage.emoji}
                              </div>
                              <span className={`text-[10px] font-medium text-center leading-tight px-0.5 ${
                                isCurrent ? 'text-[#9A8073]' : isDone ? 'text-[#7A8B76]' : 'text-[#A8A19A]'
                              }`}>
                                {stage.label}
                              </span>
                            </button>
                            {idx < STAGES.length - 1 && (
                              <div className={`h-0.5 shrink-0 w-3 ${idx < currentIdx ? 'bg-[#7A8B76]' : 'bg-[#EBE6E0]'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!cancelled && (
                    <div className="mt-4 px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl flex items-center justify-between">
                      <span className="text-xs text-[#A8A19A]">Current stage</span>
                      <span className="text-sm font-semibold text-[#9A8073]">
                        {STAGES.find(s => s.key === status)?.label ?? status}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#524A44]">Update Production Phase</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                >
                  <option value="pending">Pending</option>
                  <option value="cutting">Cutting</option>
                  <option value="sewing">Sewing</option>
                  <option value="fitting">Fitting</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-[#524A44]">Notes / Remarks</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                  placeholder="e.g. Needs adjustments on the sleeves..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Multi-Stage Staff Assignment</h2>
            <div className="space-y-4">
              {['cutting', 'sewing', 'finishing'].map(stage => (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#524A44] capitalize">{stage} Staff</label>
                    {staffAssignments[stage] && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        staffCompletions[stage] 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {staffCompletions[stage] ? 'Completed' : 'In Progress'}
                      </span>
                    )}
                  </div>
                  <select
                    value={staffAssignments[stage]}
                    onChange={(e) => setStaffAssignments({...staffAssignments, [stage]: e.target.value})}
                    className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                  >
                    <option value="">Unassigned</option>
                    {allStaff.map(staff => (
                      <option key={staff.id} value={staff.user.id}>{staff.user.name} ({staff.user.email})</option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="pt-2">
                <button
                  onClick={handleUpdateStaff}
                  disabled={savingStaff}
                  className="w-full bg-[#F0EAE3] hover:bg-[#EBE6E0] border border-[#D1C7BD] text-[#2D2A26] px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingStaff ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                  Save Staff Assignments
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Financials (POS)</h2>
            <div className="space-y-6">
              
              <div className="flex justify-between items-end border-b border-[#EBE6E0] pb-4">
                <div>
                  <div className="text-sm text-[#A8A19A] mb-1">Total Amount</div>
                  <div className="text-xl font-medium text-[#2D2A26]">₱{parseFloat(job.total_amount as string).toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#A8A19A] mb-1">Status</div>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shadow-sm uppercase tracking-wide
                    ${job.payment_status === 'paid' ? 'bg-[#7A8B76]/10 text-[#7A8B76] border border-[#7A8B76]/20' :
                    job.payment_status === 'partial' ? 'bg-[#BCA89F]/10 text-[#BCA89F] border border-[#BCA89F]/20' :
                    'bg-[#B26959]/10 text-[#B26959] border border-[#B26959]/20'
                  }`}>
                    {job.payment_status}
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF6F3] p-4 rounded-xl border border-[#EBE6E0]">
                <div className="text-sm text-[#A8A19A] mb-2">Remaining Balance</div>
                <div className="text-3xl font-bold text-taupe mb-4">
                  ₱{parseFloat(job.balance as string).toFixed(2)}
                </div>

                {parseFloat(job.balance as string) > 0 ? (
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const input = form.elements.namedItem('amount') as HTMLInputElement;
                      const amt = parseFloat(input.value);
                      if (!amt || amt <= 0) return;
                      
                      setSaving(true);
                      try {
                        await api.post(`/shops/${shop?.id}/jobs/${job.id}/pay`, { amount: amt });
                        const res = await api.get(`/shops/${shop?.id}/jobs/${job.id}`);
                        setJob(res.data.data);
                        setBalance(res.data.data.balance);
                        setPaymentStatus(res.data.data.payment_status);
                        input.value = '';
                        alert('Payment successfully logged!');
                      } catch(err: unknown) {
                        const error = err as { response?: { data?: { message?: string } } };
                        alert(error.response?.data?.message || 'Payment failed');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <label className="text-xs font-medium text-[#827A73] block">Log a Payment</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]">₱</span>
                        <input 
                          type="number" 
                          name="amount"
                          step="0.01" 
                          max={job.balance}
                          required
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-2 bg-white shadow-sm border border-[#D1C7BD] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={saving}
                        className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Charge
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-4 bg-[#7A8B76]/10 rounded-lg border border-[#7A8B76]/20 text-[#7A8B76] font-medium text-sm">
                    Fully Paid
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-[#524A44] text-sm">
            Are you sure you want to delete this job order? This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
            <button 
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting && <Loader2 size={16} className="animate-spin" />}
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
