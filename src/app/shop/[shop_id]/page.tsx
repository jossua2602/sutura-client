'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { MapPin, Star, Phone, Mail, Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';

interface ShopProfile {
  id: number;
  name: string;
  description: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  logo_path: string;
  social_links: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
  };
  gallery_images: string[];
  reviews_avg_rating: number | null;
  reviews_count: number;
}

export default function PublicShopProfilePage({ params }: { params: { shop_id: string } }) {
  const { user } = useAuthStore();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Review State
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchShop = () => {
    api.get(`/public/shops/${params.shop_id}`)
      .then(res => {
        setShop(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchShop();
  }, [params.shop_id]);

  const submitRating = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to leave a review.");
      return;
    }
    if (!shop) {
      alert("Shop profile is still loading. Please try again.");
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/shops/${shop.id}/reviews`, {
        rating: ratingValue,
        comment: ratingComment
      });
      setIsRatingModalOpen(false);
      fetchShop(); // Refresh counts
    } catch (e) {
      console.error(e);
      alert("Failed to submit rating. You might have already rated this shop.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="w-8 h-8 animate-spin text-zinc-900" /></div>;
  }

  if (!shop) {
    return <div className="py-32 text-center text-[#A8A19A]">Shop not found.</div>;
  }

  return (
    <div className="bg-white min-h-screen text-zinc-900 selection:bg-[#EBE6E0] selection:text-indigo-900">
      {/* Navigation Bar */}
      <nav className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-serif font-bold text-xl tracking-tight text-zinc-900 flex items-center gap-3">
            {shop.logo_path && <img src={shop.logo_path} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-zinc-200" />}
            {shop.name}
          </div>
          <div className="flex gap-4">
            <Link href={`/shop/${params.shop_id}/catalog`} className="text-[#827A73] hover:text-black font-medium text-sm flex items-center transition-colors">
              View Catalog
            </Link>
            <Link href={`/shop/${params.shop_id}/book`} className="bg-black text-[#2D2A26] hover:bg-[#F0EAE3] px-6 py-2 rounded-full font-medium transition-colors text-sm">
              Book Appointment
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Profile Section */}
      <div className="max-w-5xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="md:col-span-1">
          <div className="aspect-square bg-zinc-100 rounded-2xl overflow-hidden shadow-xl mb-6">
            {shop.logo_path ? (
              <img src={shop.logo_path} alt={shop.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#827A73] font-serif text-6xl">
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {shop.address && (
              <div className="flex items-start gap-3 text-[#827A73] text-sm">
                <MapPin className="w-5 h-5 text-zinc-900 shrink-0" />
                <span>{shop.address}, {shop.city}, {shop.province}</span>
              </div>
            )}
            {shop.phone && (
              <div className="flex items-center gap-3 text-[#827A73] text-sm">
                <Phone className="w-5 h-5 text-zinc-900 shrink-0" />
                <span>{shop.phone}</span>
              </div>
            )}
            {shop.email && (
              <div className="flex items-center gap-3 text-[#827A73] text-sm">
                <Mail className="w-5 h-5 text-zinc-900 shrink-0" />
                <span>{shop.email}</span>
              </div>
            )}
          </div>

          {/* Social Links */}
          {shop.social_links && Object.values(shop.social_links).some(link => link) && (
            <div className="mt-8 flex items-center gap-4 border-t border-zinc-200 pt-6">
              {shop.social_links.facebook && (
                <a href={shop.social_links.facebook} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-zinc-100 hover:bg-[#F0EAE3] text-[#886E62] rounded-full transition-colors text-sm font-medium">
                  Facebook
                </a>
              )}
              {shop.social_links.instagram && (
                <a href={shop.social_links.instagram} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-zinc-100 hover:bg-pink-50 text-pink-600 rounded-full transition-colors text-sm font-medium">
                  Instagram
                </a>
              )}
              {shop.social_links.tiktok && (
                <a href={shop.social_links.tiktok} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-full transition-colors text-sm font-bold flex items-center justify-center">
                  TikTok
                </a>
              )}
            </div>
          )}
        </div>

        <div className="md:col-span-2 space-y-8">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <h1 className="text-4xl font-serif font-bold text-zinc-900">{shop.name}</h1>
            </div>
            
            <div className="flex items-center gap-3 bg-[#FAF6F3] text-yellow-800 w-fit px-4 py-2 rounded-full mb-6 shadow-sm border border-yellow-200/50">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-current text-[#BCA89F]" />
                <span className="font-semibold">{shop.reviews_avg_rating ? shop.reviews_avg_rating : 'New'}</span>
              </div>
              <div className="w-1 h-1 bg-yellow-300 rounded-full"></div>
              <span className="text-sm font-medium">{shop.reviews_count} {shop.reviews_count === 1 ? 'Review' : 'Reviews'}</span>
              <button 
                onClick={() => setIsRatingModalOpen(true)}
                className="ml-2 text-xs bg-white hover:bg-[#F0EAE3] text-yellow-700 px-3 py-1 rounded-full font-medium transition-colors border border-yellow-200"
              >
                Rate Shop
              </button>
            </div>

            <p className="text-lg text-[#827A73] leading-relaxed font-serif">
              {shop.description || 'A premium tailoring establishment dedicated to exceptional craftsmanship.'}
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <Link href={`/shop/${params.shop_id}/catalog`} className="group p-6 border border-zinc-200 rounded-2xl hover:border-zinc-900 hover:shadow-lg transition-all bg-white">
              <h3 className="font-semibold text-lg text-zinc-900 mb-2 group-hover:text-[#886E62] transition-colors">Catalog Showcase &rarr;</h3>
              <p className="text-sm text-[#A8A19A]">Explore our expertly curated collection of premium garments.</p>
            </Link>
            <Link href={`/shop/${params.shop_id}/book`} className="group p-6 bg-white shadow-sm text-[#2D2A26] rounded-2xl hover:bg-[#F0EAE3] hover:shadow-lg transition-all border border-[#EBE6E0]">
              <h3 className="font-semibold text-lg mb-2 text-indigo-300">Book Appointment &rarr;</h3>
              <p className="text-sm text-[#827A73]">Schedule a bespoke fitting or consultation session.</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Gallery Section */}
      {shop.gallery_images && shop.gallery_images.length > 0 && (
        <div className="bg-zinc-50 py-20 border-t border-zinc-200">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif font-bold text-zinc-900">Shop Gallery</h2>
              <p className="text-[#A8A19A] mt-3">A glimpse inside our establishment and craftsmanship.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {shop.gallery_images.map((img, idx) => (
                <div key={idx} className="aspect-square bg-zinc-200 rounded-2xl overflow-hidden shadow-md group">
                  <img 
                    src={img} 
                    alt={`Gallery Image ${idx + 1}`} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      <Modal isOpen={isRatingModalOpen} onClose={() => setIsRatingModalOpen(false)} title="Rate this Shop">
        <form onSubmit={submitRating} className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-[#827A73] mb-4">How was your experience with {shop.name}?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingValue(star)}
                  className={`p-2 transition-transform hover:scale-125 ${ratingValue >= star ? 'text-[#BCA89F]' : 'text-[#524A44]'}`}
                >
                  <Star size={36} className={ratingValue >= star ? 'fill-current' : ''} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Optional Comment</label>
            <textarea 
              rows={3}
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              placeholder="Tell others about your experience..."
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:border-[var(--brand-taupe)] focus:ring-1 focus:ring-[var(--brand-taupe)]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
            <button type="button" onClick={() => setIsRatingModalOpen(false)} className="px-4 py-2 text-sm text-[#A8A19A] hover:text-zinc-900">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-white shadow-sm hover:bg-black text-[#2D2A26] rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors">
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Submit Rating
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
