import React from 'react';
import { Filter, Download, Printer } from 'lucide-react';

interface ReportFiltersProps {
  period: string;
  setPeriod: (period: string) => void;
  onExportCSV: () => void;
  onPrint: () => void;
}

export default function ReportFilters({
  period,
  setPeriod,
  onExportCSV,
  onPrint,
}: ReportFiltersProps) {
  return (
    <div className="flex items-center justify-between no-print">
      <div>
        <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Sales & Analytics</h1>
        <p className="text-[#827A73] text-sm mt-1">Real-time performance metrics and business overview.</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white shadow-sm border border-[#EBE6E0] rounded-lg px-3 py-1.5 filter-bar">
          <Filter size={16} className="text-[#A8A19A]" />
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="bg-transparent text-sm text-[#524A44] font-medium focus:outline-none cursor-pointer"
          >
            <option value="all_time">All Time</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="ytd">Year to Date</option>
          </select>
        </div>

        <button
          onClick={onExportCSV}
          className="flex items-center gap-1.5 bg-white hover:bg-[#FAF6F3] border border-[#EBE6E0] text-[#524A44] font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer shadow-xs"
        >
          <Download size={14} /> Export CSV
        </button>

        <button
          onClick={onPrint}
          className="flex items-center gap-1.5 bg-[#9A8073] hover:bg-[#91756A] text-white font-medium px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer shadow-xs"
        >
          <Printer size={14} /> Print Report
        </button>
      </div>
    </div>
  );
}
