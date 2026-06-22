'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus } from 'lucide-react';

import { Service, Specialization } from '@/components/services/serviceHelpers';
import ServiceFormModal from '@/components/services/ServiceFormModal';
import ServicePricingModal from '@/components/services/ServicePricingModal';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';
import ServiceListView from '@/components/services/ServiceListView';

export default function ServicesPage() {
  const { shop, user } = useAuthStore();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pricingService, setPricingService] = useState<Service | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [specializations, setSpecializations] = useState<Specialization[]>([]);

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
  }, [shop?.id, user?.id]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    if (shop?.id) {
      api.get(`/shops/${shop.id}/specializations`)
        .then(res => setSpecializations(res.data.data))
        .catch(err => console.error('Failed to fetch specializations:', err));
    }
  }, [shop?.id]);

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

  const handleFormSubmit = async (payload: Record<string, unknown>) => {
    if (!shop) return;
    setIsSubmitting(true);
    setError('');

    try {
      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/services/${editingId}`, payload);
        setServices(prev => prev.map(s => s.id === editingId ? res.data.data : s));
      } else {
        const res = await api.post(`/shops/${shop.id}/services`, payload);
        setServices(prev => [res.data.data, ...prev]);
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
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete service');
    } finally {
      setIsSubmitting(false);
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

  const handleManagePricingClick = (service: Service) => {
    setPricingService(service);
    setIsPricingModalOpen(true);
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

      <ServiceListView
        services={services}
        filteredServices={filtered}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        allCategories={categoriesList}
        actionLoadingId={actionLoadingId}
        onDuplicate={handleDuplicateClick}
        onManagePricing={handleManagePricingClick}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      <ServiceFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          setError('');
        }}
        editingId={editingId}
        services={services}
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
          isOpen={isPricingModalOpen}
          onClose={() => {
            setIsPricingModalOpen(false);
            setPricingService(null);
          }}
          shopId={shop.id}
          service={pricingService}
          specializations={specializations}
        />
      )}
    </div>
  );
}
