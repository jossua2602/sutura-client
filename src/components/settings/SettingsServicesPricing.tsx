'use client';

import React, { useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { Sparkles, Scissors, Shirt, Palette, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SettingsServicesPricing() {
  const { shop } = useAuthStore();
  const toast = useToast();
  const [industryType, setIndustryType] = useState<'Tailoring' | 'Sublimation' | 'Fashion' | 'Hybrid'>('Tailoring');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const options = [
    {
      id: 'Tailoring' as const,
      name: 'Tailoring Shop',
      desc: 'Bespoke tailoring, waist/hem alterations, suits & blazers, and embroidery detailing',
      icon: Scissors,
      sectors: ['Custom Tailoring & Bespoke', 'Alterations & Repairs', 'Embroidery & Detailing'],
      emoji: '🧵',
    },
    {
      id: 'Sublimation' as const,
      name: 'Sublimation & Print',
      desc: 'Sports jerseys, sublimated apparel, lanyards, custom mugs, banners, and layout designs',
      icon: Shirt,
      sectors: ['Sublimation & Digital Printing', 'Non-Apparel Sublimation & Merch', 'Commercial & Large Format Printing', 'Digital & Design Services'],
      emoji: '👕',
    },
    {
      id: 'Fashion' as const,
      name: 'Fashion Designer',
      desc: 'Bespoke gowns, Filipiniana dresses, pattern designs, and events package styling',
      icon: Palette,
      sectors: ['Fashion & Designer Services', 'Custom Tailoring & Bespoke', 'Embroidery & Detailing'],
      emoji: '👗',
    },
    {
      id: 'Hybrid' as const,
      name: 'Hybrid / Production Hub',
      desc: 'Complete hybrid hub managing digital mockups, large format signs, couture, and high-volume alterations',
      icon: Layers,
      sectors: [
        'Custom Tailoring & Bespoke',
        'Alterations & Repairs',
        'Sublimation & Digital Printing',
        'Fashion & Designer Services',
        'Embroidery & Detailing',
        'Non-Apparel Sublimation & Merch',
        'Commercial & Large Format Printing',
        'Digital & Design Services'
      ],
      emoji: '✨',
    },
  ];

  const handlePopulate = async () => {
    if (!shop) return;
    setLoading(true);
    setSuccess(false);
    try {
      await api.post(`/shops/${shop.id}/services/populate`, {
        industry_type: industryType,
      });
      setSuccess(true);
      toast.success(`Successfully populated default ${industryType} services!`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to populate default services catalog.');
    } finally {
      setLoading(false);
    }
  };

  const selectedOpt = options.find(o => o.id === industryType);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Introduction Card */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 space-y-4">
        <div>
          <h2 className="text-lg font-medium text-[#2D2A26] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-taupe animate-pulse" />
            Auto-Populate Services Catalog
          </h2>
          <p className="text-sm text-[#827A73] mt-1.5 leading-relaxed">
            Quickly bootstrap your shop catalog by choosing your business industry model.
            SUTURA will auto-populate default services with recommended pricing, categories, and estimated turnaround times.
          </p>
        </div>

        {/* Industry Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          {options.map(opt => {
            const Icon = opt.icon;
            const isSelected = industryType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setIndustryType(opt.id);
                  setSuccess(false);
                }}
                className={`text-left p-5 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-taupe bg-[#FAF6F3] shadow-sm'
                    : 'border-[#EBE6E0] hover:border-[#D1C7BD] bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-2xl">{opt.emoji}</span>
                  <div className="font-semibold text-[#2D2A26] text-sm">{opt.name}</div>
                </div>
                <div className="text-xs text-[#A8A19A] leading-snug mb-3">{opt.desc}</div>
                <div className="flex flex-wrap gap-1">
                  {opt.sectors.map(sec => (
                    <span key={sec} className="text-[9px] font-semibold bg-[#F0EAE3] text-[#827A73] px-1.5 py-0.5 rounded uppercase">
                      {sec}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Details & Action Card */}
      {selectedOpt && (
        <div className="bg-[#FAF6F3]/50 border border-[#EBE6E0]/60 rounded-2xl p-6 space-y-5">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-taupe shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-[#524A44]">
                Confirm Seeding {selectedOpt.name} Default Services
              </h3>
              <p className="text-xs text-[#827A73] mt-1 leading-relaxed">
                This will automatically add default catalog items matching these categories: 
                <strong className="text-[#524A44]"> {selectedOpt.sectors.join(', ')}</strong>. 
                Any custom services you previously created will remain unaffected.
              </p>
            </div>
          </div>

          {success && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-4 rounded-xl flex items-start gap-2.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block mb-0.5">Catalog Populated Successfully!</span>
                Go check your <a href="/dashboard/services" className="underline font-semibold hover:text-emerald-950">Services Catalog page</a> to see and customize the newly added items.
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handlePopulate}
              disabled={loading}
              className="bg-taupe hover:bg-taupe/90 text-white font-semibold text-sm px-6 py-2.5 rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Populating Catalog...
                </>
              ) : (
                'Populate Default Services'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
