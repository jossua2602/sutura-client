'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Plus, Search, Calendar, User, Scissors, Package, Truck, Store, ShoppingBag,
  Check, X, AlertCircle, Loader2, PauseCircle, Navigation
} from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import { parseCourierName, formatFulfillmentLabel } from '@/lib/fulfillment';

// --- Walk-in pipeline ---
const WALKIN_COLUMNS = [
  { id: 'pending',          title: 'Pending',          color: 'bg-[#EBE6E0]/50',   border: 'border-[#D1C7BD]' },
  { id: 'on_hold',          title: 'On Hold',          color: 'bg-slate-50/80',     border: 'border-slate-200' },
  { id: 'cutting',          title: 'Cutting',          color: 'bg-amber-50/50',     border: 'border-amber-200/50' },
  { id: 'sewing',           title: 'Sewing',           color: 'bg-orange-50/50',    border: 'border-orange-200/50' },
  { id: 'fitting',          title: 'Fitting',          color: 'bg-violet-50/50',    border: 'border-violet-200/50' },
  { id: 'ready_for_pickup', title: 'Ready for Pickup', color: 'bg-emerald-50/50',   border: 'border-emerald-200/50' },
  { id: 'completed',        title: 'Completed',        color: 'bg-[#9A8073]/10',    border: 'border-[#9A8073]/30' },
];

// --- Online order pipeline ---
const ONLINE_COLUMNS = [
  { id: 'pending',            title: 'Pending',              color: 'bg-[#EBE6E0]/50',  border: 'border-[#D1C7BD]' },
  { id: 'on_hold',            title: 'On Hold',              color: 'bg-slate-50/80',    border: 'border-slate-200' },
  { id: 'cutting',            title: 'Production',           color: 'bg-amber-50/50',    border: 'border-amber-200/50' },
  { id: 'packed',             title: 'Packed',               color: 'bg-blue-50/50',     border: 'border-blue-200/50' },
  { id: 'handed_to_courier',  title: 'Dispatched / Sent',    color: 'bg-indigo-50/50',   border: 'border-indigo-200/50' },
  { id: 'completed',          title: 'Completed / Delivered',color: 'bg-emerald-50/50',  border: 'border-emerald-200/50' },
];

interface Job {
  id: number;
  order_number?: string;
  order_type: 'walk_in' | 'online';
  courier_name?: string | null;
  courier_tracking_number?: string | null;
  status: string;
  payment_status: string;
  balance: number | string;
  customer?: { name: string } | null;
  service?: { name: string } | null;
  assigned_staff?: { name: string } | null;
  due_date?: string | null;
}

type Tab = 'all' | 'walk_in' | 'online';

const getDueStatus = (dueDateStr: string | null | undefined, status: string) => {
  if (!dueDateStr) return null;
  if (['completed', 'cancelled'].includes(status)) return null;

  const dueDate = new Date(dueDateStr);
  const today = new Date();
  
  const dueTime = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  
  if (dueTime < todayTime) {
    return { label: 'Overdue', className: 'bg-[#B26959]/10 text-[#B26959] border-[#B26959]/20' };
  }
  
  const diffTime = dueTime - todayTime;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 2) {
    return { label: 'Due Soon', className: 'bg-amber-50 text-amber-600 border-amber-200' };
  }
  
  return null;
};

function TypeBadge({ type }: { readonly type: string }) {
  if (type === 'online') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
        <ShoppingBag size={9} /> Online
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#F0EAE3] text-[#827A73] px-1.5 py-0.5 rounded">
      <Store size={9} /> Walk-in
    </span>
  );
}

function CourierTag({ job }: { readonly job: Job }) {
  if (job.order_type !== 'online') return null;
  
  const { type, name } = parseCourierName(job.courier_name);
  const displayLabel = formatFulfillmentLabel(type, name);

  let Icon = Truck;
  if (type === 'delivery') Icon = Navigation;
  if (type === 'pickup') Icon = Store;

  const isLink = job.courier_tracking_number?.startsWith('http://') || job.courier_tracking_number?.startsWith('https://');

  return (
    <div className="flex items-center gap-1 text-[10px] text-[#827A73] mt-1 flex-wrap">
      <Icon size={10} className="shrink-0" />
      <span className="font-medium">{displayLabel}</span>
      {job.courier_tracking_number && (
        <>
          <span className="text-[#A8A19A]">•</span>
          {isLink ? (
            <a
              href={job.courier_tracking_number}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5"
              onClick={e => e.stopPropagation()}
            >
              Track ↗
            </a>
          ) : (
            <span className="text-[#BCA89F] font-mono">#{job.courier_tracking_number}</span>
          )}
        </>
      )}
    </div>
  );
}

function ColumnIcon({ id }: { readonly id: string }) {
  switch (id) {
    case 'on_hold':
      return <PauseCircle size={14} className="text-slate-500" />;
    case 'handed_to_courier':
      return <Truck size={14} className="text-indigo-500" />;
    case 'packed':
      return <Package size={14} className="text-blue-500" />;
    case 'ready_for_pickup':
      return <Store size={14} className="text-emerald-600" />;
    case 'completed':
      return <Scissors size={14} className="text-[#9A8073]" />;
    default:
      return null;
  }
}

export default function JobOrdersPage() {
  const { shop } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  // Review gate state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingJobId, setRejectingJobId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
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
    }
  }, [shop]);

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

  // ── Feasibility Review Actions ────────────────────────────────────────────
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
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!shop || !rejectingJobId) return;
    setActionLoadingId(rejectingJobId);
    const old = [...jobs];
    setJobs(jobs.map(j => j.id === rejectingJobId ? { ...j, status: 'cancelled' } : j));
    try {
      const job = jobs.find(j => j.id === rejectingJobId);
      if (!job) return;
      await api.put(`/shops/${shop.id}/jobs/${rejectingJobId}`, { status: 'cancelled', payment_status: job.payment_status, balance: job.balance });
      setRejectModalOpen(false);
      setRejectingJobId(null);
    } catch {
      setJobs(old);
      alert('Failed to reject order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Determine which columns to show
  let activeColumns;
  if (tab === 'online') {
    activeColumns = ONLINE_COLUMNS;
  } else if (tab === 'walk_in') {
    activeColumns = WALKIN_COLUMNS;
  } else {
    activeColumns = [
      ...WALKIN_COLUMNS,
      ...ONLINE_COLUMNS.filter(c => !WALKIN_COLUMNS.some(w => w.id === c.id))
    ];
  }

  // Filter jobs by tab and search
  const filteredJobs = jobs.filter(j => {
    const matchType = tab === 'all' || j.order_type === tab;
    const matchSearch = !search
      || j.order_number?.toLowerCase().includes(search.toLowerCase())
      || j.customer?.name?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Group by status
  const groupedJobs = activeColumns.reduce((acc, col) => {
    // For online tab, "cutting" column also includes sewing/fitting (production stages)
    if (tab === 'online' && col.id === 'cutting') {
      acc[col.id] = filteredJobs.filter(j => ['cutting', 'sewing', 'fitting'].includes(j.status));
    } else {
      acc[col.id] = filteredJobs.filter(j => j.status === col.id);
    }
    return acc;
  }, {} as Record<string, Job[]>);

  const walkInCount = jobs.filter(j => j.order_type === 'walk_in').length;
  const onlineCount = jobs.filter(j => j.order_type === 'online').length;
  const pendingReviewCount = jobs.filter(j => j.status === 'pending').length;

  return (
    <div className="space-y-5 h-full flex flex-col">
      {/* Header */}
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

      {/* Pending Review Banner */}
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

      {/* Tab Bar + Search */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center border-b border-[#EBE6E0]">
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

          {/* Search */}
          <div className="ml-auto pr-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={16} />
              <input
                type="text"
                placeholder="Search order or customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-64 pl-9 pr-4 py-1.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
              />
            </div>
          </div>
        </div>

        {tab === 'online' && (
          <div className="px-5 py-2.5 bg-blue-50/60 border-b border-blue-100 flex items-center gap-2 text-xs text-blue-700">
            <Truck size={13} />
            <span>Online orders flow: <strong>Pending → Production → Packed → Handed to Courier → Completed</strong>. Update courier info in the order detail page.</span>
          </div>
        )}

        {/* Walk-in workflow explainer */}
        {tab === 'walk_in' && (
          <div className="px-5 py-2.5 bg-[#FAF6F3] border-b border-[#EBE6E0] flex items-center gap-2 text-xs text-[#827A73]">
            <Scissors size={13} />
            <span>Walk-in orders flow: <strong>Pending → Cutting → Sewing → Fitting → Ready for Pickup → Completed</strong>.</span>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading production pipeline...</div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start" style={{ minHeight: 'calc(100vh - 340px)' }}>
          {activeColumns.map(col => (
            <div
              key={col.id}
              className={`flex-none w-72 glass-panel border ${col.border} rounded-2xl flex flex-col`}
              style={{ maxHeight: 'calc(100vh - 340px)' }}
            >
              {/* Column Header */}
              <div className={`px-4 py-3 border-b ${col.border} flex items-center justify-between ${col.color} rounded-t-2xl`}>
                <div className="flex items-center gap-2">
                  <ColumnIcon id={col.id} />
                  <h3 className="font-semibold text-[#2D2A26] text-sm">{col.title}</h3>
                </div>
                <span className="bg-white/70 text-[#2D2A26] text-xs px-2 py-0.5 rounded-full font-semibold shadow-sm">
                  {groupedJobs[col.id]?.length ?? 0}
                </span>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {groupedJobs[col.id]?.map(job => (
                  <Link href={`/dashboard/jobs/${job.id}`} key={job.id} className="block">
                    <div className={`bg-white border p-3.5 rounded-xl hover:shadow-sm transition-all group cursor-pointer ${
                      job.status === 'pending' ? 'border-amber-200 hover:border-amber-300' : 'border-[#D1C7BD] hover:border-[#9A8073]/50'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-xs font-bold text-[#827A73]">{job.order_number}</span>
                            <TypeBadge type={job.order_type} />
                          </div>
                        </div>
                        <select
                          value={job.status}
                          onClick={(e) => e.preventDefault()}
                          onChange={(e) => { e.preventDefault(); updateJobStatus(job.id, e.target.value); }}
                          className="text-[10px] bg-[#F0EAE3] text-[#524A44] border border-[#D1C7BD] rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none cursor-pointer"
                        >
                          {job.order_type === 'online' ? (
                            ONLINE_COLUMNS.map(c => {
                              let optionTitle = c.title;
                              if (c.id === 'handed_to_courier') {
                                const { type } = parseCourierName(job.courier_name);
                                if (type === 'delivery') optionTitle = 'Dispatched / Handed to Rider';
                                if (type === 'pickup') optionTitle = 'Ready for Pickup / Handed Over';
                                if (type === 'shipping') optionTitle = 'Shipped / Handed to Courier';
                              }
                              return (
                                <option key={c.id} value={c.id}>{optionTitle}</option>
                              );
                            })
                          ) : (
                            WALKIN_COLUMNS.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))
                          )}
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h4 className="font-semibold text-[#2D2A26] text-sm truncate">{job.customer?.name}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border uppercase shrink-0 ${
                          job.payment_status === 'paid' ? 'bg-[#7A8B76]/15 text-[#7A8B76] border-[#7A8B76]/20' :
                          job.payment_status === 'partial' ? 'bg-[#BCA89F]/15 text-[#BCA89F] border-[#BCA89F]/20' :
                          'bg-[#B26959]/15 text-[#B26959] border-[#B26959]/20'
                        }`}>
                          {job.payment_status}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5 text-xs text-[#827A73]">
                        <Scissors size={11} />
                        {job.service?.name}
                      </div>

                      {Number.parseFloat(job.balance as string || '0') > 0 && (
                        <div className="text-[10px] font-medium text-[#B26959] mt-1">
                          Bal: ₱{Number.parseFloat(job.balance as string).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      )}

                      <CourierTag job={job} />

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#EBE6E0]">
                        <div className="flex items-center gap-1 text-xs text-[#A8A19A]">
                          <User size={11} />
                          {job.assigned_staff?.name || 'Unassigned'}
                        </div>
                        {job.due_date && (
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <div className="flex items-center gap-1 text-xs text-[#BCA89F]/80">
                              <Calendar size={11} />
                              {new Date(job.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </div>
                            {(() => {
                              const dueStatus = getDueStatus(job.due_date, job.status);
                              if (!dueStatus) return null;
                              return (
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm border uppercase tracking-wider ${dueStatus.className}`}>
                                  {dueStatus.label}
                                </span>
                              );
                            })()}
                          </div>
                        )}
                      </div>

                      {/* ── Feasibility Review Gate (Pending only) ─────────── */}
                      {job.status === 'pending' && (
                        <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center gap-2">
                          {actionLoadingId === job.id ? (
                            <div className="flex-1 flex justify-center"><Loader2 size={14} className="animate-spin text-amber-500" /></div>
                          ) : (
                            <>
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); handleApproveJob(job.id); }}
                                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg bg-[#7A8B76]/15 text-[#7A8B76] border border-[#7A8B76]/25 hover:bg-[#7A8B76]/25 transition-colors"
                              >
                                <Check size={11} /> Approve
                              </button>
                              <button
                                onClick={e => { e.preventDefault(); e.stopPropagation(); openRejectModal(job.id); }}
                                className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg bg-[#B26959]/10 text-[#B26959] border border-[#B26959]/20 hover:bg-[#B26959]/20 transition-colors"
                              >
                                <X size={11} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {/* ── On Hold actions ───────────────────────────────── */}
                      {job.status === 'on_hold' && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center gap-2">
                          {actionLoadingId === job.id ? (
                            <div className="flex-1 flex justify-center"><Loader2 size={14} className="animate-spin text-slate-400" /></div>
                          ) : (
                            <button
                              onClick={e => { e.preventDefault(); e.stopPropagation(); updateJobStatus(job.id, 'cutting'); }}
                              className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg bg-[#7A8B76]/10 text-[#7A8B76] border border-[#7A8B76]/20 hover:bg-[#7A8B76]/20 transition-colors"
                            >
                              <Check size={11} /> Resume to Production
                            </button>
                          )}
                        </div>
                      )}

                      {/* ── Place On Hold (active production stages only) ── */}
                      {['cutting', 'sewing', 'fitting', 'ready_for_pickup'].includes(job.status) && (
                        <div className="mt-2 flex">
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); updateJobStatus(job.id, 'on_hold'); }}
                            className="flex items-center gap-1 text-[9px] font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 px-2 py-1 rounded-md transition-colors border border-transparent hover:border-slate-200"
                          >
                            <PauseCircle size={10} /> Place On Hold
                          </button>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}

                {(groupedJobs[col.id]?.length ?? 0) === 0 && (
                  <div className="text-center py-8 text-[#827A73] border-2 border-dashed border-[#EBE6E0] rounded-xl">
                    <span className="text-xs">No orders here</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Reject Order Modal ──────────────────────────────────────────────── */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Job Order">
        <div className="space-y-4">
          <p className="text-sm text-[#524A44]">
            Are you sure you want to reject this order? It will be moved to <strong>Cancelled</strong>.
          </p>
          <div>
            <label htmlFor="reject-reason" className="block text-sm font-medium text-[#524A44] mb-1.5">Reason for Rejection <span className="text-[#A8A19A] font-normal">(optional)</span></label>
            <textarea
              id="reject-reason"
              rows={3}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Materials not available, fully booked this week..."
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] resize-none"
            />
          </div>
          <div className="pt-1 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmReject}
              disabled={actionLoadingId !== null}
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
            >
              {actionLoadingId !== null && <Loader2 size={14} className="animate-spin" />}
              Confirm Rejection
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
