import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, Plus, X } from 'lucide-react';
import { Service, ServiceField, SERVICE_CATEGORIES } from './serviceHelpers';

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingId: number | null;
  services: Service[];
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  isSubmitting: boolean;
  error: string;
  editingService: Service | null;
}

export default function ServiceFormModal({
  isOpen,
  onClose,
  editingId,
  onSubmit,
  isSubmitting,
  error,
  editingService,
}: ServiceFormModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    base_price: '',
    estimated_days: '',
  });
  const [customFields, setCustomFields] = useState<ServiceField[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [isActive, setIsActive] = useState(true);

  const isOtherCategory = formData.category === 'Other / Custom Category';

  useEffect(() => {
    if (editingService && editingId) {
      const allPredefinedItems = SERVICE_CATEGORIES.flatMap(g => g.items);
      const isKnownCategory = allPredefinedItems.includes(editingService.category || '');
      const dropdownValue = isKnownCategory ? (editingService.category || '') : 'Other / Custom Category';
      const customValue = isKnownCategory ? '' : (editingService.category || '');

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: editingService.name,
        description: editingService.description || '',
        category: dropdownValue,
        base_price: editingService.base_price.toString(),
        estimated_days: editingService.estimated_days.toString(),
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomCategory(customValue);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomFields(editingService.custom_fields || []);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(editingService.is_active !== false);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({ name: '', description: '', category: '', base_price: '', estimated_days: '' });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomCategory('');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCustomFields([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsActive(true);
    }
  }, [editingService, editingId, isOpen]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const resolvedCategory = isOtherCategory ? customCategory.trim() : formData.category;
    
    if (isOtherCategory && !customCategory.trim()) {
      return; // Handled via HTML required anyway
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      category: resolvedCategory,
      estimated_days: Number.parseInt(formData.estimated_days, 10),
      base_price: Number.parseFloat(formData.base_price),
      custom_fields: customFields,
      is_active: isActive,
    };
    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? "Edit Service" : "Add New Service"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="service-name" className="block text-sm font-medium text-[#524A44] mb-1">Service Name <span className="text-[#B26959]">*</span></label>
          <input 
            id="service-name"
            type="text" 
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
            placeholder="e.g. Wedding Dress Tailoring"
          />
        </div>

        <div>
          <label htmlFor="service-category" className="block text-sm font-medium text-[#524A44] mb-1">Category</label>
          <select
            id="service-category"
            value={formData.category}
            onChange={e => {
              setFormData({...formData, category: e.target.value});
              if (e.target.value !== 'Other / Custom Category') setCustomCategory('');
            }}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
          >
            <option value="">— Select a category —</option>
            {SERVICE_CATEGORIES.map(group => (
              <optgroup key={group.group} label={group.group}>
                {group.items.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </optgroup>
            ))}
          </select>

          {isOtherCategory && (
            <div className="mt-2">
              <label htmlFor="custom-category" className="block text-xs font-medium text-[#827A73] mb-1">
                Specify Custom Category <span className="text-[#B26959]">*</span>
              </label>
              <input
                id="custom-category"
                type="text"
                required
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="w-full bg-white border border-taupe/50 rounded-lg px-4 py-2 text-[#2D2A26] text-sm focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe placeholder:text-[#A8A19A]"
                placeholder="e.g. Gown Alteration, Embroidery, Repair"
                autoFocus
              />
              <p className="text-[10px] text-[#A8A19A] mt-1">This exact text will be saved as the category name.</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="base-price" className="block text-sm font-medium text-[#524A44] mb-1">Base Price (₱) <span className="text-[#B26959]">*</span></label>
            <input 
              id="base-price"
              type="number" 
              required
              min="0"
              step="0.01"
              value={formData.base_price}
              onChange={e => setFormData({...formData, base_price: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="est-duration" className="block text-sm font-medium text-[#524A44] mb-1">Est. Duration (Days) <span className="text-[#B26959]">*</span></label>
            <input 
              id="est-duration"
              type="number" 
              required
              min="1"
              value={formData.estimated_days}
              onChange={e => setFormData({...formData, estimated_days: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
              placeholder="7"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="service-desc" className="block text-sm font-medium text-[#524A44] mb-1">Description</label>
          <textarea 
            id="service-desc"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe h-20 resize-none"
            placeholder="Describe what's included..."
          />
        </div>

        <div className="flex items-center gap-2 py-1">
          <input
            type="checkbox"
            id="service-status"
            checked={isActive}
            onChange={e => setIsActive(e.target.checked)}
            className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe h-4 w-4 accent-[#9A8073]"
          />
          <label htmlFor="service-status" className="text-sm font-semibold text-[#524A44] select-none cursor-pointer">
            Service is Active <span className="text-xs text-[#827A73] font-normal">(visible for customer bookings)</span>
          </label>
        </div>

        <div className="border-t border-[#EBE6E0] pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#2D2A26]">Custom Order Specifications</h3>
              <p className="text-xs text-[#827A73]">Ask customers for details (e.g. Name/Number on jersey, custom size) when ordering.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const newField: ServiceField = {
                  id: Math.random().toString(36).substring(2, 11),
                  label: '',
                  type: 'text',
                  required: false,
                  options: []
                };
                setCustomFields([...customFields, newField]);
              }}
              className="flex items-center gap-1 text-xs text-taupe font-semibold hover:underline"
            >
              <Plus size={14} />
              Add Field
            </button>
          </div>

          {customFields.length > 0 && (
            <div className="space-y-3 bg-[#FAF6F3] border border-[#EBE6E0] p-4 rounded-xl max-h-60 overflow-y-auto">
              {customFields.map((field, idx) => (
                <div key={field.id} className="flex flex-col gap-2 p-3 bg-white border border-[#EBE6E0] rounded-lg relative group">
                  <button
                    type="button"
                    onClick={() => setCustomFields(customFields.filter(f => f.id !== field.id))}
                    className="absolute top-2 right-2 text-[#A8A19A] hover:text-[#B26959] transition-colors"
                    title="Remove field"
                  >
                    <X size={16} />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pr-6">
                    <div>
                      <label htmlFor={`field-label-${field.id}`} className="text-[10px] uppercase font-bold text-[#827A73]">Field Label</label>
                      <input
                        id={`field-label-${field.id}`}
                        type="text"
                        required
                        value={field.label}
                        onChange={e => {
                          const updated = [...customFields];
                          updated[idx].label = e.target.value;
                          setCustomFields(updated);
                        }}
                        className="w-full text-xs bg-[#FAF6F3] border border-[#EBE6E0] rounded px-2 py-1 text-[#2D2A26] focus:outline-none"
                        placeholder="e.g. Name on Jersey"
                      />
                    </div>
                    <div>
                      <label htmlFor={`field-type-${field.id}`} className="text-[10px] uppercase font-bold text-[#827A73]">Field Type</label>
                      <select
                        id={`field-type-${field.id}`}
                        value={field.type}
                        onChange={e => {
                          const updated = [...customFields];
                          updated[idx].type = e.target.value as 'text' | 'number' | 'select' | 'radio' | 'checkbox';
                          if (!['select', 'radio', 'checkbox'].includes(e.target.value)) {
                            updated[idx].options = [];
                          }
                          setCustomFields(updated);
                        }}
                        className="w-full text-xs bg-[#FAF6F3] border border-[#EBE6E0] rounded px-2 py-1 text-[#2D2A26] focus:outline-none"
                      >
                        <option value="text">Short Text</option>
                        <option value="number">Number</option>
                        <option value="select">Dropdown Choice</option>
                        <option value="radio">Single Choice (Radio)</option>
                        <option value="checkbox">Multi-Select (Checkbox)</option>
                      </select>
                    </div>
                  </div>

                  {['select', 'radio', 'checkbox'].includes(field.type) && (
                    <div className="mt-1">
                      <label htmlFor={`field-options-${field.id}`} className="text-[10px] uppercase font-bold text-[#827A73]">Options (Comma-separated)</label>
                      <input
                        id={`field-options-${field.id}`}
                        type="text"
                        required
                        value={field.options?.join(', ') || ''}
                        onChange={e => {
                          const updated = [...customFields];
                          updated[idx].options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          setCustomFields(updated);
                        }}
                        className="w-full text-xs bg-[#FAF6F3] border border-[#EBE6E0] rounded px-2 py-1 text-[#2D2A26] focus:outline-none"
                        placeholder="e.g. S, M, L, XL"
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="checkbox"
                      id={`req-${field.id}`}
                      checked={field.required}
                      onChange={e => {
                        const updated = [...customFields];
                        updated[idx].required = e.target.checked;
                        setCustomFields(updated);
                      }}
                      className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe h-3.5 w-3.5"
                    />
                    <label htmlFor={`req-${field.id}`} className="text-xs text-[#524A44] select-none">
                      Required field
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 flex justify-end gap-3">
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
            className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            {editingId ? "Save Changes" : "Save Service"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
