import React from 'react';
import { Scissors, ShoppingBag, Users, Calendar, Package, UserCog, Building2 } from 'lucide-react';
import { AnalyticsData } from './dashboardHelpers';

interface DashboardMetricsProps {
  readonly data: AnalyticsData | null;
}

export default function DashboardMetrics({
  data,
}: DashboardMetricsProps) {
  const metricsList = [
    {
      label: 'Total Revenue',
      value: `₱${data?.total_revenue ? data.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}`,
      icon: <span className="font-serif italic text-lg text-[#827A73]">₱</span>,
    },
    {
      label: 'Orders',
      value: data?.total_jobs || 0,
      icon: <Scissors size={18} className="text-[#827A73]" />,
    },
    {
      label: 'Collections',
      value: data?.total_collections || 0,
      icon: <ShoppingBag size={18} className="text-[#827A73]" />,
    },
    {
      label: 'Customers',
      value: data?.total_customers || 0,
      icon: <Users size={18} className="text-[#827A73]" />,
    },
    {
      label: 'Appointments',
      value: data?.total_appointments || 0,
      icon: <Calendar size={18} className="text-[#827A73]" />,
    },
    {
      label: 'Services',
      value: data?.total_services || 0,
      icon: <Package size={18} className="text-[#827A73]" />,
    },
    {
      label: 'Staff',
      value: data?.total_staff || 0,
      icon: <UserCog size={18} className="text-[#827A73]" />,
    },
    {
      label: 'Branches',
      value: data?.total_branches || 0,
      icon: <Building2 size={18} className="text-[#827A73]" />,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[#2D2A26]">
      {metricsList.map((m) => (
        <div key={m.label} className="p-5 rounded-2xl bg-white shadow-sm border border-[#EBE6E0] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#827A73] uppercase tracking-wider">{m.label}</p>
            <div className="w-8 h-8 rounded-xl bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center">
              {m.icon}
            </div>
          </div>
          <p className="text-2xl font-semibold text-[#2D2A26] tracking-tight">{m.value}</p>
        </div>
      ))}
    </div>
  );
}
