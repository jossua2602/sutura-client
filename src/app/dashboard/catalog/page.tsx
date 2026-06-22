'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';

import { CatalogItem } from '@/components/catalog/catalogHelpers';
import CatalogItemCard from '@/components/catalog/CatalogItemCard';
import CatalogRatingModal from '@/components/catalog/CatalogRatingModal';
import CatalogDeleteModal from '@/components/catalog/CatalogDeleteModal';

export default function CatalogPage() {
  const { shop, user } = useAuthStore();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchItems = useCallback(() => {
    if (shop?.id) {
      api.get(`/shops/${shop.id}/catalog`)
        .then(res => {
          setItems(res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user?.id) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop?.id, user?.id]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleView = async (id: number) => {
    if (!shop) return;
    try {
      await api.post(`/shops/${shop.id}/catalog/${id}/view`);
      fetchItems(); // Refresh counts
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (id: number) => {
    if (!shop) return;
    try {
      await api.post(`/shops/${shop.id}/catalog/${id}/save`);
      fetchItems(); // Refresh counts
    } catch (e) {
      console.error(e);
    }
  };

  const submitRating = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shop || !selectedItemId) return;
    setIsSubmitting(true);
    try {
      await api.post(`/shops/${shop.id}/catalog/${selectedItemId}/reviews`, {
        rating: ratingValue
      });
      setIsRatingModalOpen(false);
      fetchItems(); // Refresh counts
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/catalog/${deletingId}`);
      setItems(prev => prev.filter(i => i.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (e) {
      alert('Failed to remove item from catalog');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRating = (id: number) => {
    setSelectedItemId(id);
    setRatingValue(5);
    setIsRatingModalOpen(true);
  };

  const openDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return <div className="text-[#A8A19A] py-12 text-center animate-pulse">Loading catalog...</div>;
  }

  return (
    <div className="space-y-6 pb-12 text-[#2D2A26]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Catalog Showcase</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage the premium garments showcased to your customers.</p>
        </div>
        <Link 
          href="/dashboard/catalog/new"
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          <Plus size={18} />
          Create New Item
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-12 text-center">
          <ImageIcon className="w-12 h-12 text-[#827A73] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2D2A26] mb-2">No items in your catalog</h3>
          <p className="text-[#827A73] text-sm mb-6 max-w-md mx-auto">
            Showcase your best tailoring work. Add items like Tuxedos, Dresses, or suits with detailed specs and images.
          </p>
          <Link 
            href="/dashboard/catalog/new"
            className="inline-flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Plus size={18} />
            Create First Item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => (
            <CatalogItemCard
              key={item.id}
              item={item}
              onSave={handleSave}
              onView={handleView}
              onOpenRating={openRating}
              onOpenDelete={openDelete}
            />
          ))}
        </div>
      )}

      <CatalogRatingModal
        isOpen={isRatingModalOpen}
        onClose={() => {
          setIsRatingModalOpen(false);
          setSelectedItemId(null);
        }}
        onSubmit={submitRating}
        ratingValue={ratingValue}
        setRatingValue={setRatingValue}
        isSubmitting={isSubmitting}
      />

      <CatalogDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingId(null);
        }}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
