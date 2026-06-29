import React from 'react';

interface DashboardHeaderProps {
  readonly userName: string;
}

export default function DashboardHeader({
  userName,
}: Readonly<DashboardHeaderProps>) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#EBE6E0] text-[#2D2A26]">
      <div>
        <h1 className="font-heading text-3xl font-medium text-[#2D2A26] tracking-tight mb-1">
          Welcome Back, {userName.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-[#827A73] text-sm font-sans">
          Manage your tailoring shop operations, customer bookings, and staff presence in real-time.
        </p>
      </div>
    </div>
  );
}
