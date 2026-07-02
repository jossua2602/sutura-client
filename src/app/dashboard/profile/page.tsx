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
                className="px-4 py-2 bg-[#9A8073] text-white rounded-lg"
              >
                <Globe size={16} />
              </Link>

              <button
                onClick={() => setActiveTab('about')}
                className="px-4 py-2 bg-[#F0F2F5] rounded-lg"
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
                  className={`px-4 py-3 text-[15px] font-semibold ${
                    isActive
                      ? 'text-[#9A8073] border-b-[3px] border-[#9A8073]'
                      : 'text-[#65676B]'
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
            {activeTab === 'appointments' && (
              <ProfileAppointmentsCalendar />
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