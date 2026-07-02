'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuthStore, User } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';

export type Tab = 'all' | 'about' | 'gallery' | 'appointments' | 'catalog' | 'services' | 'reviews' | 'hours';

export interface ProfileStats {
  totalJobs: number;
  totalCustomers: number;
  totalStaff: number;
  totalServices: number;
  totalCatalog: number;
  avgRating: number | null;
  totalReviews: number;
  totalAppointments?: number;
  totalBranches?: number;
}

export interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user: { name: string };
}

export interface CatalogItem {
  id: number;
  name: string;
  images?: { id: number; image_url: string; is_primary: boolean }[];
  price?: number;
}

export interface ServiceItem {
  id: number;
  name: string;
  price?: number;
  base_price?: string | number;
  estimated_days?: number;
  description?: string;
  category?: string;
  image_url?: string | null;
}

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
}

export interface EducationItem {
  school: string;
  degree: string;
  year: string;
}

export interface SpecialHour {
  id?: number;
  date: string;
  is_closed: boolean;
  open: string;
  close: string;
  note?: string;
}

export interface PersonalForm {
  name: string;
  phone: string;
  bio: string;
  skills: string[];
  social_links: { label: string; url: string }[];
  experience: ExperienceItem[];
  education: EducationItem[];
}

export interface ProfileSubscription {
  plan_id: number;
  plan: {
    id: number;
    name: string;
    slug: string;
  };
  status: string;
  ends_at: string;
}

export function useProfile() {
  const { user, shop, setAuth, token, staffProfile, logout } = useAuthStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [subscription, setSubscription] = useState<ProfileSubscription | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [specializations, setSpecializations] = useState<Record<string, unknown>[]>([]);
  const [specialHours, setSpecialHours] = useState<SpecialHour[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const getInitialForm = (u: User | null): PersonalForm => {
    let parsedSocialLinks: { label: string; url: string }[] = [];
    if (Array.isArray(u?.social_links)) {
      parsedSocialLinks = u.social_links;
    } else if (u?.social_links && typeof u.social_links === 'object') {
      parsedSocialLinks = Object.entries(u.social_links).map(([k, v]) => ({
        label: k.charAt(0).toUpperCase() + k.slice(1),
        url: v as string
      }));
    }

    return {
      name: u?.name || '',
      phone: u?.phone || '',
      bio: u?.bio || '',
      skills: u?.skills || [],
      social_links: parsedSocialLinks,
      experience: (u?.experience || []).map(exp => ({
        ...exp,
        description: (exp as ExperienceItem).description || '',
        id: crypto.randomUUID()
      })),
      education: (u?.education || []).map(edu => ({
        ...edu,
        id: crypto.randomUUID()
      })),
    };
  };

  const [personalForm, setPersonalForm] = useState<PersonalForm>(getInitialForm(user));

  // Sync state inline during rendering when store user changes
  const [prevUser, setPrevUser] = useState<User | null>(user);
  if (user !== prevUser) {
    setPrevUser(user);
    setPersonalForm(getInitialForm(user));
  }

  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [uploadingCreation, setUploadingCreation] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const [isCoverDropdownOpen, setIsCoverDropdownOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // Load stats, reviews, catalog, services, subscription
  useEffect(() => {
    if (!shop?.id) return;
    Promise.allSettled([
      api.get(`/shops/${shop.id}/analytics`),
      api.get(`/shops/${shop.id}/reviews?per_page=3`),
      api.get(`/shops/${shop.id}/catalog?per_page=12`),
      api.get(`/shops/${shop.id}/services?per_page=6`),
      api.get(`/shops/${shop.id}/staff`),
      api.get(`/shops/${shop.id}/subscription`),
      api.get(`/shops/${shop.id}/specializations`),
      api.get(`/shops/${shop.id}/special-hours`),
    ]).then(([analyticsRes, reviewsRes, catalogRes, servicesRes, , subRes, specsRes, specialHoursRes]) => {
      if (analyticsRes.status === 'fulfilled') {
        const d = analyticsRes.value.data.data;
        setStats({
          totalJobs: d?.total_jobs || 0,
          totalCustomers: d?.total_customers || 0,
          totalStaff: d?.total_staff || 0,
          totalServices: d?.total_services || 0,
          totalCatalog: d?.total_collections || 0,
          avgRating: d?.avg_rating ?? null,
          totalReviews: d?.total_reviews || 0,
          totalAppointments: d?.total_appointments || 0,
          totalBranches: d?.total_branches || 0,
        });
      }
      if (reviewsRes.status === 'fulfilled') {
        const rv = reviewsRes.value.data.data;
        setRecentReviews(Array.isArray(rv) ? rv.slice(0, 3) : (rv?.data || []).slice(0, 3));
      }
      if (catalogRes.status === 'fulfilled') {
        const ct = catalogRes.value.data.data;
        setCatalogItems(Array.isArray(ct) ? ct : (ct?.data || []));
      }
      if (servicesRes.status === 'fulfilled') {
        const sv = servicesRes.value.data.data;
        setServices(Array.isArray(sv) ? sv : (sv?.data || []));
      }
      if (subRes?.status === 'fulfilled') {
        setSubscription(subRes.value.data.data);
      }
      if (specsRes?.status === 'fulfilled') {
        setSpecializations(specsRes.value.data.data || []);
      }
      if (specialHoursRes?.status === 'fulfilled') {
        setSpecialHours(specialHoursRes.value.data.data || []);
      }
      setLoadingStats(false);
    });
  }, [shop?.id]);

  const handlePersonalSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoadingPersonal(true);
    try {
      const res = await api.put('/profile/personal', {
        ...personalForm,
        creations_gallery: user?.creations_gallery || [],
      });
      toast.success('Profile updated successfully.');
      if (token) setAuth(res.data.data, token, shop ?? undefined, staffProfile || undefined);
    } catch {
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoadingPersonal(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    try {
      const res = await api.post('/profile/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (token) setAuth(res.data.data, token, shop ?? undefined, staffProfile || undefined);
      toast.success(`${type === 'avatar' ? 'Profile photo' : 'Cover photo'} updated.`);
    } catch {
      toast.error('Failed to upload image. Please try again.');
    }
  };

  const [shopGallery, setShopGallery] = useState<string[]>([]);
  const [fetchingGallery, setFetchingGallery] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchGallery = async () => {
      setFetchingGallery(true);
      try {
        const res = await api.get('/shop/settings');
        if (!ignore) setShopGallery(res.data.data?.gallery_images || []);
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setFetchingGallery(false);
      }
    };

    if (shop?.id) {
      fetchGallery();
    }
    return () => { ignore = true; };
  }, [shop?.id]);

  const handleCreationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'gallery');
    setUploadingCreation(true);
    try {
      const uploadRes = await api.post('/shop/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const uploadedUrl = uploadRes.data.url;
      const updatedGallery = [...shopGallery, uploadedUrl];
      await api.put('/shop/settings', { gallery_images: updatedGallery });
      setShopGallery(updatedGallery);
      toast.success('Photo added to your gallery.');
    } catch {
      toast.error('Failed to upload photo.');
    } finally {
      setUploadingCreation(false);
    }
  };

  const handleRemoveCreation = async (urlToRemove: string) => {
    try {
      const updatedGallery = shopGallery.filter((url: string) => url !== urlToRemove);
      await api.put('/shop/settings', { gallery_images: updatedGallery });
      setShopGallery(updatedGallery);
      toast.success('Photo removed.');
    } catch {
      toast.error('Failed to remove photo.');
    }
  };

  return {
    user,
    shop,
    activeTab,
    setActiveTab,
    stats,
    subscription,
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
    logout,
    specializations,
    shopGallery,
    fetchingGallery,
    specialHours,
  };
}
