import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { AnalyticsData } from './dashboardHelpers';

interface DashboardChartsProps {
  readonly data: AnalyticsData | null;
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  const chartData = data?.revenue_data && data.revenue_data.length > 0
    ? data.revenue_data
    : [
        { month: 'Week 1', revenue: 0 },
        { month: 'Week 2', revenue: 0 },
        { month: 'Week 3', revenue: 0 },
        { month: 'Week 4', revenue: 0 },
      ];

  const recentJobs = data?.recent_jobs || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-[#2D2A26]">
      {/* Sales Area Chart */}
      <div className="lg:col-span-2">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs font-medium text-[#A8A19A] uppercase tracking-wider mb-1">Total Revenue</p>
            <p className="text-3xl font-semibold text-[#2D2A26] tracking-tight">
              ₱{data?.total_revenue
                ? data.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })
                : '0.00'}
            </p>
          </div>
        </div>
        <div className="h-52 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9A8073" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#9A8073" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" vertical={false} />
              <XAxis dataKey="month" stroke="#A8A19A" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#A8A19A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₱${val / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  borderColor: '#EBE6E0',
                  borderRadius: '0.75rem',
                  color: '#2D2A26',
                  boxShadow: '0 4px 20px -4px rgba(0,0,0,0.1)',
                  fontSize: 13,
                }}
                itemStyle={{ color: '#9A8073', fontWeight: 600 }}
                cursor={{ stroke: '#EBE6E0', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#9A8073"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorRev)"
                activeDot={{ r: 5, fill: '#9A8073', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-[#2D2A26]">Recent Orders</h2>
          <Link href="/dashboard/jobs" className="text-xs font-medium text-[#9A8073] hover:underline">
            View All
          </Link>
        </div>

        <div className="flex-1 space-y-1">
          {recentJobs.length > 0 ? (
            recentJobs.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-2.5 border-b border-[#EBE6E0] last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#2D2A26] truncate">
                    {order.customer?.name || 'Walk-in Customer'}
                  </p>
                  <p className="text-xs text-[#A8A19A]">{order.order_number || `#${order.id}`}</p>
                </div>
                <span className="text-sm font-semibold text-[#2D2A26] shrink-0 ml-3">
                  ₱{(Number(order.total_amount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-10 h-10 bg-[#FAF6F3] rounded-full flex items-center justify-center mb-3">
                <Package size={18} className="text-[#C5BDBA]" />
              </div>
              <p className="text-sm text-[#A8A19A]">No recent orders yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
