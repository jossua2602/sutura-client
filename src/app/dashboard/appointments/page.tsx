'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Plus, Search, Calendar as CalendarIcon, List, LayoutGrid,
  ChevronLeft, ChevronRight, Pencil, Trash2, Check, X,
  RefreshCw, Clock, Loader2, AlertCircle, Scissors, Eye,
  Play, CheckSquare, ArrowLeft, Ruler, ShirtIcon,
  MessageSquare, Package,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';

// ─── Constants ────────────────────────────────────────────────────────────────

const APPOINTMENT_TYPES = ['consultation', 'measurement', 'fitting', 'alteration', 'pickup'] as const;
type AppointmentType = typeof APPOINTMENT_TYPES[number];

type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';

/** Types that require a service to be selected */
const TYPES_REQUIRING_SERVICE = new Set<AppointmentType>(['measurement', 'fitting', 'alteration']);

// ─── Type Config (calendar base color by appointment type) ───────────────────

const TYPE_CONFIG: Record<AppointmentType, {
  label: string; icon: React.ReactNode; bg: string; border: string;
  dot: string; text: string; badgeBg: string; badgeBorder: string; badgeText: string;
}> = {
  consultation: {
    label: 'Consultation', icon: <MessageSquare size={12} />,
    bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-500',
    text: 'text-purple-900', badgeBg: 'bg-purple-50', badgeBorder: 'border-purple-200', badgeText: 'text-purple-700',
  },
  measurement: {
    label: 'Measurement', icon: <Ruler size={12} />,
    bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500',
    text: 'text-blue-900', badgeBg: 'bg-blue-50', badgeBorder: 'border-blue-200', badgeText: 'text-blue-700',
  },
  fitting: {
    label: 'Fitting', icon: <ShirtIcon size={12} />,
    bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500',
    text: 'text-orange-900', badgeBg: 'bg-orange-50', badgeBorder: 'border-orange-200', badgeText: 'text-orange-700',
  },
  alteration: {
    label: 'Alteration', icon: <Scissors size={12} />,
    bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-400',
    text: 'text-yellow-900', badgeBg: 'bg-yellow-50', badgeBorder: 'border-yellow-200', badgeText: 'text-yellow-700',
  },
  pickup: {
    label: 'Pickup', icon: <Package size={12} />,
    bg: 'bg-emerald-50', border: 'border-emerald-200', dot: 'bg-emerald-500',
    text: 'text-emerald-900', badgeBg: 'bg-emerald-50', badgeBorder: 'border-emerald-200', badgeText: 'text-emerald-700',
  },
};

// ─── Status Config (overlay on top of type color) ────────────────────────────

const STATUS_CONFIG: Record<AppointmentStatus, {
  label: string; dot: string; badge: string; opacity: string; borderStyle: string;
}> = {
  pending:     { label: 'Pending',     dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border-amber-200',    opacity: 'opacity-70',  borderStyle: 'border-dashed' },
  confirmed:   { label: 'Confirmed',   dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-200',       opacity: 'opacity-100', borderStyle: 'border-solid' },
  in_progress: { label: 'In Progress', dot: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 border-orange-200', opacity: 'opacity-100', borderStyle: 'border-solid' },
  completed:   { label: 'Completed',   dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', opacity: 'opacity-50', borderStyle: 'border-solid' },
  cancelled:   { label: 'Cancelled',   dot: 'bg-rose-500',    badge: 'bg-rose-50 text-rose-700 border-rose-200',       opacity: 'opacity-40',  borderStyle: 'border-solid' },
  no_show:     { label: 'No Show',     dot: 'bg-gray-500',    badge: 'bg-gray-100 text-gray-600 border-gray-200',      opacity: 'opacity-40',  borderStyle: 'border-solid' },
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface Appointment {
  id: number;
  appointment_type: AppointmentType;
  customer: { name: string; email: string };
  service: { name: string } | null;
  branch: { id: number; name: string } | null;
  scheduled_at: string;
  duration_minutes: number;
  assigned_staff_id?: number | null;
  assigned_staff?: { name: string } | null;
  status: AppointmentStatus;
  notes: string;
  shop_branch_id?: number | null;
  answers?: Record<string, string | number | boolean> | null;
}

interface ServiceData  { id: number; name: string }
interface CustomerData { id: number; name: string }
interface BranchData   { id: number; name: string }
interface StaffData    { id: number; user_id: number; user?: { id: number; name: string } }
interface JobOrderData { id: number; title?: string; status?: string; customer?: { name: string } }

// ─── Small Components ─────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: AppointmentType }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.badgeBg} ${cfg.badgeBorder} ${cfg.badgeText}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatScheduled(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
  };
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as { response?: { data?: { message?: string } } }).response;
    if (res?.data?.message) {
      return res.data.message;
    }
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ─── Main Component ───────────────────────────────────────────────────────────

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

  // Form states
  const defaultForm = {
    customer_id: '', appointment_type: 'consultation' as AppointmentType,
    service_id: '', shop_branch_id: '', scheduled_date: '', scheduled_time: '',
    duration_minutes: '60', assigned_staff_id: '', notes: '',
  };
  const [formData, setFormData] = useState(defaultForm);

  const [rescheduleForm, setRescheduleForm] = useState({ scheduled_date: '', scheduled_time: '', notes: '' });
  const [completeForm,   setCompleteForm]   = useState({ notes: '', job_order_id: '', measurement_action: 'none' });

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  const todayStr = new Date().toISOString().split('T')[0];

  const minTimeFor = (dateStr: string): string => {
    if (dateStr !== todayStr) return '00:00';
    const now   = new Date();
    const mins  = now.getHours() * 60 + now.getMinutes();
    const round = Math.ceil(mins / 15) * 15;
    return `${String(Math.floor(round / 60) % 24).padStart(2, '0')}:${String(round % 60).padStart(2, '0')}`;
  };

  // ─── Data Fetching ────────────────────────────────────────────────────────────

  const fetchAppointments = useCallback(() => {
    if (!shop) return;
    api.get(`/shops/${shop.id}/appointments`)
      .then(res => { setAppointments(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [shop]);

  useEffect(() => {
    fetchAppointments();
    if (shop) {
      api.get(`/shops/${shop.id}/services`).then(r => setServices(r.data.data)).catch(() => {});
      api.get(`/shops/${shop.id}/customers`).then(r => setCustomers(r.data.data)).catch(() => {});
      api.get(`/shops/${shop.id}/branches`).then(r => setBranches(r.data.data)).catch(() => {});
      api.get(`/shops/${shop.id}/staff`).then(r => setStaff(r.data.data)).catch(() => {});
      api.get(`/shops/${shop.id}/jobs`).then(r => setJobOrders(r.data.data)).catch(() => {});
    } else if (user && !shop) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [shop, user, fetchAppointments]);

  // ─── Role Check ───────────────────────────────────────────────────────────────

  const userRoles: string[] = user?.roles?.map(r => r.name) ?? [];
  const isOwnerOrManager = userRoles.some(r => ['shop_owner', 'branch_manager'].includes(r));

  // ─── Quick Status Update ──────────────────────────────────────────────────────

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

  // ─── Create / Edit ────────────────────────────────────────────────────────────

  const handleCreateSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shop) return;
    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        customer_id:       formData.customer_id,
        appointment_type:  formData.appointment_type,
        service_id:        formData.service_id || null,
        scheduled_at:      `${formData.scheduled_date} ${formData.scheduled_time}:00`,
        duration_minutes:  Number.parseInt(formData.duration_minutes, 10) || 60,
        notes:             formData.notes || null,
        shop_branch_id:    formData.shop_branch_id || null,
        assigned_staff_id: formData.assigned_staff_id || null,
      };

      if (editingApt) {
        const res = await api.put(`/shops/${shop.id}/appointments/${editingApt.id}`, payload);
        setAppointments(prev => prev.map(a => a.id === editingApt.id ? { ...a, ...res.data.data } : a));
      } else {
        const res = await api.post(`/shops/${shop.id}/appointments`, payload);
        setAppointments(prev => [...prev, res.data.data]);
      }
      closeCreateModal();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to save appointment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (apt: Appointment) => {
    setEditingApt(apt);
    const d   = new Date(apt.scheduled_at);
    const custId  = customers.find(c => c.name === apt.customer?.name)?.id?.toString() || '';
    const servId  = services.find(s => s.name === apt.service?.name)?.id?.toString() || '';
    setFormData({
      customer_id:       custId,
      appointment_type:  apt.appointment_type,
      service_id:        servId,
      shop_branch_id:    apt.shop_branch_id?.toString() || '',
      scheduled_date:    d.toISOString().split('T')[0],
      scheduled_time:    d.toTimeString().substring(0, 5),
      duration_minutes:  (apt.duration_minutes || 60).toString(),
      assigned_staff_id: apt.assigned_staff_id?.toString() || '',
      notes:             apt.notes || '',
    });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setEditingApt(null);
    setFormData(defaultForm);
    setError('');
  };

  // ─── Reschedule ───────────────────────────────────────────────────────────────

  const openRescheduleModal = (apt: Appointment) => {
    setRescheduleApt(apt);
    const d = new Date(apt.scheduled_at);
    setRescheduleForm({
      scheduled_date: d.toISOString().split('T')[0],
      scheduled_time: d.toTimeString().substring(0, 5),
      notes: apt.notes || '',
    });
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shop || !rescheduleApt) return;
    setIsSubmitting(true);
    try {
      const scheduled_at = `${rescheduleForm.scheduled_date} ${rescheduleForm.scheduled_time}:00`;
      await api.put(`/shops/${shop.id}/appointments/${rescheduleApt.id}`, {
        scheduled_at,
        notes: rescheduleForm.notes || undefined,
      });
      setAppointments(prev =>
        prev.map(a => a.id === rescheduleApt.id ? { ...a, scheduled_at, notes: rescheduleForm.notes || a.notes } : a)
      );
      setShowRescheduleModal(false);
      setRescheduleApt(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to reschedule.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Complete ─────────────────────────────────────────────────────────────────

  const handleCompleteSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shop || !completeApt) return;
    setIsSubmitting(true);
    try {
      await api.post(`/shops/${shop.id}/appointments/${completeApt.id}/complete`, {
        notes:        completeForm.notes || undefined,
        job_order_id: completeForm.job_order_id || undefined,
      });
      setAppointments(prev =>
        prev.map(a => a.id === completeApt.id ? { ...a, status: 'completed' } : a)
      );
      setShowCompleteModal(false);

      // Redirect to measurements if user chose to record measurements
      if (completeForm.measurement_action === 'record') {
        const custId = customers.find(c => c.name === completeApt.customer?.name)?.id;
        if (custId) router.push(`/dashboard/measurements?customer_id=${custId}`);
      }
      setCompleteApt(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to complete appointment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Cancel / Delete ──────────────────────────────────────────────────────────

  const handleCancelConfirm = async () => {
    if (!shop || !cancelApt) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/appointments/${cancelApt.id}`);
      setAppointments(prev => prev.map(a => a.id === cancelApt.id ? { ...a, status: 'cancelled' } : a));
      setShowCancelModal(false);
      setCancelApt(null);
    } catch (err: unknown) {
      alert(getErrorMessage(err, 'Failed to cancel appointment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Create Job from Appointment ──────────────────────────────────────────────

  const handleCreateJob = async (apt: Appointment) => {
    const custId = customers.find(c => c.name === apt.customer?.name)?.id;
    const servId = services.find(s => s.name === apt.service?.name)?.id;
    if (!custId) { alert('Customer not found.'); return; }
    const serviceParam = servId ? `&service_id=${servId}` : '';
    const notesParam = encodeURIComponent(`From appointment. Notes: ${apt.notes || ''}`);
    router.push(`/dashboard/jobs/new?customer_id=${custId}${serviceParam}&notes=${notesParam}`);
  };

  // ─── Filtering ────────────────────────────────────────────────────────────────

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

  // ─── Calendar helpers ─────────────────────────────────────────────────────────

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth     = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysArray   = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // ─── Render ───────────────────────────────────────────────────────────────────

  const renderTableBody = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-10 text-center text-[#A8A19A]">
            Loading appointments...
          </td>
        </tr>
      );
    }

    if (filtered.length === 0) {
      return (
        <tr>
          <td colSpan={6} className="px-6 py-10 text-center text-[#A8A19A]">
            No appointments found.
          </td>
        </tr>
      );
    }

    return filtered.map(apt => {
      const { date, time } = formatScheduled(apt.scheduled_at);
      const isLoading = actionLoadingId === apt.id;
      const isPending = apt.status === 'pending';
      const isConfirmed = apt.status === 'confirmed';
      const isInProgress = apt.status === 'in_progress';
      const isTerminal = ['completed', 'cancelled', 'no_show'].includes(apt.status);
      return (
        <tr key={apt.id} className={`hover:bg-[#FAF6F3]/60 transition-colors ${isPending ? 'bg-amber-50/30' : ''}`}>
          <td className="px-5 py-3.5">
            <p className="font-semibold text-[#2D2A26]">{apt.customer?.name}</p>
            <p className="text-xs text-[#A8A19A]">{apt.customer?.email}</p>
          </td>
          <td className="px-5 py-3.5">
            <TypeBadge type={apt.appointment_type} />
            {apt.service && (
              <p className="text-xs text-[#827A73] mt-1">{apt.service.name}</p>
            )}
          </td>
          <td className="px-5 py-3.5">
            <div className="flex items-center gap-2 text-[#2D2A26]">
              <CalendarIcon size={13} className="text-[#A8A19A]" />
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock size={13} className="text-[#A8A19A]" />
              <span className="text-xs text-[#827A73]">{time} · {apt.duration_minutes ?? 60}min</span>
            </div>
          </td>
          <td className="px-5 py-3.5 text-xs text-[#827A73]">
            {apt.branch?.name || <span className="italic text-[#C4BDB6]">Main Branch</span>}
          </td>
          <td className="px-5 py-3.5"><StatusBadge status={apt.status} /></td>
          <td className="px-5 py-3.5">
            <div className="flex items-center justify-end gap-1.5">
              {isLoading ? (
                <Loader2 size={16} className="animate-spin text-[#A8A19A]" />
              ) : (
                <>
                  {/* Pending → Owner Review modal */}
                  {isPending && isOwnerOrManager && (
                    <button
                      onClick={() => { setReviewApt(apt); setShowReviewModal(true); }}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors"
                    >
                      <Eye size={13} /> Review
                    </button>
                  )}

                  {/* Confirmed → Start (in_progress) */}
                  {isConfirmed && (
                    <button
                      onClick={() => updateStatus(apt.id, 'in_progress')}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors"
                    >
                      <Play size={13} /> Start
                    </button>
                  )}

                  {/* Confirmed → Create Job */}
                  {isConfirmed && isOwnerOrManager && (
                    <button
                      onClick={() => handleCreateJob(apt)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#9A8073]/10 text-[#9A8073] hover:bg-[#FAF6F3] border border-[#9A8073]/20 transition-colors"
                    >
                      <Scissors size={13} /> Job
                    </button>
                  )}

                  {/* In Progress → Complete modal */}
                  {isInProgress && (
                    <button
                      onClick={() => { setCompleteApt(apt); setCompleteForm({ notes: '', job_order_id: '', measurement_action: 'none' }); setShowCompleteModal(true); }}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                    >
                      <CheckSquare size={13} /> Complete
                    </button>
                  )}

                  {/* Reschedule — pending or confirmed */}
                  {['pending', 'confirmed'].includes(apt.status) && isOwnerOrManager && (
                    <button
                      onClick={() => openRescheduleModal(apt)}
                      title="Reschedule"
                      className="p-1.5 text-[#A8A19A] hover:text-[#6B7FA8] hover:bg-[#6B7FA8]/10 rounded-lg transition-colors"
                    >
                      <RefreshCw size={14} />
                    </button>
                  )}

                  {/* View details */}
                  <button
                    onClick={() => { setViewApt(apt); setShowViewModal(true); }}
                    title="View Details"
                    className="p-1.5 text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#F0EAE3] rounded-lg transition-colors"
                  >
                    <Eye size={14} />
                  </button>

                  {/* Edit — owner/manager, non-terminal */}
                  {!isTerminal && isOwnerOrManager && (
                    <button onClick={() => openEditModal(apt)} title="Edit" className="p-1.5 text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#F0EAE3] rounded-lg transition-colors">
                      <Pencil size={14} />
                    </button>
                  )}

                  {/* Cancel — owner/manager, non-terminal */}
                  {!isTerminal && isOwnerOrManager && (
                    <button
                      onClick={() => { setCancelApt(apt); setShowCancelModal(true); }}
                      title="Cancel"
                      className="p-1.5 text-[#A8A19A] hover:text-[#B26959] hover:bg-[#B26959]/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </>
              )}
            </div>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header ─────────────────────────────────────────────────────────────── */}
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
              onClick={() => { setEditingApt(null); setFormData(defaultForm); setError(''); setShowCreateModal(true); }}
              className="flex items-center gap-2 bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={18} /> New Appointment
            </button>
          )}
        </div>
      </div>

      {/* ── Pending inbox banner ─────────────────────────────────────────────── */}
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

      {/* ── Main content card ─────────────────────────────────────────────────── */}
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

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-[#524A44]">
                <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Customer</th>
                    <th className="px-5 py-3.5 font-semibold">Type / Service</th>
                    <th className="px-5 py-3.5 font-semibold">Scheduled</th>
                    <th className="px-5 py-3.5 font-semibold">Branch</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EBE6E0]/70">
                  {renderTableBody()}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* ── CALENDAR VIEW ──────────────────────────────────────────────────── */
          <div className="p-0">
            {calSubMode === 'month' ? (
              /* ── MONTH VIEW ─────────────────────────────────────────────────── */
              <div className="p-6">
                {/* Nav */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-[#2D2A26]">
                      {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => setCurrentDate(new Date())} className="text-xs font-semibold px-3 py-1 rounded-lg border border-[#EBE6E0] bg-[#FAF6F3] text-[#9A8073] hover:bg-[#F0EAE3] transition-colors">Today</button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#2D2A26] transition-colors"><ChevronLeft size={18} /></button>
                    <button onClick={nextMonth} className="p-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#2D2A26] transition-colors"><ChevronRight size={18} /></button>
                  </div>
                </div>

                {/* Type legend */}
                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  {APPOINTMENT_TYPES.map(t => (
                    <div key={t} className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${TYPE_CONFIG[t].dot}`} />
                      <span className="text-xs text-[#827A73]">{TYPE_CONFIG[t].label}</span>
                    </div>
                  ))}
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-px mb-px">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                    <div key={d} className="text-center text-[11px] font-semibold text-[#A8A19A] uppercase tracking-wider py-2 bg-[#FAF6F3]/50">{d}</div>
                  ))}
                </div>

                {/* Day cells */}
                <div className="grid grid-cols-7 gap-px bg-[#EBE6E0]">
                  {paddingDays.map(i => <div key={`e-${i}`} className="min-h-28 bg-white/40 p-1.5" />)}
                  {daysArray.map(day => {
                    const y = year, m = String(month + 1).padStart(2, '0'), d = String(day).padStart(2, '0');
                    const dateStr  = `${y}-${m}-${d}`;
                    const dayEvents = appointments.filter(a => a.scheduled_at.startsWith(dateStr));
                    const hasPending = dayEvents.some(a => a.status === 'pending');
                    const todayRef   = new Date();
                    const isToday    = y === todayRef.getFullYear() && month === todayRef.getMonth() && day === todayRef.getDate();
                    const isPast     = new Date(y, month, day) < new Date(todayRef.getFullYear(), todayRef.getMonth(), todayRef.getDate());
                    const dayTextClass = isToday
                      ? 'bg-[#9A8073] text-white'
                      : isPast
                        ? 'text-[#C4BDB6]'
                        : 'text-[#524A44] group-hover:text-[#2D2A26]';
                    return (
                      <div
                        key={day}
                        onClick={() => { setSelectedDay(new Date(y, month, day)); setCalSubMode('day'); }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedDay(new Date(y, month, day));
                            setCalSubMode('day');
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        className={`min-h-28 p-1.5 group transition-colors ${isPast ? 'bg-[#FAF6F3]/40 cursor-default' : 'bg-white cursor-pointer hover:bg-[#FAF6F3]'} ${!isPast && hasPending ? 'ring-inset ring-1 ring-amber-300' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${dayTextClass}`}>
                            {day}
                          </span>
                          {dayEvents.length > 0 && (
                            <span className={`text-[9px] font-medium ${isPast ? 'text-[#C4BDB6]' : 'text-[#A8A19A]'}`}>{dayEvents.length}</span>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          {dayEvents.slice(0, 3).map(event => {
                            const tc  = TYPE_CONFIG[event.appointment_type];
                            const sc  = STATUS_CONFIG[event.status];
                            const time = new Date(event.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
                            const eventColorClass = isPast
                              ? 'bg-gray-50 border-gray-100 text-gray-400'
                              : `${tc.bg} ${tc.border} ${tc.text} ${sc.opacity}`;
                            const borderDashedClass = !isPast && event.status === 'pending' ? 'border-dashed' : '';
                            return (
                              <div key={event.id} className={`text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 border truncate ${eventColorClass} ${borderDashedClass}`}>
                                <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${isPast ? 'bg-gray-300' : tc.dot}`} />
                                <span className="truncate">{time} {event.customer?.name}</span>
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className={`text-[10px] font-medium pl-1 ${isPast ? 'text-[#C4BDB6]' : 'text-[#9A8073]'}`}>+{dayEvents.length - 3} more</div>
                          )}
                          {!isPast && dayEvents.length === 0 && (
                            <div className="text-[9px] text-[#D4CEC9] italic mt-1">Click to add</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* ── DAY VIEW ────────────────────────────────────────────────────── */
              (() => {
                const dayDate = selectedDay || new Date();
                const dayStr  = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
                const dayEvents = appointments
                  .filter(a => a.scheduled_at.startsWith(dayStr))
                  .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

                const HOUR_START  = 7;
                const HOUR_END    = 20;
                const PX_PER_MIN  = 1.5;

                const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
                const dayMidnight   = new Date(dayDate); dayMidnight.setHours(0, 0, 0, 0);
                const isDayPast   = dayMidnight < todayMidnight;
                const isDayToday  = dayMidnight.getTime() === todayMidnight.getTime();

                // Current time indicator position
                const now            = new Date();
                const nowMins        = now.getHours() * 60 + now.getMinutes();
                const nowOffsetMins  = nowMins - HOUR_START * 60;
                const nowTopPx       = nowOffsetMins * PX_PER_MIN;
                const showNowLine    = isDayToday && nowOffsetMins >= 0 && nowOffsetMins <= (HOUR_END - HOUR_START) * 60;

                const defaultTimeForDay = () => {
                  if (isDayToday) {
                    const rounded = Math.ceil((now.getHours() * 60 + now.getMinutes() + 30) / 15) * 15;
                    return `${String(Math.floor(rounded / 60) % 24).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
                  }
                  return '09:00';
                };

                const prevDay = () => { const d = new Date(dayDate); d.setDate(d.getDate() - 1); setSelectedDay(d); };
                const nextDay = () => { const d = new Date(dayDate); d.setDate(d.getDate() + 1); setSelectedDay(d); };

                const renderDayEmptyState = () => {
                  if (isDayPast) {
                    return <p className="text-xs text-[#C4BDB6] italic">Read-only — this date has passed</p>;
                  }
                  if (isOwnerOrManager) {
                    return (
                      <button
                        onClick={() => {
                          setEditingApt(null);
                          setFormData({ ...defaultForm, scheduled_date: dayStr, scheduled_time: defaultTimeForDay() });
                          setError('');
                          setShowCreateModal(true);
                        }}
                        className="text-xs font-medium text-[#9A8073] hover:text-[#9A8073]/70 underline underline-offset-2 transition-colors"
                      >
                        + Add appointment for this day
                      </button>
                    );
                  }
                  return null;
                };

                return (
                  <div className="flex flex-col">
                    {/* Day nav */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#EBE6E0] bg-[#FAF6F3]/40">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setCalSubMode('month')} className="flex items-center gap-1.5 text-sm font-medium text-[#9A8073] hover:text-[#2D2A26] transition-colors">
                          <ArrowLeft size={16} />
                          {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </button>
                        <span className="text-[#EBE6E0]">›</span>
                        <h2 className="text-lg font-bold text-[#2D2A26]">
                          {dayDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h2>
                        {dayEvents.length > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#9A8073]/10 text-[#9A8073]">
                            {dayEvents.length} appointment{dayEvents.length === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={prevDay} className="p-2 bg-white border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#2D2A26] transition-colors"><ChevronLeft size={16} /></button>
                        <button onClick={() => setSelectedDay(new Date())} className="text-xs font-semibold px-3 py-1 rounded-lg border border-[#EBE6E0] bg-white text-[#9A8073] hover:bg-[#F0EAE3] transition-colors">Today</button>
                        <button onClick={nextDay} className="p-2 bg-white border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#2D2A26] transition-colors"><ChevronRight size={16} /></button>
                      </div>
                    </div>

                    <div className="flex overflow-hidden">
                       {/* Time labels */}
                       <div className="w-16 shrink-0 border-r border-[#EBE6E0] bg-[#FAF6F3]/30">
                         {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => {
                           const h   = HOUR_START + i;
                           let lbl = '';
                           if (h < 12) {
                             lbl = `${h} AM`;
                           } else if (h === 12) {
                             lbl = '12 PM';
                           } else {
                             lbl = `${h - 12} PM`;
                           }
                           return (
                             <div key={h} style={{ height: `${60 * PX_PER_MIN}px` }} className="flex items-start justify-end pr-3 pt-1">
                               <span className="text-[10px] text-[#A8A19A] font-medium">{lbl}</span>
                             </div>
                           );
                         })}
                       </div>

                      {/* Events area */}
                      <div className="flex-1 relative bg-white" style={{ height: `${(HOUR_END - HOUR_START) * 60 * PX_PER_MIN}px` }}>
                        {/* Hour lines */}
                        {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                          <div key={i} className="absolute left-0 right-0 border-t border-[#EBE6E0]/70" style={{ top: `${i * 60 * PX_PER_MIN}px` }} />
                        ))}
                        {/* Half-hour dashes */}
                        {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                          <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-[#EBE6E0]/30 border-dashed" style={{ top: `${(i * 60 + 30) * PX_PER_MIN}px` }} />
                        ))}

                        {/* Current time indicator */}
                        {showNowLine && (
                          <div className="absolute left-0 right-0 z-20 flex items-center" style={{ top: `${nowTopPx}px` }}>
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 -ml-1.5 shrink-0" />
                            <div className="flex-1 border-t-2 border-rose-500" />
                          </div>
                        )}

                        {/* Appointment blocks */}
                        {dayEvents.map(event => {
                          const startDate  = new Date(event.scheduled_at);
                          const startMins  = startDate.getHours() * 60 + startDate.getMinutes();
                          const offsetMins = startMins - HOUR_START * 60;
                          const durMins    = event.duration_minutes || 60;
                          const topPx      = Math.max(0, offsetMins * PX_PER_MIN);
                          const heightPx   = Math.max(42, durMins * PX_PER_MIN);
                          const tc         = TYPE_CONFIG[event.appointment_type];
                          const sc         = STATUS_CONFIG[event.status];
                          const isHovered  = hoveredAptId === event.id;
                          const isLoading  = actionLoadingId === event.id;
                          const isPending  = event.status === 'pending';
                          const isConfirmed= event.status === 'confirmed';
                          const isInProg   = event.status === 'in_progress';
                          const isCompleted= event.status === 'completed';
                          const isClosed   = ['cancelled', 'no_show'].includes(event.status);

                          return (
                            <div
                              key={event.id}
                              className={`absolute left-2 right-2 rounded-lg border overflow-hidden transition-all duration-150 ${tc.bg} ${tc.border} ${sc.opacity} ${isPending ? 'border-dashed' : sc.borderStyle} ${isHovered && !isClosed ? 'shadow-lg z-10 ring-2 ring-[#9A8073]/30' : 'z-1'}`}
                              style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                              onMouseEnter={() => setHoveredAptId(event.id)}
                              onMouseLeave={() => setHoveredAptId(null)}
                            >
                              <div className="flex h-full">
                                {/* Type color bar */}
                                <div className={`w-1 shrink-0 ${tc.dot} ${isInProg ? 'animate-pulse' : ''}`} />

                                <div className="flex-1 px-2 py-1.5 min-w-0 flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-start justify-between gap-1">
                                      <div className="min-w-0">
                                        <p className={`text-xs font-bold truncate ${tc.text} ${isClosed ? 'line-through opacity-60' : ''}`}>
                                          {event.customer?.name}
                                        </p>
                                        <p className="text-[10px] text-[#827A73] truncate">
                                          {TYPE_CONFIG[event.appointment_type].label}
                                          {event.service ? ` · ${event.service.name}` : ''}
                                          {event.assigned_staff ? ` · ${event.assigned_staff.name}` : ''}
                                        </p>
                                      </div>
                                      <StatusBadge status={event.status} />
                                    </div>
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <Clock size={9} className="text-[#A8A19A]" />
                                      <span className="text-[10px] text-[#A8A19A]">
                                        {new Date(event.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        {' – '}
                                        {new Date(new Date(event.scheduled_at).getTime() + durMins * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        {` (${durMins}m)`}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Action buttons — on hover or tall block */}
                                  {(isHovered || heightPx >= 90) && !isClosed && !isLoading && (
                                    <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                                      {isPending && isOwnerOrManager && (
                                        <button onClick={e => { e.stopPropagation(); setReviewApt(event); setShowReviewModal(true); }}
                                          className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors">
                                          <Eye size={10} /> Review
                                        </button>
                                      )}
                                      {isConfirmed && (
                                        <button onClick={e => { e.stopPropagation(); updateStatus(event.id, 'in_progress'); }}
                                          className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 transition-colors">
                                          <Play size={10} /> Start
                                        </button>
                                      )}
                                      {isInProg && (
                                        <button onClick={e => { e.stopPropagation(); setCompleteApt(event); setCompleteForm({ notes: '', job_order_id: '', measurement_action: 'none' }); setShowCompleteModal(true); }}
                                          className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                                          <CheckSquare size={10} /> Complete
                                        </button>
                                      )}
                                      {isCompleted && isOwnerOrManager && (
                                        <button onClick={e => { e.stopPropagation(); handleCreateJob(event); }}
                                          className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#9A8073]/10 text-[#9A8073] hover:bg-[#FAF6F3] border border-[#9A8073]/20 transition-colors">
                                          <Scissors size={10} /> Create Job
                                        </button>
                                      )}
                                      <button onClick={e => { e.stopPropagation(); setViewApt(event); setShowViewModal(true); }}
                                        className="flex items-center gap-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-[#FAF6F3] text-[#827A73] hover:bg-[#F0EAE3] border border-[#EBE6E0] transition-colors">
                                        <Eye size={10} /> Details
                                      </button>
                                    </div>
                                  )}
                                  {isLoading && (
                                    <div className="flex items-center gap-1 mt-1">
                                      <Loader2 size={12} className="animate-spin text-[#9A8073]" />
                                      <span className="text-[10px] text-[#A8A19A]">Updating...</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Empty state */}
                        {dayEvents.length === 0 && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                            <CalendarIcon size={36} className="text-[#EBE6E0]" />
                            <p className="text-sm text-[#A8A19A]">No appointments on this day</p>
                            {renderDayEmptyState()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODALS
      ══════════════════════════════════════════════════════════════════════════ */}

      {/* ── 1. Create / Edit Modal ──────────────────────────────────────────── */}
      <Modal isOpen={showCreateModal} onClose={closeCreateModal} title={editingApt ? 'Edit Appointment' : 'Schedule Appointment'}>
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

          {/* Customer */}
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium text-[#524A44] mb-1">Customer <span className="text-rose-500">*</span></label>
            <select id="customer_id" required value={formData.customer_id} onChange={e => setFormData({ ...formData, customer_id: e.target.value })}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
              <option value="" disabled>Select a customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Appointment Type */}
          <div>
            <span className="block text-sm font-medium text-[#524A44] mb-1">Appointment Type <span className="text-rose-500">*</span></span>
            <div className="grid grid-cols-5 gap-2">
              {APPOINTMENT_TYPES.map(t => {
                const tc = TYPE_CONFIG[t];
                return (
                  <button
                    type="button" key={t}
                    onClick={() => setFormData({ ...formData, appointment_type: t })}
                    className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg border text-[10px] font-semibold transition-all ${
                      formData.appointment_type === t
                        ? `${tc.bg} ${tc.border} ${tc.text} ring-2 ring-offset-1 ${tc.border.replace('border-', 'ring-')}`
                        : 'bg-white border-[#EBE6E0] text-[#827A73] hover:border-[#9A8073]/40'
                    }`}
                  >
                    {tc.icon}
                    {tc.label}
                  </button>
                );
              })}
            </div>
            {TYPES_REQUIRING_SERVICE.has(formData.appointment_type) && (
              <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                <AlertCircle size={11} /> Service selection is required for {formData.appointment_type} appointments.
              </p>
            )}
          </div>

          {/* Service */}
          <div>
            <label htmlFor="service_id" className="block text-sm font-medium text-[#524A44] mb-1">
              Service {TYPES_REQUIRING_SERVICE.has(formData.appointment_type) && <span className="text-rose-500">*</span>}
            </label>
            <select
              id="service_id"
              value={formData.service_id}
              required={TYPES_REQUIRING_SERVICE.has(formData.appointment_type)}
              onChange={e => setFormData({ ...formData, service_id: e.target.value })}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
              <option value="">No specific service</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduled_date" className="block text-sm font-medium text-[#524A44] mb-1">Date <span className="text-rose-500">*</span></label>
              <input id="scheduled_date" type="date" required min={todayStr} value={formData.scheduled_date}
                onChange={e => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" />
            </div>
            <div>
              <label htmlFor="scheduled_time" className="block text-sm font-medium text-[#524A44] mb-1">Time <span className="text-rose-500">*</span></label>
              <input id="scheduled_time" type="time" required min={minTimeFor(formData.scheduled_date)} value={formData.scheduled_time}
                onChange={e => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label htmlFor="duration_minutes" className="block text-sm font-medium text-[#524A44] mb-1">Duration</label>
            <select id="duration_minutes" value={formData.duration_minutes} onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
              {[15, 30, 45, 60, 90, 120, 180].map(m => <option key={m} value={m}>{m} minutes</option>)}
            </select>
          </div>

          {/* Branch (multi-branch only) */}
          {branches.length > 1 && (
            <div>
              <label htmlFor="shop_branch_id" className="block text-sm font-medium text-[#524A44] mb-1">Branch <span className="text-rose-500">*</span></label>
              <select id="shop_branch_id" required value={formData.shop_branch_id} onChange={e => setFormData({ ...formData, shop_branch_id: e.target.value })}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
                <option value="" disabled>Select branch...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}

          {/* Assign Staff */}
          {staff.length > 0 && (
            <div>
              <label htmlFor="assigned_staff_id" className="block text-sm font-medium text-[#524A44] mb-1">Assign Staff (Optional)</label>
              <select id="assigned_staff_id" value={formData.assigned_staff_id} onChange={e => setFormData({ ...formData, assigned_staff_id: e.target.value })}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
                <option value="">Unassigned</option>
                {staff.map(s => <option key={s.user_id} value={s.user_id}>{s.user?.name || `Staff #${s.user_id}`}</option>)}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-[#524A44] mb-1">Notes (Optional)</label>
            <textarea id="notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}
              rows={2} className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073] resize-none"
              placeholder="Any special notes or instructions..." />
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={closeCreateModal} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {editingApt ? 'Save Changes' : 'Save Appointment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── 2. Owner Review Modal ───────────────────────────────────────────── */}
      <Modal isOpen={showReviewModal} onClose={() => { setShowReviewModal(false); setReviewApt(null); }} title="Review Appointment">
        {reviewApt && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#2D2A26]">{reviewApt.customer?.name}</h3>
                <p className="text-xs text-[#A8A19A]">{reviewApt.customer?.email}</p>
              </div>
              <StatusBadge status={reviewApt.status} />
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Type</p>
                <div className="mt-1"><TypeBadge type={reviewApt.appointment_type} /></div>
              </div>
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Service</p>
                <p className="text-[#2D2A26] font-medium mt-1">{reviewApt.service?.name || <span className="italic text-[#A8A19A]">None</span>}</p>
              </div>
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Scheduled</p>
                <p className="text-[#2D2A26] font-medium mt-1">
                  {new Date(reviewApt.scheduled_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                  {' at '}
                  {new Date(reviewApt.scheduled_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Duration</p>
                <p className="text-[#2D2A26] font-medium mt-1">{reviewApt.duration_minutes ?? 60} minutes</p>
              </div>
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Branch</p>
                <p className="text-[#2D2A26] font-medium mt-1">{reviewApt.branch?.name || 'Main Branch'}</p>
              </div>
              {reviewApt.assigned_staff && (
                <div>
                  <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider">Assigned Staff</p>
                  <p className="text-[#2D2A26] font-medium mt-1">{reviewApt.assigned_staff.name}</p>
                </div>
              )}
            </div>

            {reviewApt.notes && (
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider mb-1">Notes from Customer</p>
                <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg p-3 text-sm text-[#2D2A26] whitespace-pre-wrap">{reviewApt.notes}</div>
              </div>
            )}

            {reviewApt.answers && Object.keys(reviewApt.answers).length > 0 && (
              <div>
                <p className="text-[11px] text-[#A8A19A] font-semibold uppercase tracking-wider mb-2">Booking Answers</p>
                <div className="space-y-2">
                  {Object.entries(reviewApt.answers).map(([q, a]) => (
                    <div key={q} className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-[#827A73]">{q}</p>
                      <p className="text-xs text-[#2D2A26] mt-0.5">{String(a)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 flex flex-col gap-2 border-t border-[#EBE6E0]">
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { openRescheduleModal(reviewApt); setShowReviewModal(false); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-[#6B7FA8] hover:bg-[#6B7FA8]/10 border border-[#6B7FA8]/20 transition-colors"
                >
                  <RefreshCw size={14} /> Propose New Time
                </button>
                <button
                  onClick={async () => {
                    const id = reviewApt.id;
                    setActionLoadingId(id);
                    try {
                      await api.put(`/shops/${shop?.id}/appointments/${id}`, { status: 'cancelled' });
                      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
                      setShowReviewModal(false); setReviewApt(null);
                    } catch (err: unknown) { alert(getErrorMessage(err, 'Failed.')); }
                    finally { setActionLoadingId(null); }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                >
                  <X size={14} /> Reject
                </button>
                <button
                  onClick={async () => {
                    const id = reviewApt.id;
                    setActionLoadingId(id);
                    try {
                      await api.put(`/shops/${shop?.id}/appointments/${id}`, { status: 'confirmed' });
                      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'confirmed' } : a));
                      setShowReviewModal(false); setReviewApt(null);
                    } catch (err: unknown) { alert(getErrorMessage(err, 'Failed.')); }
                    finally { setActionLoadingId(null); }
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#7A8B76] hover:bg-[#7A8B76]/90 transition-colors"
                >
                  {actionLoadingId === reviewApt.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ── 3. Reschedule Modal ─────────────────────────────────────────────── */}
      <Modal isOpen={showRescheduleModal} onClose={() => { setShowRescheduleModal(false); setRescheduleApt(null); }} title="Propose New Schedule">
        <form onSubmit={handleRescheduleSubmit} className="space-y-4">
          <p className="text-sm text-[#827A73]">Propose a new date and time. The customer will be notified of the change.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reschedule_date" className="block text-sm font-medium text-[#524A44] mb-1">New Date</label>
              <input id="reschedule_date" type="date" required min={todayStr} value={rescheduleForm.scheduled_date}
                onChange={e => setRescheduleForm(f => ({ ...f, scheduled_date: e.target.value }))}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" />
            </div>
            <div>
              <label htmlFor="reschedule_time" className="block text-sm font-medium text-[#524A44] mb-1">New Time</label>
              <input id="reschedule_time" type="time" required min={minTimeFor(rescheduleForm.scheduled_date)} value={rescheduleForm.scheduled_time}
                onChange={e => setRescheduleForm(f => ({ ...f, scheduled_time: e.target.value }))}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" />
            </div>
          </div>
          <div>
            <label htmlFor="reschedule_notes" className="block text-sm font-medium text-[#524A44] mb-1">Note to Customer (Optional)</label>
            <textarea id="reschedule_notes" rows={2} value={rescheduleForm.notes} onChange={e => setRescheduleForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073] resize-none"
              placeholder="e.g. Unavailable on original date, please come on the new date..." />
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={() => setShowRescheduleModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="bg-[#6B7FA8] hover:bg-[#6B7FA8]/90 text-white px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50">
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              <RefreshCw size={14} /> Confirm Reschedule
            </button>
          </div>
        </form>
      </Modal>

      {/* ── 4. Complete Appointment Modal ────────────────────────────────────── */}
      <Modal isOpen={showCompleteModal} onClose={() => { setShowCompleteModal(false); setCompleteApt(null); }} title="Complete Appointment">
        {completeApt && (
          <form onSubmit={handleCompleteSubmit} className="space-y-4">
            {/* Context */}
            <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-[#2D2A26]">{completeApt.customer?.name}</p>
                <TypeBadge type={completeApt.appointment_type} />
              </div>
              {completeApt.service && <p className="text-sm text-[#827A73]">{completeApt.service.name}</p>}
              <p className="text-xs text-[#A8A19A]">
                {new Date(completeApt.scheduled_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                {' · '}{completeApt.duration_minutes ?? 60} min
              </p>
            </div>

            {/* Type-specific fields */}
            {completeApt.appointment_type === 'measurement' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1.5"><Ruler size={14} /> Measurement Session</p>
                <p className="text-xs text-blue-600 mb-3">After completing, would you like to record the customer&apos;s measurements?</p>
                <div className="flex gap-2">
                  {(['none', 'record'] as const).map(opt => (
                    <button type="button" key={opt}
                      onClick={() => setCompleteForm(f => ({ ...f, measurement_action: opt }))}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${completeForm.measurement_action === opt ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}>
                      {opt === 'record' ? '📏 Record Measurements' : 'Skip for Now'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {completeApt.appointment_type === 'fitting' && (
              <div>
                <label htmlFor="complete_job_order_id" className="block text-sm font-medium text-[#524A44] mb-1">Link to Job Order <span className="text-rose-500">*</span></label>
                <p className="text-xs text-[#827A73] mb-2">Fitting sessions must be linked to an existing job order.</p>
                <select id="complete_job_order_id" required value={completeForm.job_order_id}
                  onChange={e => setCompleteForm(f => ({ ...f, job_order_id: e.target.value }))}
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
                  <option value="" disabled>Select job order...</option>
                  {jobOrders
                    .filter(j => j.customer?.name === completeApt.customer?.name)
                    .map(j => <option key={j.id} value={j.id}>#{j.id} — {j.title || j.status}</option>)}
                </select>
              </div>
            )}

            {completeApt.appointment_type === 'pickup' && (
              <div>
                <label htmlFor="pickup_job_order_id" className="block text-sm font-medium text-[#524A44] mb-1">Linked Job Order <span className="text-rose-500">*</span></label>
                <select id="pickup_job_order_id" required value={completeForm.job_order_id}
                  onChange={e => setCompleteForm(f => ({ ...f, job_order_id: e.target.value }))}
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
                  <option value="" disabled>Select the job order being picked up...</option>
                  {jobOrders
                    .filter(j => j.customer?.name === completeApt.customer?.name)
                    .map(j => <option key={j.id} value={j.id}>#{j.id} — {j.title || j.status}</option>)}
                </select>
              </div>
            )}

            {/* Create job shortcut for consultation/alteration */}
            {['consultation', 'alteration'].includes(completeApt.appointment_type) && (
              <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#2D2A26]">Create a Job Order?</p>
                  <p className="text-xs text-[#827A73]">Optionally start a job order from this appointment.</p>
                </div>
                <button type="button" onClick={() => handleCreateJob(completeApt)}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#9A8073]/10 text-[#9A8073] hover:bg-[#FAF6F3] border border-[#9A8073]/20 transition-colors">
                  <Scissors size={12} /> Create Job
                </button>
              </div>
            )}

            {/* Completion notes */}
            <div>
              <label htmlFor="complete_notes" className="block text-sm font-medium text-[#524A44] mb-1">Completion Notes (Optional)</label>
              <textarea id="complete_notes" rows={2} value={completeForm.notes} onChange={e => setCompleteForm(f => ({ ...f, notes: e.target.value }))}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073] resize-none"
                placeholder="Any notes from the session..." />
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCompleteModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
                {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                <CheckSquare size={14} /> Mark as Completed
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── 5. Cancel Confirmation Modal ────────────────────────────────────── */}
      <Modal isOpen={showCancelModal} onClose={() => { setShowCancelModal(false); setCancelApt(null); }} title="Cancel Appointment">
        <div className="space-y-4">
          <p className="text-sm text-[#524A44]">
            Are you sure you want to cancel the appointment for <strong>{cancelApt?.customer?.name}</strong>? The customer will be notified.
          </p>
          <div className="pt-2 flex justify-end gap-3">
            <button onClick={() => setShowCancelModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Keep Appointment</button>
            <button onClick={handleCancelConfirm} disabled={isSubmitting} className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50">
              {isSubmitting && <Loader2 size={15} className="animate-spin" />} Yes, Cancel It
            </button>
          </div>
        </div>
      </Modal>

      {/* ── 6. View Details Modal ────────────────────────────────────────────── */}
      <Modal isOpen={showViewModal} onClose={() => { setShowViewModal(false); setViewApt(null); }} title="Appointment Details">
        {viewApt && (
          <div className="space-y-4 text-sm text-[#524A44]">
            <div className="flex items-start justify-between border-b border-[#EBE6E0] pb-3">
              <div>
                <h4 className="font-bold text-[#2D2A26] text-base">{viewApt.customer?.name}</h4>
                <p className="text-xs text-[#A8A19A]">{viewApt.customer?.email}</p>
              </div>
              <div className="flex flex-col gap-1 items-end">
                <TypeBadge type={viewApt.appointment_type} />
                <StatusBadge status={viewApt.status} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Scheduled At</p>
                <p className="text-[#2D2A26] font-medium mt-0.5">
                  {new Date(viewApt.scheduled_at).toLocaleDateString('en-PH', { dateStyle: 'medium' })}
                  {' at '}
                  {new Date(viewApt.scheduled_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Duration</p>
                <p className="text-[#2D2A26] font-medium mt-0.5">{viewApt.duration_minutes ?? 60} minutes</p>
              </div>
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Service</p>
                <p className="text-[#2D2A26] font-medium mt-0.5">{viewApt.service?.name || <span className="italic text-[#A8A19A]">Consultation</span>}</p>
              </div>
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Branch</p>
                <p className="text-[#2D2A26] font-medium mt-0.5">{viewApt.branch?.name || 'Main Branch'}</p>
              </div>
              {viewApt.assigned_staff && (
                <div>
                  <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Assigned Staff</p>
                  <p className="text-[#2D2A26] font-medium mt-0.5">{viewApt.assigned_staff.name}</p>
                </div>
              )}
            </div>

            {viewApt.notes && (
              <div>
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider">Notes</p>
                <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg p-3 text-xs mt-1 whitespace-pre-wrap text-[#2D2A26]">{viewApt.notes}</div>
              </div>
            )}

            {viewApt.answers && Object.keys(viewApt.answers).length > 0 && (
              <div className="border-t border-[#EBE6E0] pt-3">
                <p className="text-xs text-[#A8A19A] font-semibold uppercase tracking-wider mb-2">Booking Answers</p>
                <div className="space-y-2">
                  {Object.entries(viewApt.answers).map(([q, a]) => (
                    <div key={q} className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-[#827A73]">{q}</p>
                      <p className="text-xs text-[#2D2A26] mt-0.5">{String(a)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-[#EBE6E0] flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-5 py-2 rounded-lg text-xs font-medium transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
