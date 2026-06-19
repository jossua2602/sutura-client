'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Search, Calendar as CalendarIcon, MoreVertical, List, LayoutGrid, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';

interface Appointment {
  id: number;
  customer: { name: string; email: string };
  service: { name: string };
  scheduled_at: string;
  status: string;
  notes: string;
}

interface ServiceData { id: number; name: string }
interface CustomerData { id: number; name: string }

export default function AppointmentsPage() {
  const { shop , user } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    customer_id: '',
    service_id: '',
    scheduled_date: '',
    scheduled_time: '',
    notes: ''
  });

  const [services, setServices] = useState<ServiceData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);

  const fetchAppointments = () => {
    if (!shop) return;
    api.get(`/shops/${shop.id}/appointments`)
      .then(res => {
        setAppointments(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAppointments();
    if (shop) {
      api.get(`/shops/${shop.id}/services`).then(res => setServices(res.data.data));
      api.get(`/shops/${shop.id}/customers`).then(res => setCustomers(res.data.data));
    } else if (user && !shop) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop, user]);

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const payload = {
        customer_id: formData.customer_id,
        service_id: formData.service_id || null,
        scheduled_at: `${formData.scheduled_date} ${formData.scheduled_time}:00`,
        notes: formData.notes
      };

      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/appointments/${editingId}`, payload);
        // We will do a full refetch here because the backend might return updated relationships (customer name, service name)
        // that are complex to manually build. Let's do a fast refetch or update state if we have all data.
        // Actually, let's just do a refetch for now if it's complex, or we can manually build it.
        // The user specifically requested not to refresh everything. Let's do a manual build.
        const updatedApt = res.data.data;
        const cust = customers.find(c => c.id.toString() === formData.customer_id);
        const serv = services.find(s => s.id.toString() === formData.service_id);
        
        const localApt = {
          ...updatedApt,
          customer: cust ? { name: cust.name, email: '' } : { name: 'Unknown', email: '' },
          service: serv ? { name: serv.name } : { name: 'Consultation' }
        };
        setAppointments(prev => prev.map(a => a.id === editingId ? localApt : a));
      } else {
        const res = await api.post(`/shops/${shop.id}/appointments`, payload);
        const newApt = res.data.data;
        const cust = customers.find(c => c.id.toString() === formData.customer_id);
        const serv = services.find(s => s.id.toString() === formData.service_id);
        
        const localApt = {
          ...newApt,
          customer: cust ? { name: cust.name, email: '' } : { name: 'Unknown', email: '' },
          service: serv ? { name: serv.name } : { name: 'Consultation' }
        };
        setAppointments(prev => [...prev, localApt]);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ customer_id: '', service_id: '', scheduled_date: '', scheduled_time: '', notes: '' });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (apt: Appointment) => {
    setEditingId(apt.id);
    const dateObj = new Date(apt.scheduled_at);
    // Format date to YYYY-MM-DD
    const dateStr = dateObj.toISOString().split('T')[0];
    // Format time to HH:MM
    const timeStr = dateObj.toTimeString().substring(0, 5);

    // Find ids
    const custId = customers.find(c => c.name === apt.customer?.name)?.id?.toString() || '';
    const servId = services.find(s => s.name === apt.service?.name)?.id?.toString() || '';

    setFormData({
      customer_id: custId,
      service_id: servId,
      scheduled_date: dateStr,
      scheduled_time: timeStr,
      notes: apt.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/appointments/${deletingId}`);
      setAppointments(prev => prev.filter(a => a.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to remove appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ customer_id: '', service_id: '', scheduled_date: '', scheduled_time: '', notes: '' });
    setError('');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-zinc-500/10 text-[#827A73] border-zinc-500/20',
      confirmed: 'bg-[#9A8073]/10 text-taupe border-[#9A8073]/20',
      completed: 'bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20',
      cancelled: 'bg-[#B26959]/10 text-[#B26959] border-[#B26959]/20',
    };
    return colors[status] || colors.pending;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    return { daysInMonth, firstDayOfMonth };
  };

  const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Appointments</h1>
          <p className="text-[#827A73] text-sm mt-1">Schedule and manage client fittings.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white shadow-sm border border-[#EBE6E0] rounded-lg p-1">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#F0EAE3] text-[#2D2A26]' : 'text-[#A8A19A] hover:text-[#524A44]'}`}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-[#F0EAE3] text-[#2D2A26]' : 'text-[#A8A19A] hover:text-[#524A44]'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button 
            onClick={() => {
              setEditingId(null);
              setFormData({ customer_id: '', service_id: '', scheduled_date: '', scheduled_time: '', notes: '' });
              setError('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            New Appointment
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm">
        {viewMode === 'list' ? (
          <>
            <div className="p-4 border-b border-[#EBE6E0] flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
                <input 
                  type="text" 
                  placeholder="Search appointments..." 
                  className="pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors w-64"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#524A44]">
                <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
                  <tr>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Service</th>
                    <th className="px-6 py-4 font-medium">Scheduled At</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[#A8A19A]">
                        Loading appointments...
                      </td>
                    </tr>
                  ) : appointments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-[#A8A19A]">
                        No appointments scheduled.
                      </td>
                    </tr>
                  ) : (
                    appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-[#F0EAE3]/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-[#2D2A26]">{apt.customer?.name}</td>
                        <td className="px-6 py-4 text-[#827A73]">{apt.service?.name || 'Consultation'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <CalendarIcon size={14} className="text-[#A8A19A]" />
                            <span>{new Date(apt.scheduled_at).toLocaleDateString()}</span>
                            <span className="text-[#A8A19A]">{new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(apt.status)}`}>
                            {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleEditClick(apt)} className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1">
                              <Pencil size={16} />
                            </button>
                            <button onClick={() => handleDeleteClick(apt.id)} className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#2D2A26]">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-2">
                <button onClick={prevMonth} className="p-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#2D2A26] transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={nextMonth} className="p-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#2D2A26] transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-[#A8A19A] uppercase py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {paddingDays.map(i => (
                <div key={`empty-${i}`} className="min-h-24 bg-[#FAF6F3]/30 rounded-lg border border-[#EBE6E0]/30"></div>
              ))}
              
              {daysArray.map(day => {
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = appointments.filter(apt => apt.scheduled_at.startsWith(dateStr));
                
                return (
                  <div key={day} className="min-h-24 bg-[#FAF6F3]/80 rounded-lg border border-[#EBE6E0] p-2 group hover:border-[#9A8073]/50 transition-colors">
                    <div className="text-right text-xs font-medium text-[#A8A19A] group-hover:text-[#524A44] mb-1">{day}</div>
                    <div className="space-y-1">
                      {dayEvents.map(event => (
                        <div key={event.id} className="text-[10px] px-1.5 py-1 rounded truncate bg-[#9A8073]/20 text-indigo-300 border border-[#9A8073]/20">
                          {new Date(event.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {event.customer?.name}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Appointment Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Appointment" : "Schedule Appointment"}>
        <form onSubmit={handleAddAppointment} className="space-y-4">
          {error && (
            <div className="bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Customer</label>
            <select
              required
              value={formData.customer_id}
              onChange={e => setFormData({...formData, customer_id: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
            >
              <option value="" disabled>Select a customer</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Service (Optional)</label>
            <select
              value={formData.service_id}
              onChange={e => setFormData({...formData, service_id: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
            >
              <option value="">No specific service</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Date</label>
              <input 
                type="date" 
                required
                value={formData.scheduled_date}
                onChange={e => setFormData({...formData, scheduled_date: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Time</label>
              <input 
                type="time" 
                required
                value={formData.scheduled_time}
                onChange={e => setFormData({...formData, scheduled_time: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Notes (Optional)</label>
            <textarea 
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe h-20 resize-none"
              placeholder="Any special requests or details..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {editingId ? "Save Changes" : "Save Appointment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Cancel Appointment">
        <div className="space-y-4">
          <p className="text-[#524A44] text-sm">
            Are you sure you want to delete this appointment?
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              Close
            </button>
            <button 
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
