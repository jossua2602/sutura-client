'use client';

import React, { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { Search, Plus } from 'lucide-react';
import {
  Specialization,
  BLANK_FORM,
} from '@/components/specializations/specializationHelpers';
import SpecializationFormModal from '@/components/specializations/SpecializationFormModal';
import SpecializationDeleteModal from '@/components/specializations/SpecializationDeleteModal';
import SpecializationListView from '@/components/specializations/SpecializationListView';

export default function SpecializationsPage() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({ ...BLANK_FORM });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchSpecializations = useCallback(() => {
    if (!shop) {
      if (user) {
        setTimeout(() => setLoading(false), 0);
      }
      return;
    }
    api
      .get(`/shops/${shop.id}/specializations`)
      .then(res => {
        setSpecializations(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shop, user]);

  useEffect(() => {
    fetchSpecializations();
  }, [fetchSpecializations]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!shop) return;
    setIsSubmitting(true);
    setError('');
    try {
      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/specializations/${editingId}`, formData);
        setSpecializations(prev => prev.map(s => (s.id === editingId ? res.data.data : s)));
      } else {
        const res = await api.post(`/shops/${shop.id}/specializations`, formData);
        setSpecializations(prev => [res.data.data, ...prev]);
      }
      closeModal();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || 'Failed to save specialization');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit / Delete ──────────────────────────────────────────────────────────
  const handleEditClick = (spec: Specialization) => {
    setEditingId(spec.id);
    setFormData({
      category: spec.category || '',
      name: spec.name,
      description: spec.description || '',
      is_active: spec.is_active,
      starting_price: spec.starting_price || 0,
      production_time_days: spec.production_time_days || 0,
      min_order_qty: spec.min_order_qty || 1,
    });
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
      await api.delete(`/shops/${shop.id}/specializations/${deletingId}`);
      setSpecializations(prev => prev.filter(s => s.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to delete specialization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ ...BLANK_FORM });
    setError('');
  };

  const filtered = specializations.filter(
    s =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.category || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Apparel Specializations</h1>
          <p className="text-[#827A73] text-sm mt-1">
            Declare what garment types your shop specializes in — customers filter shops by these.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ ...BLANK_FORM });
            setError('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Specialization
        </button>
      </div>

      {/* Table & Search */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#EBE6E0]">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
            <input
              type="text"
              placeholder="Search specializations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors w-full"
            />
          </div>
        </div>

        <SpecializationListView
          specializations={filtered}
          loading={loading}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </div>

      {/* Add / Edit Modal */}
      <SpecializationFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmit}
        editingId={editingId}
        isSubmitting={isSubmitting}
        error={error}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Delete Confirmation */}
      <SpecializationDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
