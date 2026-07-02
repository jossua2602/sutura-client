'use client';

import { useProfile, ServiceItem, Tab } from '@/components/profile/useProfile';
import StorefrontSchedules from '@/components/profile/StorefrontSchedules';
import {
  MapPin, Clock, Star, Plus, Globe, Calendar, Upload, X, Loader2,
  ShoppingBag, Package, Megaphone, Image as ImageIcon, Sparkles,
  Link as LinkIcon, Briefcase, Edit2, Info
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

  const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All', icon: Sparkles },
    { id: 'about', label: 'About', icon: Info },
    { id: 'hours', label: 'Hours', icon: Clock },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'catalog', label: 'Catalog', icon: ShoppingBag },
    { id: 'services', label: 'Services', icon: Package },
    { id: 'reviews', label: 'Reviews', icon: Star },
  ];

  // Helper to format operating hours
  const formatOperatingHours = (hours?: Record<string, unknown> | string) => {
    if (!hours) return 'No operating hours set';
    if (typeof hours === 'string') return hours;
    
    try {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const activeDays: string[] = [];
      let commonHours = '';
      
      for (const d of days) {
        const h = hours[d] as { is_open?: boolean; open?: string; close?: string } | undefined;
        if (h?.is_open) {
          const timeStr = `${h.open} - ${h.close}`;
          activeDays.push(d.substring(0, 3));
          commonHours = timeStr;
        }
      }
      
      if (activeDays.length === 0) return 'Closed';
      if (activeDays.length === 7) return `Daily: ${commonHours}`;
      if (activeDays.length === 5 && !activeDays.includes('sat') && !activeDays.includes('sun')) {
        return `Mon-Fri: ${commonHours}`;
      }
      return `${activeDays.join(', ')}: ${commonHours}`;
    } catch {
      return 'Schedule Configured';
    }
  };

  return (
    <div className="max-w-[1100px] mx-auto pb-16 space-y-4">
      
      {/* FACEBOOK STYLE HEADER */}
      <div className="bg-white border border-[#EBE6E0] rounded-b-2xl overflow-hidden shadow-sm mb-4">
        {/* Cover Photo */}
        <div className="h-48 md:h-80 bg-[#F0EAE3] relative w-full"></div>
        
        <div className="px-4 md:px-8 pb-0 relative">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 -mt-16 md:-mt-12">
            
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6 text-center md:text-left z-10">
              {/* Avatar */}
              <div className="w-32 h-32 md:w-[168px] md:h-[168px] rounded-full border-4 border-white bg-white relative overflow-hidden shadow-sm shrink-0">
                {shop?.logo_path ? (
                  <Image
                    src={shop.logo_path}
                    alt={shop.name || 'Shop Logo'}
                    fill
                    sizes="168px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8C6B5D] text-[64px] font-serif bg-[#FAF6F3]">
                    {shop?.name?.charAt(0) || 'S'}
                  </div>
                )}
              </div>

              {/* Name & Basic Info */}
              <div className="mb-2 md:mb-6">
                <h1 className="text-[32px] font-bold text-[#2D2A26] leading-none mb-1">{shop?.name || 'Your Shop Name'}</h1>
                <p className="text-[15px] font-semibold text-[#827A73]">
                  {stats?.totalCatalog || 0} catalog items • {stats?.totalServices || 0} services
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-[#524A44] mt-2">
                  <span className="flex items-center gap-1.5"><Briefcase size={14} className="text-[#9A8073]" /> {shop?.business_type || 'Custom Tailoring'}</span>
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-[#9A8073]" /> {shop?.address ? `${shop.address}, ${shop.city}` : 'No address'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-2 md:mb-6 z-10">
              <Link href={`/shop/${shop?.slug}`} target="_blank" className="flex items-center gap-1.5 px-4 py-2 bg-[#9A8073] text-white rounded-lg text-[15px] font-semibold hover:bg-[#8A7063] transition-colors shadow-sm">
                <Globe size={16} /> View Live Shop
              </Link>
              <button onClick={() => setActiveTab('about')} className="flex items-center gap-1.5 px-4 py-2 bg-[#F0F2F5] text-[#050505] rounded-lg text-[15px] font-semibold hover:bg-[#E4E6EB] transition-colors">
                <Edit2 size={16} /> Edit details
              </button>
            </div>
          </div>

          <hr className="mt-6 mb-1 border-[#EBE6E0]" />

          {/* TABS */}
          <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-1">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-[15px] font-semibold transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-[#9A8073] border-b-[3px] border-[#9A8073]'
                      : 'text-[#65676B] hover:bg-[#F0F2F5] rounded-lg border-b-[3px] border-transparent'
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
        <div className="w-full max-w-[1100px]">
          <ProfileAboutTab />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1100px] w-full">
        
        {/* LEFT COLUMN: Intro */}
        {activeTab === 'all' && (
          <div className="lg:col-span-5 xl:col-span-4 space-y-4">
            <div className="bg-white border border-[#EBE6E0] rounded-xl p-4 shadow-sm">
            <h3 className="text-xl font-bold text-[#050505] mb-4">Intro</h3>
            
            <p className="text-[15px] text-[#050505] text-center mb-4 whitespace-pre-wrap">
              {shop?.description || user?.bio || 'Add a bio in the About tab to tell customers about your brand.'}
            </p>
            <button onClick={() => setActiveTab('about')} className="block w-full py-1.5 bg-[#F0F2F5] text-center rounded-lg font-semibold text-[15px] text-[#050505] hover:bg-[#E4E6EB] transition-colors mb-4">
              Edit bio
            </button>

            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-3 text-[15px]">
                <Clock size={20} className="text-[#8C939D] shrink-0" />
                <span className="text-[#050505]">{formatOperatingHours(shop?.operating_hours)}</span>
              </div>
              <div className="flex items-center gap-3 text-[15px]">
                <Star size={20} className="text-[#8C939D] shrink-0" />
                <span className="text-[#050505]">Rating: {stats?.avgRating ? Number(stats.avgRating).toFixed(1) : '0.0'}</span>
              </div>
              <div className="flex items-center gap-3 text-[15px]">
                <Globe size={20} className="text-[#8C939D] shrink-0" />
                <span className="text-[#050505]">{user?.email || 'No email set'}</span>
              </div>

              {/* Links */}
                  let links: { label: string; url: string }[] = [];
                  if (Array.isArray(user?.social_links)) {
                    links = user.social_links;
                  } else if (user?.social_links && typeof user.social_links === 'object') {
                    links = Object.entries(user.social_links).map(([k, v]) => ({ label: k.charAt(0).toUpperCase() + k.slice(1), url: v as string }));
                  }
                  
                  if (links.length === 0) return null;

                  return (
                    <>
                      {links.map((link, idx) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <div key={idx} className="flex items-center gap-3 text-[15px]">
                          <LinkIcon size={20} className="text-[#8C939D] shrink-0" />
                          <a href={link.url} target="_blank" rel="noreferrer" className="text-[#9A8073] hover:underline truncate">
                            {link.label || link.url}
                          </a>
                        </div>
                      ))}
                    </>
                  );
              })()}
            </div>
            <button onClick={() => setActiveTab('about')} className="block w-full py-1.5 bg-[#F0F2F5] text-center rounded-lg font-semibold text-[15px] text-[#050505] hover:bg-[#E4E6EB] transition-colors mt-4">
              Edit details
            </button>
          </div>
        </div>
        )}

        {/* RIGHT COLUMN: Tab Content Area */}
        <div className={activeTab === 'all' ? "lg:col-span-7 xl:col-span-8 space-y-4" : "lg:col-span-12 space-y-4"}>
          <div className="bg-white border border-[#EBE6E0] rounded-xl p-4 md:p-6 shadow-sm min-h-[500px]">
            
            {/* Filter Row (Placeholder for future functionality) */}
            <div className="flex justify-end mb-6 pb-4 border-b border-[#EBE6E0]">
              <select className="text-xs bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-1.5 text-[#524A44] focus:outline-none">
                <option>Newest First</option>
                <option>Oldest First</option>
              </select>
            </div>

            {/* TAB: ALL (Summary Feed) */}
            {activeTab === 'all' && (
              <div className="space-y-8">
                {shop?.active_special_hours && (
                  <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-amber-900">
                    <p className="font-bold flex items-center gap-2 mb-1">
                      <Megaphone size={16} className="text-amber-600" />
                      Announcement: {shop.active_special_hours.title}
                    </p>
                    <p className="text-sm text-amber-800">{shop.active_special_hours.announcement_message}</p>
                  </div>
                )}
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-[#2D2A26] flex items-center gap-2">
                      <ShoppingBag size={20} className="text-[#9A8073]" />
                      Design Catalog
                    </h3>
                    <Link href="/dashboard/catalog/new" className="text-xs font-semibold text-white bg-[#9A8073] px-4 py-2 rounded-lg hover:bg-[#8A7063] transition-colors flex items-center gap-1.5 shadow-sm">
                      <Plus size={14} /> Add Item
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {catalogItems.map(item => (
                      <div key={item.id} className="group flex flex-col bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                        <button type="button" className="text-left w-full aspect-4/5 relative bg-[#FAF6F3] overflow-hidden cursor-pointer" onClick={() => setViewerImage(item.images?.[0]?.image_url || null)}>
                          {item.images?.[0]?.image_url ? (
                            <Image src={item.images[0].image_url} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" unoptimized />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#A8A19A]"><ImageIcon size={32} /></div>
                          )}
                          <h4 className="font-bold text-[13px] text-[#2D2A26] line-clamp-1">{item.name}</h4>
                          {item.price && <p className="text-xs font-extrabold text-[#9A8073] mt-0.5">₱{Number(item.price).toLocaleString()}</p>}
                        </button>
                      </div>
                    ))}
                    {catalogItems.length === 0 && <p className="text-sm text-[#A8A19A] col-span-4">No catalog items yet.</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[#2D2A26] mb-4">Recent Reviews</h3>
                  <div className="space-y-3">
                    {recentReviews.map(r => (
                      <div key={r.id} className="p-4 bg-[#FAF6F3] rounded-xl border border-[#EBE6E0]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-sm">{r.user?.name}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              // eslint-disable-next-line react/no-array-index-key
                              <Star key={`star-${i}`} size={12} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'} />
                            ))}
                          </div>
                        </div>
                        {r.comment && <p className="text-sm text-[#524A44] italic">&quot;{r.comment}&quot;</p>}
                      </div>
                    ))}
                    {recentReviews.length === 0 && <p className="text-sm text-[#A8A19A]">No reviews yet.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* TAB: HOURS */}
            {activeTab === 'hours' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Standard Weekly Hours */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-xl font-extrabold text-[#2D2A26] flex items-center gap-2">
                        <Clock size={22} className="text-[#9A8073]" />
                        Standard Hours
                      </h3>
                      <button 
                        onClick={() => setIsEditHoursModalOpen(true)}
                        className="p-2 text-[#9A8073] hover:bg-[#FAF6F3] rounded-lg transition-colors group"
                        title="Edit Standard Hours"
                      >
                        <Edit2 size={18} className="group-hover:text-[#8A7063]" />
                      </button>
                    </div>
                    <p className="text-sm text-[#827A73] mb-6">Your regular weekly operating schedule.</p>
                    
                    <div className="space-y-3">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
                        const hours = shop?.operating_hours?.[day] as { is_open: boolean; open: string; close: string } | undefined;
                        if (!hours) return null;
                        return (
                          <div key={day} className="flex justify-between items-center text-[15px] p-4 bg-[#FAF6F3]/50 hover:bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl transition-colors">
                            <span className="capitalize text-[#524A44] font-bold w-24">{day.slice(0, 3)}</span>
                            {hours.is_open ? (
                              <div className="flex items-center gap-2">
                                <span className="text-[#2D2A26] font-semibold bg-white border border-[#EBE6E0] px-3 py-1.5 rounded-lg shadow-sm">{hours.open}</span>
                                <span className="text-[#A8A19A]">-</span>
                                <span className="text-[#2D2A26] font-semibold bg-white border border-[#EBE6E0] px-3 py-1.5 rounded-lg shadow-sm">{hours.close}</span>
                              </div>
                            ) : (
                              <span className="text-[#B26959] font-bold text-xs uppercase bg-white border border-red-100 px-4 py-1.5 rounded-lg shadow-sm">Closed</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Temporary Schedules & Announcements */}
                  <div>
                    <StorefrontSchedules specialHours={specialHours} />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GALLERY */}
            {activeTab === 'gallery' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-[#2D2A26] flex items-center gap-2">
                    <ImageIcon size={20} className="text-[#9A8073]" />
                    Creations Gallery
                  </h3>
                  <div>
                    <input
                      type="file"
                      id="gallery-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleCreationUpload}
                      disabled={uploadingCreation}
                    />
                    <label
                      htmlFor="gallery-upload"
                      className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-xs font-semibold text-[#524A44] transition-colors cursor-pointer ${uploadingCreation ? 'opacity-50' : 'hover:bg-[#F0EAE3]'}`}
                    >
                      {uploadingCreation ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                      {uploadingCreation ? 'Uploading...' : 'Add Photo'}
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {shopGallery.map((url: string, i: number) => (
                    <div key={`gallery-${url}-${i}`} className="aspect-square relative rounded-xl overflow-hidden group border border-[#EBE6E0]">
                      <button type="button" className="text-left w-full absolute inset-0 cursor-pointer" onClick={() => setViewerImage(url)}>
                        <Image src={url} alt="Gallery item" fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoveCreation(url); }}
                        className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {(!shopGallery || shopGallery.length === 0) && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-[#EBE6E0] rounded-xl bg-[#FAF6F3]">
                      <ImageIcon size={32} className="text-[#A8A19A] mx-auto mb-3" />
                      <p className="text-[#524A44] font-medium">{fetchingGallery ? 'Loading gallery...' : 'Your gallery is empty.'}</p>
                      <p className="text-sm text-[#827A73] mb-4">Upload photos to show off your creations to customers.</p>
                      <label
                        htmlFor="gallery-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#9A8073] text-white rounded-lg text-sm font-semibold hover:bg-[#826A5E] transition-colors cursor-pointer"
                      >
                        <Upload size={16} />
                        Add First Photo
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: APPOINTMENTS */}
            {activeTab === 'appointments' && (
              <ProfileAppointmentsCalendar />
            )}

            {/* TAB: CATALOG */}
            {activeTab === 'catalog' && (
              <div>
                <h3 className="text-lg font-bold text-[#2D2A26] mb-4 flex items-center gap-2">
                  <ShoppingBag size={20} className="text-[#9A8073]" />
                  Design Catalog
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {catalogItems.map(item => (
                    <div key={item.id} className="group flex flex-col gap-2">
                      <button type="button" className="text-left w-full aspect-square relative bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl overflow-hidden cursor-pointer" onClick={() => setViewerImage(item.images?.[0]?.image_url || null)}>
                        {item.images?.[0]?.image_url ? (
                          <Image src={item.images[0].image_url} alt={item.name} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#A8A19A]"><ImageIcon size={24} /></div>
                        )}
                      </button>
                      <p className="text-sm font-semibold text-[#2D2A26] truncate">{item.name}</p>
                      {item.price && <p className="text-xs text-[#9A8073]">₱{Number(item.price).toLocaleString()}</p>}
                    </div>
                  ))}
                  {catalogItems.length === 0 && <p className="text-sm text-[#A8A19A] col-span-3">Your catalog is empty.</p>}
                </div>
              </div>
            )}

            {/* TAB: SERVICES */}
            {activeTab === 'services' && (
              <div>
                <h3 className="text-lg font-bold text-[#2D2A26] mb-4 flex items-center gap-2">
                  <Package size={20} className="text-[#9A8073]" />
                  Services Offered
                </h3>
                <div className="space-y-3">
                  {services.map(svc => (
                    <button type="button" key={svc.id} onClick={() => setSelectedService(svc)} className="text-left w-full flex items-center justify-between p-4 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl hover:border-[#9A8073]/50 cursor-pointer transition-colors">
                      <div>
                        <p className="font-semibold text-[#2D2A26]">{svc.name}</p>
                        <p className="text-xs text-[#827A73] line-clamp-1 mt-0.5">{svc.description}</p>
                      </div>
                      <span className="font-bold text-[#9A8073]">
                        {svc.price || svc.base_price ? `₱${Number(svc.price || svc.base_price).toLocaleString()}` : 'Custom'}
                      </span>
                    </button>
                  ))}
                  {services.length === 0 && <p className="text-sm text-[#A8A19A]">No services listed.</p>}
                </div>
              </div>
            )}

            {/* TAB: REVIEWS */}
            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-lg font-bold text-[#2D2A26] mb-4 flex items-center gap-2">
                  <Star size={20} className="text-[#9A8073]" />
                  Customer Reviews
                </h3>
                <div className="space-y-4">
                  {recentReviews.map(r => (
                    <div key={r.id} className="p-4 border border-[#EBE6E0] rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm">{r.user?.name}</span>
                        <span className="text-[10px] text-[#A8A19A]">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={`star-${i}`} size={14} className={i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} />
                        ))}
                      </div>
                      {r.comment && <p className="text-sm text-[#524A44] leading-relaxed">&quot;{r.comment}&quot;</p>}
                    </div>
                  ))}
                  {recentReviews.length === 0 && <p className="text-sm text-[#A8A19A]">No reviews found.</p>}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
      )}

      <ProfileImageViewer imageUrl={viewerImage} onClose={() => setViewerImage(null)} />
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
        initialHours={(shop?.operating_hours as Record<string, { is_open: boolean; open: string; close: string }>) || {}}
        onSaved={(newHours) => {
          if (shop && token && authUser) {
            setAuth(authUser, token, { ...shop, operating_hours: newHours }, staffProfile || undefined);
          }
        }}
      />
    </div>
  );
}
