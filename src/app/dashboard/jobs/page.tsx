'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Search, Calendar, User, Scissors, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';

const COLUMNS = [
  { id: 'pending', title: 'Pending', color: 'bg-[#EBE6E0]/50', border: 'border-[#D1C7BD]' },
  { id: 'cutting', title: 'Cutting', color: 'bg-[#BCA89F]/10', border: 'border-[#BCA89F]/30' },
  { id: 'sewing', title: 'Sewing', color: 'bg-[#9A8073]/10', border: 'border-[#9A8073]/30' },
  { id: 'fitting', title: 'Fitting', color: 'bg-[#BAA195]/10', border: 'border-[#BAA195]/30' },
  { id: 'ready_for_pickup', title: 'Ready', color: 'bg-[#7A8B76]/10', border: 'border-[#7A8B76]/30' },
  { id: 'completed', title: 'Done', color: 'bg-[#9A8073]/10', border: 'border-[#9A8073]/30' }
];

interface Job {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  balance: number | string;
  customer?: { name: string };
  service?: { name: string };
  assigned_staff?: { name: string };
  deadline?: string;
}

export default function JobOrdersPage() {
  const { shop , user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shop) {
      api.get(`/shops/${shop.id}/jobs`)
        .then(res => {
          setJobs(res.data.data.data || res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user && !shop) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop, user]);

  const updateJobStatus = async (jobId: number, newStatus: string) => {
    if (!shop) return;
    const oldJobs = [...jobs];
    
    // Optimistic update
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    
    try {
      const jobToUpdate = jobs.find(j => j.id === jobId);
      if (!jobToUpdate) return;
      await api.put(`/shops/${shop.id}/jobs/${jobId}`, {
        status: newStatus,
        payment_status: jobToUpdate.payment_status,
        balance: jobToUpdate.balance,
      });
    } catch (err) {
      console.error('Failed to update status', err);
      setJobs(oldJobs); // Revert on failure
      alert('Failed to update job status. Please check your connection and try again.');
    }
  };

  const groupedJobs: Record<string, Job[]> = COLUMNS.reduce((acc: Record<string, Job[]>, col) => {
    acc[col.id] = jobs.filter(j => j.status === col.id) || [];
    return acc;
  }, {});

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/jobs/${deletingId}`);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      setJobs(jobs.filter(j => j.id !== deletingId));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete job order');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Production Pipeline</h1>
          <p className="text-[#827A73] text-sm mt-1">Track and manage your shops garment production workflow.</p>
        </div>
        <Link 
          href="/dashboard/jobs/new"
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Create Job Order
        </Link>
      </div>

      <div className="flex items-center gap-4 bg-white shadow-sm border border-[#EBE6E0] p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
          <input 
            type="text" 
            placeholder="Search by order number or customer..." 
            className="w-full pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading production pipeline...</div>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-4 items-start h-[calc(100vh-280px)]">
          {COLUMNS.map(col => (
            <div key={col.id} className={`flex-none w-80 glass-panel border ${col.border} rounded-2xl flex flex-col max-h-full`}>
              <div className={`p-4 border-b ${col.border} flex items-center justify-between ${col.color} rounded-t-2xl`}>
                <h3 className="font-semibold text-[#2D2A26] tracking-wide">{col.title}</h3>
                <span className="bg-white/60 text-[#2D2A26] text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
                  {groupedJobs[col.id].length}
                </span>
              </div>
              
              <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {groupedJobs[col.id].map(job => (
                  <Link href={`/dashboard/jobs/${job.id}`} key={job.id} className="block">
                    <div className="bg-white shadow-sm border border-[#D1C7BD] p-4 rounded-xl shadow-sm hover:border-[#9A8073]/50 transition-colors group cursor-pointer">
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold text-[#827A73]">{job.order_number}</span>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              setDeletingId(job.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1"
                          >
                            <Trash2 size={14} />
                          </button>
                          <select 
                            value={job.status}
                            onClick={(e) => e.preventDefault()} // Prevent clicking the link when selecting status
                            onChange={(e) => updateJobStatus(job.id, e.target.value)}
                            className="text-xs bg-[#F0EAE3] text-[#524A44] border border-[#D1C7BD] rounded p-1 focus:outline-none focus:ring-1 focus:ring-taupe"
                          >
                            {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                          </select>
                        </div>
                      </div>
                      
                      <h4 className="font-medium text-[#2D2A26] text-sm mb-1">{job.customer?.name}</h4>
                      <div className="flex items-center gap-1.5 text-xs text-[#827A73] mb-4">
                        <Scissors size={12} />
                        {job.service?.name}
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#EBE6E0]">
                        <div className="flex items-center gap-1.5 text-xs text-[#A8A19A]">
                          <User size={12} />
                          {job.assigned_staff?.name || 'Unassigned'}
                        </div>
                        {job.deadline && (
                          <div className="flex items-center gap-1.5 text-xs text-[#BCA89F]/80">
                            <Calendar size={12} />
                            {new Date(job.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                
                {groupedJobs[col.id].length === 0 && (
                  <div className="text-center py-6 text-[#827A73] border-2 border-dashed border-[#EBE6E0] rounded-xl">
                    <span className="text-sm">Empty</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
