import React from 'react';
import { TABS } from './dashboardHelpers';

interface DashboardHeaderProps {
  userName: string;
  activeTab: 'dashboard' | 'news' | 'welcome';
  setActiveTab: (tab: 'dashboard' | 'news' | 'welcome') => void;
}

export default function DashboardHeader({
  userName,
  activeTab,
  setActiveTab,
}: DashboardHeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#EBE6E0] pb-6 text-[#2D2A26]">
      <div>
        <h1 className="font-heading text-3xl font-medium text-[#2D2A26] tracking-tight mb-1">
          Welcome Back, {userName.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-[#827A73] text-sm font-sans">Manage your shop operations, read admin announcements, or check welcome tips.</p>
      </div>

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
  );
}
