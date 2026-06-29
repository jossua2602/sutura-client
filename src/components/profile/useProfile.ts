'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuthStore, User } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';

export type Tab = 'overview' | 'about' | 'photos';

export interface ProfileStats {
  totalJobs: number;
  totalCustomers: number;
  totalStaff: number;
  totalServices: number;
  totalCatalog: number;
  avgRating: number | null;
  totalReviews: number;
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
  images?: string[];
  price?: number;
}

export interface ServiceItem {
  id: number;
  name: string;
  price?: number;
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

export interface PersonalForm {
  name: string;
  phone: string;
  bio: string;
  skills: string[];
  social_links: {
    instagram: string;
    youtube: string;
    website: string;
  };
  experience: ExperienceItem[];
  education: EducationItem[];
}

export function useProfile() {
  const { user, shop, setAuth, token, staffProfile } = useAuthStore();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  const getInitialForm = (u: User | null): PersonalForm => ({
    name: u?.name || '',
    phone: u?.phone || '',
    bio: u?.bio || '',
    skills: u?.skills || [],
    social_links: {
      instagram: u?.social_links?.instagram || '',
      youtube: u?.social_links?.youtube || '',
      website: u?.social_links?.website || '',
    },
    experience: (u?.experience || []).map(exp => ({
      title: exp.title || '',
      company: exp.company || '',
      duration: exp.duration || '',
      description: '',
    })),
    education: (u?.education || []).map(edu => ({
      school: edu.school || '',
      degree: edu.degree || '',
      year: edu.year || '',
    })),
  });

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

  // Load stats, reviews, catalog, services
  useEffect(() => {
    if (!shop?.id) return;
    Promise.allSettled([
      api.get(`/shops/${shop.id}/analytics`),
      api.get(`/shops/${shop.id}/reviews?per_page=3`),
      api.get(`/shops/${shop.id}/catalog?per_page=4`),
      api.get(`/shops/${shop.id}/services?per_page=6`),
      api.get(`/shops/${shop.id}/staff`),
    ]).then(([analyticsRes, reviewsRes, catalogRes, servicesRes]) => {
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
        });
      }
      if (reviewsRes.status === 'fulfilled') {
        const rv = reviewsRes.value.data.data;
        setRecentReviews(Array.isArray(rv) ? rv.slice(0, 3) : (rv?.data || []).slice(0, 3));
      }
      if (catalogRes.status === 'fulfilled') {
        const ct = catalogRes.value.data.data;
        setCatalogItems(Array.isArray(ct) ? ct.slice(0, 4) : (ct?.data || []).slice(0, 4));
      }
      if (servicesRes.status === 'fulfilled') {
        const sv = servicesRes.value.data.data;
        setServices(Array.isArray(sv) ? sv.slice(0, 6) : (sv?.data || []).slice(0, 6));
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

  const handleCreationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', 'creation');
    setUploadingCreation(true);
    try {
      const uploadRes = await api.post('/profile/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const uploadedUrl = uploadRes.data.url;
      const updatedGallery = [...(user?.creations_gallery || []), uploadedUrl];
      const res = await api.put('/profile/personal', { ...personalForm, creations_gallery: updatedGallery });
      if (token) setAuth(res.data.data, token, shop ?? undefined, staffProfile || undefined);
      toast.success('Photo added to your gallery.');
    } catch {
      toast.error('Failed to upload photo.');
    } finally {
      setUploadingCreation(false);
    }
  };

  const handleRemoveCreation = async (urlToRemove: string) => {
    try {
      const updatedGallery = (user?.creations_gallery || []).filter((url: string) => url !== urlToRemove);
      const res = await api.put('/profile/personal', { ...personalForm, creations_gallery: updatedGallery });
      if (token) setAuth(res.data.data, token, shop ?? undefined, staffProfile || undefined);
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
  };
}
