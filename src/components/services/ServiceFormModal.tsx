import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Service, SERVICE_CATEGORIES, SERVICE_TYPES, SERVICE_TYPE_META, ServiceType } from './serviceHelpers';
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
  });
  const [customCategory, setCustomCategory] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [basePrice, setBasePrice] = useState('');
  const [estimatedDays, setEstimatedDays] = useState('');
  const [minOrderQty, setMinOrderQty] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { shop } = useAuthStore();

  const isOtherCategory = formData.category === 'Other / Custom Category';
  const typeMeta = serviceType ? SERVICE_TYPE_META[serviceType] : null;
  const TypeIcon = typeMeta?.icon;

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
        });
        setCustomCategory(customValue);
        setServiceType(editingService.service_type || '');
        setBasePrice(editingService.base_price != null ? String(editingService.base_price) : '');
        setEstimatedDays(editingService.estimated_days != null ? String(editingService.estimated_days) : '');
        setMinOrderQty(editingService.min_order_qty != null ? String(editingService.min_order_qty) : '1');
        setTags(editingService.tags || []);
        setIsActive(editingService.is_active !== false);
        setImageUrl(editingService.image_url || null);
      });
    } else {
      Promise.resolve().then(() => {
        setFormData({ name: '', description: '', category: '' });
        setCustomCategory('');
        setServiceType('');
        setBasePrice('');
        setEstimatedDays('');
        setMinOrderQty('1');
        setTags([]);
        setTagInput('');
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

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const resolvedCategory = isOtherCategory ? customCategory.trim() : formData.category;
    if (isOtherCategory && !customCategory.trim()) return;

    const payload = {
      name: formData.name,
      description: formData.description,
      category: resolvedCategory,
      service_type: serviceType || null,
      tags: tags,
      is_active: isActive,
      image_url: imageUrl,
      base_price: basePrice.trim() === '' ? null : Number.parseFloat(basePrice),
      estimated_days: estimatedDays.trim() === '' ? null : Number.parseInt(estimatedDays, 10),
      min_order_qty: minOrderQty.trim() === '' ? 1 : Number.parseInt(minOrderQty, 10),
    };
    onSubmit(payload);
  };

  const labelClass = 'block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider';
  const inputClass = 'w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? 'Edit Service Catalog' : 'Add Service Catalog'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6 text-[#2D2A26]">
        {error && (
          <div className="p-3 text-sm text-[#B26959] bg-[#B26959]/10 border border-[#B26959]/20 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>
                Title Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className={inputClass}
                placeholder="e.g. Alterations & Repairs"
              />
              <p className="text-xs text-[#A8A19A] mt-1">This acts as the main category for the services below.</p>
            </div>

            <div>
              <label className={labelClass}>
                Service Type *
              </label>
              <div className="flex items-center gap-2">
                <select
                  required
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as ServiceType)}
                  className={`${inputClass} flex-1`}
                >
                  <option value="">Select a service type</option>
                  {SERVICE_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                {typeMeta && TypeIcon && (
                  <span className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center border ${typeMeta.bg} ${typeMeta.border}`} title="Preview: how this type appears elsewhere">
                    <TypeIcon size={16} className={typeMeta.text} />
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A8A19A] mt-1">
                {SERVICE_TYPES.find(t => t.value === serviceType)?.hint || 'Determines which order fields apply when this service is booked (team roster, fitting schedule, damage notes, etc.)'}
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Services (Tags) *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, idx) => (
                  <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-taupe text-white text-sm rounded-full">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-white/70 focus:outline-none">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className={inputClass}
                placeholder="Type a service and press Enter..."
              />
              <p className="text-xs text-[#A8A19A] mt-1">Add specific services that belong to this title.</p>
            </div>

            <div>
              <label className={labelClass}>
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={inputClass}
              >
                <option value="">Select a category</option>
                {SERVICE_CATEGORIES.map(group => (
                  <optgroup key={group.group} label={group.group}>
                    {group.items.map(item => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </optgroup>
                ))}
                <option value="Other / Custom Category">Other / Custom Category</option>
              </select>
            </div>

            {isOtherCategory && (
              <div>
                <label className={labelClass}>
                  Custom Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className={inputClass}
                  placeholder="Enter custom category"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>
                  Starting Price (₱)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 1500"
                />
              </div>
              <div>
                <label className={labelClass}>
                  Turnaround (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={estimatedDays}
                  onChange={(e) => setEstimatedDays(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 7"
                />
              </div>
            </div>

            {serviceType === 'bulk_sublimation' && (
              <div>
                <label className={labelClass}>
                  Minimum Order Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={minOrderQty}
                  onChange={(e) => setMinOrderQty(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. 10"
                />
                <p className="text-xs text-[#A8A19A] mt-1">Team/bulk orders below this quantity will be blocked at job creation.</p>
              </div>
            )}

            <div>
              <label className={labelClass}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Describe this group of services..."
              />
            </div>

            <div>
              <label className={labelClass}>
                Service Group Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#EBE6E0] border-dashed rounded-xl relative overflow-hidden group bg-[#FAF6F3]/50">
                <div className="space-y-1 text-center relative z-10">
                  {uploadingImage ? (
                    <Loader2 className="mx-auto h-8 w-8 text-[#A8A19A] animate-spin" />
                  ) : imageUrl ? (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="mx-auto h-8 w-8 text-[#7A8B76] mb-2" />
                      <span className="text-sm text-[#7A8B76] font-medium">Image uploaded</span>
                      <button type="button" onClick={() => setImageUrl(null)} className="mt-2 text-xs text-[#B26959] hover:text-[#91544A] font-medium focus:outline-none">Remove image</button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-8 w-8 text-[#A8A19A]" />
                      <div className="flex text-sm text-[#827A73] justify-center">
                        <label htmlFor="service-image" className="relative cursor-pointer bg-transparent rounded-md font-medium text-taupe hover:underline focus-within:outline-none">
                          <span>Upload a file</span>
                          <input id="service-image" name="service-image" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                        </label>
                      </div>
                      <p className="text-xs text-[#A8A19A]">PNG, JPG up to 2MB</p>
                    </>
                  )}
                </div>
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-10 transition-opacity" />
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 accent-taupe border-[#EBE6E0] rounded focus:ring-taupe"
              />
              <label htmlFor="is_active" className="text-sm text-[#524A44]">
                Active & Visible to Customers
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#EBE6E0]">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-[#524A44] hover:bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg transition-colors focus:outline-none">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || tags.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-taupe rounded-lg hover:bg-taupe-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors focus:outline-none">
            {isSubmitting ? (
              <><Loader2 size={16} className="animate-spin" /> {editingId ? 'Saving...' : 'Adding...'}</>
            ) : (
              <>{editingId ? 'Save Changes' : 'Add Service Catalog'}</>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
