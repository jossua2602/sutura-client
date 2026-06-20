'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, Save, Plus, X, Image as ImageIcon, Clock } from 'lucide-react';
import SubscriptionGate from '@/components/SubscriptionGate';

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

  const [formData, setFormData] = useState({
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
      api.get(`/shops/${shop.id}`)
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
            social_links: s.social_links || { facebook: '', instagram: '', tiktok: '' },
            gallery_images: Array.isArray(s.gallery_images) ? s.gallery_images : [],
            business_type: s.business_type || 'tailoring_shop',
            operating_hours: s.operating_hours || DEFAULT_HOURS,
            security_deposit: s.security_deposit !== undefined && s.security_deposit !== null ? s.security_deposit : 0,
            rental_duration_days: s.rental_duration_days !== undefined && s.rental_duration_days !== null ? s.rental_duration_days : 3,
            overdue_penalty_per_day: s.overdue_penalty_per_day !== undefined && s.overdue_penalty_per_day !== null ? s.overdue_penalty_per_day : 0,
            fitting_fee: s.fitting_fee !== undefined && s.fitting_fee !== null ? s.fitting_fee : 0,
            fitting_limit: s.fitting_limit !== undefined && s.fitting_limit !== null ? s.fitting_limit : 3,
            reschedule_fee_percent: s.reschedule_fee_percent !== undefined && s.reschedule_fee_percent !== null ? s.reschedule_fee_percent : 0,
            change_reserved_hours: s.change_reserved_hours !== undefined && s.change_reserved_hours !== null ? s.change_reserved_hours : 24,
            change_reserved_fee_percent: s.change_reserved_fee_percent !== undefined && s.change_reserved_fee_percent !== null ? s.change_reserved_fee_percent : 0,
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

  const handleSocialChange = (platform: string, value: string) => {
    setFormData({
      ...formData,
      social_links: {
        ...formData.social_links,
        [platform]: value,
      }
    });
  };

  const handleHoursChange = (day: string, field: 'is_open' | 'open' | 'close', value: string | boolean) => {
    setFormData({
      ...formData,
      operating_hours: {
        ...formData.operating_hours,
        [day]: {
          ...formData.operating_hours[day],
          [field]: value
        }
      }
    });
  };

  const handleCourierToggle = (courier: string) => {
    const list = formData.supported_couriers || [];
    if (list.includes(courier)) {
      setFormData({
        ...formData,
        supported_couriers: list.filter(c => c !== courier)
      });
    } else {
      setFormData({
        ...formData,
        supported_couriers: [...list, courier]
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && shop) {
      const file = e.target.files[0];
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await api.post(`/shops/${shop.id}/upload`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setFormData({
          ...formData,
          gallery_images: [...formData.gallery_images, res.data.data.url]
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
      gallery_images: formData.gallery_images.filter((_, idx) => idx !== indexToRemove)
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
        <p className="text-[#827A73] text-sm mt-1">Manage your shop&apos;s identity, business type, and public profile.</p>
      </div>

      {/* Business Type Card */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-2">Business Type</h2>
        <p className="text-sm text-[#827A73] mb-5">Select the type that best describes your business. This controls which features are highlighted on your public profile.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {([
            { value: 'tailoring_shop',    label: 'Tailoring Shop',       desc: 'Custom measurements, job orders & production tracking',     emoji: '🧵' },
            { value: 'fashion_designer',  label: 'Fashion Designer',     desc: 'Portfolio showcase, catalog of original designs & commissions', emoji: '👗' },
            { value: 'hybrid',            label: 'Hybrid',               desc: 'Both tailoring services and original fashion designs',        emoji: '✨' },
          ] as { value: string; label: string; desc: string; emoji: string }[]).map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFormData({ ...formData, business_type: opt.value })}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                formData.business_type === opt.value
                  ? 'border-[#9A8073] bg-[#FAF6F3] shadow-sm'
                  : 'border-[#EBE6E0] hover:border-[#D1C7BD] bg-white'
              }`}
            >
              <div className="text-2xl mb-2">{opt.emoji}</div>
              <div className="font-semibold text-[#2D2A26] text-sm mb-1">{opt.label}</div>
              <div className="text-xs text-[#A8A19A] leading-snug">{opt.desc}</div>
              {formData.business_type === opt.value && (
                <div className="mt-2 text-xs font-medium text-[#9A8073]">✓ Selected</div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-6">Basic Info & Contact</h2>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Shop Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Contact Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">City</label>
              <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Province</label>
              <input type="text" name="province" value={formData.province} onChange={handleChange} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Contact Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-[#2D2A26]">Map Coordinates</h2>
          <p className="text-sm text-[#827A73] mt-1">
            Required for your shop to appear on the customer map discovery interface. 
            Right-click your location on Google Maps to copy the Latitude and Longitude.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">Latitude (e.g. 7.1907)</label>
            <input type="text" name="latitude" value={formData.latitude} onChange={handleChange} placeholder="7.1907" className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">Longitude (e.g. 125.4553)</label>
            <input type="text" name="longitude" value={formData.longitude} onChange={handleChange} placeholder="125.4553" className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe" />
          </div>
        </div>
      </div>

      {/* Rental & Store Policies Card (Visible for Fashion Designers and Hybrids) */}
      {(formData.business_type === 'fashion_designer' || formData.business_type === 'hybrid') && (
        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 transition-all duration-300">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-[#2D2A26] flex items-center gap-2">
              <span className="text-xl">👗</span>
              Rental & Store Policies
            </h2>
            <p className="text-sm text-[#827A73] mt-1">
              Configure rental rules, fees, limits, and shipping options for customers renting gowns, barongs, or other items.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Security Deposit (₱)</label>
              <input 
                type="number" 
                name="security_deposit" 
                value={formData.security_deposit} 
                onChange={(e) => setFormData({ ...formData, security_deposit: parseFloat(e.target.value) || 0 })} 
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" 
              />
              <p className="text-[11px] text-[#827A73]">Refunded to renter once the item is returned on time in good condition.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Max Rental Duration (Days)</label>
              <input 
                type="number" 
                name="rental_duration_days" 
                value={formData.rental_duration_days} 
                onChange={(e) => setFormData({ ...formData, rental_duration_days: parseInt(e.target.value) || 0 })} 
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" 
              />
              <p className="text-[11px] text-[#827A73]">Standard rental window (e.g. 3 days).</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Overdue Return Penalty (₱ / Day)</label>
              <input 
                type="number" 
                name="overdue_penalty_per_day" 
                value={formData.overdue_penalty_per_day} 
                onChange={(e) => setFormData({ ...formData, overdue_penalty_per_day: parseFloat(e.target.value) || 0 })} 
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" 
              />
              <p className="text-[11px] text-[#827A73]">Deducted from security deposit for late returns.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Fitting Session Fee (₱)</label>
              <input 
                type="number" 
                name="fitting_fee" 
                value={formData.fitting_fee} 
                onChange={(e) => setFormData({ ...formData, fitting_fee: parseFloat(e.target.value) || 0 })} 
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" 
              />
              <p className="text-[11px] text-[#827A73]">Charged if no rental is booked after fitting session. Put 0 if free.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Max Items to Fit per Session</label>
              <input 
                type="number" 
                name="fitting_limit" 
                value={formData.fitting_limit} 
                onChange={(e) => setFormData({ ...formData, fitting_limit: parseInt(e.target.value) || 0 })} 
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" 
              />
              <p className="text-[11px] text-[#827A73]">Maximum number of garments a client can try on per booking.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Rescheduling Fee (%)</label>
              <input 
                type="number" 
                name="reschedule_fee_percent" 
                value={formData.reschedule_fee_percent} 
                onChange={(e) => setFormData({ ...formData, reschedule_fee_percent: parseInt(e.target.value) || 0 })} 
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" 
              />
              <p className="text-[11px] text-[#827A73]">Percentage penalty fee of total rental price for rescheduling.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Change Reserved Item Window (Hours)</label>
              <input 
                type="number" 
                name="change_reserved_hours" 
                value={formData.change_reserved_hours} 
                onChange={(e) => setFormData({ ...formData, change_reserved_hours: parseInt(e.target.value) || 0 })} 
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" 
              />
              <p className="text-[11px] text-[#827A73]">Hours allowed to change the selected gown/barong free of charge.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-[#524A44]">Late Change Charge (%)</label>
              <input 
                type="number" 
                name="change_reserved_fee_percent" 
                value={formData.change_reserved_fee_percent} 
                onChange={(e) => setFormData({ ...formData, change_reserved_fee_percent: parseInt(e.target.value) || 0 })} 
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-[#9A8073]" 
              />
              <p className="text-[11px] text-[#827A73]">Percentage penalty fee of total rental price for changes made after the window.</p>
            </div>
          </div>

          <div className="h-px bg-[#EBE6E0] my-6" />

          {/* Courier Preferences */}
          <div>
            <h3 className="text-sm font-semibold text-[#2D2A26] mb-3">Supported Delivery / Courier Services</h3>
            <p className="text-xs text-[#827A73] mb-4">Select the couriers and shipping options your shop supports. Customers will see these during checkout/order confirmation.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'lalamove', label: '⚡ Lalamove' },
                { id: 'toktok', label: '🛵 Toktok' },
                { id: 'grab', label: '🚗 Grab Express' },
                { id: 'jnt', label: '📦 J&T Express' },
                { id: 'lbc', label: '✈️ LBC Express' },
                { id: 'jrs', label: '📯 JRS Express' },
                { id: 'pickup', label: '🏪 Store Pickup' },
              ].map(courier => {
                const isChecked = (formData.supported_couriers || []).includes(courier.id);
                return (
                  <button
                    key={courier.id}
                    type="button"
                    onClick={() => handleCourierToggle(courier.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                      isChecked
                        ? 'border-[#9A8073] bg-[#FAF6F3] text-[#2D2A26]'
                        : 'border-[#EBE6E0] bg-white text-[#524A44] hover:bg-[#FAF6F3]'
                    }`}
                  >
                    <span>{courier.label}</span>
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                      isChecked ? 'border-[#9A8073] bg-[#9A8073] text-white' : 'border-[#EBE6E0]'
                    }`}>
                      {isChecked ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-6">Social Media Links</h2>
        <p className="text-sm text-[#827A73] mb-6">These links will be displayed on your public shop profile.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">Facebook URL</label>
            <input type="url" value={formData.social_links.facebook || ''} onChange={e => handleSocialChange('facebook', e.target.value)} placeholder="https://facebook.com/yourshop" className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">Instagram URL</label>
            <input type="url" value={formData.social_links.instagram || ''} onChange={e => handleSocialChange('instagram', e.target.value)} placeholder="https://instagram.com/yourshop" className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">TikTok URL</label>
            <input type="url" value={formData.social_links.tiktok || ''} onChange={e => handleSocialChange('tiktok', e.target.value)} placeholder="https://tiktok.com/@yourshop" className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe" />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-[#2D2A26] flex items-center gap-2">
            <Clock size={20} className="text-[#827A73]" />
            Operating Hours
          </h2>
          <p className="text-sm text-[#827A73] mt-1">
            Set the regular hours your shop is open for business. Customers will use this to book appointments.
          </p>
        </div>
        <div className="space-y-3">
          {Object.keys(DEFAULT_HOURS).map(day => (
            <div key={day} className="flex items-center justify-between p-3 rounded-xl border border-[#EBE6E0] bg-[#FAF6F3]">
              <div className="flex items-center gap-4 w-32">
                <input 
                  type="checkbox" 
                  checked={formData.operating_hours[day]?.is_open || false}
                  onChange={e => handleHoursChange(day, 'is_open', e.target.checked)}
                  className="w-4 h-4 text-taupe border-[#EBE6E0] rounded focus:ring-taupe"
                />
                <span className="text-sm font-medium text-[#2D2A26] capitalize">{day}</span>
              </div>
              <div className="flex items-center gap-3 flex-1 justify-end">
                {formData.operating_hours[day]?.is_open ? (
                  <>
                    <input 
                      type="time" 
                      value={formData.operating_hours[day]?.open || '09:00'}
                      onChange={e => handleHoursChange(day, 'open', e.target.value)}
                      className="px-3 py-1.5 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:border-taupe outline-none"
                    />
                    <span className="text-[#A8A19A] text-sm">to</span>
                    <input 
                      type="time" 
                      value={formData.operating_hours[day]?.close || '18:00'}
                      onChange={e => handleHoursChange(day, 'close', e.target.value)}
                      className="px-3 py-1.5 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:border-taupe outline-none"
                    />
                  </>
                ) : (
                  <span className="text-sm text-[#B26959] font-medium px-4 py-1.5 bg-[#B26959]/10 rounded-lg">Closed</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SubscriptionGate feature="portfolio">
        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-[#2D2A26]">Gallery Images</h2>
              <p className="text-sm text-[#827A73]">Post photos of your shop, team, or best work to display on your public profile.</p>
            </div>
            <div>
              <label className="cursor-pointer bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors">
                <Plus size={16} />
                Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
          </div>

          {formData.gallery_images.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-[#EBE6E0] rounded-xl text-center text-[#A8A19A]">
              <ImageIcon size={32} className="mx-auto mb-3 opacity-50" />
              <p>No gallery images uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.gallery_images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-[#EBE6E0]">
                  <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <button 
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 bg-[#B26959]/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#9A5C4F]"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </SubscriptionGate>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-6">Booking Flow Setup</h2>
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">Cancellation Policy & Service Description</label>
            <textarea name="booking_policy" value={formData.booking_policy} onChange={handleChange} rows={4} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#524A44]">Custom Booking Questions</label>
              <button onClick={() => setFormData({...formData, booking_questions: [...formData.booking_questions, '']})} className="text-xs text-taupe hover:text-taupe-hover">+ Add Question</button>
            </div>
            
            {formData.booking_questions.map((q, idx) => (
              <div key={idx} className="flex gap-2">
                <input type="text" value={q} onChange={(e) => {
                    const newQ = [...formData.booking_questions];
                    newQ[idx] = e.target.value;
                    setFormData({...formData, booking_questions: newQ});
                  }} className="flex-1 px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:outline-none focus:border-taupe" />
                <button onClick={() => setFormData({...formData, booking_questions: formData.booking_questions.filter((_, i) => i !== idx)})} className="px-3 py-2 text-[#B26959] bg-[#B26959]/10 hover:bg-[#B26959]/20 rounded-lg transition-colors">Remove</button>
              </div>
            ))}
          </div>
          
          <div className="pt-6 flex items-center justify-between border-t border-[#EBE6E0]">
            <div className="text-[#7A8B76] text-sm font-medium">{successMsg}</div>
            <button onClick={handleSave} disabled={saving} className="bg-taupe hover:bg-taupe/90 text-white px-8 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
              Save All Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
