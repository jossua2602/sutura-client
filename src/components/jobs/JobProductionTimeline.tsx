import React from 'react';
import { Job } from './jobTypes';

interface JobProductionTimelineProps {
  readonly job: Job;
  readonly status: string;
  readonly setStatus: (status: string) => void;
  readonly notes: string;
  readonly setNotes: (notes: string) => void;
  readonly fulfillmentType: 'shipping' | 'delivery' | 'pickup';
}

export default function JobProductionTimeline({
  job,
  status,
  setStatus,
  notes,
  setNotes,
  fulfillmentType,
}: JobProductionTimelineProps) {
  let STAGES: Array<{ key: string; label: string; emoji: string }> = [];
  
  if (job.intake_channel === 'online' || job.fulfillment_type === 'shipping' || job.fulfillment_type === 'delivery') {
    let dispatchedLabel = 'Shipped';
    let dispatchedEmoji = '🚚';
    if (fulfillmentType === 'pickup') {
      dispatchedLabel = 'Ready/Handed Over';
      dispatchedEmoji = '🛍️';
    } else if (fulfillmentType === 'delivery') {
      dispatchedLabel = 'Dispatched';
      dispatchedEmoji = '🛵';
    }
    STAGES = [
      { key: 'pending',          label: 'Pending',     emoji: '🕐' },
      { key: 'cutting',          label: 'Cutting',     emoji: '✂️' },
      { key: 'sewing',           label: 'Sewing',      emoji: '🧵' },
      { key: 'fitting',          label: 'Fitting',     emoji: '📐' },
      { key: 'packed',           label: 'Packed',      emoji: '📦' },
      { key: 'handed_to_courier',label: dispatchedLabel, emoji: dispatchedEmoji },
      { key: 'completed',        label: 'Completed',   emoji: '✅' },
    ];
  } else {
    STAGES = [
      { key: 'pending',          label: 'Pending',     emoji: '🕐' },
      { key: 'cutting',          label: 'Cutting',     emoji: '✂️' },
      { key: 'sewing',           label: 'Sewing',      emoji: '🧵' },
      { key: 'fitting',          label: 'Fitting',     emoji: '📐' },
      { key: 'ready_for_pickup', label: 'Ready',       emoji: '📦' },
      { key: 'completed',        label: 'Completed',   emoji: '✅' },
    ];
  }

  const cancelled = status === 'cancelled';
  const currentIdx = STAGES.findIndex(s => s.key === status);
  const prevStage = currentIdx > 0 ? STAGES[currentIdx - 1] : null;

  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
      <h2 className="text-lg font-medium text-[#2D2A26] mb-5">Production Timeline</h2>

      <div className="mb-6">
        {cancelled ? (
          <div className="flex items-center justify-center gap-3 py-4 bg-red-50 border border-red-200 rounded-xl">
            <span className="text-xl">🚫</span>
            <span className="text-sm font-semibold text-red-600">Order Cancelled</span>
          </div>
        ) : (
          <div className="flex items-center">
            {STAGES.map((stage, idx) => {
              const isDone = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              let iconClass = 'bg-[#F0EAE3] border-[#EBE6E0] text-[#A8A19A] group-hover:border-[#9A8073]/40';
              if (isDone) {
                iconClass = 'bg-[#7A8B76] border-[#7A8B76] text-white';
              } else if (isCurrent) {
                iconClass = 'bg-[#9A8073] border-[#9A8073] text-white shadow-lg ring-2 ring-[#9A8073]/30';
              }

              let labelColor = 'text-[#A8A19A]';
              if (isCurrent) {
                labelColor = 'text-[#9A8073]';
              } else if (isDone) {
                labelColor = 'text-[#7A8B76]';
              }

              return (
                <div key={stage.key} className="flex items-center flex-1 min-w-0">
                  <button
                    onClick={() => setStatus(stage.key)}
                    className="flex flex-col items-center gap-1.5 flex-1 min-w-0 group"
                    title={`Set to ${stage.label}`}
                    type="button"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all border-2 ${iconClass}`}>
                      {isDone ? '✓' : stage.emoji}
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight px-0.5 ${labelColor}`}>
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

      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="update-production-phase" className="text-sm font-medium text-[#524A44]">Update Production Phase</label>
          <select
            id="update-production-phase"
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
          >
            <option value="pending">Pending</option>
            <option value="cutting">Cutting</option>
            <option value="sewing">Sewing</option>
            <option value="fitting">Fitting</option>
            {(job.intake_channel === 'walk_in' && job.fulfillment_type === 'pickup') && (
              <option value="ready_for_pickup">Ready for Pickup</option>
            )}
            {(job.intake_channel === 'online' || job.fulfillment_type === 'shipping' || job.fulfillment_type === 'delivery') && (
              <>
                <option value="packed">Packed</option>
                <option value="handed_to_courier">
                  {(() => {
                    let courierLabel = 'Shipped / Handed to Courier';
                    if (fulfillmentType === 'delivery') courierLabel = 'Dispatched / Handed to Rider';
                    else if (fulfillmentType === 'pickup') courierLabel = 'Ready for Pickup / Handed Over';
                    return courierLabel;
                  })()}
                </option>
              </>
            )}
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        {prevStage && (
          <button
            type="button"
            onClick={() => setStatus(prevStage.key)}
            className="w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
          >
            ↩ Revert to Previous Stage ({prevStage.label})
          </button>
        )}

        <div className="space-y-1">
          <label htmlFor="notes-remarks" className="text-sm font-medium text-[#524A44]">Notes / Remarks</label>
          <textarea
            id="notes-remarks"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
            placeholder="e.g. Needs adjustments on the sleeves..."
          />
        </div>
      </div>
    </div>
  );
}
