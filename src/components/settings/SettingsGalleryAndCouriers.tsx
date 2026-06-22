import React from 'react';
import { Plus, X, Image as ImageIcon, Loader2, Save } from 'lucide-react';
import SubscriptionGate from '@/components/SubscriptionGate';
import { ShopSettingsData } from './SettingsRentalPolicies';

interface SettingsGalleryAndCouriersProps {
  formData: ShopSettingsData;
  setFormData: React.Dispatch<React.SetStateAction<ShopSettingsData>>;
  handleSocialChange: (platform: string, value: string) => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleRemoveImage: (indexToRemove: number) => void;
  handleSave: () => void;
  saving: boolean;
  successMsg: string;
}

export default function SettingsGalleryAndCouriers({
  formData,
  setFormData,
  handleSocialChange,
  handleImageUpload,
  handleRemoveImage,
  handleSave,
  saving,
  successMsg,
}: SettingsGalleryAndCouriersProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Social Media Links */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-6">Social Media Links</h2>
        <p className="text-sm text-[#827A73] mb-6">These links will be displayed on your public shop profile.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">Facebook URL</label>
            <input
              type="url"
              value={formData.social_links.facebook || ''}
              onChange={e => handleSocialChange('facebook', e.target.value)}
              placeholder="https://facebook.com/yourshop"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">Instagram URL</label>
            <input
              type="url"
              value={formData.social_links.instagram || ''}
              onChange={e => handleSocialChange('instagram', e.target.value)}
              placeholder="https://instagram.com/yourshop"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">TikTok URL</label>
            <input
              type="url"
              value={formData.social_links.tiktok || ''}
              onChange={e => handleSocialChange('tiktok', e.target.value)}
              placeholder="https://tiktok.com/@yourshop"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">YouTube Channel URL</label>
            <input
              type="url"
              value={formData.social_links.youtube || ''}
              onChange={e => handleSocialChange('youtube', e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">Website / Other URL</label>
            <input
              type="url"
              value={formData.social_links.website || ''}
              onChange={e => handleSocialChange('website', e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe"
            />
          </div>
        </div>
      </div>

      {/* Gallery Images */}
      <SubscriptionGate feature="portfolio">
        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-[#2D2A26]">Gallery Images</h2>
              <p className="text-sm text-[#827A73]">
                Post photos of your shop, team, or best work to display on your public profile.
              </p>
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
              <p className="text-sm">No gallery images uploaded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {formData.gallery_images.map((img, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-[#EBE6E0]">
                  <img
                    src={img}
                    alt={`Gallery ${idx}`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
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

      {/* Booking Flow Setup */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        <h2 className="text-lg font-medium text-[#2D2A26] mb-6">Booking Flow Setup</h2>
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-[#524A44]">
              Cancellation Policy & Service Description
            </label>
            <textarea
              name="booking_policy"
              value={formData.booking_policy}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe text-sm"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-[#524A44]">Custom Booking Questions</label>
              <button
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    booking_questions: [...prev.booking_questions, ''],
                  }))
                }
                className="text-xs text-taupe hover:text-taupe-hover"
              >
                + Add Question
              </button>
            </div>

            {formData.booking_questions.map((q, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  type="text"
                  value={q}
                  onChange={e => {
                    const newQ = [...formData.booking_questions];
                    newQ[idx] = e.target.value;
                    setFormData(prev => ({ ...prev, booking_questions: newQ }));
                  }}
                  className="flex-1 px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:outline-none focus:border-taupe"
                />
                <button
                  onClick={() =>
                    setFormData(prev => ({
                      ...prev,
                      booking_questions: prev.booking_questions.filter((_, i) => i !== idx),
                    }))
                  }
                  className="px-3 py-2 text-[#B26959] bg-[#B26959]/10 hover:bg-[#B26959]/20 rounded-lg transition-colors text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="pt-6 flex items-center justify-between border-t border-[#EBE6E0]">
            <div className="text-[#7A8B76] text-sm font-medium">{successMsg}</div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-taupe hover:bg-taupe/90 text-white px-8 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
              Save All Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
