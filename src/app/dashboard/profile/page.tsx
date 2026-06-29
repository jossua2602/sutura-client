'use client';

import { useProfile, Review, CatalogItem, ServiceItem } from '@/components/profile/useProfile';
import {
  Star, Users, Scissors, ShoppingBag, Package,
  Globe, Briefcase, GraduationCap, Image as ImageIcon,
  MapPin, Mail, Phone, BadgeCheck, TrendingUp, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ProfileCoverAvatar from '@/components/profile/ProfileCoverAvatar';
import ProfilePersonalDetails from '@/components/profile/ProfilePersonalDetails';
import ProfileImageViewer from '@/components/profile/ProfileImageViewer';

// Social icons
const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const YoutubeIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

const TABS: { id: 'overview' | 'about' | 'photos'; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'photos', label: 'Photos' },
  { id: 'about', label: 'About & Edit' },
];

export default function OwnerProfilePage() {
  const {
    user,
    shop,
    activeTab,
    setActiveTab,
    stats,
    recentReviews,
    catalogItems,
    services,
    loadingStats,
    personalForm,
    setPersonalForm,
    loadingPersonal,
    uploadingCreation,
    isAvatarDropdownOpen,
    setIsAvatarDropdownOpen,
    isCoverDropdownOpen,
    setIsCoverDropdownOpen,
    viewerImage,
    setViewerImage,
    handlePersonalSubmit,
    handleImageUpload,
    handleCreationUpload,
    handleRemoveCreation,
  } = useProfile();

  // Helper render for Reviews section
  const renderReviewsSection = () => {
    if (loadingStats) {
      return (
        <div className="space-y-4">
          {[0, 1].map(index => (
            <div key={`skeleton-review-${index}`} className="space-y-2">
              <div className="h-3 bg-[#EBE6E0] rounded animate-pulse w-32" />
              <div className="h-3 bg-[#EBE6E0] rounded animate-pulse w-full" />
            </div>
          ))}
        </div>
      );
    }

    if (recentReviews.length === 0) {
      return (
        <div className="py-8 flex flex-col items-center text-center">
          <Star size={28} className="text-[#EBE6E0] mb-2" />
          <p className="text-sm text-[#A8A19A]">No reviews yet. They&apos;ll appear here once customers rate your shop.</p>
        </div>
      );
    }

    return (
      <div className="divide-y divide-[#EBE6E0]">
        {recentReviews.map((review: Review) => (
          <div key={review.id} className="py-4 first:pt-0 last:pb-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-[#2D2A26]">{review.user.name}</span>
              <div className="flex gap-0.5">
                {[0, 1, 2, 3, 4].map(starIdx => (
                  <Star
                    key={`review-${review.id}-star-${starIdx}`}
                    size={12}
                    className={starIdx < review.rating ? 'fill-amber-400 text-amber-400' : 'text-[#EBE6E0]'}
                  />
                ))}
              </div>
            </div>
            <p className="text-xs text-[#827A73] leading-relaxed line-clamp-2">
              {review.comment || <em>No written comment</em>}
            </p>
            <p className="text-[10px] text-[#A8A19A] mt-1.5">
              {new Date(review.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // Helper render for Catalog section
  const renderCatalogSection = () => {
    if (loadingStats) {
      return (
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map(index => (
            <div key={`skeleton-catalog-${index}`} className="aspect-square bg-[#EBE6E0] rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {catalogItems.map((item: CatalogItem) => (
          <div key={item.id} className="group relative aspect-square bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl overflow-hidden">
            {item.images?.[0] ? (
              <Image
                src={item.images[0]}
                alt={item.name}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={20} className="text-[#C5BDBA]" />
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-white text-[10px] font-semibold truncate">{item.name}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Helper render for Services section
  const renderServicesSection = () => {
    if (loadingStats) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(index => (
            <div key={`skeleton-service-${index}`} className="h-10 bg-[#EBE6E0] rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap gap-2">
        {services.map((svc: ServiceItem) => (
          <span key={svc.id}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-sm text-[#524A44] font-medium">
            {svc.name}
            {svc.price !== undefined && (
              <span className="text-[11px] text-[#9A8073] font-semibold">
                ₱{Number(svc.price).toLocaleString()}
              </span>
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* Cover + Avatar */}
      <ProfileCoverAvatar
        user={user}
        shop={shop}
        isCoverDropdownOpen={isCoverDropdownOpen}
        setIsCoverDropdownOpen={setIsCoverDropdownOpen}
        isAvatarDropdownOpen={isAvatarDropdownOpen}
        setIsAvatarDropdownOpen={setIsAvatarDropdownOpen}
        onViewImage={setViewerImage}
        onImageUpload={handleImageUpload}
      />

      {/* Tab Bar */}
      <div className="bg-white border border-[#EBE6E0] rounded-2xl px-6 mb-6 shadow-sm">
        <div className="flex gap-6 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 text-sm font-semibold transition-all border-b-2 -mb-px shrink-0 ${
                activeTab === tab.id
                  ? 'border-[#9A8073] text-[#9A8073]'
                  : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* === OVERVIEW TAB === */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Intro Card */}
          <div className="lg:col-span-4 space-y-4">
            {/* Intro */}
            <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-5">
              <h3 className="text-base font-bold text-[#2D2A26]">Intro</h3>

              <p className="text-sm text-[#524A44] leading-relaxed">
                {user?.bio || <span className="italic text-[#A8A19A]">No bio added yet. Edit your About tab to add one.</span>}
              </p>

              <div className="space-y-3 text-sm text-[#524A44] pt-3 border-t border-[#EBE6E0]">
                <div className="flex items-center gap-2.5">
                  <Briefcase size={15} className="text-[#9A8073] shrink-0" />
                  <span>Shop Owner at <strong className="text-[#2D2A26]">{shop?.name || 'Sutura Shop'}</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Mail size={15} className="text-[#9A8073] shrink-0" />
                  <span className="truncate">{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center gap-2.5">
                    <Phone size={15} className="text-[#9A8073] shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {/* Location from shop */}
                {shop?.city && (
                  <div className="flex items-center gap-2.5">
                    <MapPin size={15} className="text-[#9A8073] shrink-0" />
                    <span>{shop.city}{shop.province ? `, ${shop.province}` : ''}</span>
                  </div>
                )}
              </div>

              {/* Social links */}
              {user?.social_links && Object.values(user.social_links).some(Boolean) && (
                <div className="pt-3 border-t border-[#EBE6E0] space-y-2.5">
                  <h4 className="text-[10px] font-bold text-[#A8A19A] uppercase tracking-wider">Social Links</h4>
                  {user.social_links.instagram && (
                    <a href={user.social_links.instagram} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#9A8073] hover:underline">
                      <InstagramIcon /> Instagram
                    </a>
                  )}
                  {user.social_links.youtube && (
                    <a href={user.social_links.youtube} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#9A8073] hover:underline">
                      <YoutubeIcon /> YouTube
                    </a>
                  )}
                  {user.social_links.website && (
                    <a href={user.social_links.website} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-[#9A8073] hover:underline">
                      <Globe size={16} /> Website
                    </a>
                  )}
                </div>
              )}

              {/* Specializations */}
              {user?.skills && user.skills.length > 0 && (
                <div className="pt-3 border-t border-[#EBE6E0] space-y-2.5">
                  <h4 className="text-[10px] font-bold text-[#A8A19A] uppercase tracking-wider">Specializations</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {user.skills.map((skill: string) => (
                      <span key={skill} className="px-2.5 py-0.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-full text-xs text-[#524A44]">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Shop Stats Card */}
            <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#2D2A26]">Shop Stats</h3>
                <TrendingUp size={16} className="text-[#9A8073]" />
              </div>
              {loadingStats ? (
                <div className="space-y-2">
                  {[0, 1, 2, 3, 4].map(index => (
                    <div key={`skeleton-stat-${index}`} className="h-3 bg-[#EBE6E0] rounded animate-pulse" style={{ width: `${60 + index * 8}%` }} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {[
                    { icon: Scissors, label: 'Custom Jobs', value: stats?.totalJobs ?? 0, href: '/dashboard/jobs' },
                    { icon: Users, label: 'Customers Served', value: stats?.totalCustomers ?? 0, href: '/dashboard/customers' },
                    { icon: BadgeCheck, label: 'Team Members', value: stats?.totalStaff ?? 0, href: '/dashboard/staff' },
                    { icon: Package, label: 'Services Offered', value: stats?.totalServices ?? 0, href: '/dashboard/services' },
                    { icon: ShoppingBag, label: 'Design Catalog', value: stats?.totalCatalog ?? 0, href: '/dashboard/catalog' },
                  ].map(stat => (
                    <Link key={stat.label} href={stat.href}
                      className="flex items-center justify-between py-1.5 hover:text-[#9A8073] transition-colors group">
                      <div className="flex items-center gap-2.5">
                        <stat.icon size={14} className="text-[#A8A19A] group-hover:text-[#9A8073] transition-colors" />
                        <span className="text-sm text-[#524A44] group-hover:text-[#9A8073] transition-colors">{stat.label}</span>
                      </div>
                      <span className="text-sm font-bold text-[#2D2A26]">{stat.value}</span>
                    </Link>
                  ))}
                  {stats?.avgRating !== null && (
                    <div className="pt-3 mt-1 border-t border-[#EBE6E0] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-amber-400 fill-amber-400" />
                        <span className="text-sm text-[#524A44]">Avg. Rating</span>
                      </div>
                      <span className="text-sm font-bold text-[#2D2A26]">
                        {stats?.avgRating ? Number(stats.avgRating).toFixed(1) : '—'}
                        <span className="text-xs text-[#A8A19A] font-normal ml-1">/ 5</span>
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Main content */}
          <div className="lg:col-span-8 space-y-6">
            {/* Recent Reviews */}
            <div className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-[#EBE6E0] flex items-center justify-between">
                <h3 className="font-bold text-[#2D2A26] flex items-center gap-2">
                  <MessageSquare size={16} className="text-[#9A8073]" />
                  Recent Reviews
                </h3>
                <Link href="/dashboard/reviews" className="text-xs font-medium text-[#9A8073] hover:underline">
                  View All →
                </Link>
              </div>
              <div className="p-6">
                {renderReviewsSection()}
              </div>
            </div>

            {/* Design Catalog Preview */}
            {(loadingStats || catalogItems.length > 0) && (
              <div className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#EBE6E0] flex items-center justify-between">
                  <h3 className="font-bold text-[#2D2A26] flex items-center gap-2">
                    <ShoppingBag size={16} className="text-[#9A8073]" />
                    Design Catalog
                  </h3>
                  <Link href="/dashboard/catalog" className="text-xs font-medium text-[#9A8073] hover:underline">
                    View All →
                  </Link>
                </div>
                <div className="p-6">
                  {renderCatalogSection()}
                </div>
              </div>
            )}

            {/* Services Offered */}
            {(loadingStats || services.length > 0) && (
              <div className="bg-white border border-[#EBE6E0] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-[#EBE6E0] flex items-center justify-between">
                  <h3 className="font-bold text-[#2D2A26] flex items-center gap-2">
                    <Package size={16} className="text-[#9A8073]" />
                    Services Offered
                  </h3>
                  <Link href="/dashboard/services" className="text-xs font-medium text-[#9A8073] hover:underline">
                    Manage →
                  </Link>
                </div>
                <div className="p-6">
                  {renderServicesSection()}
                </div>
              </div>
            )}

            {/* Work & Experience (if any) */}
            {user?.experience && user.experience.length > 0 && (
              <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-[#2D2A26] flex items-center gap-2">
                  <Briefcase size={16} className="text-[#9A8073]" /> Work & Experience
                </h3>
                <div className="divide-y divide-[#EBE6E0]">
                  {user.experience.map(exp => (
                    <div key={`${exp.title}-${exp.company}`} className="py-3 first:pt-0 last:pb-0">
                      <h4 className="font-semibold text-[#2D2A26] text-sm">{exp.title}</h4>
                      <p className="text-xs text-[#827A73]">{exp.company} · {exp.duration}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {user?.education && user.education.length > 0 && (
              <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm space-y-4">
                <h3 className="font-bold text-[#2D2A26] flex items-center gap-2">
                  <GraduationCap size={16} className="text-[#9A8073]" /> Education & Certifications
                </h3>
                <div className="divide-y divide-[#EBE6E0]">
                  {user.education.map(edu => (
                    <div key={`${edu.degree}-${edu.school}`} className="py-3 first:pt-0 last:pb-0">
                      <h4 className="font-semibold text-[#2D2A26] text-sm">{edu.degree}</h4>
                      <p className="text-xs text-[#827A73]">{edu.school} · {edu.year}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === PHOTOS TAB === */}
      {activeTab === 'photos' && (
        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-[#2D2A26]">Your Creations Gallery</h3>
              <p className="text-xs text-[#A8A19A] mt-0.5">Showcase your best work and designs</p>
            </div>
            <label className="cursor-pointer bg-[#9A8073] hover:bg-[#8a7065] text-white px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2">
              {uploadingCreation ? 'Uploading...' : '+ Add Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleCreationUpload} disabled={uploadingCreation} />
            </label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {user?.creations_gallery?.map((img: string) => (
              <div key={img} className="aspect-square bg-[#FAF6F3] border border-[#EBE6E0] rounded-2xl overflow-hidden relative group">
                <button
                  onClick={() => setViewerImage(img)}
                  className="w-full h-full text-left relative focus:outline-none focus:ring-2 focus:ring-[#9A8073]/50 rounded-2xl overflow-hidden"
                >
                  <Image
                    src={img}
                    alt="Creation"
                    fill
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                </button>
                <button onClick={() => handleRemoveCreation(img)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-[#B26959] text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all text-xs font-bold z-10">
                  ×
                </button>
              </div>
            ))}
            {(!user?.creations_gallery || user.creations_gallery.length === 0) && (
              <div className="col-span-full border-2 border-dashed border-[#EBE6E0] rounded-2xl py-16 flex flex-col items-center gap-3 text-[#A8A19A]">
                <ImageIcon size={32} className="opacity-40" />
                <p className="text-sm">No photos uploaded yet.</p>
                <p className="text-xs">Use the &quot;Add Photo&quot; button to showcase your designs.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* === ABOUT TAB === */}
      {activeTab === 'about' && (
        <ProfilePersonalDetails
          email={user?.email || ''}
          personalForm={personalForm}
          setPersonalForm={setPersonalForm}
          onSubmit={handlePersonalSubmit}
          loading={loadingPersonal}
        />
      )}

      <ProfileImageViewer imageUrl={viewerImage} onClose={() => setViewerImage(null)} />
    </div>
  );
}
