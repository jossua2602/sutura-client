import React from 'react';

interface RentalStatusStepperProps {
  readonly status: string;
}

const STAGES: { key: string; label: string; emoji: string }[] = [
  { key: 'pending',                     label: 'Reserved',  emoji: '📝' },
  { key: 'ready',                       label: 'Ready',     emoji: '📦' },
  { key: 'out_for_delivery',            label: 'Released',  emoji: '🛍️' },
  { key: 'returned_pending_inspection', label: 'Returned',  emoji: '🔍' },
  { key: 'completed',                   label: 'Closed',    emoji: '✅' },
];

// Read-only progress indicator for the rental lifecycle — status changes only ever
// happen through the gated action buttons/forms elsewhere on the card, never here.
export default function RentalStatusStepper({ status }: RentalStatusStepperProps) {
  const currentIdx = STAGES.findIndex(s => s.key === status);

  return (
    <div className="flex items-center py-1">
      {STAGES.map((stage, idx) => {
        const isDone = currentIdx >= 0 && idx < currentIdx;
        const isCurrent = idx === currentIdx;

        let nodeClass = 'bg-[#F0EAE3] border-[#EBE6E0] text-[#A8A19A]';
        if (isDone) {
          nodeClass = 'bg-[#7A8B76] border-[#7A8B76] text-white';
        } else if (isCurrent) {
          nodeClass = 'bg-[#9A8073] border-[#9A8073] text-white shadow-sm ring-2 ring-[#9A8073]/30';
        }

        let labelClass = 'text-[#A8A19A]';
        if (isCurrent) labelClass = 'text-[#9A8073] font-semibold';
        else if (isDone) labelClass = 'text-[#7A8B76]';

        return (
          <div key={stage.key} className="flex items-center flex-1 min-w-0 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0" title={stage.label}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] border-2 transition-all ${nodeClass}`}>
                {isDone ? '✓' : stage.emoji}
              </div>
              <span className={`text-[9px] leading-none whitespace-nowrap ${labelClass}`}>{stage.label}</span>
            </div>
            {idx < STAGES.length - 1 && (
              <div className={`h-0.5 flex-1 min-w-[8px] mx-1 mb-3.5 ${idx < currentIdx ? 'bg-[#7A8B76]' : 'bg-[#EBE6E0]'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
