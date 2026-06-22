import React, { useState, useEffect } from 'react';
import { Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import Modal from '@/components/Modal';
import { CATEGORIES } from './specializationHelpers';

interface SpecializationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  editingId: number | null;
  isSubmitting: boolean;
  error: string;
  formData: {
    category: string;
    name: string;
    description: string;
    is_active: boolean;
    starting_price: number;
    production_time_days: number;
    min_order_qty: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    category: string;
    name: string;
    description: string;
    is_active: boolean;
    starting_price: number;
    production_time_days: number;
    min_order_qty: number;
  }>>;
}

export default function SpecializationFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingId,
  isSubmitting,
  error,
  formData,
  setFormData,
}: SpecializationFormModalProps) {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  // Sync open category with form data category when modal opens or shifts edit targets
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpenCategory(formData.category || null);
    }
  }, [isOpen, formData.category]);

  const handlePresetSelect = (item: string) => {
    setFormData(f => ({ ...f, name: item }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? 'Edit Specialization' : 'Add Specialization'}>
      <form onSubmit={onSubmit} className="space-y-5">
        {error && (
          <div className="bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Category Accordion Selector */}
        <div>
          <span className="block text-sm font-semibold text-[#524A44] mb-2">
            Category
            <span className="ml-1 font-normal text-[#A8A19A] text-xs">(choose one to see presets)</span>
          </span>

          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              const isCatOpen = openCategory === cat.name;
              const isSelected = formData.category === cat.name;

              return (
                <div
                  key={cat.name}
                  className={`rounded-xl border transition-all ${
                    isSelected ? 'border-[#9A8073] bg-[#9A8073]/5' : 'border-[#EBE6E0] bg-[#FAF6F3]'
                  }`}
                >
                  {/* Accordion header */}
                  <button
                    type="button"
                    onClick={() => {
                      setOpenCategory(isCatOpen ? null : cat.name);
                      setFormData(f => ({ ...f, category: cat.name, name: '' }));
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-[#2D2A26]"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#9A8073] text-white'
                            : 'bg-white border border-[#EBE6E0] text-[#9A8073]'
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                      <span>{cat.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-[#9A8073] bg-[#9A8073]/10 px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    {isCatOpen ? (
                      <ChevronUp size={15} className="text-[#A8A19A] shrink-0" />
                    ) : (
                      <ChevronDown size={15} className="text-[#A8A19A] shrink-0" />
                    )}
                  </button>

                  {/* Preset items */}
                  {isCatOpen && (
                    <div className="px-3 pb-3 pt-1 border-t border-[#EBE6E0] flex flex-wrap gap-1.5">
                      {cat.items.map(item => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => handlePresetSelect(item)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                            formData.name === item
                              ? 'bg-[#9A8073] text-white border-[#9A8073]'
                              : 'bg-white text-[#524A44] border-[#EBE6E0] hover:border-[#9A8073]/50 hover:text-[#9A8073]'
                          }`}
                        >
                          <Icon size={10} className="shrink-0" />
                          {item}
                        </button>
                      ))}
                      <p className="w-full text-[10px] text-[#A8A19A] mt-1.5">Or type a custom name below.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Specialization Name */}
        <div>
          <label htmlFor="spec_name" className="block text-sm font-semibold text-[#524A44] mb-1">
            Specialization Name <span className="text-[#B26959]">*</span>
          </label>
          <input
            id="spec_name"
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Basketball Jerseys, Custom T-shirt Printing"
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="spec_description" className="block text-sm font-semibold text-[#524A44] mb-1">
            Description
          </label>
          <textarea
            id="spec_description"
            value={formData.description}
            onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe your expertise and experience with this apparel type..."
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe h-20 resize-none text-sm"
          />
        </div>

        {/* starting_price + production_time_days */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="starting_price" className="block text-sm font-semibold text-[#524A44] mb-1">
              Starting Price (₱)
            </label>
            <input
              id="starting_price"
              type="number"
              min="0"
              value={formData.starting_price}
              onChange={e =>
                setFormData(f => ({ ...f, starting_price: Number.parseFloat(e.target.value) || 0 }))
              }
              placeholder="e.g. 1500"
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
            />
          </div>
          <div>
            <label htmlFor="production_time_days" className="block text-sm font-semibold text-[#524A44] mb-1">
              Sewing Time (Days)
            </label>
            <input
              id="production_time_days"
              type="number"
              min="0"
              value={formData.production_time_days}
              onChange={e =>
                setFormData(f => ({ ...f, production_time_days: Number.parseInt(e.target.value, 10) || 0 }))
              }
              placeholder="e.g. 7"
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
            />
          </div>
        </div>

        {/* MOQ */}
        <div>
          <label htmlFor="min_order_qty" className="block text-sm font-semibold text-[#524A44] mb-1">
            Min Order Qty (MOQ)
          </label>
          <input
            id="min_order_qty"
            type="number"
            min="1"
            value={formData.min_order_qty}
            onChange={e =>
              setFormData(f => ({ ...f, min_order_qty: Number.parseInt(e.target.value, 10) || 1 }))
            }
            placeholder="e.g. 1"
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
          />
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={e => setFormData(f => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4 text-taupe border-[#EBE6E0] rounded focus:ring-taupe"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-[#524A44]">
            Active (visible to customers)
          </label>
        </div>

        {/* Actions */}
        <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {editingId ? 'Save Changes' : 'Save Specialization'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
