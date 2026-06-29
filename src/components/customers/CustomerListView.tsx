import React from 'react';
import Image from 'next/image';
import { Search, Mail, Phone, Package, Eye, Pencil, Trash2 } from 'lucide-react';
import { isWalkInEmail } from './customerHelpers';
import { CustomerData } from './customerTypes';

type FilterType = 'all' | 'online' | 'walkin';

interface CustomerListViewProps {
  readonly customers: CustomerData[];
  readonly filteredCustomers: CustomerData[];
  readonly loading: boolean;
  readonly search: string;
  readonly onSearchChange: (val: string) => void;
  readonly filterType: FilterType;
  readonly onFilterTypeChange: (val: FilterType) => void;
  readonly onView: (id: number) => void;
  readonly onEdit: (customer: CustomerData) => void;
  readonly onDelete: (id: number) => void;
}

export default function CustomerListView({
  customers,
  filteredCustomers,
  loading,
  search,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  onView,
  onEdit,
  onDelete,
}: CustomerListViewProps) {
  return (
    <div className="space-y-6 text-[#2D2A26]">
      {/* Tabs */}
      <div className="flex border-b border-[#EBE6E0] gap-6">
        {[
          { id: 'all', label: 'All Clients', count: customers.length },
          { id: 'online', label: 'Online Clients', count: customers.filter(c => !isWalkInEmail(c.email)).length },
          { id: 'walkin', label: 'Walk-in Clients', count: customers.filter(c => isWalkInEmail(c.email)).length },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => onFilterTypeChange(tab.id as 'all' | 'online' | 'walkin')}
            className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 flex items-center gap-2 cursor-pointer ${
              filterType === tab.id
                ? 'border-taupe text-[#2D2A26]'
                : 'border-transparent text-[#A8A19A] hover:text-[#524A44]'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              filterType === tab.id ? 'bg-[#9A8073]/10 text-taupe' : 'bg-[#F0EAE3] text-[#827A73]'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading CRM directory...</div>
      ) : (
        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-[#EBE6E0] flex items-center justify-between bg-white">
            <div className="relative w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
              <input 
                type="text" 
                placeholder="Search clients by name or email..." 
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
              />
            </div>
            <div className="text-sm text-[#827A73] font-medium">
              Total Clients: {customers.length}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F3]/50 border-b border-[#EBE6E0] text-xs uppercase tracking-wider text-[#827A73]">
                  <th className="p-4 font-semibold">Client</th>
                  <th className="p-4 font-semibold">Contact</th>
                  <th className="p-4 font-semibold text-center">Active Jobs</th>
                  <th className="p-4 font-semibold text-right">Lifetime Spend</th>
                  <th className="p-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBE6E0]">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-[#A8A19A] text-sm">
                      No customers found. Click &quot;Add Customer&quot; to start building your Client Book.
                    </td>
                  </tr>
                ) : filteredCustomers.map(customer => (
                  <tr 
                    key={customer.id} 
                    onClick={() => onView(customer.id)}
                    className="hover:bg-[#F0EAE3]/20 transition-colors group cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F0EAE3] overflow-hidden shrink-0 flex items-center justify-center border border-[#D1C7BD]">
                          {customer.profile_picture ? (
                            <Image 
                              src={customer.profile_picture} 
                              alt={customer.name} 
                              className="w-full h-full object-cover" 
                              width={40} 
                              height={40} 
                              unoptimized 
                            />
                          ) : (
                            <span className="text-[#827A73] font-bold">{customer.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-[#2D2A26] group-hover:text-taupe transition-colors">{customer.name}</div>
                          <div className="text-xs text-[#A8A19A]">Joined {new Date(customer.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {customer.email && !isWalkInEmail(customer.email) ? (
                          <>
                            <div className="flex items-center gap-2 text-sm text-[#524A44]">
                              <Mail size={14} className="text-[#A8A19A]" />
                              {customer.email}
                            </div>
                            <span className="inline-flex items-center text-[9px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 uppercase tracking-wider">Online</span>
                          </>
                        ) : (
                          <span className="inline-flex items-center text-[9px] font-bold bg-[#FAF6F3] text-[#827A73] px-1.5 py-0.5 rounded border border-[#EBE6E0] uppercase tracking-wider">Walk-in</span>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-[#524A44]">
                            <Phone size={14} className="text-[#A8A19A]" />
                            {customer.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {customer.active_jobs && customer.active_jobs > 0 ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#BCA89F]/10 text-[#BCA89F] border border-[#BCA89F]/20">
                          <Package size={12} />
                          {customer.active_jobs} Active
                        </span>
                      ) : (
                        <span className="text-[#A8A19A] text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-semibold text-[#2D2A26]">₱{Number(customer.total_spend).toLocaleString()}</div>
                      <div className="text-xs text-[#A8A19A]">{customer.completed_jobs} completed orders</div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onView(customer.id);
                          }} 
                          className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1 cursor-pointer"
                          title="View Profile"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(customer);
                          }} 
                          className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1 cursor-pointer"
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(customer.id);
                          }} 
                          className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
