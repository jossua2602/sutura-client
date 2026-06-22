'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Search, List, LayoutGrid, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

import {
  Appointment, ServiceData, CustomerData, BranchData, StaffData, JobOrderData, AppointmentStatus, AppointmentType,
  APPOINTMENT_TYPES, TYPE_CONFIG, STATUS_CONFIG, getErrorMessage
} from '@/components/appointments/appointmentHelpers';
import AppointmentCreateModal from '@/components/appointments/AppointmentCreateModal';
import AppointmentActionModals from '@/components/appointments/AppointmentActionModals';
import AppointmentCalendarView from '@/components/appointments/AppointmentCalendarView';
import AppointmentListView from '@/components/appointments/AppointmentListView';

export default function AppointmentsPage() {
  const { shop, user } = useAuthStore();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [viewMode, setViewMode]         = useState<'list' | 'calendar'>('list');
  const [calSubMode, setCalSubMode]     = useState<'month' | 'day'>('month');
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all');
  const [typeFilter, setTypeFilter]     = useState<AppointmentType | 'all'>('all');
  const [search, setSearch]             = useState('');
  const [currentDate, setCurrentDate]   = useState(new Date());
  const [selectedDay, setSelectedDay]   = useState<Date | null>(null);
  const [hoveredAptId, setHoveredAptId] = useState<number | null>(null);

  // Modal visibility
  const [showCreateModal,    setShowCreateModal]    = useState(false);
  const [showReviewModal,    setShowReviewModal]    = useState(false);
  const [showRescheduleModal,setShowRescheduleModal]= useState(false);
  const [showCompleteModal,  setShowCompleteModal]  = useState(false);
  const [showCancelModal,    setShowCancelModal]    = useState(false);
  const [showViewModal,      setShowViewModal]      = useState(false);

  // Active appointment contexts
  const [editingApt,    setEditingApt]    = useState<Appointment | null>(null);
  const [reviewApt,     setReviewApt]     = useState<Appointment | null>(null);
  const [rescheduleApt, setRescheduleApt] = useState<Appointment | null>(null);
  const [completeApt,   setCompleteApt]   = useState<Appointment | null>(null);
  const [cancelApt,     setCancelApt]     = useState<Appointment | null>(null);
  const [viewApt,       setViewApt]       = useState<Appointment | null>(null);

  // Loading/error states
  const [isSubmitting,    setIsSubmitting]    = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError]                     = useState('');

  // Reference data
  const [services,  setServices]  = useState<ServiceData[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [branches,  setBranches]  = useState<BranchData[]>([]);
  const [staff,     setStaff]     = useState<StaffData[]>([]);
  const [jobOrders, setJobOrders] = useState<JobOrderData[]>([]);

  const todayStr = new Date().toISOString().split('T')[0];

  const minTimeFor = (dateStr: string): string => {
    if (dateStr !== todayStr) return '00:00';
    const now   = new Date();
    const mins  = now.getHours() * 60 + now.getMinutes();
    const round = Math.ceil(mins / 15) * 15;
    return `${String(Math.floor(round / 60) % 24).padStart(2, '0')}:${String(round % 60).padStart(2, '0')}`;
  };

  const fetchAppointments = useCallback(() => {
    if (!shop?.id) return;
    api.get(`/shops/${shop.id}/appointments`)
      .then(res => { setAppointments(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shop?.id]);

  useEffect(() => {
    fetchAppointments();
  }, [shop?.id, fetchAppointments]);

  useEffect(() => {
    if (shop?.id) {
      api.get(`/shops/${shop.id}/services`).then(r => setServices(r.data.data)).catch(() => {});
      api.get(`/shops/${shop.id}/customers`).then(r => setCustomers(r.data.data)).catch(() => {});
      api.get(`/shops/${shop.id}/branches`).then(r => setBranches(r.data.data)).catch(() => {});
      api.get(`/shops/${shop.id}/staff`).then(r => setStaff(r.data.data)).catch(() => {});
      api.get(`/shops/${shop.id}/jobs`).then(r => setJobOrders(r.data.data)).catch(() => {});
    } else if (user?.id && !shop?.id) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [shop?.id, user?.id]);

  const userRoles: string[] = user?.roles?.map(r => r.name) ?? [];
  const isOwnerOrManager = userRoles.some(r => ['shop_owner', 'branch_manager'].includes(r));

  // Confirm / Reject Review
  const handleConfirmReview = async (id: number) => {
    if (!shop) return;
    setActionLoadingId(id);
    try {
      await api.put(`/shops/${shop.id}/appointments/${id}`, { status: 'confirmed' });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
      setShowReviewModal(false);
      setReviewApt(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to confirm appointment.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectReview = async (id: number) => {
    if (!shop) return;
    setActionLoadingId(id);
    try {
      await api.put(`/shops/${shop.id}/appointments/${id}`, { status: 'cancelled' });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
      setShowReviewModal(false);
      setReviewApt(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to reject appointment.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    if (!shop) return;
    setActionLoadingId(id);
    try {
      await api.put(`/shops/${shop.id}/appointments/${id}`, { status: newStatus });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as AppointmentStatus } : a));
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to update status.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  // Submit appointment creation or edit
  const handleCreateSubmit = async (payload: Record<string, unknown>) => {
    if (!shop) return;
    setIsSubmitting(true);
    setError('');
    try {
      if (editingApt) {
        const res = await api.put(`/shops/${shop.id}/appointments/${editingApt.id}`, payload);
        setAppointments(prev => prev.map(a => a.id === editingApt.id ? { ...a, ...res.data.data } : a));
      } else {
        const res = await api.post(`/shops/${shop.id}/appointments`, payload);
        setAppointments(prev => [...prev, res.data.data]);
      }
      setShowCreateModal(false);
      setEditingApt(null);
      setError('');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save appointment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRescheduleSubmit = async (aptId: number, date: string, time: string, notes: string) => {
    if (!shop) return;
    setIsSubmitting(true);
    try {
      const scheduled_at = `${date} ${time}:00`;
      await api.put(`/shops/${shop.id}/appointments/${aptId}`, {
        scheduled_at,
        notes: notes || undefined,
      });
      setAppointments(prev =>
        prev.map(a => a.id === aptId ? { ...a, scheduled_at, notes: notes || a.notes } : a)
      );
      setShowRescheduleModal(false);
      setRescheduleApt(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to reschedule.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (aptId: number, notes: string, jobOrderId: string, measurementAction: 'none' | 'record') => {
    if (!shop) return;
    setIsSubmitting(true);
    try {
      await api.post(`/shops/${shop.id}/appointments/${aptId}/complete`, {
        notes:        notes || undefined,
        job_order_id: jobOrderId || undefined,
      });
      setAppointments(prev =>
        prev.map(a => a.id === aptId ? { ...a, status: 'completed' } : a)
      );
      setShowCompleteModal(false);

      if (measurementAction === 'record') {
        const targetApt = appointments.find(a => a.id === aptId);
        const custId = customers.find(c => c.name === targetApt?.customer?.name)?.id;
        if (custId) router.push(`/dashboard/measurements?customer_id=${custId}`);
      }
      setCompleteApt(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to complete appointment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = async (aptId: number) => {
    if (!shop) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/appointments/${aptId}`);
      setAppointments(prev => prev.map(a => a.id === aptId ? { ...a, status: 'cancelled' } : a));
      setShowCancelModal(false);
      setCancelApt(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to cancel appointment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateJob = async (apt: Appointment) => {
    const custId = customers.find(c => c.name === apt.customer?.name)?.id;
    const servId = services.find(s => s.name === apt.service?.name)?.id;
    if (!custId) { alert('Customer not found.'); return; }
    const serviceParam = servId ? `&service_id=${servId}` : '';
    const notesParam = encodeURIComponent(`From appointment. Notes: ${apt.notes || ''}`);
    router.push(`/dashboard/jobs/new?customer_id=${custId}${serviceParam}&notes=${notesParam}&appointment_id=${apt.id}`);
  };

  // Filtering
  const filtered = appointments.filter(a => {
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchType   = typeFilter   === 'all' || a.appointment_type === typeFilter;
    const q           = search.toLowerCase();
    const matchSearch = !q
      || a.customer?.name?.toLowerCase().includes(q)
      || a.service?.name?.toLowerCase().includes(q)
      || a.appointment_type?.toLowerCase().includes(q);
    return matchStatus && matchType && matchSearch;
  });

  const pendingCount = appointments.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Appointments</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage client fittings, consultations, and garment pickups.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white shadow-sm border border-[#EBE6E0] rounded-lg p-1">
            <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[#F0EAE3] text-[#2D2A26]' : 'text-[#A8A19A] hover:text-[#524A44]'}`}><List size={18} /></button>
            <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'calendar' ? 'bg-[#F0EAE3] text-[#2D2A26]' : 'text-[#A8A19A] hover:text-[#524A44]'}`}><LayoutGrid size={18} /></button>
          </div>
          {isOwnerOrManager && (
            <button
              onClick={() => { setEditingApt(null); setError(''); setShowCreateModal(true); }}
              className="flex items-center gap-2 bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} /> New Appointment
            </button>
          )}
        </div>
      </div>

      {/* Pending inbox banner */}
      {pendingCount > 0 && isOwnerOrManager && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3.5 flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <AlertCircle size={16} className="text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800">
              {pendingCount} appointment{pendingCount === 1 ? '' : 's'} awaiting your review
            </p>
            <p className="text-xs text-amber-600 mt-0.5">Review and confirm or reject pending bookings below.</p>
          </div>
          <button
            onClick={() => setStatusFilter('pending')}
            className="shrink-0 text-xs font-semibold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            View Pending
          </button>
        </div>
      )}

      {/* Main content card */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
        {viewMode === 'list' ? (
          <>
            {/* Filters */}
            <div className="p-4 border-b border-[#EBE6E0] flex flex-wrap items-center gap-3 bg-[#FAF6F3]/30">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={16} />
                <input
                  type="text"
                  placeholder="Search customer or service..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] w-56"
                />
              </div>

              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as AppointmentType | 'all')}
                className="text-sm border border-[#EBE6E0] rounded-lg px-3 py-2 bg-white text-[#524A44] focus:outline-none focus:border-[#9A8073]"
              >
                <option value="all">All Types</option>
                {APPOINTMENT_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_CONFIG[t].label}</option>
                ))}
              </select>

              {/* Status tabs */}
              <div className="flex items-center gap-1 border border-[#EBE6E0] rounded-lg bg-white p-1 ml-auto">
                {(['all', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'] as const).map(s => {
                  let tabLabel = '';
                  if (s === 'all') {
                    tabLabel = 'All';
                  } else if (s === 'in_progress') {
                    tabLabel = 'In Progress';
                  } else {
                    tabLabel = STATUS_CONFIG[s as AppointmentStatus]?.label || '';
                  }
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors relative ${
                        statusFilter === s ? 'bg-[#F0EAE3] text-[#2D2A26]' : 'text-[#827A73] hover:text-[#2D2A26]'
                      }`}
                    >
                      {tabLabel}
                      {s === 'pending' && pendingCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List */}
            <AppointmentListView
              filtered={filtered}
              loading={loading}
              actionLoadingId={actionLoadingId}
              isOwnerOrManager={isOwnerOrManager}
              onReviewClick={(apt) => { setReviewApt(apt); setShowReviewModal(true); }}
              onStartClick={(id) => updateStatus(id, 'in_progress')}
              onCreateJobClick={handleCreateJob}
              onCompleteClick={(apt) => { setCompleteApt(apt); setShowCompleteModal(true); }}
              onRescheduleClick={(apt) => { setRescheduleApt(apt); setShowRescheduleModal(true); }}
              onDetailsClick={(apt) => { setViewApt(apt); setShowViewModal(true); }}
              onEditClick={(apt) => { setEditingApt(apt); setShowCreateModal(true); }}
              onCancelClick={(apt) => { setCancelApt(apt); setShowCancelModal(true); }}
            />
          </>
        ) : (
          <AppointmentCalendarView
            appointments={appointments}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            calSubMode={calSubMode}
            setCalSubMode={setCalSubMode}
            hoveredAptId={hoveredAptId}
            setHoveredAptId={setHoveredAptId}
            actionLoadingId={actionLoadingId}
            isOwnerOrManager={isOwnerOrManager}
            todayStr={todayStr}
            minTimeFor={minTimeFor}
            onReviewClick={(apt) => { setReviewApt(apt); setShowReviewModal(true); }}
            onStartClick={(id) => updateStatus(id, 'in_progress')}
            onCompleteClick={(apt) => { setCompleteApt(apt); setShowCompleteModal(true); }}
            onCreateJobClick={handleCreateJob}
            onDetailsClick={(apt) => { setViewApt(apt); setShowViewModal(true); }}
            onAddClick={(dayStr, defaultTime) => {
              setEditingApt(null);
              setError('');
              setShowCreateModal(true);
            }}
          />
        )}
      </div>

      {/* Modals */}
      <AppointmentCreateModal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); setEditingApt(null); setError(''); }}
        editingApt={editingApt}
        customers={customers}
        services={services}
        branches={branches}
        staff={staff}
        jobOrders={jobOrders}
        todayStr={todayStr}
        minTimeFor={minTimeFor}
        onSubmit={handleCreateSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />

      <AppointmentActionModals
        showReviewModal={showReviewModal}
        setShowReviewModal={setShowReviewModal}
        reviewApt={reviewApt}
        setReviewApt={setReviewApt}
        showRescheduleModal={showRescheduleModal}
        setShowRescheduleModal={setShowRescheduleModal}
        rescheduleApt={rescheduleApt}
        setRescheduleApt={setRescheduleApt}
        showCompleteModal={showCompleteModal}
        setShowCompleteModal={setShowCompleteModal}
        completeApt={completeApt}
        setCompleteApt={setCompleteApt}
        showCancelModal={showCancelModal}
        setShowCancelModal={setShowCancelModal}
        cancelApt={cancelApt}
        setCancelApt={setCancelApt}
        showViewModal={showViewModal}
        setShowViewModal={setShowViewModal}
        viewApt={viewApt}
        setViewApt={setViewApt}
        jobOrders={jobOrders}
        customers={customers}
        isOwnerOrManager={isOwnerOrManager}
        todayStr={todayStr}
        minTimeFor={minTimeFor}
        isSubmitting={isSubmitting}
        actionLoadingId={actionLoadingId}
        onConfirmReview={handleConfirmReview}
        onRejectReview={handleRejectReview}
        onRescheduleSubmit={handleRescheduleSubmit}
        onCompleteSubmit={handleCompleteSubmit}
        onCancelConfirm={handleCancelConfirm}
        onCreateJob={handleCreateJob}
      />
    </div>
  );
}
