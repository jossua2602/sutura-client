'use client';

import React from 'react';
import { Search, Loader2, Pencil, Trash2, Package as PackageIcon } from 'lucide-react';
import { ServicePackage } from './serviceHelpers';

interface ServicePackageListViewProps {
  readonly filteredPackages: ServicePackage[];
  readonly loading: boolean;
  readonly search: string;
  readonly onSearchChange: (val: string) => void;
  readonly onEdit: (pkg: ServicePackage) => void;
  readonly onDelete: (id: number) => void;
}

export default function ServicePackageListView({
  filteredPackages, loading, search, onSearchChange, onEdit, onDelete,
}: ServicePackageListViewProps) {
  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={16} />
        <input
          type="text"
          placeholder="Search packages..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-[#A8A19A]">
          <Loader2 size={24} className="animate-spin" />
        </div>
      ) : filteredPackages.length === 0 ? (
        <div className="text-center py-16 bg-[#FAF6F3]/50 border border-dashed border-[#EBE6E0] rounded-2xl">
          <PackageIcon size={28} className="mx-auto text-[#C5BDBA] mb-2" />
          <p className="text-sm text-[#827A73]">No packages yet. Bundle 2 or more services into a combo deal.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPackages.map(pkg => {
            const sumPrice = pkg.services.reduce((sum, s) => sum + (Number(s.base_price) || 0), 0);
            const displayPrice = pkg.bundle_price ? Number(pkg.bundle_price) : sumPrice;
            return (
              <div key={pkg.id} className="bg-white border border-[#EBE6E0] rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-taupe/10 text-taupe flex items-center justify-center shrink-0">
                      <PackageIcon size={16} />
                    </div>
                    <h3 className="font-semibold text-sm text-[#2D2A26] truncate">{pkg.name}</h3>
                  </div>
                  {!pkg.is_active && (
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F0EAE3] text-[#A8A19A]">
                      Inactive
                    </span>
                  )}
                </div>

                {pkg.description && (
                  <p className="text-xs text-[#827A73] line-clamp-2">{pkg.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {pkg.services.map(s => (
                    <span key={s.id} className="text-[11px] bg-[#FAF6F3] text-[#524A44] border border-[#EBE6E0] rounded-full px-2 py-0.5">
                      {s.name}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[#EBE6E0]">
                  <div>
                    <p className="text-sm font-bold text-[#2D2A26]">₱{displayPrice.toLocaleString()}</p>
                    {pkg.bundle_price && sumPrice > displayPrice && (
                      <p className="text-[11px] text-[#A8A19A] line-through">₱{sumPrice.toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(pkg)}
                      title="Edit"
                      className="p-1.5 text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#F0EAE3] rounded-lg transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(pkg.id)}
                      title="Delete"
                      className="p-1.5 text-[#A8A19A] hover:text-[#B26959] hover:bg-[#B26959]/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
