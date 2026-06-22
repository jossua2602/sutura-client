'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Search, Store, ShoppingBag, AlertCircle, Truck, Scissors } from 'lucide-react';
import Link from 'next/link';

import { Job, Tab, WALKIN_COLUMNS, ONLINE_COLUMNS, ALL_COLUMNS } from '@/components/jobs/jobHelpers';
import JobRejectModal from '@/components/jobs/JobRejectModal';
import JobKanbanBoard from '@/components/jobs/JobKanbanBoard';

export default function JobOrdersPage() {
  const { shop, user } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  // Review gate state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingJobId, setRejectingJobId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

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
    } else if (user) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop, user]);

  const updateJobStatus = async (jobId: number, newStatus: string) => {
    if (!shop) return;
    const oldJobs = [...jobs];
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
      setJobs(oldJobs);
    }
  };

  const handleApproveJob = async (jobId: number) => {
    if (!shop) return;
    setActionLoadingId(jobId);
    const old = [...jobs];
    setJobs(jobs.map(j => j.id === jobId ? { ...j, status: 'cutting' } : j));
    try {
      const job = jobs.find(j => j.id === jobId);
      if (!job) return;
      await api.put(`/shops/${shop.id}/jobs/${jobId}`, { status: 'cutting', payment_status: job.payment_status, balance: job.balance });
    } catch {
      setJobs(old);
      alert('Failed to approve order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (jobId: number) => {
    setRejectingJobId(jobId);
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (reason: string) => {
    if (!shop || !rejectingJobId) return;
    setActionLoadingId(rejectingJobId);
    const old = [...jobs];
    setJobs(jobs.map(j => j.id === rejectingJobId ? { ...j, status: 'cancelled' } : j));
    try {
      const job = jobs.find(j => j.id === rejectingJobId);
      if (!job) return;
      // We pass the reason optional payload if the backend supports it, otherwise standard properties
      await api.put(`/shops/${shop.id}/jobs/${rejectingJobId}`, { 
        status: 'cancelled', 
        payment_status: job.payment_status, 
        balance: job.balance,
        rejection_reason: reason || null 
      });
      setRejectModalOpen(false);
      setRejectingJobId(null);
    } catch {
      setJobs(old);
      alert('Failed to reject order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const activeColumns = tab === 'online' ? ONLINE_COLUMNS : tab === 'walk_in' ? WALKIN_COLUMNS : ALL_COLUMNS;

  const filteredJobs = jobs.filter(j => {
    const matchType = tab === 'all' || j.order_type === tab;
    const matchSearch = !search
      || j.order_number?.toLowerCase().includes(search.toLowerCase())
      || j.customer?.name?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const groupedJobs = activeColumns.reduce((acc, col) => {
    acc[col.id] = filteredJobs.filter(j => j.status === col.id);
    return acc;
  }, {} as Record<string, Job[]>);

  const walkInCount = jobs.filter(j => j.order_type === 'walk_in').length;
  const onlineCount = jobs.filter(j => j.order_type === 'online').length;
  const pendingReviewCount = jobs.filter(j => j.status === 'pending').length;

  return (
    <div className="space-y-5 h-full flex flex-col text-[#2D2A26]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Production Pipeline</h1>
          <p className="text-[#827A73] text-sm mt-1">Track and manage garment production — Walk-in and Online orders.</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Create Job Order
        </Link>
      </div>

      {pendingReviewCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">
              {pendingReviewCount} job order{pendingReviewCount !== 1 ? 's' : ''} awaiting feasibility review
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Review each pending order and approve it into production or reject it.</p>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
        <div className="flex items-center border-b border-[#EBE6E0] flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setTab('all')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === 'all'
                ? 'border-taupe text-taupe'
                : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
            }`}
          >
            <span>All Orders</span>
            <span className="bg-[#F0EAE3] text-[#827A73] text-xs px-2 py-0.5 rounded-full font-semibold ml-1">{jobs.length}</span>
          </button>
          <button
            onClick={() => setTab('walk_in')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === 'walk_in'
                ? 'border-taupe text-taupe'
                : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
            }`}
          >
            <Store size={15} />
            <span>Walk-in</span>
            <span className="bg-[#F0EAE3] text-[#827A73] text-xs px-2 py-0.5 rounded-full font-semibold ml-1">{walkInCount}</span>
          </button>
          <button
            onClick={() => setTab('online')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === 'online'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
            }`}
          >
            <ShoppingBag size={15} />
            Online
            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full font-semibold">{onlineCount}</span>
          </button>

          <div className="ml-auto pr-4 py-2 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={16} />
              <input
                type="text"
                placeholder="Search order or customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-1.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
              />
            </div>
          </div>
        </div>

        {tab === 'online' && (
          <div className="px-5 py-2.5 bg-blue-50/60 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-700">
            <Truck size={13} />
            <span>Online production flow: <strong>Pending → Cutting → Sewing → Fitting → Ready for Pickup → Completed</strong>.</span>
          </div>
        )}

        {tab === 'walk_in' && (
          <div className="px-5 py-2.5 bg-[#FAF6F3] border-b border-[#EBE6E0] flex items-center gap-2 text-xs text-[#827A73]">
            <Scissors size={13} />
            <span>Walk-in production flow: <strong>Pending → Cutting → Sewing → Fitting → Ready for Pickup → Completed</strong>.</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading production pipeline...</div>
      ) : (
        <JobKanbanBoard
          groupedJobs={groupedJobs}
          activeColumns={activeColumns}
          actionLoadingId={actionLoadingId}
          onUpdateStatus={updateJobStatus}
          onApprove={handleApproveJob}
          onReject={openRejectModal}
        />
      )}

      <JobRejectModal
        isOpen={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setRejectingJobId(null);
        }}
        onConfirm={handleConfirmReject}
        actionLoading={actionLoadingId !== null}
      />
    </div>
  );
}
