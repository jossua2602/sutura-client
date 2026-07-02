import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Plus, MoreVertical, Edit2, Trash2, AlertCircle } from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';

export interface SpecialHourData {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
  special_open_time?: string;
  special_close_time?: string;
  announcement_message?: string;
}

export default function StorefrontSchedules({ specialHours: initialSpecialHours }: { specialHours: SpecialHourData[] }) {
  const { shop } = useAuthStore();
  const toast = useToast();
  
  const [specialHours, setSpecialHours] = useState(initialSpecialHours || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [openTime, setOpenTime] = useState('09:00');
  const [closeTime, setCloseTime] = useState('18:00');
  const [announcement, setAnnouncement] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  const [prevInitial, setPrevInitial] = useState(initialSpecialHours);

  if (initialSpecialHours !== prevInitial) {
    setPrevInitial(initialSpecialHours);
    setSpecialHours(initialSpecialHours || []);
  }

  // Click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSpecialHours = async () => {
    if (!shop) return;
    try {
      const res = await api.get(`/shops/${shop.id}/special-hours`);
      setSpecialHours(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setTitle('');
    setStartDate('');
    setEndDate('');
    setIsClosed(false);
    setOpenTime('09:00');
    setCloseTime('18:00');
    setAnnouncement('');
    setIsModalOpen(true);
    setMenuOpenId(null);
  };

  const openEditModal = (s: SpecialHourData) => {
    setEditingId(s.id);
    setTitle(s.title);
    setStartDate(s.start_date);
    setEndDate(s.end_date);
    setIsClosed(s.is_closed);
    setOpenTime(s.special_open_time || '09:00');
    setCloseTime(s.special_close_time || '18:00');
    setAnnouncement(s.announcement_message || '');
    setIsModalOpen(true);
    setMenuOpenId(null);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    if (!title.trim() || !startDate || !endDate) {
      toast.error('Title, Start Date, and End Date are required.');
      return;
    }

    const payload = {
      title,
      start_date: startDate,
      end_date: endDate,
      is_closed: isClosed ? 1 : 0,
      special_open_time: isClosed ? null : openTime,
      special_close_time: isClosed ? null : closeTime,
      announcement_message: announcement.trim() || null,
    };

    try {
      if (editingId) {
        await api.put(`/shops/${shop.id}/special-hours/${editingId}`, payload);
        toast.success('Temporary schedule updated successfully!');
      } else {
        await api.post(`/shops/${shop.id}/special-hours`, payload);
        toast.success('Temporary schedule added successfully!');
      }
      setIsModalOpen(false);
      fetchSpecialHours();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save temporary schedule.');
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!shop) return;
    if (!window.confirm('Are you sure you want to delete this temporary schedule?')) return;

    try {
      await api.delete(`/shops/${shop.id}/special-hours/${id}`);
      toast.success('Temporary schedule deleted.');
      setMenuOpenId(null);
      fetchSpecialHours();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete schedule.');
    }
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-extrabold text-[#2D2A26] mb-1 flex items-center gap-2">
            Temporary Schedules
          </h3>
          <p className="text-sm text-[#827A73] mb-6">Manage holidays, closures, or special announcements.</p>
        </div>
        <button
          onClick={openAddModal}
          className="text-[13px] font-semibold text-white bg-[#9A8073] border border-[#9A8073] px-3 py-2 rounded-lg hover:bg-[#8A7063] transition-colors flex items-center gap-1.5 shadow-sm"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      {specialHours.length === 0 ? (
        <div className="text-center py-8 px-4 bg-white border border-[#EBE6E0] rounded-xl shadow-sm">
          <Calendar size={32} className="mx-auto text-[#A8A19A] mb-3" />
          <p className="text-sm font-semibold text-[#524A44]">No temporary schedules set</p>
          <p className="text-xs text-[#A8A19A] mt-1">Your regular weekly operating hours are currently active.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {specialHours.map((s: SpecialHourData) => (
            <div key={s.id} className="bg-white border border-[#EBE6E0] rounded-xl p-4 shadow-sm relative overflow-visible">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#9A8073]"></div>
              
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <h5 className="text-sm font-bold text-[#2D2A26]">{s.title}</h5>
                  {s.is_closed ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-100">
                      Closed
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                      Special Hours
                    </span>
                  )}
                </div>

                {/* 3-Dot Menu */}
                <div className="relative" ref={menuOpenId === s.id ? menuRef : null}>
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === s.id ? null : s.id)}
                    className="p-1 text-[#A8A19A] hover:bg-[#FAF6F3] rounded-md transition-colors"
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpenId === s.id && (
                    <div className="absolute right-0 mt-1 w-36 bg-white border border-[#EBE6E0] rounded-xl shadow-lg z-10 py-1 overflow-hidden">
                      <button
                        onClick={() => openEditModal(s)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors"
                      >
                        <Edit2 size={14} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSchedule(s.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#B26959] hover:bg-[#B26959]/5 transition-colors"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#827A73] mb-2 font-medium">
                <Calendar size={12} className="inline mr-1 text-[#9A8073]" />
                {new Date(s.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(s.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              
              {!s.is_closed && (
                <p className="text-xs text-[#524A44] mb-2 font-medium">
                  Hours: {s.special_open_time} - {s.special_close_time}
                </p>
              )}

              {s.announcement_message && (
                <div className="mt-2 text-sm bg-amber-50 border border-amber-200 text-amber-900 px-3 py-2 rounded-lg flex items-start gap-2 shadow-sm">
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-600" />
                  <span>{s.announcement_message}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBE6E0]">
              <h2 className="text-lg font-bold text-[#2D2A26]">{editingId ? 'Edit Schedule' : 'New Temporary Schedule'}</h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-[#827A73] hover:text-[#2D2A26] transition-colors font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="schedule-form" onSubmit={handleSaveSchedule} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-[#2D2A26] mb-1.5">Schedule Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    required
                    placeholder="e.g. Christmas Break, Summer Renovation"
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#9A8073]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#2D2A26] mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      required
                      className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#9A8073]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#2D2A26] mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      required
                      className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#9A8073]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-[#FAF6F3] p-4 rounded-xl border border-[#EBE6E0]">
                  <input
                    type="checkbox"
                    id="isClosed"
                    checked={isClosed}
                    onChange={e => setIsClosed(e.target.checked)}
                    className="w-4 h-4 text-[#9A8073] border-[#EBE6E0] rounded focus:ring-[#9A8073]"
                  />
                  <label htmlFor="isClosed" className="text-sm font-medium text-[#2D2A26] cursor-pointer">
                    Fully Closed for these dates
                  </label>
                </div>

                {!isClosed && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#2D2A26] mb-1.5">Special Open Time</label>
                      <input
                        type="time"
                        value={openTime}
                        onChange={e => setOpenTime(e.target.value)}
                        required={!isClosed}
                        className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#9A8073]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#2D2A26] mb-1.5">Special Close Time</label>
                      <input
                        type="time"
                        value={closeTime}
                        onChange={e => setCloseTime(e.target.value)}
                        required={!isClosed}
                        className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#9A8073]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-[#2D2A26] mb-1.5">
                    Announcement Message <span className="text-[#827A73] font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={announcement}
                    onChange={e => setAnnouncement(e.target.value)}
                    placeholder="e.g. We are having our annual Staff Planning Day. Online bookings are disabled."
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#9A8073] min-h-[80px]"
                  />
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-[#EBE6E0] flex justify-end gap-3 bg-[#FAF6F3] rounded-b-2xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-semibold text-[#524A44] hover:bg-[#EBE6E0] rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="schedule-form"
                className="px-5 py-2.5 bg-[#9A8073] text-white text-sm font-semibold rounded-xl hover:bg-[#8A7063] transition-colors"
              >
                {editingId ? 'Save Changes' : 'Add Schedule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
