'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Search, ArrowRight } from 'lucide-react';

export default function StaffDashboard() {
  const { shop, staffProfile , user } = useAuthStore();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shop && staffProfile) {
      api.get(`/shops/${shop.id}/jobs?assigned_staff_id=${staffProfile.id}`)
        .then(res => {
          setJobs(res.data.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [shop, staffProfile]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-zinc-500/10 text-[#827A73] border-zinc-500/20',
      cutting: 'bg-[#BCA89F]/10 text-[#BCA89F] border-[#BCA89F]/20',
      sewing: 'bg-[#9A8073]/10 text-[#9A8073] border-[#9A8073]/20',
      fitting: 'bg-[#BAA195]/10 text-[#BAA195] border-[#BAA195]/20',
      ready_for_pickup: 'bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20',
      completed: 'bg-[#9A8073]/10 text-taupe border-[#9A8073]/20',
      cancelled: 'bg-[#B26959]/10 text-[#B26959] border-[#B26959]/20',
    };
    return colors[status] || colors.pending;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">My Tasks</h1>
        <p className="text-[#827A73] text-sm mt-1">Manage the production lifecycle of garments assigned to you.</p>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#EBE6E0] flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
            <input 
              type="text" 
              placeholder="Search by order number..." 
              className="pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#524A44]">
            <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
              <tr>
                <th className="px-6 py-4 font-medium">Order Number</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Service</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#A8A19A]">
                    Loading your tasks...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#A8A19A]">
                    You have no tasks assigned.
                  </td>
                </tr>
              ) : (
                jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-[#F0EAE3]/20 transition-colors">
                    <td className="px-6 py-4 font-medium text-[#2D2A26]">{job.order_number}</td>
                    <td className="px-6 py-4">{job.customer?.name}</td>
                    <td className="px-6 py-4 text-[#827A73]">{job.service?.name}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                        {job.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a 
                        href={`/staff-dashboard/jobs/${job.id}`} 
                        className="inline-flex items-center gap-1 text-taupe hover:text-taupe-hover text-xs font-medium transition-colors"
                      >
                        Update
                        <ArrowRight size={14} />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
