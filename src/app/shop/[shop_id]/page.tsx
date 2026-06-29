'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import { MapPin, Star, Phone, Mail, Loader2, Clock, ExternalLink, Tag, Image as ImageIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';

interface ShopBranch {
  id: number;
  name: string;
  address: string;
  city: string;
  contact_number?: string;
  operating_hours?: string;
  latitude?: string;
  longitude?: string;
}

interface PublicService {
  id: number;
  name: string;
  description?: string;
  category?: string;
  base_price: string;
  estimated_days: number;
  is_active: boolean;
  image_url?: string | null;
}

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
  branches?: ShopBranch[];
  owner?: {
    id: number;
    name: string;
    email: string;
    profile_picture?: string | null;
  };
}

interface PublicShopProfilePageProps {
  readonly params: {
    readonly shop_id: string;
  };
}

function PublicShopProfileContent({ params }: Readonly<PublicShopProfilePageProps>) {
  const { user } = useAuthStore();
  const [shop, setShop] = useState<ShopProfile | null>(null);
  const [services, setServices] = useState<PublicService[]>([]);
  const [loading, setLoading] = useState(true);
  
  const searchParams = useSearchParams();
  const selectedBranchId = searchParams.get('branch_id');

  // Review State
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeBranch = shop?.branches?.find(b => b.id.toString() === selectedBranchId);

  const fetchShop = useCallback(() => {
    api.get(`/public/shops/${params.shop_id}`)
      .then(res => {
        setShop(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.shop_id]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  // Fetch public services
  useEffect(() => {
    api.get(`/public/shops/${params.shop_id}/services`)
      .then(res => setServices((res.data.data || []).filter((s: PublicService) => s.is_active)))
      .catch(() => {
        // Fall back silently — services section won't show
      });
  }, [params.shop_id]);

  const submitRating = async (e: React.SyntheticEvent) => {
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
            {shop.logo_path && (
              <Image 
                src={shop.logo_path} 
                alt="Logo" 
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover border border-zinc-200" 
              />
            )}
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
              <Image 
                src={shop.logo_path} 
                alt={shop.name} 
                width={400}
                height={400}
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#827A73] font-serif text-6xl">
                {shop.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {activeBranch ? (
              <>
                <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-3 mb-2 animate-fade-in">
                  <p className="text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-1">Selected Location</p>
                  <p className="text-sm font-semibold text-[#2D2A26]">{activeBranch.name}</p>
                </div>
                <div className="flex items-start gap-3 text-[#827A73] text-sm">
                  <MapPin className="w-5 h-5 text-zinc-900 shrink-0" />
                  <span>{activeBranch.address}, {activeBranch.city}</span>
                </div>
                {activeBranch.contact_number && (
                  <div className="flex items-center gap-3 text-[#827A73] text-sm">
                    <Phone className="w-5 h-5 text-zinc-900 shrink-0" />
                    <span>{activeBranch.contact_number}</span>
                  </div>
                )}
                {activeBranch.operating_hours && (
                  <div className="flex items-center gap-3 text-[#827A73] text-sm">
                    <Clock className="w-5 h-5 text-zinc-900 shrink-0" />
                    <span>{activeBranch.operating_hours}</span>
                  </div>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
            {shop.email && (
              <div className="flex items-center gap-3 text-[#827A73] text-sm">
                <Mail className="w-5 h-5 text-zinc-900 shrink-0" />
                <span>{shop.email}</span>
              </div>
            )}
          </div>

          {/* Social Links */}
          {shop.social_links && Object.values(shop.social_links).some(Boolean) && (
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

          {/* Shop Owner Info */}
          {shop.owner && (
            <div className="mt-8 border-t border-zinc-200 pt-6">
              <p className="text-[10px] font-bold text-[#827A73] uppercase tracking-wider mb-3">Shop Owner</p>
              <div className="flex items-center gap-3 bg-[#FAF6F3] border border-[#EBE6E0] rounded-2xl p-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#9A8073] flex items-center justify-center text-white font-semibold text-lg shrink-0">
                  {shop.owner.profile_picture ? (
                    <img src={shop.owner.profile_picture} alt={shop.owner.name} className="w-full h-full object-cover" />
                  ) : (
                    shop.owner.name.charAt(0)
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#2D2A26]">{shop.owner.name}</h4>
                  <p className="text-xs text-[#827A73]">Owner & Designer</p>
                </div>
              </div>
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

      {/* ── Services Section ─────────────────────────────────── */}
      {services.length > 0 && (
        <div className="bg-[#FAF6F3] py-16 border-t border-zinc-200">
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-10">
              <h2 className="text-2xl font-serif font-bold text-zinc-900">Our Services</h2>
              <p className="text-[#827A73] text-sm mt-1">Browse our tailoring offerings and estimated turnaround times.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {services.map(service => (
                <div
                  key={service.id}
                  className="bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm hover:border-[#9A8073]/40 hover:shadow-md transition-all duration-200 group flex flex-col"
                >
                  {/* Image */}
                  <div className="h-40 bg-[#F0EAE3] border-b border-[#EBE6E0] overflow-hidden shrink-0">
                    {service.image_url ? (
                      <img
                        src={service.image_url}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#C5BDBA]">
                        <ImageIcon size={28} />
                        <span className="text-[11px]">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-4 space-y-3 flex flex-col flex-1">
                    <div>
                      <h3 className="font-semibold text-[#2D2A26] text-sm leading-tight line-clamp-1">{service.name}</h3>
                      {service.category && (
                        <div className="flex items-center gap-1 mt-1">
                          <Tag size={10} className="text-[#A8A19A]" />
                          <span className="text-[11px] text-[#A8A19A] truncate">{service.category}</span>
                        </div>
                      )}
                    </div>

                    {service.description && (
                      <p className="text-[11px] text-[#827A73] line-clamp-2 leading-relaxed">{service.description}</p>
                    )}

                    {/* Price + duration */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#EBE6E0]">
                      <span className="text-base font-bold text-[#2D2A26]">
                        ₱{Number.parseFloat(service.base_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] text-[#A8A19A]">
                        <Clock size={11} />
                        {service.estimated_days}d
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="mt-auto pt-1">
                      <Link
                        href={`/shop/${params.shop_id}/book?service_id=${service.id}`}
                        className="block w-full text-center bg-[#2D2A26] hover:bg-[#9A8073] text-white py-2 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Book Now →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Our Locations Section */}
      {shop.branches && shop.branches.length > 0 && (
        <div className="bg-white py-16 border-t border-zinc-200">
          <div className="max-w-5xl mx-auto px-6">
            <div className="mb-10">
              <h2 className="text-2xl font-serif font-bold text-zinc-900">Our Locations</h2>
              <p className="text-[#827A73] text-sm mt-1">Visit us at any of our physical tailoring shops.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shop.branches.map((branch) => {
                const isSelected = selectedBranchId === branch.id.toString();
                return (
                  <div 
                    key={branch.id} 
                    className={`border rounded-2xl p-6 transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-[#9A8073] bg-[#FAF6F3]/40 shadow-sm ring-1 ring-[#9A8073]/30' 
                        : 'border-zinc-200 hover:border-zinc-300 hover:shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-zinc-900 text-lg">{branch.name}</h3>
                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#9A8073] bg-[#F0EAE3] px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Selected Location
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-2.5 text-sm text-[#827A73] mb-6">
                        <div className="flex items-start gap-2.5">
                          <MapPin className="w-4 h-4 text-zinc-900 shrink-0 mt-0.5" />
                          <span>{branch.address}, {branch.city}</span>
                        </div>
                        {branch.contact_number && (
                          <div className="flex items-center gap-2.5">
                            <Phone className="w-4 h-4 text-zinc-900 shrink-0" />
                            <span>{branch.contact_number}</span>
                          </div>
                        )}
                        {branch.operating_hours && (
                          <div className="flex items-center gap-2.5">
                            <Clock className="w-4 h-4 text-zinc-900 shrink-0" />
                            <span>{branch.operating_hours}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 border-t border-zinc-100 pt-4 mt-auto">
                      <Link 
                        href={`/shop/${params.shop_id}/book?branch_id=${branch.id}`}
                        className="flex-1 text-center bg-black hover:bg-zinc-800 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                      >
                        Book at this Branch
                      </Link>
                      {branch.latitude && branch.longitude && (
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${branch.latitude},${branch.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl text-sm transition-colors flex items-center justify-center border border-zinc-200"
                          title="View on Google Maps"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
                <div key={img} className="aspect-square bg-zinc-200 rounded-2xl overflow-hidden shadow-md group relative">
                  <Image 
                    src={img} 
                    alt={`Showcase view ${idx + 1}`} 
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110" 
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
            <label htmlFor="rating-comment" className="block text-sm font-medium text-zinc-700 mb-1">Optional Comment</label>
            <textarea 
              id="rating-comment"
              rows={3}
              value={ratingComment}
              onChange={e => setRatingComment(e.target.value)}
              placeholder="Tell others about your experience..."
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg text-zinc-900 focus:border-taupe focus:ring-1 focus:ring-taupe"
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

export default function PublicShopProfilePage(props: Readonly<PublicShopProfilePageProps>) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-zinc-50"><Loader2 className="w-8 h-8 animate-spin text-zinc-900" /></div>}>
      <PublicShopProfileContent {...props} />
    </Suspense>
  );
}
