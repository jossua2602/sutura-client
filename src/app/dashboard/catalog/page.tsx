'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Image as ImageIcon, Star, Eye, Heart, Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Modal from '@/components/Modal';

interface CatalogItem {
  id: number;
  name: string;
  price: string;
  material: string;
  images: { id: number; image_url: string; is_primary: boolean }[];
  views_count: number;
  saves_count: number;
  reviews_avg_rating: number | null;
  reviews_count: number;
}

export default function CatalogPage() {
  const { shop , user } = useAuthStore();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [ratingValue, setRatingValue] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchItems = () => {
    if (shop) {
      api.get(`/shops/${shop.id}/catalog`)
        .then(res => {
          setItems(res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user && !shop) {
      setTimeout(() => setLoading(false), 0);
    }
  };

  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, user]);

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

  if (loading) {
    return <div className="text-[#A8A19A] py-12 text-center animate-pulse">Loading catalog...</div>;
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Catalog Showcase</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage the premium garments showcased to your customers.</p>
        </div>
        <Link 
          href="/dashboard/catalog/new"
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
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
            className="inline-flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Create First Item
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map(item => {
            const primaryImage = item.images.find(img => img.is_primary)?.image_url || item.images[0]?.image_url;
            return (
              <div key={item.id} className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden group relative flex flex-col shadow-lg shadow-black/20">
                
                {/* Image Section */}
                <div className="aspect-3/4 bg-[#F0EAE3] relative overflow-hidden">
                  {primaryImage ? (
                    <img src={primaryImage} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#827A73]">
                      <ImageIcon size={32} />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg text-xs font-bold text-[#2D2A26] shadow-sm border border-white/10">
                    ₱{Number(item.price).toLocaleString()}
                  </div>

                  <div className="absolute top-3 left-3 flex gap-2 z-20">
                    <Link
                      href={`/dashboard/catalog/${item.id}/edit`}
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[#524A44] hover:text-taupe transition-colors shadow-sm"
                    >
                      <Pencil size={16} />
                    </Link>
                    <button
                      onClick={(e) => { e.preventDefault(); setDeletingId(item.id); setIsDeleteModalOpen(true); }}
                      className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[#524A44] hover:text-[#B26959] transition-colors shadow-sm"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm p-6 text-center z-10 translate-y-4 group-hover:translate-y-0">
                    <h4 className="text-[#2D2A26] text-xs font-semibold uppercase tracking-wider mb-2 opacity-60">Material</h4>
                    <p className="text-lg font-medium text-[#2D2A26] mb-6">
                      {item.material || 'Premium Fabric'}
                    </p>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => handleSave(item.id)} 
                        title="Toggle Save"
                        className="p-3 bg-[#F0EAE3] hover:bg-[#B26959]/20 hover:text-[#B26959] rounded-full text-white transition-all transform hover:scale-110 shadow-lg"
                      >
                        <Heart size={20} className={item.saves_count > 0 ? "fill-current text-[#B26959]" : ""} />
                      </button>
                      <button 
                        onClick={() => handleView(item.id)} 
                        title="Simulate Click/View"
                        className="p-3 bg-taupe hover:bg-[#9A8073] rounded-full text-white transition-all transform hover:scale-110 shadow-lg"
                      >
                        <Eye size={20} />
                      </button>
                      <button 
                        onClick={() => openRating(item.id)} 
                        title="Rate Item"
                        className="p-3 bg-[#F0EAE3] hover:bg-[#BCA89F]/20 hover:text-[#BCA89F] rounded-full text-[#2D2A26] transition-all transform hover:scale-110 shadow-lg"
                      >
                        <Star size={20} className={item.reviews_count > 0 ? "fill-current text-[#BCA89F]" : ""} />
                      </button>
                    </div>

                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 flex flex-col flex-1 bg-linear-to-b from-zinc-900 to-zinc-950">
                  <h3 className="text-sm font-semibold text-[#2D2A26] truncate">{item.name}</h3>
                  <p className="text-xs text-[#A8A19A] mt-1 truncate">{item.material || 'No material specified'}</p>
                  
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#EBE6E0]/80">
                    <div className="flex items-center gap-1.5 text-[#BCA89F] bg-[#BCA89F]/10 px-2 py-1 rounded-md">
                      <Star size={14} className="fill-current" />
                      <span className="text-xs font-medium">
                        {item.reviews_avg_rating ? item.reviews_avg_rating : '0'} <span className="text-[#A8A19A] ml-0.5">({item.reviews_count || 0})</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[#827A73] text-xs font-medium">
                      <span className="flex items-center gap-1.5 bg-[#F0EAE3]/50 px-2 py-1 rounded-md">
                        <Eye size={14} /> {item.views_count || 0}
                      </span>
                      <span className="flex items-center gap-1.5 bg-[#F0EAE3]/50 px-2 py-1 rounded-md">
                        <Heart size={14} className={item.saves_count > 0 ? "fill-current text-[#B26959]" : ""} /> {item.saves_count || 0}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} title="Rate Catalog Item">
        <form onSubmit={submitRating} className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-[#827A73] mb-4">How many stars would you give this item?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingValue(star)}
                  className={`p-2 transition-transform hover:scale-125 ${ratingValue >= star ? 'text-[#BCA89F]' : 'text-[#827A73]'}`}
                >
                  <Star size={32} className={ratingValue >= star ? 'fill-current' : ''} />
                </button>
              ))}
            </div>
            <p className="text-xs text-[#A8A19A] mt-2 font-medium">{ratingValue} out of 5 stars</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#EBE6E0]">
            <button 
              type="button"
              onClick={() => setIsRatingModalOpen(false)}
              className="px-4 py-2 text-sm text-[#827A73] hover:text-[#2D2A26]"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 bg-taupe hover:bg-taupe/90 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Submit Rating
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Item">
        <div className="space-y-4">
          <p className="text-[#524A44] text-sm">
            Are you sure you want to delete this item from the catalog? This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
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

    </div>
  );
}
