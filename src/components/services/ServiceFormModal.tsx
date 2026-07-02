import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { Loader2, Plus, X, Upload, Image as ImageIcon } from 'lucide-react';
import { Service, SERVICE_CATEGORIES } from './serviceHelpers';
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
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

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
        });
        setCustomCategory(customValue);
        setTags(editingService.tags || []);
        setIsActive(editingService.is_active !== false);
        setImageUrl(editingService.image_url || null);
      });
    } else {
      Promise.resolve().then(() => {
        setFormData({ name: '', description: '', category: '' });
        setCustomCategory('');
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
      tags: tags,
      is_active: isActive,
      image_url: imageUrl,
      // Pass null for fields we removed from the UI to satisfy the backend if needed
      estimated_days: null,
      base_price: null,
      custom_fields: null,
    };
    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingId ? 'Edit Service Catalog' : 'Add Service Catalog'} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 border border-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g. Alterations & Repairs"
              />
              <p className="text-xs text-gray-500 mt-1">This acts as the main category for the services below.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Services (Tags) *
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, idx) => (
                  <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-black text-white text-sm rounded-full">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-gray-300 focus:outline-none">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Type a service and press Enter..."
              />
              <p className="text-xs text-gray-500 mt-1">Add specific services that belong to this title.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Custom Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Enter custom category"
                />
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black resize-none"
                placeholder="Describe this group of services..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Service Group Image
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg relative overflow-hidden group">
                <div className="space-y-1 text-center relative z-10">
                  {uploadingImage ? (
                    <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
                  ) : imageUrl ? (
                    <div className="flex flex-col items-center">
                      <ImageIcon className="mx-auto h-8 w-8 text-green-500 mb-2" />
                      <span className="text-sm text-green-600 font-medium">Image uploaded</span>
                      <button type="button" onClick={() => setImageUrl(null)} className="mt-2 text-xs text-red-500 hover:text-red-700 font-medium focus:outline-none">Remove image</button>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-8 w-8 text-gray-400" />
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label htmlFor="service-image" className="relative cursor-pointer bg-white rounded-md font-medium text-black hover:underline focus-within:outline-none">
                          <span>Upload a file</span>
                          <input id="service-image" name="service-image" type="file" className="sr-only" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
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
                className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
              />
              <label htmlFor="is_active" className="text-sm text-gray-700">
                Active & Visible to Customers
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border rounded-lg transition-colors focus:outline-none">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting || tags.length === 0} className="px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors focus:outline-none">
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
