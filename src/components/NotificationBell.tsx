'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import api from '@/lib/axios';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[#EBE6E0] text-[#524A44] hover:bg-[#D1C7BD] transition-colors"
      >
        <Bell size={20} fill="currentColor" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 bg-[#E41E3F] text-white text-[11px] font-bold rounded-full border-2 border-white">
            {notifications.length > 99 ? '99+' : notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-sm border border-[#EBE6E0] rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-3 border-b border-[#EBE6E0] flex items-center justify-between">
            <span className="font-medium text-[#2D2A26] text-sm">Notifications</span>
            {notifications.length > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-[var(--brand-taupe)] hover:text-[var(--brand-taupe-hover)]"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-[#A8A19A] text-sm">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {notifications.map(n => (
                  <div key={n.id} className="p-3 hover:bg-[#F0EAE3]/50 transition-colors group flex gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200">{n.data?.message || 'New notification'}</p>
                      <p className="text-xs text-[#A8A19A] mt-1">{new Date(n.created_at).toLocaleDateString()}</p>
                    </div>
                    <button 
                      onClick={() => markAsRead(n.id)}
                      className="text-[#A8A19A] hover:text-[#7A8B76] opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
