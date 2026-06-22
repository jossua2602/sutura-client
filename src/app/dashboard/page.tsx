'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Settings, Package, Tag, Users } from 'lucide-react';
import Link from 'next/link';

import { AnalyticsData, JobItem, StaffPresence } from '@/components/dashboard/dashboardHelpers';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import DashboardAlerts from '@/components/dashboard/DashboardAlerts';
import DashboardMetrics from '@/components/dashboard/DashboardMetrics';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import StaffOnline from '@/components/dashboard/StaffOnline';
import RecentReviews from '@/components/dashboard/RecentReviews';
import NewsView from '@/components/dashboard/NewsView';
import WelcomeView from '@/components/dashboard/WelcomeView';

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

  const fetchOnlineStaff = useCallback(() => {
    if (!shop?.id) return;
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
          .sort((a, b) => a._onlineSince - b._onlineSince);
        setOnlineStaff(online);
      })
      .catch(() => {});
  }, [shop?.id]);

  useEffect(() => {
    if (shop?.id) {
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
    } else if (user?.id) {
      setTimeout(() => setLoading(false), 0);
    } else {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [shop?.id, user?.id, fetchOnlineStaff]);

  useEffect(() => {
    if (!shop?.id) return;
    const interval = setInterval(fetchOnlineStaff, 30_000);
    return () => clearInterval(interval);
  }, [shop?.id, fetchOnlineStaff]);

  const toggleVisibility = async () => {
    if (!shop) return;
    setVisibilityLoading(true);
    const next = !shopVisible;
    setShopVisible(next);
    try {
      await api.put(`/shops/${shop.id}`, { is_visible: next });
    } catch {
      setShopVisible(!next);
    } finally {
      setVisibilityLoading(false);
    }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
  const activeStatuses = new Set(['cutting', 'sewing', 'fitting', 'pending', 'confirmed']);

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
    return <div className="animate-pulse text-[#A8A19A] font-medium p-6">Loading store metrics...</div>;
  }

  const promptSetup = data && !data.total_jobs && !data.total_services && !data.total_staff;

  return (
    <div className="space-y-6 pb-12 text-[#2D2A26]">
      <DashboardHeader
        userName={user?.name || ''}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          <DashboardAlerts
            shopVisible={shopVisible}
            toggleVisibility={toggleVisibility}
            visibilityLoading={visibilityLoading}
            unpaidJobs={unpaidJobs}
            balanceExpanded={balanceExpanded}
            setBalanceExpanded={setBalanceExpanded}
            dueToday={dueToday}
            dueThisWeek={dueThisWeek}
          />

          {promptSetup && (
            <div className="bg-linear-to-r from-[#FAF6F3] to-[#F0EAE3] border border-[#EBE6E0] rounded-2xl p-6 mb-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[#9A8073]">🚀</span>
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

          <DashboardMetrics data={data} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <DashboardCharts data={data} />
            </div>
            <div className="space-y-6">
              <StaffOnline onlineStaff={onlineStaff} />
              <RecentReviews />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'news' && <NewsView />}

      {activeTab === 'welcome' && <WelcomeView />}
    </div>
  );
}
