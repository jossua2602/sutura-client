import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, AlertCircle } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Appointment, CustomerData, ServiceData, BranchData, StaffData, AppointmentType,
  APPOINTMENT_TYPES, TYPE_CONFIG, TYPES_REQUIRING_SERVICE, JobOrderData
} from './appointmentHelpers';
import { roleLabel } from '@/components/staff/staffHelpers';

interface AppointmentCreateModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingApt?: Appointment | null;
  readonly customers?: CustomerData[];
  readonly services?: ServiceData[];
  readonly branches?: BranchData[];
  readonly staff?: StaffData[];
  readonly jobOrders?: JobOrderData[];
  readonly todayStr: string;
  readonly minTimeFor: (dateStr: string) => string;
  readonly onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly error: string;
}

const defaultForm = {
  customer_id: '', appointment_type: 'consultation' as AppointmentType,
  service_id: '', job_order_id: '', shop_branch_id: '', scheduled_date: '', scheduled_time: '',
  duration_minutes: '60', assigned_staff_id: '', notes: '',
  priority: 'normal', garment_category: '',
};

export default function AppointmentCreateModal({
  isOpen, onClose, editingApt, customers = [], services = [], branches = [], staff = [], jobOrders = [], todayStr, minTimeFor, onSubmit, isSubmitting, error
}: AppointmentCreateModalProps) {
  const [formData, setFormData] = useState(defaultForm);
  const { selectedBranchId } = useBranch();
  const { staffProfile } = useAuthStore();

  useEffect(() => {
    if (editingApt) {
      const d = new Date(editingApt.scheduled_at);
      const custId = editingApt.customer?.id?.toString() || '';
      const servId = editingApt.service?.id?.toString() || '';
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
        priority: editingApt.priority || 'normal',
        garment_category: editingApt.garment_category || '',
      });
    } else {
      const defaultBranchId = selectedBranchId?.toString() || '';
      setFormData({
        ...defaultForm,
        shop_branch_id: defaultBranchId || (branches.length === 1 ? branches[0].id.toString() : '')
      });
    }
  }, [editingApt, isOpen, customers, services, branches, selectedBranchId]);

  const handleSubmit = (e: React.SyntheticEvent) => {
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
      priority: formData.priority,
      garment_category: formData.garment_category || null,
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
          <div className="grid grid-cols-4 gap-2">
            {APPOINTMENT_TYPES.map(t => {
              const tc = TYPE_CONFIG[t];
              return (
                <button
                  type="button" key={t}
                  onClick={() => setFormData({
                    ...formData,
                    appointment_type: t,
                    // Pickup is a quick hand-off, not a sit-down session — default
                    // it to a short slot instead of inheriting whatever duration
                    // was previously selected for another appointment type.
                    duration_minutes: t === 'pickup' ? '15' : formData.duration_minutes,
                  })}
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
        </div>
        {/* CONDITIONAL BLOCK */}

          {/* Consultation Flow */}
          {formData.appointment_type === 'consultation' && (
            <div>
              <label htmlFor="service_id" className="block text-sm font-medium text-[#524A44] mb-1">
                Service (Optional)
              </label>
              <select
                id="service_id"
                value={formData.service_id}
                onChange={e => setFormData({ ...formData, service_id: e.target.value })}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
                <option value="">No specific service (General Consultation)</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {/* Measurement Flow */}
          {formData.appointment_type === 'measurement' && (
            <div>
              <label htmlFor="service_id" className="block text-sm font-medium text-[#524A44] mb-1">
                Service <span className="text-rose-500">*</span>
              </label>
              <select
                id="service_id"
                required
                value={formData.service_id}
                onChange={e => setFormData({ ...formData, service_id: e.target.value })}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
                <option value="" disabled>Select target service (e.g. Suit, Gown, Barong)...</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <p className="text-[11px] text-[#827A73] mt-1">
                💡 Required to determine the correct body measurement template.
              </p>
            </div>
          )}

          {/* Fitting Flow */}
          {formData.appointment_type === 'fitting' && (
            <div>
              <label htmlFor="job_order_id" className="block text-sm font-medium text-[#524A44] mb-1">
                Link to Job Order <span className="text-rose-500">*</span>
              </label>
              <select
                id="job_order_id"
                required
                disabled={!formData.customer_id}
                value={formData.job_order_id}
                onChange={e => setFormData({ ...formData, job_order_id: e.target.value })}
                className="w-full bg-[#FAF6F3] disabled:opacity-60 disabled:cursor-not-allowed border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
                {!formData.customer_id ? (
                  <option value="">Select a customer first...</option>
                ) : (
                  <>
                    <option value="" disabled>Choose active job order...</option>
                    {jobOrders
                      .filter(job => {
                        const targetCustomer = customers.find(c => c.id.toString() === formData.customer_id);
                        if (!targetCustomer) return false;

                        if (job.customer_id !== undefined && job.customer_id !== null) {
                          if (job.customer_id !== targetCustomer.id) return false;
                        } else {
                          if (job.customer?.name !== targetCustomer.name) return false;
                        }
                        
                        const status = job.status || '';
                        if (status === 'cancelled' || status === 'completed') return false;
                        return true;
                      })
                      .map(j => (
                        <option key={j.id} value={j.id}>
                          {j.order_number || `Order #${j.id}`} (Status: {(j.status || '').toUpperCase()})
                        </option>
                      ))}
                  </>
                )}
              </select>
              <p className="text-[11px] text-[#827A73] mt-1.5 font-medium">
                💡 Fittings must link to an active production job order. Completed or cancelled orders are hidden.
              </p>

              {/* Auto Suggestions Chips */}
              {(() => {
                const targetCustomer = customers.find(c => c.id.toString() === formData.customer_id);
                if (!targetCustomer) return null;

                const activeJobs = jobOrders.filter(job => {
                  if (job.customer_id !== undefined && job.customer_id !== null) {
                    if (job.customer_id !== targetCustomer.id) return false;
                  } else {
                    if (job.customer?.name !== targetCustomer.name) return false;
                  }
                  const status = job.status || '';
                  return status !== 'cancelled' && status !== 'completed';
                });

                if (activeJobs.length === 0) return null;

                return (
                  <div className="mt-3 space-y-1.5 bg-[#FAF6F3]/50 border border-[#EBE6E0]/60 p-2.5 rounded-lg">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#827A73] block">
                      ⭐ Auto-suggested Active Jobs:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeJobs.map(job => (
                        <button
                          type="button"
                          key={job.id}
                          onClick={() => setFormData({ ...formData, job_order_id: job.id.toString() })}
                          className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer text-left ${
                            formData.job_order_id === job.id.toString()
                              ? 'bg-taupe text-white border-taupe font-medium'
                              : 'bg-white hover:bg-[#FAF6F3] border-[#EBE6E0] text-[#524A44]'
                          }`}
                        >
                          {job.order_number || `Order #${job.id}`}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Alteration Flow */}
          {formData.appointment_type === 'alteration' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="job_order_id" className="block text-sm font-medium text-[#524A44] mb-1">
                  Link to Job Order (Optional)
                </label>
                <select
                  id="job_order_id"
                  disabled={!formData.customer_id}
                  value={formData.job_order_id}
                  onChange={e => setFormData({ ...formData, job_order_id: e.target.value })}
                  className="w-full bg-[#FAF6F3] disabled:opacity-60 disabled:cursor-not-allowed border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
                  {!formData.customer_id ? (
                    <option value="">Select a customer first...</option>
                  ) : (
                    <>
                      <option value="">No specific job order (Standalone Alteration)</option>
                      {jobOrders
                        .filter(job => {
                          const targetCustomer = customers.find(c => c.id.toString() === formData.customer_id);
                          if (!targetCustomer) return false;

                          if (job.customer_id !== undefined && job.customer_id !== null) {
                            if (job.customer_id !== targetCustomer.id) return false;
                          } else {
                            if (job.customer?.name !== targetCustomer.name) return false;
                          }
                          
                          return job.status !== 'cancelled';
                        })
                        .map(j => (
                          <option key={j.id} value={j.id}>
                            {j.order_number || `Order #${j.id}`} (Status: {(j.status || '').toUpperCase()})
                          </option>
                        ))}
                    </>
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="service_id" className="block text-sm font-medium text-[#524A44] mb-1">
                  Service {!formData.job_order_id && <span className="text-rose-500">*</span>}
                </label>
                <select
                  id="service_id"
                  value={formData.service_id}
                  required={!formData.job_order_id}
                  onChange={e => setFormData({ ...formData, service_id: e.target.value })}
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
                  <option value="">Select service to alter...</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Pickup Flow */}
          {formData.appointment_type === 'pickup' && (
            <div>
              <label htmlFor="job_order_id" className="block text-sm font-medium text-[#524A44] mb-1">
                Link to Job Order <span className="text-rose-500">*</span>
              </label>
              <select
                id="job_order_id"
                required
                disabled={!formData.customer_id}
                value={formData.job_order_id}
                onChange={e => setFormData({ ...formData, job_order_id: e.target.value })}
                className="w-full bg-[#FAF6F3] disabled:opacity-60 disabled:cursor-not-allowed border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
                {!formData.customer_id ? (
                  <option value="">Select a customer first...</option>
                ) : (
                  <>
                    <option value="" disabled>Choose order ready for pickup...</option>
                    {jobOrders
                      .filter(job => {
                        const targetCustomer = customers.find(c => c.id.toString() === formData.customer_id);
                        if (!targetCustomer) return false;

                        if (job.customer_id !== undefined && job.customer_id !== null) {
                          if (job.customer_id !== targetCustomer.id) return false;
                        } else {
                          if (job.customer?.name !== targetCustomer.name) return false;
                        }

                        return job.status === 'ready_for_pickup';
                      })
                      .map(j => (
                        <option key={j.id} value={j.id}>
                          {j.order_number || `Order #${j.id}`}
                        </option>
                      ))}
                  </>
                )}
              </select>
              <p className="text-[11px] text-[#827A73] mt-1.5 font-medium">
                💡 Only orders already marked &quot;Ready for Pickup&quot; are shown — confirming which one avoids handing over the wrong garment.
              </p>
            </div>
          )}

        {/* Garment Category Selector */}
        <div>
          <label htmlFor="garment_category" className="block text-sm font-medium text-[#524A44] mb-1">
            Garment Category (Optional)
          </label>
          <select
            id="garment_category"
            value={formData.garment_category}
            onChange={e => setFormData({ ...formData, garment_category: e.target.value })}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]">
            <option value="">No specific category / Mixed</option>
            <option value="barong">Barong Tagalog</option>
            <option value="gown">Gown / Bridal / Debut</option>
            <option value="suit">Bespoke Suit / Tuxedo</option>
            <option value="filipiniana">Filipiniana</option>
            <option value="uniform">Uniform / Sublimation Jersey</option>
          </select>
        </div>

        {/* Priority Selector */}
        <div>
          <span className="block text-sm font-medium text-[#524A44] mb-1">Priority</span>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal', label: 'Normal', activeBg: 'bg-zinc-100 border-[#2D2A26] text-[#2D2A26]' },
              { id: 'urgent', label: 'Urgent', activeBg: 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20' },
              { id: 'rush', label: 'Rush', activeBg: 'bg-rose-50 border-[#B26959] text-[#B26959] ring-2 ring-[#B26959]/20' }
            ].map(p => (
              <button
                type="button" key={p.id}
                onClick={() => setFormData({ ...formData, priority: p.id })}
                className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                  formData.priority === p.id
                    ? p.activeBg
                    : 'bg-white border-[#EBE6E0] text-[#524A44] hover:border-[#9A8073]/40'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
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
              {staff.map(s => {
                const roles = [s.role, ...(s.additional_roles || [])].filter((r): r is string => Boolean(r)).map(roleLabel).join(', ');
                const name = s.user?.name || `Staff #${s.user_id}`;
                return (
                  <option key={s.user_id} value={s.user_id}>
                    {roles ? `[${roles}] ${name}` : name}
                  </option>
                );
              })}
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
