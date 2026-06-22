import React from 'react';
import { Truck, Store, ShoppingBag, Navigation, Scissors } from 'lucide-react';
import { parseCourierName, formatFulfillmentLabel } from '@/lib/fulfillment';

export const WALKIN_COLUMNS = [
  { id: 'pending',          title: 'Pending',          color: 'bg-[#EBE6E0]/50',   border: 'border-[#D1C7BD]' },
  { id: 'cutting',          title: 'Cutting',          color: 'bg-amber-50/50',     border: 'border-amber-200/50' },
  { id: 'sewing',           title: 'Sewing',           color: 'bg-orange-50/50',    border: 'border-orange-200/50' },
  { id: 'fitting',          title: 'Fitting',          color: 'bg-violet-50/50',    border: 'border-violet-200/50' },
  { id: 'ready_for_pickup', title: 'Ready for Pickup', color: 'bg-emerald-50/50',   border: 'border-emerald-200/50' },
  { id: 'completed',        title: 'Completed',        color: 'bg-[#9A8073]/10',    border: 'border-[#9A8073]/30' },
];

export const ONLINE_COLUMNS = [
  { id: 'pending',          title: 'Pending',          color: 'bg-[#EBE6E0]/50',   border: 'border-[#D1C7BD]' },
  { id: 'cutting',          title: 'Cutting',          color: 'bg-amber-50/50',     border: 'border-amber-200/50' },
  { id: 'sewing',           title: 'Sewing',           color: 'bg-orange-50/50',    border: 'border-orange-200/50' },
  { id: 'fitting',          title: 'Fitting',          color: 'bg-violet-50/50',    border: 'border-violet-200/50' },
  { id: 'packed',           title: 'Packed',           color: 'bg-indigo-50/50',    border: 'border-indigo-200/50' },
  { id: 'handed_to_courier',title: 'Handed Over',      color: 'bg-cyan-50/50',      border: 'border-cyan-200/50' },
  { id: 'completed',        title: 'Completed',        color: 'bg-[#9A8073]/10',    border: 'border-[#9A8073]/30' },
];

export const ALL_COLUMNS = [
  { id: 'pending',          title: 'Pending',          color: 'bg-[#EBE6E0]/50',   border: 'border-[#D1C7BD]' },
  { id: 'cutting',          title: 'Cutting',          color: 'bg-amber-50/50',     border: 'border-amber-200/50' },
  { id: 'sewing',           title: 'Sewing',           color: 'bg-orange-50/50',    border: 'border-orange-200/50' },
  { id: 'fitting',          title: 'Fitting',          color: 'bg-violet-50/50',    border: 'border-violet-200/50' },
  { id: 'ready_for_pickup', title: 'Ready for Pickup', color: 'bg-emerald-50/50',   border: 'border-emerald-200/50' },
  { id: 'packed',           title: 'Packed',           color: 'bg-indigo-50/50',    border: 'border-indigo-200/50' },
  { id: 'handed_to_courier',title: 'Handed Over',      color: 'bg-cyan-50/50',      border: 'border-cyan-200/50' },
  { id: 'completed',        title: 'Completed',        color: 'bg-[#9A8073]/10',    border: 'border-[#9A8073]/30' },
];

export interface Job {
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

export type Tab = 'all' | 'walk_in' | 'online';

export const getDueStatus = (dueDateStr: string | null | undefined, status: string) => {
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

export function TypeBadge({ type }: { readonly type: string }) {
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

export function CourierTag({ job }: { readonly job: Job }) {
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

export function ColumnIcon({ id }: { readonly id: string }) {
  switch (id) {
    case 'ready_for_pickup':
      return <Store size={14} className="text-emerald-600" />;
    case 'packed':
      return <ShoppingBag size={14} className="text-indigo-600" />;
    case 'handed_to_courier':
      return <Truck size={14} className="text-cyan-600" />;
    case 'completed':
      return <Scissors size={14} className="text-[#9A8073]" />;
    default:
      return null;
  }
}
