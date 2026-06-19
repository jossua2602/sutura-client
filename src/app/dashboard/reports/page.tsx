'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  TrendingUp, Users, PackageCheck, Wallet,
  Calendar as CalendarIcon, Target, Filter
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  Legend
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface AnalyticsData {
  total_jobs: number;
  completed_jobs: number;
  total_revenue: number;
  total_outstanding_balance: number;
  upcoming_appointments: number;
  total_staff: number;
  revenue_data?: { month: string; revenue: number }[];
  jobs_by_status?: { status: string; count: number }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  pending:          '#BCA89F',
  cutting:          '#9A8073',
  sewing:           '#7A8B76',
  fitting:          '#D4B896',
  ready_for_pickup: '#4A7C59',
  completed:        '#2D6A4F',
  cancelled:        '#B26959',
};

const STATUS_LABELS: Record<string, string> = {
  pending:          'Pending',
  cutting:          'Cutting',
  sewing:           'Sewing',
  fitting:          'Fitting',
  ready_for_pickup: 'Ready',
  completed:        'Completed',
  cancelled:        'Cancelled',
};

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#EBE6E0] rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs text-[#A8A19A] mb-1">{label}</p>
        <p className="text-base font-bold text-[#2D2A26]">
          ₱{payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: {
  active?: boolean; payload?: { name: string; value: number }[]
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-[#EBE6E0] rounded-xl shadow-lg px-4 py-3">
        <p className="text-xs font-medium text-[#2D2A26]">{STATUS_LABELS[payload[0].name] ?? payload[0].name}</p>
        <p className="text-base font-bold text-taupe">{payload[0].value} orders</p>
      </div>
    );
  }
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ReportsPage() {
  const { shop } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all_time');

  useEffect(() => {
    if (!shop) return;
    
    async function fetchAnalytics() {
      setLoading(true);

      const now = new Date();
      let startDate = '';
      let endDate = '';

      if (period === 'this_month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDate   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      } else if (period === 'last_month') {
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        endDate   = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      } else if (period === 'ytd') {
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDate   = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      }

      let url = `/shops/${shop.id}/analytics`;
      if (startDate && endDate) url += `?start_date=${startDate}&end_date=${endDate}`;

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
  }, [shop, period]);

  // ─── Derived chart data ──────────────────────────────────────────────────

  const revenueChartData = (data?.revenue_data && data.revenue_data.length > 0)
    ? data.revenue_data
    : [
        { month: 'Jan', revenue: 0 }, { month: 'Feb', revenue: 0 },
        { month: 'Mar', revenue: 0 }, { month: 'Apr', revenue: 0 },
        { month: 'May', revenue: 0 }, { month: 'Jun', revenue: 0 },
      ];

  const jobsStatusData = (data?.jobs_by_status && data.jobs_by_status.length > 0)
    ? data.jobs_by_status
    : [
        { status: 'pending',   count: 0 },
        { status: 'cutting',   count: 0 },
        { status: 'sewing',    count: 0 },
        { status: 'completed', count: 0 },
      ];

  const completionRate = data?.total_jobs
    ? Math.round(((data.completed_jobs || 0) / data.total_jobs) * 100)
    : 0;

  const pendingRate = 100 - completionRate;

  const completionPieData = [
    { name: 'Completed', value: completionRate,  fill: '#7A8B76' },
    { name: 'Pending',   value: pendingRate,     fill: '#EBE6E0' },
  ];

  const outstandingRate = data?.total_revenue
    ? Math.round(((data.total_outstanding_balance || 0) / (data.total_revenue + (data.total_outstanding_balance || 0))) * 100)
    : 0;

  const balancePieData = [
    { name: 'Collected',    value: 100 - outstandingRate, fill: '#9A8073' },
    { name: 'Outstanding',  value: outstandingRate,       fill: '#EBE6E0' },
  ];

  // ─── KPI Cards ─────────────────────────────────────────────────────────────
  const kpis = [
    {
      label: 'Total Revenue',
      value: `₱${Number(data?.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
      sub: 'Lifetime collected',
      icon: <TrendingUp className="text-[#7A8B76]" size={20} />,
      color: 'text-[#7A8B76] bg-[#7A8B76]/10 border-[#7A8B76]/20',
    },
    {
      label: 'Outstanding Balance',
      value: `₱${Number(data?.total_outstanding_balance || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
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

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="py-24 text-center text-[#A8A19A] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-[#9A8073]/30 border-t-[#9A8073] rounded-full animate-spin" />
        Recalculating analytics...
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-12">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Sales & Analytics</h1>
          <p className="text-[#827A73] text-sm mt-1">Real-time performance metrics and business overview.</p>
        </div>
        <div className="flex items-center gap-2 bg-white shadow-sm border border-[#EBE6E0] rounded-lg px-3 py-1.5">
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
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white border border-[#EBE6E0] rounded-2xl p-5 flex items-start justify-between shadow-sm">
            <div>
              <p className="text-sm font-medium text-[#827A73] mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-[#2D2A26] tracking-tight mb-1">{kpi.value}</h3>
              <p className="text-xs text-[#A8A19A]">{kpi.sub}</p>
            </div>
            <div className={`p-2.5 rounded-xl border ${kpi.color}`}>
              {kpi.icon}
            </div>
          </div>
        ))}
      </div>

      {/* ── Revenue Bar Chart ── */}
      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-[#2D2A26]">Monthly Revenue</h2>
            <p className="text-sm text-[#A8A19A] mt-0.5">Revenue collected per month across all orders</p>
          </div>
          <span className="text-2xl font-bold text-[#2D2A26]">
            ₱{Number(data?.total_revenue || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" vertical={false} />
              <XAxis dataKey="month" stroke="#A8A19A" fontSize={12} tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="#A8A19A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `₱${v >= 1000 ? `${v / 1000}k` : v}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F0EAE3', radius: 6 }} />
              <Bar dataKey="revenue" fill="#9A8073" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Row: Order Status Pie + Outstanding Balance ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Order Status Distribution */}
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#2D2A26] mb-1">Order Status Breakdown</h2>
          <p className="text-sm text-[#A8A19A] mb-6">Distribution of orders across all production stages</p>
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={jobsStatusData} layout="vertical" margin={{ top: 0, right: 10, left: 40, bottom: 0 }} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" horizontal={false} />
                <XAxis type="number" stroke="#A8A19A" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="status"
                  stroke="#A8A19A"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => STATUS_LABELS[v] ?? v}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-white border border-[#EBE6E0] rounded-xl shadow-lg px-3 py-2">
                          <p className="text-xs font-medium text-[#2D2A26]">{STATUS_LABELS[payload[0]?.payload?.status] ?? payload[0]?.payload?.status}</p>
                          <p className="text-sm font-bold text-taupe">{payload[0]?.value} orders</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  radius={[0, 6, 6, 0]}
                >
                  {jobsStatusData.map((entry, idx) => (
                    <Cell key={idx} fill={STATUS_COLORS[entry.status] ?? '#9A8073'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Rate + Balance Gauges */}
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-semibold text-[#2D2A26] mb-1">Performance Gauges</h2>
          <p className="text-sm text-[#A8A19A] mb-4">Completion and collection rates at a glance</p>

          <div className="grid grid-cols-2 gap-4">
            {/* Completion Rate Pie */}
            <div className="flex flex-col items-center">
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionPieData}
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={58}
                      startAngle={90} endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {completionPieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <text
                      x="50%" y="47%"
                      textAnchor="middle" dominantBaseline="middle"
                      className="fill-[#2D2A26] text-xl font-bold"
                      style={{ fontSize: 18, fontWeight: 700, fill: '#2D2A26' }}
                    >
                      {completionRate}%
                    </text>
                    <text
                      x="50%" y="62%"
                      textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: 10, fill: '#A8A19A' }}
                    >
                      done
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs font-medium text-[#524A44] text-center">Completion Rate</p>
              <p className="text-xs text-[#A8A19A] text-center">{data?.completed_jobs || 0} of {data?.total_jobs || 0} orders</p>
            </div>

            {/* Balance Collection Pie */}
            <div className="flex flex-col items-center">
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={balancePieData}
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={58}
                      startAngle={90} endAngle={-270}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {balancePieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.fill} />
                      ))}
                    </Pie>
                    <text
                      x="50%" y="47%"
                      textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: 18, fontWeight: 700, fill: '#2D2A26' }}
                    >
                      {outstandingRate}%
                    </text>
                    <text
                      x="50%" y="62%"
                      textAnchor="middle" dominantBaseline="middle"
                      style={{ fontSize: 10, fill: '#A8A19A' }}
                    >
                      unpaid
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs font-medium text-[#524A44] text-center">Outstanding Balance</p>
              <p className="text-xs text-[#A8A19A] text-center">₱{Number(data?.total_outstanding_balance || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Revenue Trend mini area */}
          <div className="mt-4 pt-4 border-t border-[#EBE6E0]">
            <p className="text-xs text-[#A8A19A] mb-2 font-medium">Revenue Trend</p>
            <div className="h-20 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChartData} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#9A8073" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#9A8073" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" stroke="#A8A19A" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#9A8073"
                    strokeWidth={2}
                    fill="url(#trendGrad)"
                    dot={false}
                    activeDot={{ r: 4, fill: '#9A8073', stroke: '#fff', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
