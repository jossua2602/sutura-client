import React from 'react';
import { Clock } from 'lucide-react';

interface SettingsOperatingHoursProps {
  readonly operatingHours: Record<string, { is_open: boolean; open: string; close: string }>;
  readonly onHoursChange: (day: string, field: 'is_open' | 'open' | 'close', value: string | boolean) => void;
}

export default function SettingsOperatingHours({
  operatingHours,
  onHoursChange,
}: SettingsOperatingHoursProps) {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-lg font-medium text-[#2D2A26] flex items-center gap-2">
          <Clock size={20} className="text-[#827A73]" />
          Operating Hours
        </h2>
        <p className="text-sm text-[#827A73] mt-1">
          Set the regular hours your shop is open for business. Customers will use this to book appointments.
        </p>
      </div>
      <div className="space-y-3">
        {days.map(day => (
          <div key={day} className="flex items-center justify-between p-3 rounded-xl border border-[#EBE6E0] bg-[#FAF6F3]">
            <div className="flex items-center gap-4 w-32">
              <input
                type="checkbox"
                checked={operatingHours[day]?.is_open || false}
                onChange={e => onHoursChange(day, 'is_open', e.target.checked)}
                className="w-4 h-4 text-taupe border-[#EBE6E0] rounded focus:ring-taupe"
              />
              <span className="text-sm font-medium text-[#2D2A26] capitalize">{day}</span>
            </div>
            <div className="flex items-center gap-3 flex-1 justify-end">
              {operatingHours[day]?.is_open ? (
                <>
                  <input
                    type="time"
                    value={operatingHours[day]?.open || '09:00'}
                    onChange={e => onHoursChange(day, 'open', e.target.value)}
                    className="px-3 py-1.5 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:border-taupe outline-none"
                  />
                  <span className="text-[#A8A19A] text-sm">to</span>
                  <input
                    type="time"
                    value={operatingHours[day]?.close || '18:00'}
                    onChange={e => onHoursChange(day, 'close', e.target.value)}
                    className="px-3 py-1.5 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:border-taupe outline-none"
                  />
                </>
              ) : (
                <span className="text-sm text-[#B26959] font-medium px-4 py-1.5 bg-[#B26959]/10 rounded-lg">
                  Closed
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
