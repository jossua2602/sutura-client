'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Users, Package, Scissors, ShoppingBag, Calendar, UserCog, Building2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Link from 'next/link';

interface AnalyticsData {
  total_jobs: number;
  completed_jobs: number;
  total_revenue: number;
  total_outstanding_balance: number;
  upcoming_appointments: number;
  total_appointments: number;
  total_services: number;
  total_collections: number;
  total_branches: number;
  total_staff: number;
  total_customers?: number;
  recent_jobs?: {
    id: number;
    order_number?: string;
    total_amount: number | string;
    customer?: { name: string };
  }[];
  revenue_data?: { month: string; revenue: number }[];
}

export default function DashboardPage() {
  const { shop, user } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shop) {
      api.get(`/shops/${shop.id}/analytics`)
        .then(res => {
          setData(res.data.data);
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

  if (loading) {
    return <div className="animate-pulse text-[#A8A19A] font-medium">Loading store metrics...</div>;
  }

  // Fallback empty data for the chart if none provided by API yet
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
    <div className="space-y-6 pb-12">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-medium text-[#2D2A26] tracking-tight mb-2">
          Welcome Back, {user?.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-[#827A73] text-[15px]">Here&apos;s what&apos;s happening with your store today.</p>
      </div>

      {/* Setup prompt for new shops with no data */}
      {!loading && data && !data.total_jobs && !data.total_services && !data.total_staff && (
        <div className="bg-linear-to-r from-[#FAF6F3] to-[#F0EAE3] border border-[#EBE6E0] rounded-2xl p-6 mb-2">
          <h2 className="text-base font-semibold text-[#2D2A26] mb-1">🚀 Let&apos;s get your shop set up</h2>
          <p className="text-sm text-[#827A73] mb-4">Complete these quick steps to make your shop ready for customers.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Set Business Type', href: '/dashboard/settings', emoji: '🏷️', desc: 'Tailoring Shop / Fashion Designer' },
              { label: 'Add a Service',     href: '/dashboard/services', emoji: '📋', desc: 'What do you offer?' },
              { label: 'Upload Catalog',    href: '/dashboard/catalog/new', emoji: '🖼️', desc: 'Showcase your work' },
              { label: 'Add Staff',         href: '/dashboard/staff',    emoji: '👥', desc: 'Invite your team' },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col gap-1.5 bg-white border border-[#EBE6E0] rounded-xl p-4 hover:border-[#9A8073] hover:shadow-sm transition-all group"
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="text-sm font-medium text-[#2D2A26] group-hover:text-[#9A8073] transition-colors">{item.label}</span>
                <span className="text-xs text-[#A8A19A]">{item.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
          <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
            <span className="font-serif italic text-lg">₱</span>
          </div>
          <p className="text-sm font-medium text-[#524A44] mb-1">Total Revenue</p>
          <div className="flex items-center gap-3">
            <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">₱{data?.total_revenue ? data.total_revenue.toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</p>
          </div>
        </div>

        {/* Orders */}
        <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
          <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
            <Scissors size={18} />
          </div>
          <p className="text-sm font-medium text-[#524A44] mb-1">Orders</p>
          <div className="flex items-center gap-3">
            <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_jobs || 0}</p>
          </div>
        </div>

        {/* Collections */}
        <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
          <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
            <ShoppingBag size={18} />
          </div>
          <p className="text-sm font-medium text-[#524A44] mb-1">Collections</p>
          <div className="flex items-center gap-3">
            <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_collections || 0}</p>
          </div>
        </div>

        {/* Customers */}
        <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
          <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
            <Users size={18} />
          </div>
          <p className="text-sm font-medium text-[#524A44] mb-1">Customers</p>
          <div className="flex items-center gap-3">
            <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_customers || 0}</p>
          </div>
        </div>

        {/* Appointments */}
        <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
          <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
            <Calendar size={18} />
          </div>
          <p className="text-sm font-medium text-[#524A44] mb-1">Appointments</p>
          <div className="flex items-center gap-3">
            <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_appointments || 0}</p>
          </div>
        </div>

        {/* Services */}
        <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
          <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
            <Package size={18} />
          </div>
          <p className="text-sm font-medium text-[#524A44] mb-1">Services</p>
          <div className="flex items-center gap-3">
            <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_services || 0}</p>
          </div>
        </div>

        {/* Staff */}
        <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
          <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
            <UserCog size={18} />
          </div>
          <p className="text-sm font-medium text-[#524A44] mb-1">Staff</p>
          <div className="flex items-center gap-3">
            <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_staff || 0}</p>
          </div>
        </div>

        {/* Branches */}
        <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
          <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
            <Building2 size={18} />
          </div>
          <p className="text-sm font-medium text-[#524A44] mb-1">Branches</p>
          <div className="flex items-center gap-3">
            <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_branches || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Overview Chart */}
        <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
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
             <Link href="/dashboard/jobs" className="text-sm text-[#827A73] hover:text-[#2D2A26] transition-colors">View All</Link>
          </div>
          
          <div className="space-y-4 flex-1">
             {recentJobs.length > 0 ? (
               recentJobs.map((order, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-[#EBE6E0] last:border-0 last:pb-0">
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

      {/* Live Activity Feed */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0] p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[15px] font-semibold text-[#2D2A26]">Live Activity Feed</h2>
          <span className="flex items-center gap-2 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
            Real-time
          </span>
        </div>
        
        <div className="space-y-6">
          {[
            { user: 'Masudog', action: 'completed the Sewing stage', target: 'Order #1024', time: '2 mins ago', icon: <Scissors className="w-4 h-4 text-[#8A7E72]" /> },
            { user: 'Customer', action: 'placed a new Walk-in Pickup order for', target: 'Summer Linen Suit', time: '15 mins ago', icon: <ShoppingBag className="w-4 h-4 text-[#8A7E72]" /> },
            { user: 'Renalyn', action: 'booked a new Fitting Appointment for', target: 'Tomorrow 2:00 PM', time: '1 hour ago', icon: <Calendar className="w-4 h-4 text-[#8A7E72]" /> },
            { user: 'System', action: 'marked delivery as Out for Delivery for', target: 'Order #1020', time: '2 hours ago', icon: <Package className="w-4 h-4 text-[#8A7E72]" /> },
          ].map((activity, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-[#FAF6F3] flex items-center justify-center flex-shrink-0 border border-[#EBE6E0]">
                {activity.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#2D2A26]">
                  <span className="font-semibold">{activity.user}</span> {activity.action} <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-[#A8A19A] mt-0.5">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
