'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Users, Package, Scissors, ShoppingBag, Calendar, UserCog, Building2,
  Eye, EyeOff, AlertTriangle, Clock, CheckCircle2, Loader2, ChevronDown, ChevronUp,
  BarChart2, Megaphone, BookOpen, Tag, Settings, Rocket
} from 'lucide-react';
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

interface JobItem {
  id: number;
  order_number?: string;
  status: string;
  payment_status: string;
  balance?: string | number;
  due_date?: string;
  customer?: { name: string };
}

interface StaffPresence {
  id: number;
  role: string;
  user: { name: string; last_seen_at?: string | null };
  _onlineSince: number; // epoch ms when last_seen_at was first within 5 min
}

export default function DashboardPage() {
  const { shop, user } = useAuthStore();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'welcome'>('dashboard');

  // Visibility toggle
  const [shopVisible, setShopVisible] = useState<boolean | null>(null);
  const [visibilityLoading, setVisibilityLoading] = useState(false);

  // Balance alert
  const [unpaidJobs, setUnpaidJobs] = useState<JobItem[]>([]);
  const [balanceExpanded, setBalanceExpanded] = useState(false);

  // Daily/Weekly jobs
  const [allJobs, setAllJobs] = useState<JobItem[]>([]);

  // Online staff
  const [onlineStaff, setOnlineStaff] = useState<StaffPresence[]>([]);

  // Fetch online staff — reusable so we can call it on an interval too
  const fetchOnlineStaff = useCallback(() => {
    if (!shop) return;
    api.get(`/shops/${shop.id}/staff`)
      .then(res => {
        const raw: StaffPresence[] = (res.data.data || []);
        const FIVE_MIN = 5 * 60 * 1000;
        const now = Date.now();
        const online = raw
          .filter(s => {
            if (!s.user?.last_seen_at) return false;
            return now - new Date(s.user.last_seen_at).getTime() < FIVE_MIN;
          })
          .map(s => ({ ...s, _onlineSince: new Date(s.user.last_seen_at!).getTime() }))
          .sort((a, b) => a._onlineSince - b._onlineSince); // FIFO: first online = first in list
        setOnlineStaff(online);
      })
      .catch(() => {});
  }, [shop]);

  useEffect(() => {
    if (shop) {
      // Fetch analytics
      api.get(`/shops/${shop.id}/analytics`)
        .then(res => { setData(res.data.data); setLoading(false); })
        .catch(() => setLoading(false));
      // Fetch shop visibility
      api.get(`/shops/${shop.id}`)
        .then(res => setShopVisible(res.data.data?.is_visible ?? true))
        .catch(() => {});
      // Fetch all jobs for balance + due-date widgets
      api.get(`/shops/${shop.id}/jobs`)
        .then(res => {
          const rawData = res.data.data;
          const jobs: JobItem[] = Array.isArray(rawData) ? rawData : (rawData?.data || []);
          setAllJobs(jobs);
          const unpaid = jobs.filter(
            j => j.status === 'completed' && j.payment_status !== 'paid' && Number.parseFloat(String(j.balance || '0')) > 0
          );
          setUnpaidJobs(unpaid);
        })
        .catch(() => {});
      // Online staff
      fetchOnlineStaff();
    } else if (user) {
      setTimeout(() => setLoading(false), 0);
    } else {
      const timer = setTimeout(() => setLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [shop, user, fetchOnlineStaff]);

  // Keep the online staff list fresh every 30 s
  useEffect(() => {
    if (!shop) return;
    const interval = setInterval(fetchOnlineStaff, 30_000);
    return () => clearInterval(interval);
  }, [shop, fetchOnlineStaff]);

  const toggleVisibility = useCallback(async () => {
    if (!shop) return;
    setVisibilityLoading(true);
    const next = !shopVisible;
    setShopVisible(next);
    try {
      await api.put(`/shops/${shop.id}`, { is_visible: next });
    } catch {
      setShopVisible(!next); // revert
    } finally {
      setVisibilityLoading(false);
    }
  }, [shop, shopVisible]);

  // Due date helpers
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  const activeStatuses = new Set(['cutting', 'sewing', 'fitting', 'on_hold', 'pending', 'confirmed']);

  const dueToday = allJobs.filter(j => {
    if (!j.due_date || !activeStatuses.has(j.status)) return false;
    const d = new Date(j.due_date); d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const dueThisWeek = allJobs.filter(j => {
    if (!j.due_date || !activeStatuses.has(j.status)) return false;
    const d = new Date(j.due_date); d.setHours(0, 0, 0, 0);
    return d > today && d <= weekEnd;
  });


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

  const TABS: { readonly id: 'dashboard' | 'news' | 'welcome'; readonly label: string; readonly icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard',    icon: BarChart2 },
    { id: 'news',      label: 'System News',  icon: Megaphone },
    { id: 'welcome',   label: 'Welcome Guide', icon: BookOpen  },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Circular Navigation */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EBE6E0] pb-6">
        <div>
          <h1 className="font-heading text-3xl font-medium text-[#2D2A26] tracking-tight mb-1">
            Welcome Back, {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-[#827A73] text-sm font-sans">Manage your shop operations, read admin announcements, or check welcome tips.</p>
        </div>

        {/* Circular Pills Tab Switcher */}
        <div className="flex gap-1.5 bg-white border border-[#EBE6E0] p-1.5 rounded-full w-fit shadow-xs shrink-0 self-start md:self-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.id
                      ? 'bg-[#9A8073] text-white shadow-sm'
                      : 'text-[#827A73] hover:text-[#2D2A26] hover:bg-[#FAF6F3]'
                  }`}
                >
                  <Icon size={13} />
                  {tab.label}
                </button>
              );
            })}
        </div>
      </div>

      {/* 1. Dashboard View */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* ── Shop Visibility Toggle ───────────────────────────── */}
          {shopVisible !== null && (
            <div className="flex items-center justify-between bg-white border border-[#EBE6E0] rounded-2xl px-5 py-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  shopVisible ? 'bg-[#7A8B76]/10 border border-[#7A8B76]/20' : 'bg-[#A8A19A]/10 border border-[#A8A19A]/20'
                }`}>
                  {shopVisible
                    ? <Eye size={16} className="text-[#7A8B76]" />
                    : <EyeOff size={16} className="text-[#A8A19A]" />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2D2A26]">
                    Shop is <span className={shopVisible ? 'text-[#7A8B76]' : 'text-[#A8A19A]'}>{shopVisible ? 'Public' : 'Hidden'}</span>
                  </p>
                  <p className="text-xs text-[#A8A19A]">
                    {shopVisible ? 'Customers can find and book your shop.' : 'Your shop is hidden from the public catalog.'}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleVisibility}
                disabled={visibilityLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  shopVisible ? 'bg-[#7A8B76]' : 'bg-[#D1C7BD]'
                } disabled:opacity-60`}
                aria-label="Toggle shop visibility"
              >
                {visibilityLoading
                  ? <Loader2 size={10} className="absolute left-1 animate-spin text-white" />
                  : <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                      shopVisible ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                }
              </button>
            </div>
          )}

          {/* ── Balance Collection Alert ─────────────────────────── */}
          {unpaidJobs.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setBalanceExpanded(p => !p)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-amber-100/40 transition-colors"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle size={15} className="text-amber-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold text-amber-800">
                    {unpaidJobs.length} completed order{unpaidJobs.length === 1 ? '' : 's'} with outstanding balance
                  </p>
                  <p className="text-xs text-amber-600">
                    Total: ₱{unpaidJobs.reduce((sum, j) => sum + Number.parseFloat(String(j.balance || '0')), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                {balanceExpanded ? <ChevronUp size={16} className="text-amber-600 shrink-0" /> : <ChevronDown size={16} className="text-amber-600 shrink-0" />}
              </button>
              {balanceExpanded && (
                <div className="border-t border-amber-200 divide-y divide-amber-100">
                  {unpaidJobs.map(j => (
                    <Link key={j.id} href={`/dashboard/jobs/${j.id}`} className="flex items-center justify-between px-5 py-2.5 hover:bg-amber-100/30 transition-colors">
                      <div>
                        <p className="text-sm font-medium text-amber-900">{j.customer?.name || 'Walk-in'}</p>
                        <p className="text-xs text-amber-600">{j.order_number || `#${j.id}`}</p>
                      </div>
                      <span className="text-sm font-bold text-amber-800">
                        ₱{Number.parseFloat(String(j.balance || '0')).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Daily / Weekly Job Summary ───────────────────────── */}
          {(dueToday.length > 0 || dueThisWeek.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Due Today */}
              <div className="bg-white border border-[#EBE6E0] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#B26959]" />
                    <p className="text-sm font-semibold text-[#2D2A26]">Due Today</p>
                  </div>
                  <span className="bg-[#B26959]/10 text-[#B26959] border border-[#B26959]/20 text-xs font-bold px-2 py-0.5 rounded-full">
                    {dueToday.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {dueToday.length === 0
                    ? <p className="text-xs text-[#A8A19A] italic">Nothing due today 🎉</p>
                    : dueToday.map(j => (
                      <Link key={j.id} href={`/dashboard/jobs/${j.id}`} className="flex items-center justify-between py-1.5 border-b border-[#EBE6E0] last:border-0 hover:text-[#9A8073] transition-colors">
                        <p className="text-sm font-medium text-[#2D2A26] truncate">{j.customer?.name || 'Walk-in'}</p>
                        <span className="text-xs text-[#A8A19A] shrink-0 ml-2">{j.order_number || `#${j.id}`}</span>
                      </Link>
                    ))
                  }
                </div>
              </div>
              {/* Due This Week */}
              <div className="bg-white border border-[#EBE6E0] rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[#9A8073]" />
                    <p className="text-sm font-semibold text-[#2D2A26]">Due This Week</p>
                  </div>
                  <span className="bg-[#9A8073]/10 text-[#9A8073] border border-[#9A8073]/20 text-xs font-bold px-2 py-0.5 rounded-full">
                    {dueThisWeek.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {dueThisWeek.length === 0
                    ? <p className="text-xs text-[#A8A19A] italic">No upcoming deadlines</p>
                    : dueThisWeek.slice(0, 5).map(j => (
                      <Link key={j.id} href={`/dashboard/jobs/${j.id}`} className="flex items-center justify-between py-1.5 border-b border-[#EBE6E0] last:border-0 hover:text-[#9A8073] transition-colors">
                        <p className="text-sm font-medium text-[#2D2A26] truncate">{j.customer?.name || 'Walk-in'}</p>
                        <span className="text-xs text-[#A8A19A] shrink-0 ml-2">
                          {new Date(j.due_date!).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                        </span>
                      </Link>
                    ))
                  }
                </div>
              </div>
            </div>
          )}

          {/* Setup prompt for new shops with no data */}
          {!loading && data && !data.total_jobs && !data.total_services && !data.total_staff && (
            <div className="bg-linear-to-r from-[#FAF6F3] to-[#F0EAE3] border border-[#EBE6E0] rounded-2xl p-6 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <Rocket size={16} className="text-[#9A8073]" />
                <h2 className="text-base font-semibold text-[#2D2A26]">Let&apos;s get your shop set up</h2>
              </div>
              <p className="text-sm text-[#827A73] mb-4">Complete these quick steps to make your shop ready for customers.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Set Business Type', href: '/dashboard/settings',       icon: Settings,  desc: 'Tailoring Shop / Fashion Designer' },
                  { label: 'Add a Service',     href: '/dashboard/services',        icon: Package,   desc: 'What do you offer?' },
                  { label: 'Add Specialization',href: '/dashboard/specializations', icon: Tag,       desc: 'What do you specialize in?' },
                  { label: 'Add Staff',         href: '/dashboard/staff',           icon: Users,     desc: 'Invite your team' },
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex flex-col gap-1.5 bg-white border border-[#EBE6E0] rounded-xl p-4 hover:border-[#9A8073] hover:shadow-sm transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center text-[#9A8073] group-hover:bg-[#9A8073]/10 transition-colors">
                        <Icon size={16} />
                      </div>
                      <span className="text-sm font-medium text-[#2D2A26] group-hover:text-[#9A8073] transition-colors">{item.label}</span>
                      <span className="text-xs text-[#A8A19A]">{item.desc}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
              <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
                <span className="font-serif italic text-lg">₱</span>
              </div>
              <p className="text-sm font-medium text-[#524A44] mb-1">Total Revenue</p>
              <div className="flex items-center gap-3">
                <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">₱{data?.total_revenue ? data.total_revenue.toLocaleString('en-US', {minimumFractionDigits: 2}) : '0.00'}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
              <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
                <Scissors size={18} />
              </div>
              <p className="text-sm font-medium text-[#524A44] mb-1">Orders</p>
              <div className="flex items-center gap-3">
                <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_jobs || 0}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
              <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
                <ShoppingBag size={18} />
              </div>
              <p className="text-sm font-medium text-[#524A44] mb-1">Collections</p>
              <div className="flex items-center gap-3">
                <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_collections || 0}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
              <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
                <Users size={18} />
              </div>
              <p className="text-sm font-medium text-[#524A44] mb-1">Customers</p>
              <div className="flex items-center gap-3">
                <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_customers || 0}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
              <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
                <Calendar size={18} />
              </div>
              <p className="text-sm font-medium text-[#524A44] mb-1">Appointments</p>
              <div className="flex items-center gap-3">
                <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_appointments || 0}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
              <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
                <Package size={18} />
              </div>
              <p className="text-sm font-medium text-[#524A44] mb-1">Services</p>
              <div className="flex items-center gap-3">
                <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_services || 0}</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0]">
              <div className="w-10 h-10 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-4 text-[#827A73]">
                <UserCog size={18} />
              </div>
              <p className="text-sm font-medium text-[#524A44] mb-1">Staff</p>
              <div className="flex items-center gap-3">
                <p className="text-[28px] font-semibold text-[#2D2A26] tracking-tight">{data?.total_staff || 0}</p>
              </div>
            </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

            <div className="p-6 rounded-2xl bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-[15px] font-semibold text-[#2D2A26]">Recent Orders</h2>
                 <Link href="/dashboard/jobs" className="text-sm text-[#827A73] hover:text-[#2D2A26] transition-colors">View All</Link>
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

            {/* ── Staff Online Now (3rd column) ─────────────────── */}
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0] p-6 flex flex-col">
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#2D2A26]">Staff Online Now</h2>
                  <p className="text-xs text-[#A8A19A] mt-0.5">Active in the last 5 minutes · FIFO</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[#7A8B76] bg-[#7A8B76]/10 border border-[#7A8B76]/20 px-2.5 py-1 rounded-full shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7A8B76] animate-pulse" />
                  {onlineStaff.length} Online
                </span>
              </div>

              <div className="flex-1">
                {onlineStaff.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                    <div className="w-12 h-12 rounded-full bg-[#FAF6F3] border border-[#EBE6E0] flex items-center justify-center mb-3">
                      <UserCog size={20} className="text-[#C5BDBA]" />
                    </div>
                    <p className="text-sm text-[#A8A19A] font-medium">No staff online right now</p>
                    <p className="text-xs text-[#C5BDBA] mt-1">Staff appear here when they log in</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#EBE6E0]">
                    {onlineStaff.map((member, idx) => {
                      const initials = member.user.name
                        .split(' ')
                        .map(w => w[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      const roleLabel = member.role
                        ? member.role.charAt(0).toUpperCase() + member.role.slice(1).replace(/_/g, ' ')
                        : 'Staff';
                      const avatarColors = [
                        'bg-[#9A8073] text-white',
                        'bg-[#7A8B76] text-white',
                        'bg-[#8B7B6B] text-white',
                        'bg-[#6B7B8B] text-white',
                      ];
                      const avatarClass = avatarColors[idx % avatarColors.length];

                      return (
                        <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                          {/* Circle avatar */}
                          <div className="relative shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold select-none ${avatarClass}`}>
                              {initials}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#7A8B76] border-2 border-white" />
                          </div>

                          {/* Name + role */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[16px] font-semibold text-[#2D2A26] leading-tight truncate">{member.user.name}</p>
                            <span className="inline-block mt-0.5 text-[10px] font-medium text-[#827A73] bg-[#F0EAE3] px-2 py-0.5 rounded-full">
                              {roleLabel}
                            </span>
                          </div>

                          {/* FIFO number */}
                          <span className="text-xs text-[#C5BDBA] font-medium shrink-0">#{idx + 1}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>
      )}

      {/* 2. System News View */}
      {activeTab === 'news' && (
        <div className="space-y-6 animate-fade-in">
          <div>
            <h2 className="text-lg font-semibold text-[#2D2A26] mb-1">System News & Updates</h2>
            <p className="text-[#827A73] text-sm">Stay informed with direct announcements and platform releases from SUTURA admins.</p>
          </div>

          <div className="space-y-4">
            {[
              {
                title: "👗 New Feature: Gown & Barong Rental Configurations Added",
                date: "June 20, 2026",
                badge: "Feature Update",
                badgeColor: "bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20",
                content: "Fashion designers and hybrid shops can now manage security deposits, late return fines, fitting limits, rescheduling charges, and select supported shipping options (Lalamove, Toktok, Grab Express, etc.) directly in their Settings panel."
              },
              {
                title: "📋 Feature Update: Dynamic Custom Fields on Services",
                date: "June 20, 2026",
                badge: "Feature Update",
                badgeColor: "bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20",
                content: "You can now configure customized field specifications (like sports jersey names, numbers, or specific body choices) on each of your services, making bespoke orders extremely structured and error-free."
              },
              {
                title: "🛠️ Scheduled System Storage Maintenance",
                date: "June 18, 2026",
                badge: "Maintenance",
                badgeColor: "bg-[#B26959]/10 text-[#B26959] border-[#B26959]/20",
                content: "We will be executing database storage optimizations on June 25, 2026, from 2:00 AM to 2:05 AM PHT. Expected service disruption is less than 5 minutes. Thank you for your cooperation."
              },
              {
                title: "🚀 Welcome to SUTURA Tracker System!",
                date: "June 13, 2026",
                badge: "Announcement",
                badgeColor: "bg-blue-600/10 text-blue-600 border-blue-600/20",
                content: "Welcome to SUTURA Capstone Portal! We are live. Log in, configure your operating hours and map coordinates in Settings to let consumers find and contact your branches."
              }
            ].map((item) => (
              <div key={item.title} className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-xs hover:border-[#D1C7BD] transition-all">
                <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                  <h3 className="font-semibold text-base text-[#2D2A26]">{item.title}</h3>
                  <span className={`text-[11px] font-semibold uppercase px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <p className="text-xs text-[#A8A19A] mb-3">{item.date}</p>
                <p className="text-sm text-[#524A44] leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Welcome Onboarding Guide */}
      {activeTab === 'welcome' && (
        <div className="bg-white border border-[#EBE6E0] rounded-3xl p-8 max-w-4xl mx-auto shadow-xs space-y-8 animate-fade-in">
          <div className="text-center space-y-3 pb-6 border-b border-[#FAF6F3]">
            <div className="w-16 h-16 bg-[#FAF6F3] rounded-full flex items-center justify-center mx-auto text-[#9A8073]">
              <BookOpen size={28} />
            </div>
            <h2 className="text-2xl font-heading font-semibold text-[#2D2A26]">Welcome to SUTURA Tailoring Tracker</h2>
            <p className="text-[#827A73] text-sm max-w-md mx-auto">Here is a quick guide on how to configure and maximize your digital storefront to capture more business.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {([
              {
                step: "Step 1",
                title: "Declare Specializations",
                desc: "Go to Specializations to pick categories (Gown, Barong, Jersey, Cosplay) or add custom ones. Set starting prices, MOQ, and sewing days so customers know exactly what you offer.",
                icon: Tag,
                href: "/dashboard/specializations"
              },
              {
                step: "Step 2",
                title: "Configure Services & Fields",
                desc: "Go to Services to define what garments you sew. Enable customized dynamic specifications (like custom name/number fields) so customers provide all measurements correctly during fittings.",
                icon: Package,
                href: "/dashboard/services"
              },
              {
                step: "Step 3",
                title: "Setup Operating Hours & Coordinates",
                desc: "Open Shop Settings to select your Business Type, set map coordinates (so your branch gets discoverable), define operating hours, and customize rental deposits or fitting policies.",
                icon: Settings,
                href: "/dashboard/settings"
              },
              {
                step: "Step 4",
                title: "Track Garment Production",
                desc: "Use the Jobs panel to monitor active sewing workflows (cutting, sewing, fitted, finished). Assign staff, track downpayments, and coordinate order statuses in real-time.",
                icon: Scissors,
                href: "/dashboard/jobs"
              }
            ] as { step: string; title: string; desc: string; icon: React.ElementType; href: string }[]).map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-2xl p-6 flex gap-4 transition-all hover:border-[#D1C7BD]">
                  <div className="bg-white border border-[#EBE6E0] w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-[#9A8073]">
                    <Icon size={22} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-[#9A8073] uppercase tracking-wider">{item.step}</span>
                    <h4 className="font-semibold text-sm text-[#2D2A26]">{item.title}</h4>
                    <p className="text-xs text-[#827A73] leading-relaxed mb-3">{item.desc}</p>
                    <Link href={item.href} className="text-xs font-semibold text-[#9A8073] hover:text-[#91756A] flex items-center gap-1.5 transition-colors">
                      Configure now →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-6 border-t border-[#FAF6F3] flex justify-between items-center flex-wrap gap-4 text-xs text-[#A8A19A]">
            <p>Need support? Feel free to contact our administrative team via Support Tickets.</p>
            <Link href="/dashboard/support" className="px-4 py-2 bg-[#9A8073] hover:bg-[#91756A] text-white rounded-lg font-medium transition-all shadow-xs">
              Create Ticket
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
