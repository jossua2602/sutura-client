import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, Trash2, Pencil, X } from 'lucide-react';
import { Service, ServicePricing } from './serviceHelpers';
import api from '@/lib/axios';

interface ServicePricingModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly shopId: number;
  readonly service: Service | null;
}

export default function ServicePricingModal({
  isOpen,
  onClose,
  shopId,
  service,
}: ServicePricingModalProps) {
  const [pricings, setPricings] = useState<ServicePricing[]>([]);
  const [loadingPricings, setLoadingPricings] = useState(false);
  const [submittingPricing, setSubmittingPricing] = useState(false);
  const [pricingError, setPricingError] = useState('');
  const [pricingFormData, setPricingFormData] = useState({
    label: '',
    amount: ''
  });
  const [editingPricingId, setEditingPricingId] = useState<number | null>(null);

  const loadPricingData = async () => {
    if (!service) return;
    setLoadingPricings(true);
    setPricingError('');
    try {
      const res = await api.get(`/shops/${shopId}/services/${service.id}/pricing`);
      setPricings(res.data.data);
    } catch (err) {
      console.error(err);
      setPricingError('Failed to load pricing options.');
    } finally {
      setLoadingPricings(false);
    }
  };

  useEffect(() => {
    if (isOpen && service) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadPricingData();
      setPricingFormData({
        label: '',
        amount: ''
      });
      setEditingPricingId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, service]);

  const handleAddPricing = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!service) return;

    setSubmittingPricing(true);
    setPricingError('');
    try {
      const payload = {
        label: pricingFormData.label,
        amount: Number.parseFloat(pricingFormData.amount),
      };

      if (editingPricingId) {
        await api.put(`/shops/${shopId}/services/${service.id}/pricing/${editingPricingId}`, payload);
      } else {
        await api.post(`/shops/${shopId}/services/${service.id}/pricing`, payload);
      }
      await loadPricingData();

      setPricingFormData({
        label: '',
        amount: ''
      });
      setEditingPricingId(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setPricingError(error.response?.data?.message || 'Failed to save pricing option.');
    } finally {
      setSubmittingPricing(false);
    }
  };

  const handleEditClick = (pricing: ServicePricing) => {
    setEditingPricingId(pricing.id);
    setPricingFormData({ label: pricing.label, amount: pricing.amount });
  };

  const handleCancelEdit = () => {
    setEditingPricingId(null);
    setPricingFormData({ label: '', amount: '' });
  };

  const handleDeletePricing = async (pricingId: number) => {
    if (!service) return;
    try {
      await api.delete(`/shops/${shopId}/services/${service.id}/pricing/${pricingId}`);
      setPricings(prev => prev.filter(p => p.id !== pricingId));
      if (editingPricingId === pricingId) handleCancelEdit();
    } catch (err) {
      console.error(err);
      alert('Failed to delete pricing option.');
    }
  };

  let pricingsContent = null;
  if (loadingPricings) {
    pricingsContent = (
      <div className="text-center py-6 text-xs text-[#A8A19A] flex items-center justify-center gap-2">
        <Loader2 size={16} className="animate-spin text-taupe" />
        Loading options...
      </div>
    );
  } else if (pricings.length === 0) {
    pricingsContent = (
      <div className="text-center py-6 text-xs text-[#A8A19A] border border-dashed border-[#EBE6E0] rounded-xl">
        No pricing options configured yet.
      </div>
    );
  } else {
    pricingsContent = (
      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
        {pricings.map(pricing => (
          <div 
            key={pricing.id} 
            className="flex items-center justify-between p-3 bg-white border border-[#EBE6E0] rounded-lg hover:border-taupe/55 transition-colors"
          >
            <div className="space-y-0.5">
              <div className="font-semibold text-sm text-[#2D2A26]">{pricing.label}</div>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#2D2A26]">
                +₱{Number.parseFloat(pricing.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <button
                type="button"
                onClick={() => handleEditClick(pricing)}
                className="text-[#A8A19A] hover:text-taupe hover:bg-taupe/10 p-1.5 rounded-lg border border-transparent hover:border-taupe/20 transition-colors"
                title="Edit option"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => handleDeletePricing(pricing.id)}
                className="text-[#A8A19A] hover:text-[#B26959] hover:bg-[#B26959]/10 p-1.5 rounded-lg border border-transparent hover:border-[#B26959]/20 transition-colors"
                title="Delete option"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Manage Pricing — ${service?.name || ''}`}
    >
      <div className="space-y-6 text-[#2D2A26]">
        <p className="text-xs text-[#827A73]">
          Define additional pricing variants or upgrades for this service. These options can be selected when creating a job order.
        </p>

        {pricingError && (
          <div className="bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-2.5 rounded-lg text-xs">
            {pricingError}
          </div>
        )}

        <form onSubmit={handleAddPricing} className={`border p-4 rounded-xl space-y-3 ${editingPricingId ? 'bg-taupe/5 border-taupe/30' : 'bg-[#FAF6F3] border-[#EBE6E0]'}`}>
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider">
              {editingPricingId ? 'Edit Pricing Option' : 'Add Pricing Option'}
            </h3>
            {editingPricingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-[#A8A19A] hover:text-[#524A44] flex items-center gap-1 text-[11px] font-semibold"
              >
                <X size={12} /> Cancel Edit
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="pricing-label" className="block text-xs font-medium text-[#524A44] mb-1">Option Label *</label>
              <input
                id="pricing-label"
                type="text"
                required
                value={pricingFormData.label}
                onChange={e => setPricingFormData({ ...pricingFormData, label: e.target.value })}
                placeholder="e.g. XL Size, Rush 3-Day"
                className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-1.5 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
              />
            </div>

            <div>
              <label htmlFor="pricing-amount" className="block text-xs font-medium text-[#524A44] mb-1">Additional Price (₱) *</label>
              <input
                id="pricing-amount"
                type="number"
                required
                min="0"
                step="0.01"
                value={pricingFormData.amount}
                onChange={e => setPricingFormData({ ...pricingFormData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-1.5 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={submittingPricing}
              className="bg-taupe hover:bg-taupe/90 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {submittingPricing && <Loader2 size={12} className="animate-spin" />}
              {editingPricingId ? 'Save Changes' : 'Add Option'}
            </button>
          </div>
        </form>

        {/* Existing Pricings */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider">Active Pricing Options</h3>
          
          {pricingsContent}
        </div>

        <div className="pt-4 border-t border-[#EBE6E0] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
