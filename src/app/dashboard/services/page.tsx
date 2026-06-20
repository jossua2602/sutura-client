'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Search, Plus, Layers, Loader2, Pencil, Trash2, X, Copy, DollarSign } from 'lucide-react';
import Modal from '@/components/Modal';

interface ServicePricing {
  id: number;
  service_id: number;
  apparel_specialization_id: number | null;
  label: string;
  amount: string;
  apparel_specialization?: {
    id: number;
    name: string;
  } | null;
}

interface Specialization {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

const SERVICE_CATEGORIES = [
  { group: 'Printing & Sublimation', items: [
    'Custom T-shirt Printing',
    'Full Sublimation Printing',
    'Long Sleeve Printing',
    'Polo Shirt Printing',
    'Hoodie / Jacket Printing',
  ]},
  { group: 'Uniforms & Bulk Orders', items: [
    'School / Student Org Uniforms',
    'Company / Corporate Uniforms',
    'Sports Team Jerseys',
    'Basketball Jersey Set',
    'Cycling Jersey',
    'Campaign / Org Shirts',
  ]},
  { group: 'Sportswear & Apparel', items: [
    'Jogging Pants',
    'Sports Shorts',
    'Esports / Gaming Jerseys',
    'Sportswear / Athletic Wear',
  ]},
  { group: 'Custom Tailoring', items: [
    'Customized Dress / Blouse',
    'Customized Shorts / Pants',
    'Barong Tagalog',
    'Filipiniana / Formal Wear',
    'Costume / Special Design',
  ]},
  { group: 'Design & Layout Services', items: [
    'Graphic Design / Logo Layout',
    'T-shirt Design Layout (w/ Soft Copy)',
    'Design Consultation',
  ]},
  { group: 'Other', items: ['Other / Custom Category'] },
];

interface ServiceField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[];
}

interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  base_price: string;
  estimated_days: number;
  is_active: boolean;
  custom_fields?: ServiceField[] | null;
}

export default function ServicesPage() {
  const { shop , user } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    base_price: '',
    estimated_days: '',
  });
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [customFields, setCustomFields] = useState<ServiceField[]>([]);
  const [customCategory, setCustomCategory] = useState('');

  // Pricing Modal states
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [pricingService, setPricingService] = useState<Service | null>(null);
  const [pricings, setPricings] = useState<ServicePricing[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loadingPricings, setLoadingPricings] = useState(false);
  const [submittingPricing, setSubmittingPricing] = useState(false);
  const [pricingError, setPricingError] = useState('');
  const [pricingFormData, setPricingFormData] = useState({
    apparel_specialization_id: '',
    label: '',
    amount: ''
  });

  const handleDuplicateClick = async (service: Service) => {
    if (!shop) return;
    setActionLoadingId(service.id);
    try {
      const payload = {
        name: `${service.name} (Copy)`,
        description: service.description || '',
        category: service.category,
        base_price: parseFloat(service.base_price),
        estimated_days: service.estimated_days,
        custom_fields: service.custom_fields || [],
        is_active: service.is_active
      };
      const res = await api.post(`/shops/${shop.id}/services`, payload);
      setServices(prev => [res.data.data, ...prev]);
    } catch (err) {
      console.error(err);
      alert('Failed to duplicate service');
    } finally {
      setActionLoadingId(null);
    }
  };

  const fetchServices = useCallback(() => {
    if (!shop) {
      if (user) setTimeout(() => setLoading(false), 0);
      return;
    }
    api.get(`/shops/${shop.id}/services`)
      .then(res => {
        setServices(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [shop, user]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (shop) {
      api.get(`/shops/${shop.id}/specializations`)
        .then(res => setSpecializations(res.data.data))
        .catch(err => console.error('Failed to fetch specializations:', err));
    }
  }, [shop]);

  const handleManagePricingClick = async (service: Service) => {
    if (!shop) return;
    setPricingService(service);
    setPricingError('');
    setPricingFormData({
      apparel_specialization_id: '',
      label: '',
      amount: ''
    });
    setIsPricingModalOpen(true);
    setLoadingPricings(true);
    try {
      const res = await api.get(`/shops/${shop.id}/services/${service.id}/pricing`);
      setPricings(res.data.data);
    } catch (err) {
      console.error(err);
      setPricingError('Failed to load pricing options.');
    } finally {
      setLoadingPricings(false);
    }
  };

  const handleAddPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop || !pricingService) return;

    setSubmittingPricing(true);
    setPricingError('');
    try {
      const payload = {
        label: pricingFormData.label,
        amount: parseFloat(pricingFormData.amount),
        apparel_specialization_id: pricingFormData.apparel_specialization_id 
          ? parseInt(pricingFormData.apparel_specialization_id) 
          : null
      };

      await api.post(`/shops/${shop.id}/services/${pricingService.id}/pricing`, payload);
      
      const reloadRes = await api.get(`/shops/${shop.id}/services/${pricingService.id}/pricing`);
      setPricings(reloadRes.data.data);

      setPricingFormData({
        apparel_specialization_id: '',
        label: '',
        amount: ''
      });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setPricingError(error.response?.data?.message || 'Failed to save pricing option.');
    } finally {
      setSubmittingPricing(false);
    }
  };

  const handleDeletePricing = async (pricingId: number) => {
    if (!shop || !pricingService) return;
    try {
      await api.delete(`/shops/${shop.id}/services/${pricingService.id}/pricing/${pricingId}`);
      setPricings(prev => prev.filter(p => p.id !== pricingId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete pricing option.');
    }
  };

  const isOtherCategory = formData.category === 'Other / Custom Category';

  const handleAddService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shop) return;

    // If "Other / Custom Category" is selected, the custom text must be filled
    if (isOtherCategory && !customCategory.trim()) {
      setError('Please specify your custom category.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const resolvedCategory = isOtherCategory ? customCategory.trim() : formData.category;
      const payload = {
        ...formData,
        category: resolvedCategory,
        estimated_days: Number.parseInt(formData.estimated_days),
        base_price: Number.parseFloat(formData.base_price),
        custom_fields: customFields
      };

      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/services/${editingId}`, payload);
        setServices(prev => prev.map(s => s.id === editingId ? res.data.data : s));
      } else {
        const res = await api.post(`/shops/${shop.id}/services`, payload);
        setServices(prev => [res.data.data, ...prev]);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setCustomCategory('');
      setFormData({ name: '', description: '', category: '', base_price: '', estimated_days: '' });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (service: Service) => {
    setEditingId(service.id);
    // Determine if the saved category is a known predefined option
    const allPredefinedItems = SERVICE_CATEGORIES.flatMap(g => g.items);
    const isKnownCategory = allPredefinedItems.includes(service.category || '');
    const dropdownValue = isKnownCategory ? (service.category || '') : 'Other / Custom Category';
    const customValue = isKnownCategory ? '' : (service.category || '');

    setFormData({
      name: service.name,
      description: service.description || '',
      category: dropdownValue,
      base_price: service.base_price.toString(),
      estimated_days: service.estimated_days.toString()
    });
    setCustomCategory(customValue);
    setCustomFields(service.custom_fields || []);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/services/${deletingId}`);
      setServices(prev => prev.filter(s => s.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', category: '', base_price: '', estimated_days: '' });
    setCustomFields([]);
    setCustomCategory('');
    setError('');
  };

  const allCategories = ['All', ...Array.from(new Set(services.map(s => s.category).filter(Boolean)))];

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Services Catalog</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage your tailoring offerings and turnaround times.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', description: '', category: '', base_price: '', estimated_days: '' });
            setError('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Service
        </button>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#EBE6E0] flex items-center justify-between bg-white">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
            <input
              type="text"
              placeholder="Search services by name or category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
            />
          </div>
          <div className="text-sm text-[#827A73] font-medium">
            Total Services: {services.length}
          </div>
        </div>

        {allCategories.length > 1 && (
          <div className="flex gap-2 px-4 py-3 border-b border-[#EBE6E0] overflow-x-auto">
            {allCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === cat
                    ? 'bg-[#9A8073] text-white'
                    : 'bg-[#F0EAE3] text-[#827A73] hover:bg-[#EBE6E0]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#524A44]">
            <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
              <tr>
                <th className="px-6 py-4 font-medium">Service Name</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Base Price</th>
                <th className="px-6 py-4 font-medium">Est. Days</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#A8A19A]">
                    Loading services...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#A8A19A] text-sm">
                    {categoryFilter === 'All'
                      ? 'No services yet. Click "Add Service" to create one.'
                      : `No services in "${categoryFilter}" category.`}
                  </td>
                </tr>
              )}
              {!loading && filtered.length > 0 && (
                filtered.map((service) => (
                  <tr key={service.id} className="hover:bg-[#F0EAE3]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F0EAE3] flex items-center justify-center text-[#827A73]">
                          <Layers size={16} />
                        </div>
                        <span className="font-medium text-[#2D2A26]">{service.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#827A73] max-w-xs truncate">
                      {service.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#524A44]">₱{Number.parseFloat(service.base_price).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#524A44]">{service.estimated_days} days</span>
                    </td>
                    <td className="px-6 py-4">
                      {service.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-zinc-500/10 text-[#827A73] border-zinc-500/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actionLoadingId === service.id ? (
                          <Loader2 size={16} className="animate-spin text-[#A8A19A]" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleDuplicateClick(service)}
                              title="Duplicate Service"
                              className="text-[#A8A19A] hover:text-[#9A8073] hover:bg-[#FAF6F3] p-1.5 rounded-lg border border-transparent hover:border-[#EBE6E0] transition-colors"
                            >
                              <Copy size={14} />
                            </button>
                            <button
                              onClick={() => handleManagePricingClick(service)}
                              title="Manage Pricing Options"
                              className="text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#FAF6F3] p-1.5 rounded-lg border border-transparent hover:border-[#EBE6E0] transition-colors"
                            >
                              <DollarSign size={14} />
                            </button>
                            <button
                              onClick={() => handleEditClick(service)}
                              title="Edit Service"
                              className="text-[#A8A19A] hover:text-[#2D2A26] hover:bg-[#FAF6F3] p-1.5 rounded-lg border border-transparent hover:border-[#EBE6E0] transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(service.id)}
                              title="Delete Service"
                              className="text-[#A8A19A] hover:text-[#B26959] hover:bg-[#B26959]/10 p-1.5 rounded-lg border border-transparent hover:border-[#B26959]/20 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Service" : "Add New Service"}>
        <form onSubmit={handleAddService} className="space-y-4">
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

            {/* Show custom category input when "Other / Custom Category" is selected */}
            {isOtherCategory && (
              <div className="mt-2">
                <label htmlFor="custom-category" className="block text-xs font-medium text-[#827A73] mb-1">
                  Specify Custom Category <span className="text-[#B26959]">*</span>
                </label>
                <input
                  id="custom-category"
                  type="text"
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

          {/* Custom Fields Builder */}
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
                            updated[idx].type = e.target.value as 'text' | 'number' | 'select';
                            if (e.target.value !== 'select') {
                              updated[idx].options = [];
                            }
                            setCustomFields(updated);
                          }}
                          className="w-full text-xs bg-[#FAF6F3] border border-[#EBE6E0] rounded px-2 py-1 text-[#2D2A26] focus:outline-none"
                        >
                          <option value="text">Short Text</option>
                          <option value="number">Number</option>
                          <option value="select">Dropdown Choice</option>
                        </select>
                      </div>
                    </div>

                    {field.type === 'select' && (
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
              onClick={closeModal}
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-[#524A44] text-sm">
            Are you sure you want to delete this service? This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Manage Pricing Modal */}
      <Modal 
        isOpen={isPricingModalOpen} 
        onClose={() => setIsPricingModalOpen(false)} 
        title={`Manage Pricing — ${pricingService?.name || ''}`}
      >
        <div className="space-y-6">
          <p className="text-xs text-[#827A73]">
            Define additional pricing variants or upgrades for this service. These options can be selected when creating a job order.
          </p>

          {pricingError && (
            <div className="bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-2.5 rounded-lg text-xs">
              {pricingError}
            </div>
          )}

          {/* Add New Pricing Form */}
          <form onSubmit={handleAddPricing} className="bg-[#FAF6F3] border border-[#EBE6E0] p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider">Add Pricing Option</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label htmlFor="pricing-label" className="block text-xs font-medium text-[#524A44] mb-1">Label / Option Name *</label>
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
                <label htmlFor="pricing-amount" className="block text-xs font-medium text-[#524A44] mb-1">Additional Amount (₱) *</label>
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

            <div>
              <label htmlFor="pricing-spec" className="block text-xs font-medium text-[#524A44] mb-1">Apparel Specialization (Optional)</label>
              <select
                id="pricing-spec"
                value={pricingFormData.apparel_specialization_id}
                onChange={e => setPricingFormData({ ...pricingFormData, apparel_specialization_id: e.target.value })}
                className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-1.5 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="">— General / No Specialization —</option>
                {specializations.map(spec => (
                  <option key={spec.id} value={spec.id}>{spec.name}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submittingPricing}
                className="bg-taupe hover:bg-taupe/90 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {submittingPricing && <Loader2 size={12} className="animate-spin" />}
                Add Option
              </button>
            </div>
          </form>

          {/* Pricing Options List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider">Active Pricing Options</h3>
            
            {loadingPricings ? (
              <div className="text-center py-6 text-xs text-[#A8A19A] flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin text-taupe" />
                Loading options...
              </div>
            ) : pricings.length === 0 ? (
              <div className="text-center py-6 text-xs text-[#A8A19A] border border-dashed border-[#EBE6E0] rounded-xl">
                No pricing options configured yet.
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {pricings.map(pricing => (
                  <div 
                    key={pricing.id} 
                    className="flex items-center justify-between p-3 bg-white border border-[#EBE6E0] rounded-lg hover:border-taupe/55 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-semibold text-sm text-[#2D2A26]">{pricing.label}</div>
                      {pricing.apparel_specialization && (
                        <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-[#F0EAE3] text-[#827A73] border border-[#EBE6E0] font-medium">
                          {pricing.apparel_specialization.name}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-sm text-[#2D2A26]">
                        +₱{parseFloat(pricing.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
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
            )}
          </div>

          <div className="pt-4 border-t border-[#EBE6E0] flex justify-end">
            <button
              type="button"
              onClick={() => setIsPricingModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
