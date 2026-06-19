'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Users, Search, Package, Phone, Mail } from 'lucide-react';

interface CustomerData {
  id: number;
  name: string;
  email: string;
  phone: string;
  profile_picture: string;
  total_spend: number;
  active_jobs: number;
  completed_jobs: number;
  created_at: string;
}

export default function CustomersPage() {
  const { shop , user } = useAuthStore();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (shop) {
      api.get(`/shops/${shop.id}/customers`)
        .then(res => {
          setCustomers(res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      if (user) {
        setTimeout(() => setLoading(false), 0);
      } else {
        const timer = setTimeout(() => setLoading(false), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [shop, user]);

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Client Book</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage your customer relationships and lifetime value.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white shadow-sm border border-[#EBE6E0] p-4 rounded-2xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
          <input 
            type="text" 
            placeholder="Search clients by name or email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
          />
        </div>
        <div className="text-sm text-[#827A73] font-medium px-4">
          Total Clients: {customers.length}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading CRM directory...</div>
      ) : (
        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F3]/50 border-b border-[#EBE6E0] text-xs uppercase tracking-wider text-[#827A73]">
                  <th className="p-4 font-semibold">Client</th>
                  <th className="p-4 font-semibold">Contact</th>
                  <th className="p-4 font-semibold text-center">Active Jobs</th>
                  <th className="p-4 font-semibold text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filtered.map(customer => (
                  <tr 
                    key={customer.id} 
                    onClick={() => window.location.href = `/staff-dashboard/customers/${customer.id}`}
                    className="hover:bg-[#F0EAE3]/20 transition-colors group cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#F0EAE3] overflow-hidden shrink-0 flex items-center justify-center border border-[#D1C7BD]">
                          {customer.profile_picture ? (
                            <img src={customer.profile_picture} alt={customer.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[#827A73] font-bold">{customer.name.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-[#2D2A26] group-hover:text-taupe transition-colors">
                            {customer.name}
                          </div>
                          <div className="text-xs text-[#A8A19A] flex items-center gap-1 mt-0.5">
                            <Package size={12} /> {customer.completed_jobs} completed orders
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="space-y-1">
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-sm text-[#827A73]">
                            <Mail size={14} className="text-[#A8A19A]" /> {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-1.5 text-sm text-[#827A73]">
                            <Phone size={14} className="text-[#A8A19A]" /> {customer.phone}
                          </div>
                        )}
                        {!customer.email && !customer.phone && <span className="text-[#827A73] text-xs italic">No contact provided</span>}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {customer.active_jobs > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#BCA89F]/10 text-[#BCA89F] border border-[#BCA89F]/20">
                          {customer.active_jobs} Active
                        </span>
                      ) : (
                        <span className="text-[#827A73] text-sm">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="font-medium text-[#7A8B76]">
                        ₱{Number(customer.total_spend).toLocaleString()}
                      </div>
                      <div className="text-xs text-[#A8A19A] mt-0.5">
                        Client since {new Date(customer.created_at).getFullYear()}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-[#A8A19A]">
                      No clients found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
