'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import SettingsBusinessType from '@/components/settings/SettingsBusinessType';
import SettingsBasicInfo from '@/components/settings/SettingsBasicInfo';
import SettingsOperatingHours from '@/components/settings/SettingsOperatingHours';
import SettingsRentalPolicies, { ShopSettingsData } from '@/components/settings/SettingsRentalPolicies';
import SettingsGalleryAndCouriers from '@/components/settings/SettingsGalleryAndCouriers';

const DEFAULT_HOURS = {
  monday: { is_open: true, open: '09:00', close: '18:00' },
  tuesday: { is_open: true, open: '09:00', close: '18:00' },
  wednesday: { is_open: true, open: '09:00', close: '18:00' },
  thursday: { is_open: true, open: '09:00', close: '18:00' },
  friday: { is_open: true, open: '09:00', close: '18:00' },
  saturday: { is_open: false, open: '09:00', close: '18:00' },
  sunday: { is_open: false, open: '09:00', close: '18:00' },
};

export default function SettingsPage() {
  const { shop, setAuth, user, token, staffProfile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [formData, setFormData] = useState<ShopSettingsData>({
    name: '',
    description: '',
    address: '',
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

  useEffect(() => {
    if (shop) {
      api
        .get(`/shops/${shop.id}`)
        .then(res => {
          const s = res.data.data;
          setFormData({
            name: s.name || '',
            description: s.description || '',
            address: s.address || '',
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
            security_deposit:
              s.security_deposit !== undefined && s.security_deposit !== null ? s.security_deposit : 0,
            rental_duration_days:
              s.rental_duration_days !== undefined && s.rental_duration_days !== null
                ? s.rental_duration_days
                : 3,
            overdue_penalty_per_day:
              s.overdue_penalty_per_day !== undefined && s.overdue_penalty_per_day !== null
                ? s.overdue_penalty_per_day
                : 0,
            fitting_fee: s.fitting_fee !== undefined && s.fitting_fee !== null ? s.fitting_fee : 0,
            fitting_limit: s.fitting_limit !== undefined && s.fitting_limit !== null ? s.fitting_limit : 3,
            reschedule_fee_percent:
              s.reschedule_fee_percent !== undefined && s.reschedule_fee_percent !== null
                ? s.reschedule_fee_percent
                : 0,
            change_reserved_hours:
              s.change_reserved_hours !== undefined && s.change_reserved_hours !== null
                ? s.change_reserved_hours
                : 24,
            change_reserved_fee_percent:
              s.change_reserved_fee_percent !== undefined && s.change_reserved_fee_percent !== null
                ? s.change_reserved_fee_percent
                : 0,
            supported_couriers: Array.isArray(s.supported_couriers) ? s.supported_couriers : [],
          });
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user && !shop) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBusinessTypeChange = (value: string) => {
    setFormData({ ...formData, business_type: value });
  };

  const handleSocialChange = (platform: string, value: string) => {
    setFormData({
      ...formData,
      social_links: {
        ...formData.social_links,
        [platform]: value,
      },
    });
  };

  const handleHoursChange = (day: string, field: 'is_open' | 'open' | 'close', value: string | boolean) => {
    setFormData({
      ...formData,
      operating_hours: {
        ...formData.operating_hours,
        [day]: {
          ...formData.operating_hours[day],
          [field]: value,
        },
      },
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && shop) {
      const file = e.target.files[0];
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await api.post(`/shops/${shop.id}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFormData({
          ...formData,
          gallery_images: [...formData.gallery_images, res.data.data.url],
        });
      } catch (err) {
        console.error('Upload failed', err);
        alert('Failed to upload image.');
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormData({
      ...formData,
      gallery_images: formData.gallery_images.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const handleSave = async () => {
    if (!shop) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await api.put(`/shops/${shop.id}`, formData);
      setSuccessMsg('Shop settings updated successfully.');
      if (user && token) {
        setAuth(user, token, res.data.data, staffProfile || undefined);
      }
    } catch (err) {
      console.error('Failed to update shop', err);
    } finally {
      setSaving(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  if (loading) {
    return <div className="text-[#A8A19A] py-12 text-center animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div>
        <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Shop Settings</h1>
        <p className="text-[#827A73] text-sm mt-1">
          Manage your shop&apos;s identity, business type, and public profile.
        </p>
      </div>

      <SettingsBusinessType businessType={formData.business_type} onChange={handleBusinessTypeChange} />

      <SettingsBasicInfo formData={formData} onChange={handleChange} />

      {/* Rental & Store Policies Card (Visible for Fashion Designers and Hybrids) */}
      {(formData.business_type === 'fashion_designer' || formData.business_type === 'hybrid') && (
        <SettingsRentalPolicies formData={formData} setFormData={setFormData} />
      )}

      <SettingsOperatingHours operatingHours={formData.operating_hours} onHoursChange={handleHoursChange} />

      <SettingsGalleryAndCouriers
        formData={formData}
        setFormData={setFormData}
        handleSocialChange={handleSocialChange}
        handleImageUpload={handleImageUpload}
        handleRemoveImage={handleRemoveImage}
        handleSave={handleSave}
        saving={saving}
        successMsg={successMsg}
      />
    </div>
  );
}
