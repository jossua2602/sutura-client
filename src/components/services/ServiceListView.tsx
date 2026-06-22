import React from 'react';
import { Search, Layers, Loader2, Copy, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { Service } from './serviceHelpers';

interface ServiceListViewProps {
  services: Service[];
  filteredServices: Service[];
  loading: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  allCategories: string[];
  actionLoadingId: number | null;
  onDuplicate: (service: Service) => Promise<void>;
  onManagePricing: (service: Service) => void;
  onEdit: (service: Service) => void;
  onDelete: (id: number) => void;
}

export default function ServiceListView({
  services,
  filteredServices,
  loading,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  allCategories,
  actionLoadingId,
  onDuplicate,
  onManagePricing,
  onEdit,
  onDelete,
}: ServiceListViewProps) {
  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden text-[#2D2A26]">
      <div className="p-4 border-b border-[#EBE6E0] flex items-center justify-between bg-white">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
          <input
            type="text"
            placeholder="Search services by name or category..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
          />
        </div>
        <div className="text-sm text-[#827A73] font-medium">
          Total Services: {services.length}
        </div>
      </div>

      {allCategories.length > 1 && (
        <div className="flex gap-2 px-4 py-3 border-b border-[#EBE6E0] overflow-x-auto">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryFilterChange(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-[#9A8073] text-white'
                  : 'bg-[#F0EAE3] text-[#827A73] hover:bg-[#EBE6E0]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-[#524A44]">
          <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
            <tr>
              <th className="px-6 py-4 font-medium">Service Name</th>
              <th className="px-6 py-4 font-medium">Description</th>
              <th className="px-6 py-4 font-medium">Pricing Matrix</th>
              <th className="px-6 py-4 font-medium">Est. Days</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EBE6E0]">
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[#A8A19A]">
                  Loading services...
                </td>
              </tr>
            )}
            {!loading && filteredServices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-[#A8A19A] text-sm">
                  {categoryFilter === 'All'
                    ? 'No services yet. Click "Add Service" to create one.'
                    : `No services in "${categoryFilter}" category.`}
                </td>
              </tr>
            )}
            {!loading && filteredServices.length > 0 && (
              filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-[#F0EAE3]/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F0EAE3] flex items-center justify-center text-[#827A73]">
                        <Layers size={16} />
                      </div>
                      <span className="font-medium text-[#2D2A26]">{service.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#827A73] max-w-xs truncate">
                    {service.description || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[#524A44] font-medium">Base: ₱{Number.parseFloat(service.base_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    {service.pricing && service.pricing.length > 0 && (
                      <div className="flex flex-col gap-1 mt-2 border-l-2 border-[#EBE6E0] pl-2 min-w-[140px]">
                        {service.pricing.map(p => (
                          <div key={p.id} className="text-xs text-[#827A73] flex justify-between gap-3">
                            <span className="truncate">{p.label}</span>
                            <span className="font-semibold text-[#524A44]">+₱{Number.parseFloat(p.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[#524A44]">{service.estimated_days} days</span>
                  </td>
                  <td className="px-6 py-4">
                    {service.is_active ? (
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
                      {actionLoadingId === service.id ? (
                        <Loader2 size={16} className="animate-spin text-[#A8A19A]" />
                      ) : (
                        <>
                          <button
                            onClick={() => onDuplicate(service)}
                            title="Duplicate Service"
                            className="text-[#A8A19A] hover:text-[#9A8073] hover:bg-[#FAF6F3] p-1.5 rounded-lg border border-transparent hover:border-[#EBE6E0] transition-colors"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => onManagePricing(service)}
                            title="Manage Pricing Options"
                            className="text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#FAF6F3] p-1.5 rounded-lg border border-transparent hover:border-[#EBE6E0] transition-colors"
                          >
                            <DollarSign size={14} />
                          </button>
                          <button
                            onClick={() => onEdit(service)}
                            title="Edit Service"
                            className="text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#FAF6F3] p-1.5 rounded-lg border border-transparent hover:border-[#EBE6E0] transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => onDelete(service.id)}
                            title="Delete Service"
                            className="text-[#A8A19A] hover:text-[#B26959] hover:bg-[#B26959]/10 p-1.5 rounded-lg border border-transparent hover:border-[#B26959]/20 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
