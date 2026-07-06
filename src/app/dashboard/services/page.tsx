'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

import { Service } from '@/components/services/serviceHelpers';
import ServiceFormModal from '@/components/services/ServiceFormModal';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import ServiceListView from '@/components/services/ServiceListView';
import ServicePricingModal from '@/components/services/ServicePricingModal';
import ServiceTrashModal from '@/components/services/ServiceTrashModal';
import SettingsServicesPricing from '@/components/settings/SettingsServicesPricing';
import { Sparkles } from 'lucide-react';

export default function ServicesPage() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAutoPopulate, setShowAutoPopulate] = useState(false);
  const [pricingService, setPricingService] = useState<Service | null>(null);
  const [showTrash, setShowTrash] = useState(false);

  const fetchServices = useCallback(() => {
    if (!shop?.id) {
      if (user?.id) setTimeout(() => setLoading(false), 0);
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

  const handleDuplicateClick = async (service: Service) => {
    if (!shop) return;
    setActionLoadingId(service.id);
    try {
      const payload = {
        name: `${service.name} (Copy)`,
        description: service.description || '',
        category: service.category,
        service_type: service.service_type || null,
        base_price: service.base_price ? Number.parseFloat(service.base_price.toString()) : null,
        estimated_days: service.estimated_days,
        min_order_qty: service.min_order_qty || 1,
        custom_fields: service.custom_fields || [],
        is_active: service.is_active
      };
      const res = await api.post(`/shops/${shop.id}/services`, payload);
      setServices(prev => [res.data.data, ...prev]);
      toast.success('Service duplicated successfully.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to duplicate service. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleFormSubmit = async (payload: Record<string, unknown>) => {
    if (!shop) return;
    setIsSubmitting(true);
    setError('');

    try {
      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/services/${editingId}`, payload);
        setServices(prev => prev.map(s => s.id === editingId ? res.data.data : s));
        toast.success('Service updated successfully.');
      } else {
        const res = await api.post(`/shops/${shop.id}/services`, payload);
        setServices(prev => [res.data.data, ...prev]);
        toast.success('Service created successfully.');
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/services/${deletingId}`);
      setServices(prev => prev.filter(s => s.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      toast.success('Service deleted.');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async (ids: number[]) => {
    if (!shop) return;
    try {
      await Promise.all(ids.map(id => api.delete(`/shops/${shop.id}/services/${id}`)));
      setServices(prev => prev.filter(s => !ids.includes(s.id)));
      toast.success(`${ids.length} service${ids.length > 1 ? 's' : ''} deleted.`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete some services. Please try again.');
    }
  };

  const handleEditClick = (service: Service) => {
    setEditingId(service.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const categoriesList = ['All', ...Array.from(new Set(services.map(s => s.category).filter(Boolean)))];

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || (s.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'All' || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const editingService = editingId ? (services.find(s => s.id === editingId) || null) : null;

  return (
    <div className="space-y-6 text-[#2D2A26]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Services Catalog</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage your tailoring offerings and turnaround times.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTrash(true)}
            title="View deleted services"
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#FAF6F3] border border-[#EBE6E0] text-[#827A73] hover:bg-[#F0EAE3] transition-colors"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={() => setShowAutoPopulate(!showAutoPopulate)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${showAutoPopulate ? 'bg-[#EBE6E0] text-[#2D2A26]' : 'bg-[#FAF6F3] border border-[#EBE6E0] text-[#524A44] hover:bg-[#F0EAE3]'}`}
          >
            <Sparkles size={18} className={showAutoPopulate ? 'text-taupe' : ''} />
            Auto-Populate
          </button>
          <button
            onClick={() => {
              setEditingId(null);
              setError('');
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Add Service
          </button>
        </div>
      </div>

      {showAutoPopulate && (
        <SettingsServicesPricing />
      )}

      <ServiceListView
        filteredServices={filtered}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        allCategories={categoriesList}
        actionLoadingId={actionLoadingId}
        onDuplicate={handleDuplicateClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onManagePricing={setPricingService}
        onBulkDelete={handleBulkDelete}
      />

      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          setError('');
        }}
        editingId={editingId}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        error={error}
        editingService={editingService}
      />

      <ServiceDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />

      {shop && (
        <ServicePricingModal
          isOpen={pricingService !== null}
          onClose={() => setPricingService(null)}
          shopId={shop.id}
          service={pricingService}
        />
      )}

      {shop && (
        <ServiceTrashModal
          isOpen={showTrash}
          onClose={() => setShowTrash(false)}
          shopId={shop.id}
          onRestored={(restored) => {
            setServices(prev => [restored, ...prev]);
            toast.success(`"${restored.name}" restored to your active catalog.`);
          }}
        />
      )}
    </div>
  );
}
