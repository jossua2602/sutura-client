import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { AnalyticsData } from './dashboardHelpers';

interface DashboardChartsProps {
  data: AnalyticsData | null;
}

export default function DashboardCharts({
  data,
}: DashboardChartsProps) {
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
      <div className="lg:col-span-2 p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
        <div className="flex justify-between items-start mb-6">
          <div>
             <h2 className="text-[15px] font-semibold text-[#2D2A26] mb-1">Sales Overview</h2>
             <p className="text-3xl font-semibold text-[#2D2A26] tracking-tight">₱{data?.total_revenue ? data.total_revenue.toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</p>
          </div>
        </div>
        
        <div className="h-48 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9A8073" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#9A8073" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBE6E0" vertical={false} />
              <XAxis dataKey="month" stroke="#A8A19A" fontSize={12} tickLine={false} axisLine={false} dy={10} />
              <YAxis stroke="#A8A19A" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₱${val/1000}k`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#EBE6E0', borderRadius: '0.5rem', color: '#2D2A26', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ color: '#9A8073', fontWeight: 600 }}
                cursor={{ stroke: '#EBE6E0', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#9A8073" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" activeDot={{ r: 5, fill: '#9A8073', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0] flex flex-col">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-[15px] font-semibold text-[#2D2A26]">Recent Orders</h2>
           <Link href="/dashboard/jobs" className="text-sm text-[#827A73] hover:text-[#2D2A26] transition-colors font-medium">View All</Link>
        </div>
        
        <div className="space-y-4 flex-1">
           {recentJobs.length > 0 ? (
             recentJobs.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-[#EBE6E0] last:border-0 last:pb-0">
                  <div className="flex items-center gap-6">
                    <span className="text-[15px] font-medium text-[#827A73]">{order.order_number || `#${order.id}`}</span>
                    <span className="text-[15px] font-medium text-[#2D2A26]">{order.customer?.name || 'Walk-in Customer'}</span>
                  </div>
                  <span className="text-[15px] font-semibold text-[#2D2A26]">₱{(Number(order.total_amount) || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
             ))
           ) : (
             <div className="flex flex-col items-center justify-center h-full text-center py-6">
                <div className="w-12 h-12 bg-[#FAF6F3] rounded-full flex items-center justify-center mb-3 text-[#A8A19A]">
                   <Package size={20} />
                </div>
                <p className="text-[#827A73] text-[15px]">No recent orders yet.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
