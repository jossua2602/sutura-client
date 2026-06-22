import React from 'react';
import { UserCog } from 'lucide-react';
import { StaffPresence } from './dashboardHelpers';

interface StaffOnlineProps {
  onlineStaff: StaffPresence[];
}

export default function StaffOnline({
  onlineStaff,
}: StaffOnlineProps) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-[#EBE6E0] p-6 flex flex-col text-[#2D2A26]">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-[15px] font-semibold text-[#2D2A26]">Staff Online Now</h2>
          <p className="text-xs text-[#A8A19A] mt-0.5">Active in the last 5 minutes</p>
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
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-bold select-none ${avatarClass}`}>
                      {initials}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#7A8B76] border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[16px] font-semibold text-[#2D2A26] leading-tight truncate">{member.user.name}</p>
                    <span className="inline-block mt-0.5 text-[10px] font-medium text-[#827A73] bg-[#F0EAE3] px-2 py-0.5 rounded-full">
                      {roleLabel}
                    </span>
                  </div>

                  <span className="text-xs text-[#C5BDBA] font-medium shrink-0">#{idx + 1}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
