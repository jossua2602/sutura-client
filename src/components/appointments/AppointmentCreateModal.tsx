import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, AlertCircle } from 'lucide-react';
import {
  Appointment, CustomerData, ServiceData, BranchData, StaffData, AppointmentType,
  APPOINTMENT_TYPES, TYPE_CONFIG, TYPES_REQUIRING_SERVICE
} from './appointmentHelpers';

interface AppointmentCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingApt: Appointment | null;
  customers: CustomerData[];
  services: ServiceData[];
  branches: BranchData[];
  staff: StaffData[];
  jobOrders: import('./appointmentHelpers').JobOrderData[];
  todayStr: string;
  minTimeFor: (dateStr: string) => string;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isSubmitting: boolean;
  error: string;
}

export default function AppointmentCreateModal({
  isOpen, onClose, editingApt, customers, services, branches, staff, jobOrders, todayStr, minTimeFor, onSubmit, isSubmitting, error
}: AppointmentCreateModalProps) {
  const defaultForm = {
    customer_id: '', appointment_type: 'consultation' as AppointmentType,
    service_id: '', job_order_id: '', shop_branch_id: '', scheduled_date: '', scheduled_time: '',
    duration_minutes: '60', assigned_staff_id: '', notes: '',
  };
  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    if (editingApt) {
      const d = new Date(editingApt.scheduled_at);
      const custId = customers.find(c => c.name === editingApt.customer?.name)?.id?.toString() || '';
      const servId = services.find(s => s.name === editingApt.service?.name)?.id?.toString() || '';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        customer_id: custId,
        appointment_type: editingApt.appointment_type,
        service_id: servId,
        job_order_id: editingApt.job_order_id?.toString() || '',
        shop_branch_id: editingApt.shop_branch_id?.toString() || '',
        scheduled_date: d.toISOString().split('T')[0],
        scheduled_time: d.toTimeString().substring(0, 5),
        duration_minutes: (editingApt.duration_minutes || 60).toString(),
        assigned_staff_id: editingApt.assigned_staff_id?.toString() || '',
        notes: editingApt.notes || '',
      });
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        ...defaultForm,
        shop_branch_id: branches.length === 1 ? branches[0].id.toString() : ''
      });
    }
  }, [editingApt, isOpen, customers, services, branches]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      customer_id: formData.customer_id,
      appointment_type: formData.appointment_type,
      service_id: formData.service_id || null,
      job_order_id: formData.job_order_id || null,
      scheduled_at: `${formData.scheduled_date} ${formData.scheduled_time}:00`,
      duration_minutes: Number.parseInt(formData.duration_minutes, 10) || 60,
      notes: formData.notes || null,
      shop_branch_id: formData.shop_branch_id || null,
      assigned_staff_id: formData.assigned_staff_id || null,
    };
    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingApt ? 'Edit Appointment' : 'Schedule Appointment'}>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            Service {TYPES_REQUIRING_SERVICE.has(formData.appointment_type) && !formData.job_order_id && <span className="text-rose-500">*</span>}
          </label>
          <select
            id="service_id"
            value={formData.service_id}
            required={TYPES_REQUIRING_SERVICE.has(formData.appointment_type) && !formData.job_order_id}
            onChange={e => setFormData({ ...formData, service_id: e.target.value })}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
            <option value="">No specific service</option>
            {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Linked Job Order */}
        {(formData.appointment_type === 'fitting' || formData.appointment_type === 'alteration' || formData.appointment_type === 'pickup') && (
          <div>
            <label htmlFor="job_order_id" className="block text-sm font-medium text-[#524A44] mb-1">
              Link to Job Order {formData.appointment_type === 'fitting' && <span className="text-rose-500">*</span>}
            </label>
            <select
              id="job_order_id"
              value={formData.job_order_id}
              required={formData.appointment_type === 'fitting'}
              onChange={e => setFormData({ ...formData, job_order_id: e.target.value })}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
              <option value="">No specific job order</option>
              {jobOrders
                .filter(job => !formData.customer_id || job.customer?.name === customers.find(c => c.id.toString() === formData.customer_id)?.name)
                .map(j => <option key={j.id} value={j.id}>{j.order_number || `Order #${j.id}`} - {j.status}</option>)}
            </select>
            <p className="text-[11px] text-[#A8A19A] mt-1">Select a customer first to see their active job orders.</p>
          </div>
        )}

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
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] transition-colors">Cancel</button>
          <button type="submit" disabled={isSubmitting} className="bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50">
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {editingApt ? 'Save Changes' : 'Save Appointment'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
