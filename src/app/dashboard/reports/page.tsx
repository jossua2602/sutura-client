'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import SubscriptionGate from '@/components/SubscriptionGate';
import { AnalyticsData, STATUS_LABELS } from '@/components/reports/reportHelpers';
import ReportKpiCards from '@/components/reports/ReportKpiCards';
import ReportCharts from '@/components/reports/ReportCharts';
import ReportFilters from '@/components/reports/ReportFilters';
import { useBranch } from '@/context/BranchContext';

export default function ReportsPage() {
  const { shop, user } = useAuthStore();
  const { selectedBranchId } = useBranch();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all_time');

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['SUTURA Sales and Analytics Report'],
      ['Period', period.toUpperCase().replace('_', ' ')],
      ['Generated At', new Date().toLocaleString()],
      [],
      ['Metric', 'Value'],
      ['Total Revenue', data.total_revenue],
      ['Outstanding Balance', data.total_outstanding_balance],
      ['Completed Jobs', data.completed_jobs],
      ['Total Jobs', data.total_jobs],
      ['Upcoming Appointments', data.upcoming_appointments],
      ['Total Staff', data.total_staff],
      [],
      ['Monthly Revenue Breakdown'],
      ['Month', 'Revenue (PHP)'],
    ];

    if (data.revenue_data) {
      data.revenue_data.forEach(row => {
        rows.push([row.month, row.revenue]);
      });
    }

    if (data.jobs_by_status) {
      rows.push([], ['Jobs by Status Breakdown'], ['Status', 'Count']);
      data.jobs_by_status.forEach(row => {
        rows.push([STATUS_LABELS[row.status] || row.status, row.count]);
      });
    }

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      rows.map(e => e.map(val => `"${String(val).replaceAll('"', '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sutura_reports_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    globalThis.print();
  };

  useEffect(() => {
    if (!shop?.id) {
      if (user?.id) {
        setTimeout(() => setLoading(false), 0);
      }
      return;
    }

    async function fetchAnalytics() {
      setLoading(true);

      const now = new Date();
      let startDate = '';
      let endDate = '';

      if (period === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      } else if (period === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      } else if (period === 'ytd') {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      }

      let url = `/shops/${shop?.id}/analytics`;
      const queryParams: string[] = [];
      if (startDate && endDate) queryParams.push(`start_date=${startDate}`, `end_date=${endDate}`);
      if (selectedBranchId !== null) queryParams.push(`branch_id=${selectedBranchId}`);
      
      if (queryParams.length > 0) url += `?${queryParams.join('&')}`;

      try {
        const res = await api.get(url);
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, [shop?.id, period, user?.id, selectedBranchId]);

  // ─── Derived chart data ──────────────────────────────────────────────────

  const revenueChartData =
    data?.revenue_data && data.revenue_data.length > 0
      ? data.revenue_data
      : [
          { month: 'Jan', revenue: 0 },
          { month: 'Feb', revenue: 0 },
          { month: 'Mar', revenue: 0 },
          { month: 'Apr', revenue: 0 },
          { month: 'May', revenue: 0 },
          { month: 'Jun', revenue: 0 },
        ];

  const jobsStatusData =
    data?.jobs_by_status && data.jobs_by_status.length > 0
      ? data.jobs_by_status
      : [
          { status: 'pending', count: 0 },
          { status: 'cutting', count: 0 },
          { status: 'sewing', count: 0 },
          { status: 'completed', count: 0 },
        ];

  const completionRate = data?.total_jobs ? Math.round(((data.completed_jobs || 0) / data.total_jobs) * 100) : 0;

  const pendingRate = 100 - completionRate;

  const completionPieData = [
    { name: 'Completed', value: completionRate, fill: '#7A8B76' },
    { name: 'Pending', value: pendingRate, fill: '#EBE6E0' },
  ];

  const outstandingRate = data?.total_revenue
    ? Math.round(
        ((data.total_outstanding_balance || 0) / (data.total_revenue + (data.total_outstanding_balance || 0))) *
          100
      )
    : 0;

  const balancePieData = [
    { name: 'Collected', value: 100 - outstandingRate, fill: '#9A8073' },
    { name: 'Outstanding', value: outstandingRate, fill: '#EBE6E0' },
  ];

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-24 text-center text-[#A8A19A] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-[#9A8073]/30 border-t-[#9A8073] rounded-full animate-spin" />
        Recalculating analytics...
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 print-container">
      {/* Print CSS Stylesheet */}
      <style>{`
        @media print {
          /* Hide sidebar/navigation, headers, filters, buttons */
          aside, nav, header, button, select, .no-print, .filter-bar {
            display: none !important;
          }
          main, .print-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .bg-white {
            border: 1px solid #EBE6E0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <ReportFilters
        period={period}
        setPeriod={setPeriod}
        onExportCSV={handleExportCSV}
        onPrint={handlePrint}
      />

      <SubscriptionGate feature="reports">
        <div className="space-y-6">
          <ReportKpiCards data={data} completionRate={completionRate} />

          <ReportCharts
            data={data}
            revenueChartData={revenueChartData}
            jobsStatusData={jobsStatusData}
            completionRate={completionRate}
            completionPieData={completionPieData}
            outstandingRate={outstandingRate}
            balancePieData={balancePieData}
          />
        </div>
      </SubscriptionGate>
    </div>
  );
}
