import React from 'react';
import { TrendingUp, Wallet, PackageCheck, Calendar as CalendarIcon, Users, Target } from 'lucide-react';
import { AnalyticsData } from './reportHelpers';

interface ReportKpiCardsProps {
  data: AnalyticsData | null;
  completionRate: number;
}

export default function ReportKpiCards({ data, completionRate }: ReportKpiCardsProps) {
  const kpis = [
    {
      label: 'Total Revenue',
      value: `₱${Number(data?.total_revenue || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
      })}`,
      sub: 'Lifetime collected',
      icon: <TrendingUp className="text-[#7A8B76]" size={20} />,
      color: 'text-[#7A8B76] bg-[#7A8B76]/10 border-[#7A8B76]/20',
    },
    {
      label: 'Outstanding Balance',
      value: `₱${Number(data?.total_outstanding_balance || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
      })}`,
      sub: 'Unpaid from clients',
      icon: <Wallet className="text-amber-500" size={20} />,
      color: 'text-amber-500 bg-amber-50 border-amber-200',
    },
    {
      label: 'Completed Orders',
      value: `${data?.completed_jobs || 0} / ${data?.total_jobs || 0}`,
      sub: `${completionRate}% completion rate`,
      icon: <PackageCheck className="text-taupe" size={20} />,
      color: 'text-[#9A8073] bg-[#9A8073]/10 border-[#9A8073]/20',
    },
    {
      label: 'Appointments',
      value: data?.upcoming_appointments || 0,
      sub: 'Upcoming scheduled',
      icon: <CalendarIcon className="text-violet-500" size={20} />,
      color: 'text-violet-500 bg-violet-50 border-violet-200',
    },
    {
      label: 'Active Staff',
      value: data?.total_staff || 0,
      sub: 'Current workforce',
      icon: <Users className="text-blue-500" size={20} />,
      color: 'text-blue-500 bg-blue-50 border-blue-200',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      sub: 'Orders finished on time',
      icon: <Target className="text-[#4A7C59]" size={20} />,
      color: 'text-[#4A7C59] bg-[#4A7C59]/10 border-[#4A7C59]/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {kpis.map((kpi, idx) => (
        <div
          key={idx}
          className="bg-white border border-[#EBE6E0] rounded-2xl p-5 flex items-start justify-between shadow-sm"
        >
          <div>
            <p className="text-sm font-medium text-[#827A73] mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-bold text-[#2D2A26] tracking-tight mb-1">{kpi.value}</h3>
            <p className="text-xs text-[#A8A19A]">{kpi.sub}</p>
          </div>
          <div className={`p-2.5 rounded-xl border ${kpi.color}`}>{kpi.icon}</div>
        </div>
      ))}
    </div>
  );
}
