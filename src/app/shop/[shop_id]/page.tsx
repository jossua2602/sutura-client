'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import { MapPin, Star, Phone, Mail, Loader2, Clock, ExternalLink, Tag, Image as ImageIcon, AlertCircle, ShoppingBag, Map, Building2, Megaphone, Calendar } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Modal from '@/components/Modal';
import ServiceDetailModal from '@/components/profile/ServiceDetailModal';

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
  custom_fields?: {
    name: string;
    label: string;
    type: 'short_text' | 'number' | 'dropdown' | 'single_choice' | 'multi_select';
    required?: boolean;
    options?: string[];
  }[];
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
  active_special_hours?: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
  } | null;
  operating_hours?: Record<string, { is_open: boolean; open: string; close: string }>;
  special_hours?: Array<{
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
  }>;
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
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'hours' | 'locations'>('services');

  const getMessengerUrl = (facebookUrl?: string) => {
    if (!facebookUrl) return 'https://m.me/suturatailoring';
    try {
      const url = new URL(facebookUrl);
      const pathname = url.pathname.replace(/^\/|\/$/g, '');
      if (pathname && !pathname.includes('/') && pathname !== 'profile.php') {
        return `https://m.me/${pathname}`;
      }
    } catch {
      // Ignore URL parse error
    }
    return 'https://m.me/suturatailoring';
  };

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
            {shop.active_special_hours?.is_closed ? (
              <span className="bg-[#B26959]/10 text-[#B26959] border border-[#B26959]/20 px-4 py-2 rounded-full font-semibold text-xs uppercase tracking-wider flex items-center justify-center">
                Closed
              </span>
            ) : (
              <Link href={`/shop/${params.shop_id}/book`} className="bg-black hover:bg-zinc-800 text-white px-6 py-2 rounded-full font-medium transition-colors text-sm">
                Book Appointment
              </Link>
            )}
          </div>
        </div>
      </nav>

      {shop.active_special_hours?.announcement_message && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 py-3.5 px-6 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-w-5xl mx-auto flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-sm font-medium">
              <span className="font-bold mr-1">{shop.active_special_hours.title}:</span>
              {shop.active_special_hours.announcement_message}
            </div>
          </div>
        </div>
      )}

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
                    /* eslint-disable-next-line @next/next/no-img-element */
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
                className="ml-2 text-xs bg-white hover:bg-[#F0EAE3] text-yellow-700 px-3 py-1 rounded-full font-medium transition-colors border border-yellow-200 cursor-pointer"
              >
                Rate Shop
              </button>
              <a
                href={getMessengerUrl(shop.social_links?.facebook)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-xs bg-[#2D2A26] hover:bg-[#9A8073] text-white px-3.5 py-1.5 rounded-full font-medium transition-colors border border-transparent flex items-center gap-1.5 shadow-xs"
              >
                💬 Chat Shop
              </a>
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
            {shop.active_special_hours?.is_closed ? (
              <div className="group p-6 bg-[#B26959]/5 border border-[#B26959]/20 rounded-2xl cursor-not-allowed">
                <h3 className="font-semibold text-lg mb-2 text-[#B26959]">Temporarily Closed</h3>
                <p className="text-sm text-[#B26959]/80">Online booking is temporarily disabled. Check announcement banner for details.</p>
              </div>
            ) : (
              <Link href={`/shop/${params.shop_id}/book`} className="group p-6 bg-white shadow-sm text-[#2D2A26] rounded-2xl hover:bg-[#F0EAE3] hover:shadow-lg transition-all border border-[#EBE6E0]">
                <h3 className="font-semibold text-lg mb-2 text-indigo-300">Book Appointment &rarr;</h3>
                <p className="text-sm text-[#827A73]">Schedule a bespoke fitting or consultation session.</p>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs Section ─────────────────────────────────── */}
      <div className="border-t border-zinc-200 bg-white sticky top-16 z-40">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-8 overflow-x-auto hide-scrollbar">
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'services'
                  ? 'border-[#2D2A26] text-[#2D2A26]'
                  : 'border-transparent text-[#827A73] hover:text-[#524A44]'
              }`}
            >
              <ShoppingBag size={16} />
              Services & Pricing
            </button>
            <button
              onClick={() => setActiveTab('hours')}
              className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'hours'
                  ? 'border-[#2D2A26] text-[#2D2A26]'
                  : 'border-transparent text-[#827A73] hover:text-[#524A44]'
              }`}
            >
              <Clock size={16} />
              Store Hours & Announcements
            </button>
            {shop.branches && shop.branches.length > 0 && (
              <button
                onClick={() => setActiveTab('locations')}
                className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'locations'
                    ? 'border-[#2D2A26] text-[#2D2A26]'
                    : 'border-transparent text-[#827A73] hover:text-[#524A44]'
                }`}
              >
                <Map size={16} />
                Locations
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#FAF6F3] min-h-[400px] py-12">
        <div className="max-w-5xl mx-auto px-6">
          
          {/* TAB: SERVICES */}
          {activeTab === 'services' && (
            <div>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-serif font-bold text-zinc-900">Our Services</h2>
                  <p className="text-[#827A73] text-sm mt-1">Browse our tailoring offerings and estimated turnaround times.</p>
                </div>
                {services.length > 0 && (
                  <Link href={`/shop/${params.shop_id}/catalog`} className="text-sm font-semibold text-[#9A8073] hover:underline flex items-center gap-1">
                    View Catalog &rarr;
                  </Link>
                )}
              </div>

              {services.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-zinc-200">
                  <p className="text-[#827A73]">No services listed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-5">
                  {services.map(service => (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedService(service); }}
                      role="button"
                      tabIndex={0}
                      className="bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm hover:border-[#9A8073]/40 hover:shadow-md transition-all duration-200 group flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#9A8073]"
                    >
                      {/* Image */}
                      <div className="h-40 bg-[#F0EAE3] border-b border-[#EBE6E0] overflow-hidden shrink-0">
                        {service.image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
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
                          <span className="text-sm font-bold text-[#2D2A26]">
                            {service.base_price !== null && service.base_price !== undefined ? (
                              `₱${Number.parseFloat(service.base_price.toString()).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            ) : (
                              'Custom Quote'
                            )}
                          </span>
                          <div className="flex items-center gap-1 text-[11px] text-[#A8A19A]">
                            <Clock size={11} />
                            {service.estimated_days}d
                          </div>
                        </div>

                        {/* CTA */}
                        <div className="mt-auto pt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedService(service);
                            }}
                            className="block w-full text-center bg-[#2D2A26] hover:bg-[#9A8073] text-white py-2 rounded-xl text-xs font-semibold transition-colors focus:outline-none"
                          >
                            Inquire / Order Custom →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: HOURS */}
          {activeTab === 'hours' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Col: Announcements */}
              <div>
                <h3 className="text-xl font-bold text-[#2D2A26] mb-6 flex items-center gap-2">
                  <Megaphone size={20} className="text-[#9A8073]" />
                  Announcements
                </h3>
                
                {shop.special_hours && shop.special_hours.length > 0 ? (
                  <div className="space-y-4">
                    {shop.special_hours.map(s => (
                      <div key={s.id} className="bg-white border border-[#EBE6E0] rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-bold text-[#2D2A26]">{s.title}</h5>
                          {s.is_closed ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-red-50 text-red-700 rounded-md border border-red-100">
                              Closed
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                              Special Hours
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#827A73] mb-3 font-medium flex items-center">
                          <Calendar size={12} className="mr-1.5 text-[#9A8073]" />
                          {new Date(s.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(s.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        {s.announcement_message && (
                          <div className="text-sm bg-amber-50/50 border border-amber-100 text-amber-900 px-4 py-3 rounded-xl flex items-start gap-2">
                            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                            <span className="leading-relaxed">{s.announcement_message}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-6 border border-[#EBE6E0] text-center">
                    <p className="text-[#827A73] text-sm">No active announcements at this time.</p>
                  </div>
                )}
              </div>

              {/* Right Col: Operating Hours */}
              <div>
                <h3 className="text-xl font-bold text-[#2D2A26] mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-[#9A8073]" />
                  Standard Operating Hours
                </h3>
                
                <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
                  <div className="space-y-4">
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                      const hours = shop.operating_hours?.[day];
                      if (!hours) return null;
                      return (
                        <div key={day} className="flex justify-between items-center text-sm py-1 border-b border-[#EBE6E0]/50 last:border-0 last:pb-0">
                          <span className="capitalize text-[#524A44] font-medium">{day}</span>
                          {hours.is_open ? (
                            <span className="text-[#2D2A26] font-bold bg-[#FAF6F3] px-3 py-1 rounded-lg">
                              {hours.open} - {hours.close}
                            </span>
                          ) : (
                            <span className="text-[#B26959] font-bold text-xs uppercase tracking-wider bg-[#B26959]/10 px-3 py-1 rounded-lg">
                              Closed
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: LOCATIONS */}
          {activeTab === 'locations' && shop.branches && shop.branches.length > 0 && (
            <div>
              <div className="mb-8">
                <h2 className="text-2xl font-serif font-bold text-zinc-900">Our Locations</h2>
                <p className="text-[#827A73] text-sm mt-1">Visit us at any of our physical tailoring shops.</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {shop.branches.map((branch) => {
                  const isSelected = selectedBranchId === branch.id.toString();
                  return (
                    <div 
                      key={branch.id} 
                      className={`bg-white rounded-2xl p-6 transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'border-2 border-[#2D2A26] shadow-md ring-2 ring-white ring-offset-1 ring-offset-[#2D2A26]' 
                          : 'border border-[#EBE6E0] hover:border-[#9A8073] hover:shadow-md'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="font-bold text-[#2D2A26] text-xl flex items-center gap-2">
                            <Building2 className="text-[#9A8073]" size={20} />
                            {branch.name}
                          </h3>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-white bg-[#2D2A26] px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                              Selected Location
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-3 text-sm text-[#524A44] mb-8 bg-[#FAF6F3] p-4 rounded-xl border border-[#EBE6E0]/50">
                          <div className="flex items-start gap-3">
                            <MapPin className="w-4 h-4 text-[#9A8073] shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{branch.address}, {branch.city}</span>
                          </div>
                          {branch.contact_number && (
                            <div className="flex items-center gap-3">
                              <Phone className="w-4 h-4 text-[#9A8073] shrink-0" />
                              <span className="font-medium">{branch.contact_number}</span>
                            </div>
                          )}
                          {branch.operating_hours && (
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-[#9A8073] shrink-0" />
                              <span className="font-medium">{branch.operating_hours}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-3 mt-auto">
                        <Link 
                          href={`/shop/${params.shop_id}/book?branch_id=${branch.id}`}
                          className={`flex-1 text-center py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                            isSelected 
                              ? 'bg-[#2D2A26] text-white hover:bg-black' 
                              : 'bg-white border-2 border-[#2D2A26] text-[#2D2A26] hover:bg-[#FAF6F3]'
                          }`}
                        >
                          Book Here
                        </Link>
                        {branch.latitude && branch.longitude && (
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${branch.latitude},${branch.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 rounded-xl border border-[#EBE6E0] text-[#524A44] hover:bg-[#F0EAE3] hover:text-[#2D2A26] transition-colors flex items-center justify-center bg-white shadow-sm"
                            title="Get Directions"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

      <ServiceDetailModal
        service={selectedService}
        isOpen={selectedService !== null}
        onClose={() => setSelectedService(null)}
        facebookUrl={shop.social_links?.facebook}
        shopId={shop.id}
      />
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
