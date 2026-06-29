import { useState, useEffect, useRef, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { Specialization, BLANK_FORM } from '@/components/specializations/specializationHelpers';
import { ShopSettingsData } from '@/components/settings/SettingsRentalPolicies';

const DEFAULT_HOURS = {
  monday: { is_open: true, open: '09:00', close: '18:00' },
  tuesday: { is_open: true, open: '09:00', close: '18:00' },
  wednesday: { is_open: true, open: '09:00', close: '18:00' },
  thursday: { is_open: true, open: '09:00', close: '18:00' },
  friday: { is_open: true, open: '09:00', close: '18:00' },
  saturday: { is_open: false, open: '09:00', close: '18:00' },
  sunday: { is_open: false, open: '09:00', close: '18:00' },
};

export type SettingsTab = 'identity' | 'hours' | 'policies' | 'gallery' | 'specializations';

export function useSettings() {
  const { shop, setAuth, user, token, staffProfile } = useAuthStore();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('identity');

  const savedDataRef = useRef<ShopSettingsData | null>(null);

  // Specialization state
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [specSearch, setSpecSearch] = useState('');
  const [specModalOpen, setSpecModalOpen] = useState(false);
  const [specDeleteModalOpen, setSpecDeleteModalOpen] = useState(false);
  const [editingSpecId, setEditingSpecId] = useState<number | null>(null);
  const [deletingSpecId, setDeletingSpecId] = useState<number | null>(null);
  const [specSubmitting, setSpecSubmitting] = useState(false);
  const [specError, setSpecError] = useState('');
  const [specFormData, setSpecFormData] = useState({ ...BLANK_FORM });

  const fetchSpecializations = useCallback(() => {
    if (!shop) return;
    api.get(`/shops/${shop.id}/specializations`)
      .then(res => setSpecializations(res.data.data || []))
      .catch(console.error);
  }, [shop]);

  useEffect(() => {
    if (activeTab === 'specializations') fetchSpecializations();
  }, [activeTab, fetchSpecializations]);

  const handleSpecSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!shop) return;
    setSpecSubmitting(true);
    setSpecError('');
    try {
      if (editingSpecId) {
        const res = await api.put(`/shops/${shop.id}/specializations/${editingSpecId}`, specFormData);
        setSpecializations(prev => prev.map(s => s.id === editingSpecId ? res.data.data : s));
      } else {
        const res = await api.post(`/shops/${shop.id}/specializations`, specFormData);
        setSpecializations(prev => [res.data.data, ...prev]);
      }
      closeSpecModal();
      toast.success(editingSpecId ? 'Specialization updated!' : 'Specialization added!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setSpecError(error.response?.data?.message || 'Failed to save specialization');
    } finally {
      setSpecSubmitting(false);
    }
  };

  const confirmSpecDelete = async () => {
    if (!shop || !deletingSpecId) return;
    setSpecSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/specializations/${deletingSpecId}`);
      setSpecializations(prev => prev.filter(s => s.id !== deletingSpecId));
      setSpecDeleteModalOpen(false);
      toast.success('Specialization removed.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete specialization');
    } finally {
      setSpecSubmitting(false);
    }
  };

  const closeSpecModal = () => {
    setSpecModalOpen(false);
    setEditingSpecId(null);
    setSpecFormData({ ...BLANK_FORM });
    setSpecError('');
  };

  const [formData, setFormData] = useState<ShopSettingsData>({
    name: '',
    description: '',
    address: '',
    landmark: '',
    city: '',
    province: '',
    phone: '',
    email: '',
    booking_policy: '',
    booking_questions: [] as string[],
    latitude: '',
    longitude: '',
    social_links: {
      facebook: '',
      instagram: '',
      tiktok: '',
      youtube: '',
      website: '',
    },
    gallery_images: [] as string[],
    business_type: 'tailoring_shop',
    operating_hours: DEFAULT_HOURS as Record<string, { is_open: boolean; open: string; close: string }>,
    security_deposit: 0,
    rental_duration_days: 3,
    overdue_penalty_per_day: 0,
    fitting_fee: 0,
    fitting_limit: 3,
    reschedule_fee_percent: 0,
    change_reserved_hours: 24,
    change_reserved_fee_percent: 0,
    supported_couriers: [] as string[],
  });

  const setFormDataWithDirty = (valueOrUpdater: ShopSettingsData | ((prev: ShopSettingsData) => ShopSettingsData)) => {
    if (typeof valueOrUpdater === 'function') {
      setFormData(prev => {
        const next = valueOrUpdater(prev);
        setIsDirty(true);
        return next;
      });
    } else {
      setFormData(valueOrUpdater);
      setIsDirty(true);
    }
  };

  useEffect(() => {
    if (shop) {
      api
        .get(`/shops/${shop.id}`)
        .then(res => {
          const s = res.data.data;
          const loaded: ShopSettingsData = {
            name: s.name || '',
            description: s.description || '',
            address: s.address || '',
            landmark: s.landmark || '',
            city: s.city || '',
            province: s.province || '',
            phone: s.phone || '',
            email: s.email || '',
            booking_policy: s.booking_policy || '',
            booking_questions: Array.isArray(s.booking_questions) ? s.booking_questions : [],
            latitude: s.latitude || '',
            longitude: s.longitude || '',
            social_links: s.social_links || { facebook: '', instagram: '', tiktok: '', youtube: '', website: '' },
            gallery_images: Array.isArray(s.gallery_images) ? s.gallery_images : [],
            business_type: s.business_type || 'tailoring_shop',
            operating_hours: s.operating_hours || DEFAULT_HOURS,
            security_deposit: s.security_deposit ?? 0,
            rental_duration_days: s.rental_duration_days ?? 3,
            overdue_penalty_per_day: s.overdue_penalty_per_day ?? 0,
            fitting_fee: s.fitting_fee ?? 0,
            fitting_limit: s.fitting_limit ?? 3,
            reschedule_fee_percent: s.reschedule_fee_percent ?? 0,
            change_reserved_hours: s.change_reserved_hours ?? 24,
            change_reserved_fee_percent: s.change_reserved_fee_percent ?? 0,
            supported_couriers: Array.isArray(s.supported_couriers) ? s.supported_couriers : [],
          };
          setFormData(loaded);
          savedDataRef.current = loaded;
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          toast.error('Failed to load shop settings.');
          setLoading(false);
        });
    } else if (user && !shop) {
      setTimeout(() => setLoading(false), 0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormDataWithDirty(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBusinessTypeChange = (value: string) => {
    setFormDataWithDirty(prev => ({ ...prev, business_type: value }));
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormDataWithDirty(prev => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: value },
    }));
  };

  const handleHoursChange = (day: string, field: 'is_open' | 'open' | 'close', value: string | boolean) => {
    setFormDataWithDirty(prev => ({
      ...prev,
      operating_hours: {
        ...prev.operating_hours,
        [day]: { ...prev.operating_hours[day], [field]: value },
      },
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0] && shop) {
      const file = e.target.files[0];
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await api.post(`/shops/${shop.id}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFormDataWithDirty(prev => ({
          ...prev,
          gallery_images: [...prev.gallery_images, res.data.data.url],
        }));
        toast.success('Image uploaded successfully.');
      } catch {
        toast.error('Failed to upload image. Please try again.');
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormDataWithDirty(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, idx) => idx !== indexToRemove),
    }));
  };

  const handleSave = async () => {
    if (!shop) return;
    setSaving(true);
    try {
      const res = await api.put(`/shops/${shop.id}`, formData);
      savedDataRef.current = formData;
      setIsDirty(false);
      toast.success('Shop settings saved successfully.');
      if (user && token) {
        setAuth(user, token, res.data.data, staffProfile || undefined);
      }
    } catch {
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (savedDataRef.current) {
      setFormData(savedDataRef.current);
      setIsDirty(false);
    }
  };

  return {
    shop,
    loading,
    saving,
    isDirty,
    activeTab,
    setActiveTab,
    specializations,
    specSearch,
    setSpecSearch,
    specModalOpen,
    setSpecModalOpen,
    specDeleteModalOpen,
    setSpecDeleteModalOpen,
    editingSpecId,
    setEditingSpecId,
    deletingSpecId,
    setDeletingSpecId,
    specSubmitting,
    specError,
    specFormData,
    setSpecFormData,
    formData,
    setFormDataWithDirty,
    handleChange,
    handleBusinessTypeChange,
    handleSocialChange,
    handleHoursChange,
    handleImageUpload,
    handleRemoveImage,
    handleSave,
    handleDiscard,
    closeSpecModal,
    confirmSpecDelete,
    handleSpecSubmit,
  };
}
