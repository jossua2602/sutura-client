'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2, Save, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export default function NewCatalogItemPage() {
  const { shop } = useAuthStore();
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    material: '',
    description: '',
    care_instructions: '',
    garment_type: '',
    listing_type: 'made_to_order',
    external_gallery_url: '',
  });

  const [features, setFeatures] = useState<string[]>(['']);
  const [fitGuide, setFitGuide] = useState<string[]>(['']);
  const [images, setImages] = useState<{ url: string; angle: string; is_primary: boolean }[]>([
    { url: '', angle: 'Default', is_primary: true },
  ]);


  const [featuresImage, setFeaturesImage] = useState<string>('');
  const [fitGuideImage, setFitGuideImage] = useState<string>('');
  const [careImage, setCareImage] = useState<string>('');
  const [uploadingSection, setUploadingSection] = useState<'specs' | 'fit' | 'care' | null>(null);

  // Accordion toggle states
  const [accordionOpen, setAccordionOpen] = useState({
    specs: false,
    fit: false,
    care: false,
  });

  const toggleAccordion = (section: 'specs' | 'fit' | 'care') => {
    setAccordionOpen(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSectionUpload = async (file: File | undefined, section: 'specs' | 'fit' | 'care') => {
    if (!file || !shop) return;
    setUploadingSection(section);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/shops/${shop.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data.data.url;
      if (section === 'specs') setFeaturesImage(url);
      else if (section === 'fit') setFitGuideImage(url);
      else if (section === 'care') setCareImage(url);
    } catch (err) {
      console.error(`${section} image upload failed`, err);
      alert('Failed to upload image. File may be too large.');
    } finally {
      setUploadingSection(null);
    }
  };

  const handleSave = async () => {
    if (!shop) return;
    setSaving(true);
    try {
      const filteredFeatures = features.filter(f => f.trim() !== '');
      const filteredFit = fitGuide.filter(f => f.trim() !== '');
      const filteredImages = images.filter(img => img.url.trim() !== '');

      const payload = {
        ...formData,
        price: formData.listing_type === 'portfolio' ? '0' : formData.price,
        features: {
          bullets: filteredFeatures,
          image_url: featuresImage,
        },
        fit_guide: {
          bullets: filteredFit,
          image_url: fitGuideImage,
        },
        care_instructions: JSON.stringify({
          text: formData.care_instructions,
          image_url: careImage,
        }),
        images: filteredImages,
        external_gallery_url: formData.external_gallery_url || null,
      };

      await api.post(`/shops/${shop.id}/catalog`, payload);
      router.push('/dashboard/catalog');
    } catch (err: unknown) {
      console.error(err);
      alert('Failed to save catalog item');
      setSaving(false);
    }
  };

  const isPortfolio = formData.listing_type === 'portfolio';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 text-[#2D2A26]">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/catalog"
          className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#827A73] hover:text-[#2D2A26] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Create Showcase Item</h1>
          <p className="text-[#827A73] text-sm mt-1">Add a new premium garment to your catalog.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details */}
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Basic Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-[#524A44] mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="name"
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Black Ellis Shawl Collar Tuxedo"
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="garment_type" className="block text-sm font-semibold text-[#524A44] mb-1">
                    Garment Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="garment_type"
                    name="garment_type"
                    value={formData.garment_type}
                    onChange={e => setFormData({ ...formData, garment_type: e.target.value })}
                    className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                  >
                    <option value="">Select type...</option>
                    <optgroup label="Formal">
                      <option value="barong">Barong Tagalog</option>
                      <option value="filipiniana">Filipiniana / Baro&apos;t Saya</option>
                      <option value="suit">Suit / Blazer</option>
                      <option value="gown">Gown / Evening Dress</option>
                      <option value="wedding_dress">Wedding Dress</option>
                      <option value="debut_gown">Debut Gown</option>
                    </optgroup>
                    <optgroup label="Casual &amp; Everyday">
                      <option value="dress">Dress / Blouse</option>
                      <option value="polo">Polo / Button-down</option>
                      <option value="skirt">Skirt</option>
                      <option value="pants">Pants / Slacks</option>
                    </optgroup>
                    <optgroup label="Uniforms &amp; Custom">
                      <option value="school_uniform">School Uniform</option>
                      <option value="office_uniform">Office / Company Uniform</option>
                      <option value="police_uniform">Police / Government Uniform</option>
                      <option value="sports_jersey">Sports Jersey</option>
                      <option value="intramural_shirt">Intramural / Event Shirt</option>
                      <option value="custom_tshirt">Custom T-shirt / Dryfit</option>
                    </optgroup>
                    <optgroup label="Other">
                      <option value="costume">Costume / Cosplay</option>
                      <option value="other">Other</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label htmlFor="listing_type" className="block text-sm font-semibold text-[#524A44] mb-1">
                    Listing Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="listing_type"
                    name="listing_type"
                    value={formData.listing_type}
                    onChange={e => setFormData({ ...formData, listing_type: e.target.value })}
                    className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                  >
                    {(shop?.business_type === 'tailoring_shop' || shop?.business_type === 'hybrid') && (
                      <>
                        <option value="made_to_order">Made to Order (Custom)</option>
                        <option value="bulk_order">Bulk / Group Order</option>
                      </>
                    )}
                    {(shop?.business_type === 'fashion_designer' || shop?.business_type === 'hybrid') && (
                      <>
                        <option value="ready_to_wear">Ready to Wear (Premade)</option>
                        <option value="portfolio">Portfolio / Showcase Only</option>
                      </>
                    )}
                    {!shop?.business_type && (
                      <>
                        <option value="made_to_order">Made to Order (Custom)</option>
                        <option value="ready_to_wear">Ready to Wear (Premade)</option>
                        <option value="bulk_order">Bulk / Group Order</option>
                        <option value="portfolio">Portfolio / Showcase Only</option>
                      </>
                    )}
                    {(shop?.business_type === 'fashion_designer' ||
                      shop?.business_type === 'hybrid' ||
                      !shop?.business_type) && (
                      <optgroup label="Rental & Sales">
                        <option value="for_rent">For Rent (Gowns/Barongs)</option>
                        <option value="for_sale">For Sale (Ready-made)</option>
                        <option value="rent_or_sale">For Rent or Sale</option>
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-semibold text-[#524A44] mb-1">
                    Price (PHP) {!isPortfolio && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    id="price"
                    type="number"
                    name="price"
                    value={isPortfolio ? '' : formData.price}
                    onChange={handleChange}
                    disabled={isPortfolio}
                    placeholder={isPortfolio ? 'Showcase Only (Price Hidden)' : 'e.g. 24999'}
                    className={`w-full px-4 py-2 border rounded-lg text-sm transition-all focus:outline-none ${
                      isPortfolio
                        ? 'bg-[#FAF6F3]/50 border-[#EBE6E0] text-[#A8A19A] cursor-not-allowed'
                        : 'bg-[#FAF6F3] border-[#EBE6E0] text-[#2D2A26] focus:border-taupe'
                    }`}
                  />
                </div>
                <div>
                  <label htmlFor="material" className="block text-sm font-semibold text-[#524A44] mb-1">
                    Material (e.g. Fabric Detail)
                  </label>
                  <input
                    id="material"
                    type="text"
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                    placeholder="e.g. 100% Merino Wool"
                    className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-[#524A44] mb-1">
                  Brief Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  name="description"
                  required
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell clients about the craftsmanship, styling, or service options..."
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                />
              </div>

              <div>
                <label htmlFor="external_gallery_url" className="block text-sm font-semibold text-[#524A44] mb-1">
                  External Design Catalog Link (Optional)
                </label>
                <input
                  id="external_gallery_url"
                  type="url"
                  name="external_gallery_url"
                  value={formData.external_gallery_url}
                  onChange={handleChange}
                  placeholder="e.g. https://photos.google.com/share/... or Facebook Album link"
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                />
                <p className="text-[11px] text-[#827A73] mt-1">
                  If you have a Google Photos or Facebook Album containing all designs, paste it here so customers can view it.
                </p>
              </div>
            </div>
          </div>

          {/* ADVANCED DETAILS: Collapsible Accordions */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#827A73] uppercase tracking-wider px-1">
              Advanced Specifications (Optional)
            </h3>

            {/* Accordion 1: Features / Specs */}
            <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('specs')}
                className="w-full flex items-center justify-between p-5 text-left font-medium text-[#2D2A26] hover:bg-[#FAF6F3]/50 transition-colors"
              >
                <div>
                  <span className="font-semibold text-sm">Features & Product Specs</span>
                  <p className="text-xs text-[#827A73] mt-0.5">Bullets showing canvas type, button styles, pockets details</p>
                </div>
                {accordionOpen.specs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {accordionOpen.specs && (
                <div className="p-5 border-t border-[#EBE6E0] bg-[#FAF6F3]/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#827A73]">Dynamic details that list out product specifications.</span>
                    <button
                      type="button"
                      onClick={() => setFeatures([...features, ''])}
                      className="text-taupe text-xs font-semibold hover:text-taupe-hover flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Bullet
                    </button>
                  </div>
                  <div className="space-y-3">
                    {features.map((feat, idx) => (
                      <div key={`feature-${idx}`} className="flex gap-2">
                        <input
                          type="text"
                          value={feat}
                          onChange={e => {
                            const newF = [...features];
                            newF[idx] = e.target.value;
                            setFeatures(newF);
                          }}
                          placeholder="e.g. Hand-stitched lapel, horn buttons"
                          className="flex-1 px-4 py-2 bg-white border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setFeatures(features.filter((_, i) => i !== idx))}
                          className="p-2 text-[#A8A19A] hover:text-[#B26959] transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Visual Guide Upload */}
                  <div className="border-t border-[#EBE6E0] pt-4 mt-4">
                    <label className="block text-xs font-semibold text-[#524A44] mb-2">
                      Section Visual Guide / Image (Optional)
                    </label>
                    {featuresImage ? (
                      <div className="relative max-w-md aspect-video bg-white shadow-sm border border-[#EBE6E0] rounded-lg overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={featuresImage} alt="Features Spec Guide" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFeaturesImage('')}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#FAF6F3] text-xs font-medium"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-[#EBE6E0] rounded-lg p-4 text-center max-w-md bg-white">
                        {uploadingSection === 'specs' ? (
                          <div className="flex items-center justify-center gap-2 text-xs text-[#827A73]">
                            <Loader2 className="w-4 h-4 animate-spin text-taupe" />
                            <span>Uploading visual guide...</span>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleSectionUpload(e.target.files?.[0], 'specs')}
                            className="text-xs text-[#827A73] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#F0EAE3] file:text-taupe hover:file:bg-[#EBE6E0] cursor-pointer"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 2: Fit & Sizing Guide */}
            <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('fit')}
                className="w-full flex items-center justify-between p-5 text-left font-medium text-[#2D2A26] hover:bg-[#FAF6F3]/50 transition-colors"
              >
                <div>
                  <span className="font-semibold text-sm">Fit & Sizing Guidelines</span>
                  <p className="text-xs text-[#827A73] mt-0.5">Sizing models, measurements, and body type fit tips</p>
                </div>
                {accordionOpen.fit ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {accordionOpen.fit && (
                <div className="p-5 border-t border-[#EBE6E0] bg-[#FAF6F3]/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#827A73]">Describe sizes the sample covers or measurement rules.</span>
                    <button
                      type="button"
                      onClick={() => setFitGuide([...fitGuide, ''])}
                      className="text-taupe text-xs font-semibold hover:text-taupe-hover flex items-center gap-1"
                    >
                      <Plus size={14} /> Add Bullet
                    </button>
                  </div>
                  <div className="space-y-3">
                    {fitGuide.map((feat, idx) => (
                      <div key={`fit-${idx}`} className="flex gap-2">
                        <input
                          type="text"
                          value={feat}
                          onChange={e => {
                            const newF = [...fitGuide];
                            newF[idx] = e.target.value;
                            setFitGuide(newF);
                          }}
                          placeholder="e.g. Runs true to size, slim fit through waist"
                          className="flex-1 px-4 py-2 bg-white border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setFitGuide(fitGuide.filter((_, i) => i !== idx))}
                          className="p-2 text-[#A8A19A] hover:text-[#B26959] transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Visual Guide Upload */}
                  <div className="border-t border-[#EBE6E0] pt-4 mt-4">
                    <label className="block text-xs font-semibold text-[#524A44] mb-2">
                      Section Visual Guide / Image (Optional)
                    </label>
                    {fitGuideImage ? (
                      <div className="relative max-w-md aspect-video bg-white shadow-sm border border-[#EBE6E0] rounded-lg overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={fitGuideImage} alt="Fit Guide" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setFitGuideImage('')}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#FAF6F3] text-xs font-medium"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-[#EBE6E0] rounded-lg p-4 text-center max-w-md bg-white">
                        {uploadingSection === 'fit' ? (
                          <div className="flex items-center justify-center gap-2 text-xs text-[#827A73]">
                            <Loader2 className="w-4 h-4 animate-spin text-taupe" />
                            <span>Uploading visual guide...</span>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleSectionUpload(e.target.files?.[0], 'fit')}
                            className="text-xs text-[#827A73] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#F0EAE3] file:text-taupe hover:file:bg-[#EBE6E0] cursor-pointer"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: Garment Care & Alteration FAQ */}
            <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAccordion('care')}
                className="w-full flex items-center justify-between p-5 text-left font-medium text-[#2D2A26] hover:bg-[#FAF6F3]/50 transition-colors"
              >
                <div>
                  <span className="font-semibold text-sm">Garment Care & Alterations FAQ</span>
                  <p className="text-xs text-[#827A73] mt-0.5">Dry-cleaning rules, laundry instructions, alteration limits</p>
                </div>
                {accordionOpen.care ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {accordionOpen.care && (
                <div className="p-5 border-t border-[#EBE6E0] bg-[#FAF6F3]/20 space-y-4">
                  <div>
                    <span className="block text-xs text-[#827A73] mb-1">Detailed text description for garment upkeep and store policies:</span>
                    <textarea
                      rows={4}
                      name="care_instructions"
                      value={formData.care_instructions}
                      onChange={handleChange}
                      placeholder="Dry clean only. Minor alterations (hem, sleeves) are free within 30 days of purchase..."
                      className="w-full px-4 py-2 bg-white border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                    />
                  </div>

                  {/* Visual Guide Upload */}
                  <div className="border-t border-[#EBE6E0] pt-4 mt-2">
                    <label className="block text-xs font-semibold text-[#524A44] mb-2">
                      Section Visual Guide / Image (Optional)
                    </label>
                    {careImage ? (
                      <div className="relative max-w-md aspect-video bg-white shadow-sm border border-[#EBE6E0] rounded-lg overflow-hidden group">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={careImage} alt="Garment Care Guide" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCareImage('')}
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#FAF6F3] text-xs font-medium"
                        >
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-[#EBE6E0] rounded-lg p-4 text-center max-w-md bg-white">
                        {uploadingSection === 'care' ? (
                          <div className="flex items-center justify-center gap-2 text-xs text-[#827A73]">
                            <Loader2 className="w-4 h-4 animate-spin text-taupe" />
                            <span>Uploading visual guide...</span>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={e => handleSectionUpload(e.target.files?.[0], 'care')}
                            className="text-xs text-[#827A73] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#F0EAE3] file:text-taupe hover:file:bg-[#EBE6E0] cursor-pointer"
                          />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Images Upload Section */}
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[#2D2A26]">Images</h2>
              <button
                onClick={() => setImages([...images, { url: '', angle: 'Default', is_primary: false }])}
                className="text-taupe text-xs font-semibold hover:text-taupe-hover flex items-center gap-1"
              >
                <Plus size={14} /> Add Image Slot
              </button>
            </div>
            <div className="space-y-4">
              {images.map((img, idx) => (
                <div
                  key={`image-${idx}`}
                  className="space-y-2 p-3 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg relative group"
                >
                  <button
                    onClick={() => setImages(images.filter((_, i) => i !== idx))}
                    className="absolute -top-2 -right-2 bg-[#F0EAE3] text-[#827A73] hover:text-[#B26959] rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                  >
                    <X size={14} />
                  </button>

                  {img.url ? (
                    <div className="relative aspect-video bg-white shadow-sm border border-[#EBE6E0] rounded overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          const newI = [...images];
                          newI[idx].url = '';
                          setImages(newI);
                        }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[#FAF6F3] text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-[#EBE6E0] rounded p-4 text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async e => {
                          const file = e.target.files?.[0];
                          if (file && shop) {
                            const fd = new FormData();
                            fd.append('file', file);

                            try {
                              const res = await api.post(`/shops/${shop.id}/upload`, fd, {
                                headers: { 'Content-Type': 'multipart/form-data' },
                              });
                              const newI = [...images];
                              newI[idx].url = res.data.data.url;
                              setImages(newI);
                            } catch (err) {
                              console.error('Upload failed', err);
                              alert('Failed to upload image. File may be too large.');
                            }
                          }
                        }}
                        className="text-xs text-[#827A73] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#F0EAE3] file:text-taupe hover:file:bg-[#EBE6E0] cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={img.angle}
                      onChange={e => {
                        const newI = [...images];
                        newI[idx].angle = e.target.value;
                        setImages(newI);
                      }}
                      placeholder="Variation (e.g. DM-01, Front)"
                      className="flex-1 px-3 py-1.5 bg-white shadow-sm border border-[#EBE6E0] rounded text-[#524A44] text-xs focus:border-taupe"
                    />
                    <label className="flex items-center gap-2 text-xs text-[#827A73] bg-white shadow-sm px-3 py-1.5 border border-[#EBE6E0] rounded cursor-pointer">
                      <input
                        type="radio"
                        name="is_primary"
                        checked={img.is_primary}
                        onChange={() => {
                          const newI = images.map((im, i) => ({ ...im, is_primary: i === idx }));
                          setImages(newI);
                        }}
                        className="accent-[#9A8073]"
                      />
                      Primary
                    </label>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-[#EBE6E0] pt-6">
              <button
                onClick={handleSave}
                disabled={saving || !formData.name || (!isPortfolio && !formData.price) || images.every(i => !i.url)}
                className="w-full bg-taupe hover:bg-taupe/90 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                Publish to Catalog
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
