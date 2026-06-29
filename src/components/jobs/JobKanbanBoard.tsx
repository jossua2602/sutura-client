import React from 'react';
import Link from 'next/link';
import { User, Calendar, Scissors, Check, X, Loader2 } from 'lucide-react';
import { Job as JobItem, WALKIN_COLUMNS, getDueStatus, TypeBadge, CourierTag, ColumnIcon } from './jobHelpers';

interface JobKanbanBoardProps {
  readonly groupedJobs: Record<string, JobItem[]>;
  readonly activeColumns: typeof WALKIN_COLUMNS;
  readonly actionLoadingId: number | null;
  readonly onUpdateStatus: (id: number, status: string) => void;
  readonly onApprove: (id: number) => void;
  readonly onReject: (id: number) => void;
}

export default function JobKanbanBoard({
  groupedJobs,
  activeColumns,
  actionLoadingId,
  onUpdateStatus,
  onApprove,
  onReject,
}: JobKanbanBoardProps) {
  return (
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
              <div key={job.id}>
                <div className={`bg-white border p-3.5 rounded-xl hover:shadow-sm transition-all group relative ${
                  job.status === 'pending' ? 'border-amber-200 hover:border-amber-300' : 'border-[#D1C7BD] hover:border-[#9A8073]/50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/dashboard/jobs/${job.id}`} className="block">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold text-[#827A73] hover:underline">{job.order_number || `#${job.id}`}</span>
                        <TypeBadge type={job.order_type} />
                      </div>
                    </Link>
                    <select
                      value={job.status}
                      onChange={(e) => onUpdateStatus(job.id, e.target.value)}
                      className="text-[10px] bg-[#F0EAE3] text-[#524A44] border border-[#D1C7BD] rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none cursor-pointer"
                    >
                      {WALKIN_COLUMNS.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>

                  <Link href={`/dashboard/jobs/${job.id}`} className="block space-y-1.5">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className="font-semibold text-[#2D2A26] text-sm truncate">{job.customer?.name || 'Walk-in'}</h4>
                      {(() => {
                        let payBadge = 'bg-[#B26959]/15 text-[#B26959] border-[#B26959]/20';
                        if (job.payment_status === 'paid') payBadge = 'bg-[#7A8B76]/15 text-[#7A8B76] border-[#7A8B76]/20';
                        else if (job.payment_status === 'partial') payBadge = 'bg-[#BCA89F]/15 text-[#BCA89F] border-[#BCA89F]/20';
                        return (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm border uppercase shrink-0 ${payBadge}`}>
                            {job.payment_status}
                          </span>
                        );
                      })()}
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-[#827A73]">
                      <Scissors size={11} />
                      {job.service?.name || 'Custom Sew'}
                    </div>

                    {Number.parseFloat(job.balance as string || '0') > 0 && (
                      <div className="text-[10px] font-medium text-[#B26959] mt-1">
                        Bal: ₱{Number.parseFloat(job.balance as string).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                    )}

                    <CourierTag job={job} />
                  </Link>

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

                  {/* Feasibility Review Gate (Pending only) */}
                  {job.status === 'pending' && (
                    <div className="mt-3 pt-2.5 border-t border-amber-100 flex items-center gap-2">
                      {actionLoadingId === job.id ? (
                        <div className="flex-1 flex justify-center"><Loader2 size={14} className="animate-spin text-amber-500" /></div>
                      ) : (
                        <>
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); onApprove(job.id); }}
                            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg bg-[#7A8B76]/15 text-[#7A8B76] border border-[#7A8B76]/25 hover:bg-[#7A8B76]/25 transition-colors"
                          >
                            <Check size={11} /> Approve
                          </button>
                          <button
                            onClick={e => { e.preventDefault(); e.stopPropagation(); onReject(job.id); }}
                            className="flex-1 flex items-center justify-center gap-1 text-[10px] font-bold py-1.5 rounded-lg bg-[#B26959]/10 text-[#B26959] border border-[#B26959]/20 hover:bg-[#B26959]/20 transition-colors"
                          >
                            <X size={11} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  )}

                </div>
              </div>
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
  );
}
