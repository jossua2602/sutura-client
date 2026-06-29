import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Specialization, getCategoryIcon } from './specializationHelpers';

interface SpecializationListViewProps {
  readonly specializations: Specialization[];
  readonly loading: boolean;
  readonly onEdit: (spec: Specialization) => void;
  readonly onDelete: (id: number) => void;
}

export default function SpecializationListView({
  specializations,
  loading,
  onEdit,
  onDelete,
}: SpecializationListViewProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-[#524A44]">
        <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
          <tr>
            <th className="px-6 py-4 font-medium">Category</th>
            <th className="px-6 py-4 font-medium">Specialization</th>
            <th className="px-6 py-4 font-medium">Starting Price</th>
            <th className="px-6 py-4 font-medium">Sewing Time</th>
            <th className="px-6 py-4 font-medium">Min Qty</th>
            <th className="px-6 py-4 font-medium">Status</th>
            <th className="px-6 py-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#EBE6E0]">
          {loading && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-[#A8A19A]">
                Loading specializations...
              </td>
            </tr>
          )}
          {!loading && specializations.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-[#A8A19A]">
                No specializations declared yet.
              </td>
            </tr>
          )}
          {!loading &&
            specializations.map(spec => {
              const CatIcon = getCategoryIcon(spec.category);
              return (
                <tr key={spec.id} className="hover:bg-[#F0EAE3]/20 transition-colors">
                  <td className="px-6 py-4">
                    {spec.category ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#524A44] bg-[#F0EAE3] px-2.5 py-1 rounded-full">
                        <CatIcon size={12} className="shrink-0 text-[#9A8073]" />
                        {spec.category}
                      </span>
                    ) : (
                      <span className="text-[#C5BDBA] text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F0EAE3] flex items-center justify-center text-[#827A73] shrink-0">
                        <CatIcon size={15} />
                      </div>
                      <span className="font-medium text-[#2D2A26]">{spec.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-[#2D2A26]">
                    {spec.starting_price && spec.starting_price > 0
                      ? `₱${Number(spec.starting_price).toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                        })}`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-[#827A73]">
                    {spec.production_time_days && spec.production_time_days > 0
                      ? `${spec.production_time_days} days`
                      : '—'}
                  </td>
                  <td className="px-6 py-4 text-[#827A73]">
                    {spec.min_order_qty ? `${spec.min_order_qty} pcs` : '1 pc'}
                  </td>
                  <td className="px-6 py-4">
                    {spec.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-zinc-500/10 text-[#827A73] border-zinc-500/20">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(spec)}
                        className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(spec.id)}
                        className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
