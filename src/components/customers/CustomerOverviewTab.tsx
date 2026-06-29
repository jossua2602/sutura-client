'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { CustomerData, JobOrder, MeasurementProfile } from './customerTypes';
import { isWalkInEmail } from './customerHelpers';

interface CustomerOverviewTabProps {
  readonly customer: CustomerData | null;
  readonly jobs: JobOrder[];
  readonly measurements: MeasurementProfile[];
  readonly setActiveTab: (tab: 'overview' | 'measurements' | 'orders' | 'appointments' | 'history') => void;
}

export default function CustomerOverviewTab({
  customer,
  jobs,
  measurements,
  setActiveTab,
}: CustomerOverviewTabProps) {
  const activeJobs = jobs.filter(j => !['completed', 'cancelled'].includes(j.status));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
      <div className="md:col-span-2 space-y-6">
        {/* Profile Details */}
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#2D2A26]">Client Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Full Name</span>
              <span className="text-[#2D2A26] font-medium">{customer?.name}</span>
            </div>
            <div>
              <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Email Address</span>
              <span className="text-[#2D2A26] font-medium">
                {customer?.email && !isWalkInEmail(customer.email) ? customer.email : 'Walk-in (No Email)'}
              </span>
            </div>
            <div>
              <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Phone Number</span>
              <span className="text-[#2D2A26] font-medium">{customer?.phone || 'N/A'}</span>
            </div>
            <div>
              <span className="text-[#A8A19A] block mb-0.5 text-xs font-semibold">Profile Reference</span>
              <span className="text-[#2D2A26] font-medium">Customer ID #{customer?.id}</span>
            </div>
          </div>
        </div>

        {/* Active Jobs Quick Overview */}
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[#2D2A26]">Ongoing Garments Production</h2>
            <button onClick={() => setActiveTab('orders')} className="text-xs text-taupe font-semibold hover:underline flex items-center gap-0.5 cursor-pointer">
              View All Orders <ChevronRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-[#EBE6E0] text-sm">
            {activeJobs.map(job => (
              <div key={job.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <Link href={`/dashboard/jobs/${job.id}`} className="font-semibold text-taupe hover:underline block">
                    {job.order_number}
                  </Link>
                  <span className="text-xs text-[#827A73]">{job.service?.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-[#2D2A26]">₱{Number.parseFloat(job.total_amount as string).toLocaleString()}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                    job.status === 'pending' ? 'bg-[#FAF6F3] text-[#827A73] border-[#EBE6E0]' : 'bg-[#BCA89F]/10 text-[#BCA89F] border-[#BCA89F]/20'
                  }`}>
                    {job.status}
                  </span>
                </div>
              </div>
            ))}
            {activeJobs.length === 0 && (
              <div className="text-center py-6 text-xs text-[#A8A19A] italic">No active production runs currently.</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Measurements Version Box */}
      <div className="space-y-6">
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-[#2D2A26]">Quick Specs</h2>
            <button onClick={() => setActiveTab('measurements')} className="text-xs text-taupe font-semibold hover:underline cursor-pointer">
              Manage
            </button>
          </div>
          <div className="space-y-3">
            {measurements.slice(0, 2).map(m => (
              <div key={m.id} className="bg-[#FAF6F3]/50 border border-[#EBE6E0] p-3.5 rounded-xl text-xs">
                <div className="font-bold text-[#2D2A26] border-b border-[#EBE6E0]/60 pb-1 mb-2 flex justify-between">
                  <span>{m.profile_name}</span>
                  <span className="font-normal text-[10px] text-[#827A73]">({Object.keys(m.metrics || {}).length} specs)</span>
                </div>
                <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto">
                  {Object.entries(m.metrics || {}).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex justify-between border-b border-[#EBE6E0]/20 pb-0.5">
                      <span className="text-[#827A73] capitalize truncate">{k}</span>
                      <span className="font-semibold text-[#524A44]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {measurements.length === 0 && (
              <div className="text-center py-6 text-xs text-[#A8A19A] italic">No specifications entered.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
