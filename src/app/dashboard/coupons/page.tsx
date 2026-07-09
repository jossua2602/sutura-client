'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

import { Coupon } from '@/components/coupons/couponHelpers';
import CouponListView from '@/components/coupons/CouponListView';
import CouponFormModal from '@/components/coupons/CouponFormModal';
import ServiceDeleteModal from '@/components/services/ServiceDeleteModal';

export default function CouponsPage() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchCoupons = useCallback(() => {
    if (!shop?.id) {
      if (user?.id) setTimeout(() => setLoading(false), 0);
      return;
    }
    api.get(`/shops/${shop.id}/coupons`)
      .then(res => {
        setCoupons(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [shop, user]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleFormSubmit = async (payload: Record<string, unknown>) => {
    if (!shop) return;
    setIsSubmitting(true);
    setError('');
    try {
      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/coupons/${editingId}`, payload);
        setCoupons(prev => prev.map(c => c.id === editingId ? res.data.data : c));
        toast.success('Coupon updated successfully.');
      } else {
        const res = await api.post(`/shops/${shop.id}/coupons`, payload);
        setCoupons(prev => [res.data.data, ...prev]);
        toast.success('Coupon created successfully.');
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const firstFieldError = error.response?.data?.errors ? Object.values(error.response.data.errors)[0]?.[0] : null;
      setError(firstFieldError || error.response?.data?.message || 'Failed to save coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setDeleteSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/coupons/${deletingId}`);
      setCoupons(prev => prev.filter(c => c.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      toast.success('Coupon deleted.');
    } catch {
      toast.error('Failed to delete coupon.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const editingCoupon = editingId ? (coupons.find(c => c.id === editingId) || null) : null;

  return (
    <div className="space-y-6 pb-12 text-[#2D2A26]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Coupons</h1>
          <p className="text-[#827A73] text-sm mt-1">Create discount codes customers can redeem on your Catalog and/or Services.</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setError('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus size={18} />
          Create Coupon
        </button>
      </div>

      <CouponListView
        coupons={coupons}
        loading={loading}
        onEdit={(coupon) => { setEditingId(coupon.id); setError(''); setIsModalOpen(true); }}
        onDelete={(id) => { setDeletingId(id); setIsDeleteModalOpen(true); }}
      />

      <CouponFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingId(null);
          setError('');
        }}
        editingCoupon={editingCoupon}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        error={error}
      />

      <ServiceDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        isSubmitting={deleteSubmitting}
        label="coupon"
      />
    </div>
  );
}
