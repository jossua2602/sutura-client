import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, Plus, X, Upload, Image as ImageIcon, GripVertical, Type, Hash, ChevronDown, ToggleLeft, CheckSquare } from 'lucide-react';
import { Service, ServiceField, SERVICE_CATEGORIES } from './serviceHelpers';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

interface ServiceFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly editingId: number | null;
  readonly onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  readonly isSubmitting: boolean;
  readonly error: string;
  readonly editingService: Service | null;
}

const FIELD_TYPES: { value: ServiceField['type']; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'text',     label: 'Short Text',       icon: <Type size={13} />,        description: 'Free-form text answer' },
  { value: 'number',   label: 'Number',            icon: <Hash size={13} />,        description: 'Numeric input' },
  { value: 'select',   label: 'Dropdown',          icon: <ChevronDown size={13} />, description: 'Pick one from a list' },
  { value: 'radio',    label: 'Single Choice',     icon: <ToggleLeft size={13} />,  description: 'Radio button selection' },
  { value: 'checkbox', label: 'Multi-Select',      icon: <CheckSquare size={13} />, description: 'Multiple selections' },
];

const hasOptions = (type: string) => ['select', 'radio', 'checkbox'].includes(type);

// ── Helpers for immutable field updates ──────────────────────────────────────
function updateField<K extends keyof ServiceField>(
  fields: ServiceField[],
  idx: number,
  key: K,
  value: ServiceField[K]
): ServiceField[] {
  return fields.map((f, i) => (i === idx ? { ...f, [key]: value } : f));
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  // Per-field: track the raw options string separately so typing is smooth
  const [optionInputs, setOptionInputs] = useState<Record<string, string>>({});
  const { shop } = useAuthStore();

  const isOtherCategory = formData.category === 'Other / Custom Category';

  useEffect(() => {
    if (editingService && editingId) {
      Promise.resolve().then(() => {
        const allPredefinedItems = SERVICE_CATEGORIES.flatMap(g => g.items);
        const isKnownCategory = allPredefinedItems.includes(editingService.category || '');
        const dropdownValue = isKnownCategory ? (editingService.category || '') : 'Other / Custom Category';
        const customValue = isKnownCategory ? '' : (editingService.category || '');

        setFormData({
          name: editingService.name,
          description: editingService.description || '',
          category: dropdownValue,
          base_price: editingService.base_price.toString(),
          estimated_days: editingService.estimated_days.toString(),
        });
        setCustomCategory(customValue);

        const fields = editingService.custom_fields || [];
        setCustomFields(fields);
        // Pre-populate option inputs
        const initInputs: Record<string, string> = {};
        fields.forEach(f => {
          if (f.options?.length) initInputs[f.id] = f.options.join(', ');
        });
        setOptionInputs(initInputs);

        setIsActive(editingService.is_active !== false);
        setImageUrl(editingService.image_url || null);
      });
    } else {
      Promise.resolve().then(() => {
        setFormData({ name: '', description: '', category: '', base_price: '', estimated_days: '' });
        setCustomCategory('');
        setCustomFields([]);
        setOptionInputs({});
        setIsActive(true);
        setImageUrl(null);
      });
    }
  }, [editingService, editingId, isOpen]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !shop) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append('file', file);
    setUploadingImage(true);
    try {
      const res = await api.post(`/shops/${shop.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(res.data.data?.url || res.data.url || null);
    } catch {
      // silently fail
    } finally {
      setUploadingImage(false);
    }
  };

  const addField = () => {
    const newField: ServiceField = {
      id: Math.random().toString(36).substring(2, 11),
      label: '',
      type: 'text',
      required: false,
      options: [],
    };
    setCustomFields(prev => [...prev, newField]);
  };

  const removeField = (id: string) => {
    setCustomFields(prev => prev.filter(f => f.id !== id));
    setOptionInputs(prev => { const next = { ...prev }; delete next[id]; return next; });
  };

  const handleFieldLabel = (idx: number, value: string) => {
    setCustomFields(prev => updateField(prev, idx, 'label', value));
  };

  const handleFieldType = (idx: number, value: ServiceField['type']) => {
    setCustomFields(prev => updateField(prev, idx, 'type', value));
    // Clear options when switching to non-option type
    if (!hasOptions(value)) {
      const fieldId = customFields[idx]?.id;
      setCustomFields(prev => updateField(prev, idx, 'options', []));
      if (fieldId) setOptionInputs(prev => { const next = { ...prev }; delete next[fieldId]; return next; });
    }
  };

  const handleFieldRequired = (idx: number, value: boolean) => {
    setCustomFields(prev => updateField(prev, idx, 'required', value));
  };

  const handleOptionsInput = (idx: number, fieldId: string, raw: string) => {
    setOptionInputs(prev => ({ ...prev, [fieldId]: raw }));
    const parsed = raw.split(',').map(s => s.trim()).filter(Boolean);
    setCustomFields(prev => updateField(prev, idx, 'options', parsed));
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const resolvedCategory = isOtherCategory ? customCategory.trim() : formData.category;
    if (isOtherCategory && !customCategory.trim()) return;

    // Validate all fields have labels
    const hasEmptyLabels = customFields.some(f => !f.label.trim());
    if (hasEmptyLabels) return;

    const payload = {
      name: formData.name,
      description: formData.description,
      category: resolvedCategory,
      estimated_days: Number.parseInt(formData.estimated_days, 10),
      base_price: Number.parseFloat(formData.base_price),
      custom_fields: customFields,
      is_active: isActive,
      image_url: imageUrl,
    };
    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? 'Edit Service' : 'Add New Service'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Error banner */}
        {error && (
          <div className="bg-[#B26959]/10 border border-[#B26959]/40 text-[#B26959] px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* ── Image Upload ─────────────────────────────── */}
        <div>
          <span className="block text-sm font-medium text-[#524A44] mb-2">Service Image</span>
          {imageUrl ? (
            <div className="relative w-full h-44 rounded-xl overflow-hidden border border-[#EBE6E0] group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="Service" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="cursor-pointer bg-white/90 hover:bg-white text-[#2D2A26] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                  <Upload size={12} /> Change
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                </label>
                <button type="button" onClick={() => setImageUrl(null)}
                  className="bg-white/90 hover:bg-white text-[#B26959] px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5">
                  <X size={12} /> Remove
                </button>
              </div>
            </div>
          ) : (
            <label className={`flex flex-col items-center justify-center gap-2 w-full h-36 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
              uploadingImage ? 'border-[#9A8073] bg-[#FAF6F3]' : 'border-[#EBE6E0] hover:border-[#9A8073] hover:bg-[#FAF6F3]'
            }`}>
              {uploadingImage
                ? <><Loader2 size={20} className="animate-spin text-[#9A8073]" /><span className="text-xs text-[#9A8073]">Uploading...</span></>
                : <><ImageIcon size={22} className="text-[#C5BDBA]" /><span className="text-xs text-[#A8A19A]">Click to upload a service image</span><span className="text-[10px] text-[#C5BDBA]">PNG, JPG, WEBP up to 5MB</span></>
              }
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
            </label>
          )}
        </div>

        {/* ── Service Name ──────────────────────────────── */}
        <div>
          <label htmlFor="service-name" className="block text-sm font-medium text-[#524A44] mb-1.5">
            Service Name <span className="text-[#B26959]">*</span>
          </label>
          <input
            id="service-name"
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-4 py-2.5 text-[#2D2A26] text-sm focus:outline-none focus:border-[#9A8073] focus:ring-2 focus:ring-[#9A8073]/10 transition-colors"
            placeholder="e.g. Wedding Dress Tailoring"
          />
        </div>

        {/* ── Category ─────────────────────────────────── */}
        <div>
          <label htmlFor="service-category" className="block text-sm font-medium text-[#524A44] mb-1.5">Category</label>
          <select
            id="service-category"
            value={formData.category}
            onChange={e => {
              setFormData({ ...formData, category: e.target.value });
              if (e.target.value !== 'Other / Custom Category') setCustomCategory('');
            }}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-4 py-2.5 text-[#2D2A26] text-sm focus:outline-none focus:border-[#9A8073] transition-colors"
          >
            <option value="">— Select a category —</option>
            {SERVICE_CATEGORIES.map(group => (
              <optgroup key={group.group} label={group.group}>
                {group.items.map(item => <option key={item} value={item}>{item}</option>)}
              </optgroup>
            ))}
          </select>

          {isOtherCategory && (
            <div className="mt-2">
              <input
                id="custom-category"
                type="text"
                required
                value={customCategory}
                onChange={e => setCustomCategory(e.target.value)}
                className="w-full bg-white border border-[#9A8073]/40 rounded-xl px-4 py-2.5 text-[#2D2A26] text-sm focus:outline-none focus:border-[#9A8073] focus:ring-2 focus:ring-[#9A8073]/10 placeholder:text-[#A8A19A]"
                placeholder="e.g. Gown Alteration, Embroidery, Repair"
                autoFocus
              />
              <p className="text-[10px] text-[#A8A19A] mt-1 pl-1">This exact text will be saved as the category name.</p>
            </div>
          )}
        </div>

        {/* ── Base Price + Duration ─────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="base-price" className="block text-sm font-medium text-[#524A44] mb-1.5">
              Base Price (₱) <span className="text-[#B26959]">*</span>
            </label>
            <input
              id="base-price"
              type="number"
              required
              min="0"
              step="0.01"
              value={formData.base_price}
              onChange={e => setFormData({ ...formData, base_price: e.target.value })}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-4 py-2.5 text-[#2D2A26] text-sm focus:outline-none focus:border-[#9A8073] focus:ring-2 focus:ring-[#9A8073]/10 transition-colors"
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="est-duration" className="block text-sm font-medium text-[#524A44] mb-1.5">
              Est. Duration (Days) <span className="text-[#B26959]">*</span>
            </label>
            <input
              id="est-duration"
              type="number"
              required
              min="1"
              value={formData.estimated_days}
              onChange={e => setFormData({ ...formData, estimated_days: e.target.value })}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-4 py-2.5 text-[#2D2A26] text-sm focus:outline-none focus:border-[#9A8073] focus:ring-2 focus:ring-[#9A8073]/10 transition-colors"
              placeholder="7"
            />
          </div>
        </div>

        {/* ── Description ───────────────────────────────── */}
        <div>
          <label htmlFor="service-desc" className="block text-sm font-medium text-[#524A44] mb-1.5">Description</label>
          <textarea
            id="service-desc"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-4 py-2.5 text-[#2D2A26] text-sm focus:outline-none focus:border-[#9A8073] focus:ring-2 focus:ring-[#9A8073]/10 h-20 resize-none transition-colors"
            placeholder="Describe what's included in this service..."
          />
        </div>

        {/* ── Active toggle ─────────────────────────────── */}
        <div className="flex items-center gap-3 select-none group">
          <div className="relative">
            <input
              type="checkbox"
              id="service-status"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="sr-only"
            />
            <div className={`w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-[#9A8073]' : 'bg-[#D1C7BD]'}`} />
            <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
          <label htmlFor="service-status" className="cursor-pointer">
            <span className="block text-sm font-medium text-[#524A44]">Service is Active</span>
            <span className="block text-[11px] text-[#A8A19A]">Visible to customers for booking</span>
          </label>
        </div>


        {/* ── Custom Order Specifications ───────────────── */}
        <div className="border-t border-[#EBE6E0] pt-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#2D2A26]">Custom Order Specifications</h3>
              <p className="text-xs text-[#A8A19A] mt-0.5">
                Ask customers for extra details when booking this service (e.g. name on jersey, measurements, color preference).
              </p>
            </div>
            <button
              type="button"
              onClick={addField}
              className="flex items-center gap-1.5 bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#9A8073] hover:text-[#2D2A26] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 ml-4"
            >
              <Plus size={13} /> Add Field
            </button>
          </div>

          {customFields.length === 0 && (
            <div className="text-center py-8 bg-[#FAF6F3] rounded-xl border border-dashed border-[#EBE6E0]">
              <p className="text-xs text-[#C5BDBA] font-medium">No custom fields yet.</p>
              <p className="text-[11px] text-[#C5BDBA] mt-0.5">Click &quot;Add Field&quot; to collect extra info from customers.</p>
            </div>
          )}

          {customFields.length > 0 && (
            <div className="space-y-3">
              {customFields.map((field, idx) => (
                <div
                  key={field.id}
                  className="bg-white border border-[#EBE6E0] rounded-2xl p-4 shadow-sm space-y-3 relative"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[#A8A19A]">
                      <GripVertical size={14} className="cursor-grab" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#C5BDBA]">
                        Field {idx + 1}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="p-1 rounded-lg text-[#A8A19A] hover:text-[#B26959] hover:bg-[#B26959]/10 transition-colors"
                      title="Remove field"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* Field Label */}
                  <div>
                    <label
                      htmlFor={`field-label-${field.id}`}
                      className="block text-xs font-semibold text-[#524A44] mb-1"
                    >
                      Field Label <span className="text-[#B26959]">*</span>
                    </label>
                    <input
                      id={`field-label-${field.id}`}
                      type="text"
                      required
                      value={field.label}
                      onChange={e => handleFieldLabel(idx, e.target.value)}
                      className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-2 focus:ring-[#9A8073]/10 transition-colors placeholder:text-[#C5BDBA]"
                      placeholder="e.g. Name on Jersey, Chest Size, Color Preference"
                    />
                  </div>

                  {/* Field Type — button group */}
                  <div>
                    <p className="text-xs font-semibold text-[#524A44] mb-2">Field Type</p>
                    <div className="flex flex-wrap gap-2">
                      {FIELD_TYPES.map(ft => (
                        <button
                          key={ft.value}
                          type="button"
                          onClick={() => handleFieldType(idx, ft.value)}
                          title={ft.description}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                            field.type === ft.value
                              ? 'bg-[#9A8073] text-white border-[#9A8073] shadow-sm'
                              : 'bg-[#FAF6F3] text-[#827A73] border-[#EBE6E0] hover:border-[#9A8073] hover:text-[#9A8073]'
                          }`}
                        >
                          {ft.icon}
                          {ft.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-[#A8A19A] mt-1.5">
                      {FIELD_TYPES.find(ft => ft.value === field.type)?.description}
                    </p>
                  </div>

                  {/* Options input — only for select/radio/checkbox */}
                  {hasOptions(field.type) && (
                    <div>
                      <label
                        htmlFor={`field-options-${field.id}`}
                        className="block text-xs font-semibold text-[#524A44] mb-1"
                      >
                        Options <span className="text-[#B26959]">*</span>
                        <span className="font-normal text-[#A8A19A] ml-1">(comma-separated)</span>
                      </label>
                      <input
                        id={`field-options-${field.id}`}
                        type="text"
                        required={hasOptions(field.type)}
                        value={optionInputs[field.id] ?? (field.options?.join(', ') || '')}
                        onChange={e => handleOptionsInput(idx, field.id, e.target.value)}
                        className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-[#9A8073] focus:ring-2 focus:ring-[#9A8073]/10 transition-colors placeholder:text-[#C5BDBA]"
                        placeholder="e.g. S, M, L, XL  or  Red, Blue, Green"
                      />
                      {field.options && field.options.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {field.options.map(opt => (
                            <span key={opt} className="inline-flex items-center px-2 py-0.5 bg-[#F0EAE3] text-[#9A8073] rounded-full text-[11px] font-medium">
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Required toggle */}
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id={`req-${field.id}`}
                      checked={field.required}
                      onChange={e => handleFieldRequired(idx, e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-[#EBE6E0] accent-[#9A8073] cursor-pointer"
                    />
                    <span className="text-xs text-[#524A44] font-medium">Required field</span>
                    <span className="text-[10px] text-[#A8A19A]">(customer must fill this in)</span>
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Actions ──────────────────────────────────── */}
        <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-[#524A44] hover:bg-[#F0EAE3] hover:text-[#2D2A26] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#9A8073] hover:bg-[#8a7065] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={15} className="animate-spin" />}
            {editingId ? 'Save Changes' : 'Save Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
