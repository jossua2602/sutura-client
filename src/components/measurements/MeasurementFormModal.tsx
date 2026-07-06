'use client';

import React from 'react';
import Link from 'next/link';
import { User, Ruler, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';
import { CustomerData } from './measurementTypes';
import { UPPER, LOWER, emptyForm } from './measurementHelpers';

interface MeasurementFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingId: number | null;
  readonly form: ReturnType<typeof emptyForm>;
  readonly setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
  readonly customers: CustomerData[];
  readonly error: string;
  readonly isSubmitting: boolean;
  readonly onSubmit: (e: React.SyntheticEvent) => void;
}

export default function MeasurementFormModal({
  isOpen,
  onClose,
  editingId,
  form,
  setForm,
  customers,
  error,
  isSubmitting,
  onSubmit,
}: MeasurementFormModalProps) {
  const setMetric = (key: string, val: string) => {
    setForm(f => ({ ...f, metrics: { ...f.metrics, [key]: val } }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingId ? 'Edit Measurement Profile' : 'New Measurement Profile'}
      maxWidth="max-w-lg"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="bg-[#B26959]/10 border border-[#B26959]/30 text-[#B26959] px-4 py-3 rounded-lg text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Customer */}
        <div>
          <label htmlFor="measurement-customer" className="block text-sm font-medium text-[#524A44] mb-1.5">
            Customer <span className="text-[#B26959]">*</span>
          </label>
          {customers.length === 0 ? (
            <div className="bg-[#FAF6F3] border border-[#EBE6E0] border-dashed rounded-lg px-4 py-3 text-sm text-[#827A73]">
              No customers yet.{' '}
              <Link href="/dashboard/customers" className="text-[#9A8073] font-semibold hover:underline">
                Add one first
              </Link>{' '}
              — a measurement profile always belongs to a customer.
            </div>
          ) : (
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" />
              <select
                id="measurement-customer"
                required
                value={form.customer_id}
                onChange={e => setForm(f => ({ ...f, customer_id: e.target.value }))}
                className="w-full pl-9 pr-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30 appearance-none cursor-pointer"
              >
                <option value="">Select customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id.toString()}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Profile Name */}
        <div>
          <label htmlFor="measurement-profile-name" className="block text-sm font-medium text-[#524A44] mb-1.5">
            Profile Name <span className="text-[#B26959]">*</span>
            <span className="text-[#A8A19A] font-normal ml-1">(e.g. &quot;Formal Suit&quot;, &quot;School Uniform&quot;)</span>
          </label>
          <input
            id="measurement-profile-name"
            required
            type="text"
            value={form.profile_name}
            onChange={e => setForm(f => ({ ...f, profile_name: e.target.value }))}
            placeholder="e.g. Wedding Barong"
            className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30"
          />
        </div>

        <div>
          <label htmlFor="measurement-source" className="block text-sm font-medium text-[#524A44] mb-1.5">Record Type</label>
          <select
            id="measurement-source"
            value={form.source}
            onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
            className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30"
          >
            <option value="shop_owner">Shop Owner (tailor&apos;s own format)</option>
            <option value="customer">Customer-Side (encoded from the customer)</option>
          </select>
        </div>

        {/* Measurement Fields */}
        <div>
          <p className="text-sm font-medium text-[#524A44] mb-3 flex items-center gap-2">
            <Ruler size={14} className="text-[#9A8073]" />
            Body Measurements
            <span className="text-[#A8A19A] font-normal text-xs">— all in inches (″), leave blank if not applicable</span>
          </p>

          <div className="grid grid-cols-2 gap-4">
            {/* Upper Body */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-[#A8A19A] uppercase tracking-wider border-b border-[#EBE6E0] pb-1 mb-2">Upper Body</p>
              {UPPER.map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-xs text-[#524A44] font-medium">{f.label}</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.metrics[f.key] || ''}
                      onChange={e => setMetric(f.key, e.target.value)}
                      placeholder="—"
                      className="w-full pl-3 pr-8 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30 font-mono text-right"
                    />
                    <span className="absolute right-3 text-xs text-[#A8A19A] pointer-events-none">″</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Lower Body */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-[#A8A19A] uppercase tracking-wider border-b border-[#EBE6E0] pb-1 mb-2">Lower Body</p>
              {LOWER.map(f => (
                <div key={f.key} className="flex flex-col gap-1">
                  <label className="text-xs text-[#524A44] font-medium">{f.label}</label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.metrics[f.key] || ''}
                      onChange={e => setMetric(f.key, e.target.value)}
                      placeholder="—"
                      className="w-full pl-3 pr-8 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30 font-mono text-right"
                    />
                    <span className="absolute right-3 text-xs text-[#A8A19A] pointer-events-none">″</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="measurement-notes" className="block text-sm font-medium text-[#524A44] mb-1.5">
            Notes <span className="text-[#A8A19A] font-normal">(optional)</span>
          </label>
          <textarea
            id="measurement-notes"
            rows={2}
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="e.g. Client prefers loose fit, allergic to polyester..."
            className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073]/30 resize-none"
          />
        </div>

        {/* Actions */}
        <div className="pt-1 flex justify-end gap-3 border-t border-[#EBE6E0] mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors hover:bg-[#F0EAE3]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#9A8073] hover:bg-[#9A8073]/90 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm cursor-pointer"
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {editingId ? 'Save Changes' : 'Create Profile'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
