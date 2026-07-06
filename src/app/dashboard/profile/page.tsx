'use client';

import { useProfile, ServiceItem, Tab } from '@/components/profile/useProfile';
import StorefrontSchedules from '@/components/profile/StorefrontSchedules';
import {
  MapPin,
  Clock,
  Star,
  Plus,
  Globe,
  Calendar,
  Upload,
  X,
  Loader2,
  ShoppingBag,
  Package,
  Megaphone,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  Briefcase,
  Edit2,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ProfileImageViewer from '@/components/profile/ProfileImageViewer';
import ServiceDetailModal from '@/components/profile/ServiceDetailModal';
import EditOperatingHoursModal from '@/components/profile/EditOperatingHoursModal';
import ProfileAboutTab from '@/components/profile/ProfileAboutTab';
import { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import ProfileAppointmentsCalendar from '@/components/profile/ProfileAppointmentsCalendar';

export default function StoreProfilePage() {
  const { token, setAuth, staffProfile, user: authUser } = useAuthStore();

  const {
    shop,
    user,
    activeTab,
    setActiveTab,
    stats,
    recentReviews,
    catalogItems,
    services,
    viewerImage,
    setViewerImage,
    uploadingCreation,
    handleCreationUpload,
    handleRemoveCreation,
    shopGallery,
    fetchingGallery,
    specialHours,
  } = useProfile();

  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isEditHoursModalOpen, setIsEditHoursModalOpen] = useState(false);

  const TABS: { id: Tab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'about', label: 'About' },
    { id: 'hours', label: 'Hours' },
    { id: 'gallery', label: 'Gallery' },
    { id: 'appointments', label: 'Appointments' },
    { id: 'catalog', label: 'Catalog' },
    { id: 'services', label: 'Services' },
    { id: 'reviews', label: 'Reviews' },
  ];

  const formatOperatingHours = (hours?: Record<string, any> | string) => {
    if (!hours) return 'No operating hours set';
    if (typeof hours === 'string') return hours;

    try {
      const days = [
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ];

      const activeDays: string[] = [];
      let commonHours = '';

      for (const d of days) {
        const h = hours[d];
        if (h?.is_open) {
          activeDays.push(d.substring(0, 3));
          commonHours = `${h.open} - ${h.close}`;
        }
      }

      if (!activeDays.length) return 'Closed';
      if (activeDays.length === 7) return `Daily: ${commonHours}`;
      return `${activeDays.join(', ')}: ${commonHours}`;
    } catch {
      return 'Schedule Configured';
    }
  };

  const socialLinks =
    Array.isArray(user?.social_links)
      ? user.social_links
      : user?.social_links && typeof user.social_links === 'object'
      ? Object.entries(user.social_links).map(([k, v]) => ({
          label: k.charAt(0).toUpperCase() + k.slice(1),
          url: v as string,
        }))
      : [];

  return (
    <div className="max-w-[1100px] mx-auto pb-16 space-y-4">
      <div className="bg-white border border-[#EBE6E0] rounded-b-2xl overflow-hidden shadow-sm mb-4">
        <div className="h-48 md:h-80 bg-[#F0EAE3] relative w-full"></div>

        <div className="px-4 md:px-8 pb-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 md:-mt-12">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 text-center md:text-left z-10">
              <div className="w-32 h-32 md:w-[168px] md:h-[168px] rounded-full border-4 border-white bg-white relative overflow-hidden shadow-sm shrink-0">
                {shop?.logo_path ? (
                  <Image
                    src={shop.logo_path}
                    alt={shop.name || 'Shop Logo'}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8C6B5D] text-[64px] font-serif bg-[#FAF6F3]">
                    {shop?.name?.charAt(0) || 'S'}
                  </div>
                )}
              </div>

              <div className="mb-2 md:mb-6">
                <h1 className="text-[32px] font-bold text-[#2D2A26]">
                  {shop?.name || 'Your Shop Name'}
                </h1>

                <p className="text-[15px] font-semibold text-[#827A73]">
                  {stats?.totalCatalog || 0} catalog items •{' '}
                  {stats?.totalServices || 0} services
                </p>

                <div className="flex flex-wrap gap-3 mt-2 text-sm text-[#524A44]">
                  <span className="flex items-center gap-1.5">
                    <Briefcase size={14} />
                    {shop?.business_type || 'Custom Tailoring'}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} />
                    {shop?.address
                      ? `${shop.address}, ${shop.city}`
                      : 'No address'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-2 md:mb-6">
              <Link
                href={`/shop/${shop?.slug}`}
                target="_blank"
                title="View Public Storefront"
                className="px-4 py-2 bg-[#9A8073] hover:bg-[#8A7063] text-white rounded-lg transition-colors"
              >
                <Globe size={16} />
              </Link>

              <button
                onClick={() => setActiveTab('about')}
                title="Edit Profile"
                className="px-4 py-2 bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#524A44] rounded-lg transition-colors"
              >
                <Edit2 size={16} />
              </button>
            </div>
          </div>

          <hr className="mt-6 mb-1 border-[#EBE6E0]" />

          <div className="flex gap-1 overflow-x-auto pb-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-[15px] font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-[#9A8073] border-b-[3px] border-[#9A8073]'
                      : 'text-[#827A73] hover:text-[#2D2A26]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activeTab === 'about' ? (
        <ProfileAboutTab />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {activeTab === 'all' && (
            <div className="lg:col-span-5 xl:col-span-4 space-y-4">
              <div className="bg-white border border-[#EBE6E0] rounded-xl p-4 shadow-sm">
                <h3 className="text-xl font-bold mb-4">Intro</h3>

                <p className="text-[15px] text-center mb-4 whitespace-pre-wrap">
                  {shop?.description ||
                    user?.bio ||
                    'Add a bio in the About tab.'}
                </p>

                <div className="space-y-4 mt-4">
                  <div className="flex items-center gap-3">
                    <Clock size={20} />
                    {formatOperatingHours(shop?.operating_hours)}
                  </div>

                  <div className="flex items-center gap-3">
                    <Star size={20} />
                    Rating:{' '}
                    {stats?.avgRating
                      ? Number(stats.avgRating).toFixed(1)
                      : '0.0'}
                  </div>

                  <div className="flex items-center gap-3">
                    <Globe size={20} />
                    {user?.email || 'No email set'}
                  </div>

                  {socialLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <LinkIcon size={20} />
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#9A8073] hover:underline truncate"
                      >
                        {link.label}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div
            className={
              activeTab === 'all'
                ? 'lg:col-span-7 xl:col-span-8'
                : 'lg:col-span-12'
            }
          >
            {activeTab === 'appointments' && <ProfileAppointmentsCalendar />}

            {activeTab === 'hours' && (
              <div className="space-y-6">
                <div className="bg-white border border-[#EBE6E0] rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-[#2D2A26]">Weekly Operating Hours</h3>
                    <button
                      onClick={() => setIsEditHoursModalOpen(true)}
                      className="flex items-center gap-1.5 text-sm font-medium text-[#9A8073] hover:text-[#8A7063] transition-colors"
                    >
                      <Edit2 size={14} /> Edit Hours
                    </button>
                  </div>
                  {shop?.operating_hours ? (
                    <div className="space-y-1">
                      {(['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const).map(day => {
                        const h = (shop.operating_hours as Record<string, { is_open: boolean; open: string; close: string }>)[day];
                        return (
                          <div key={day} className="flex items-center justify-between py-2 border-b border-[#F0EAE3] last:border-0">
                            <span className="text-sm font-medium text-[#524A44] capitalize w-28">{day}</span>
                            {h?.is_open
                              ? <span className="text-sm text-[#2D2A26]">{h.open} – {h.close}</span>
                              : <span className="text-sm text-[#A8A19A] italic">Closed</span>
                            }
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-[#A8A19A] italic">No weekly hours configured yet.</p>
                  )}
                </div>
                <StorefrontSchedules specialHours={specialHours} />
              </div>
            )}

            {activeTab === 'gallery' && (
              <div className="bg-white border border-[#EBE6E0] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#2D2A26]">Shop Gallery</h3>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-white bg-[#9A8073] px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#8A7063] transition-colors">
                    {uploadingCreation ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploadingCreation ? 'Uploading…' : 'Add Photo'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCreationUpload} disabled={uploadingCreation} />
                  </label>
                </div>
                {fetchingGallery ? (
                  <div className="flex justify-center py-12"><Loader2 className="animate-spin text-[#A8A19A]" /></div>
                ) : shopGallery.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="mx-auto h-10 w-10 text-[#C5BDBA] mb-3" />
                    <p className="text-sm text-[#827A73]">No photos yet. Add your first shop photo.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {shopGallery.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-[#EBE6E0]">
                        <Image src={url} alt={`Gallery ${idx + 1}`} fill className="object-cover" unoptimized />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button onClick={() => setViewerImage(url)} className="p-1.5 bg-white/90 rounded-full text-[#2D2A26]">
                            <ImageIcon size={14} />
                          </button>
                          <button onClick={() => handleRemoveCreation(url)} className="p-1.5 bg-white/90 rounded-full text-red-500">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'catalog' && (
              <div className="bg-white border border-[#EBE6E0] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#2D2A26]">Catalog Items</h3>
                  <Link href="/dashboard/catalog" className="text-sm text-[#9A8073] hover:underline flex items-center gap-1">
                    <Package size={14} /> Manage Catalog
                  </Link>
                </div>
                {catalogItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="mx-auto h-10 w-10 text-[#C5BDBA] mb-3" />
                    <p className="text-sm text-[#827A73]">No catalog items yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {catalogItems.map(item => {
                      const primaryImage = item.images?.find(img => img.is_primary)?.image_url ?? item.images?.[0]?.image_url;
                      return (
                        <Link key={item.id} href={`/dashboard/catalog/${item.id}/edit`} className="group block border border-[#EBE6E0] rounded-xl overflow-hidden hover:border-[#D1C7BD] transition-colors">
                          <div className="aspect-square bg-[#FAF6F3] relative">
                            {primaryImage
                              ? <Image src={primaryImage} alt={item.name} fill className="object-cover" unoptimized />
                              : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="text-[#C5BDBA]" /></div>
                            }
                          </div>
                          <div className="p-2.5">
                            <p className="text-xs font-semibold text-[#2D2A26] truncate">{item.name}</p>
                            {item.price != null && <p className="text-xs text-[#827A73] mt-0.5">₱{Number(item.price).toLocaleString()}</p>}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'services' && (
              <div className="bg-white border border-[#EBE6E0] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#2D2A26]">Services</h3>
                  <Link href="/dashboard/services" className="text-sm text-[#9A8073] hover:underline flex items-center gap-1">
                    <Briefcase size={14} /> Manage Services
                  </Link>
                </div>
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="mx-auto h-10 w-10 text-[#C5BDBA] mb-3" />
                    <p className="text-sm text-[#827A73]">No services listed yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {services.map(svc => (
                      <button
                        key={svc.id}
                        onClick={() => setSelectedService(svc)}
                        className="w-full text-left flex items-center gap-3 p-3 rounded-xl border border-[#EBE6E0] hover:border-[#D1C7BD] hover:bg-[#FAF6F3] transition-colors"
                      >
                        {svc.image_url
                          ? <Image src={svc.image_url} alt={svc.name} width={40} height={40} className="rounded-lg object-cover shrink-0" unoptimized />
                          : <div className="w-10 h-10 rounded-lg bg-[#F0EAE3] flex items-center justify-center shrink-0"><Briefcase size={16} className="text-[#9A8073]" /></div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2D2A26] truncate">{svc.name}</p>
                          {svc.description && <p className="text-xs text-[#827A73] truncate">{svc.description}</p>}
                        </div>
                        {(svc.base_price ?? svc.price) != null && (
                          <span className="text-sm font-medium text-[#9A8073] shrink-0">
                            ₱{Number(svc.base_price ?? svc.price).toLocaleString()}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white border border-[#EBE6E0] rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#2D2A26]">Recent Reviews</h3>
                  <Link href="/dashboard/reviews" className="text-sm text-[#9A8073] hover:underline flex items-center gap-1">
                    <Star size={14} /> View All
                  </Link>
                </div>
                {recentReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="mx-auto h-10 w-10 text-[#C5BDBA] mb-3" />
                    <p className="text-sm text-[#827A73]">No reviews yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentReviews.map(review => (
                      <div key={review.id} className="flex gap-3 pb-4 border-b border-[#F0EAE3] last:border-0 last:pb-0">
                        <div className="w-9 h-9 rounded-full bg-[#EBE6E0] flex items-center justify-center font-bold text-[#524A44] shrink-0">
                          {review.user.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[#2D2A26]">{review.user.name}</p>
                            <span className="text-xs text-[#A8A19A]">{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-0.5 my-1">
                            {[1,2,3,4,5].map(s => (
                              <Star key={s} size={12} className={s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
                            ))}
                          </div>
                          {review.comment && <p className="text-sm text-[#524A44] line-clamp-2">{review.comment}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <ProfileImageViewer
        imageUrl={viewerImage}
        onClose={() => setViewerImage(null)}
      />

      <ServiceDetailModal
        service={selectedService}
        isOpen={selectedService !== null}
        onClose={() => setSelectedService(null)}
        facebookUrl={shop?.social_links?.facebook}
        shopId={shop?.id}
      />

      <EditOperatingHoursModal
        isOpen={isEditHoursModalOpen}
        onClose={() => setIsEditHoursModalOpen(false)}
        initialHours={shop?.operating_hours || {}}
        onSaved={(newHours) => {
          if (shop && token && authUser) {
            setAuth(
              authUser,
              token,
              { ...shop, operating_hours: newHours },
              staffProfile || undefined
            );
          }
        }}
      />
    </div>
  );
}