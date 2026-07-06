'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  ImageOff,
} from 'lucide-react';
import { BulletItem, ImageItem, CatalogFormData } from './catalogTypes';
import { uploadSectionImage, uploadCatalogImage, buildSavePayload } from './catalogHelpers';
import api from '@/lib/axios';

interface SectionImageUploadProps {
  readonly imageUrl: string;
  readonly uploading: boolean;
  readonly uploadId: string;
  readonly alt: string;
  readonly onRemove: () => void;
  readonly onChange: (file: File | undefined) => void;
}

function SectionImageUpload({ imageUrl, uploading, uploadId, alt, onRemove, onChange }: SectionImageUploadProps) {
  if (imageUrl) {
    return (
      <div className="relative max-w-md aspect-video bg-white shadow-sm border border-[#EBE6E0] rounded-lg overflow-hidden group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={alt} className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[#FAF6F3] text-xs font-medium"
        >
          Remove Image
        </button>
      </div>
    );
  }
  return (
    <div className="border-2 border-dashed border-[#EBE6E0] rounded-lg p-4 text-center max-w-md bg-white">
      {uploading ? (
        <div className="flex items-center justify-center gap-2 text-xs text-[#827A73]">
          <Loader2 className="w-4 h-4 animate-spin text-taupe" />
          <span>Uploading visual guide...</span>
        </div>
      ) : (
        <input
          id={uploadId}
          type="file"
          accept="image/*"
          onChange={e => onChange(e.target.files?.[0])}
          className="text-xs text-[#827A73] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#F0EAE3] file:text-taupe hover:file:bg-[#EBE6E0] cursor-pointer"
        />
      )}
    </div>
  );
}

interface CatalogFormProps {
  title: string;
  description: string;
  submitLabel: string;
  initialData?: {
    features: BulletItem[];
    featuresImage: string;
    fitGuide: BulletItem[];
    fitGuideImage: string;
    careImage: string;
    formData: CatalogFormData;
    images: ImageItem[];
  };
  onSubmit: (payload: ReturnType<typeof buildSavePayload>) => Promise<void>;
  submitting: boolean;
}

export default function CatalogForm({
  title,
  description,
  submitLabel,
  initialData,
  onSubmit,
  submitting,
}: Readonly<CatalogFormProps>) {
  const { shop } = useAuthStore();

  const [formData, setFormData] = useState<CatalogFormData>({
    name: '',
    price: '',
    material: '',
    color: '',
    fabric_image_url: '',
    description: '',
    care_instructions: '',
    garment_type: '',
    listing_type: 'made_to_order',
    rental_price: '',
    rental_deposit: '',
    sizes: '',
    external_gallery_url: '',
    is_active: true,
  });

  const [fabricImageUploading, setFabricImageUploading] = useState(false);
  const fabricImageInputRef = useRef<HTMLInputElement>(null);

  const [features, setFeatures] = useState<BulletItem[]>([{ id: 'init', text: '' }]);
  const [fitGuide, setFitGuide] = useState<BulletItem[]>([{ id: 'init', text: '' }]);
  const [images, setImages] = useState<ImageItem[]>([
    { id: 'init', url: '', angle: 'Default', is_primary: true },
  ]);

  const [featuresImage, setFeaturesImage] = useState<string>('');
  const [fitGuideImage, setFitGuideImage] = useState<string>('');
  const [careImage, setCareImage] = useState<string>('');
  const [uploadingSection, setUploadingSection] = useState<'specs' | 'fit' | 'care' | null>(null);

  const [accordionOpen, setAccordionOpen] = useState({
    specs: false,
    fit: false,
    care: false,
  });

  const [showMoreDetails, setShowMoreDetails] = useState(false);

  useEffect(() => {
    if (!initialData) return;
    setTimeout(() => {
      setFormData(initialData.formData);
      setFeatures(initialData.features);
      setFitGuide(initialData.fitGuide);
      setImages(initialData.images);
      setFeaturesImage(initialData.featuresImage);
      setFitGuideImage(initialData.fitGuideImage);
      setCareImage(initialData.careImage);
    }, 0);
  }, [initialData]);

  const toggleAccordion = (section: 'specs' | 'fit' | 'care') => {
    setAccordionOpen(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSectionUpload = (file: File | undefined, section: 'specs' | 'fit' | 'care') => {
    if (!file || !shop?.id) return;
    uploadSectionImage({
      file,
      shopId: shop.id,
      section,
      setUploadingSection,
      setFeaturesImage,
      setFitGuideImage,
      setCareImage,
    });
  };

  const handleFormSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = buildSavePayload(
      formData,
      features,
      featuresImage,
      fitGuide,
      fitGuideImage,
      careImage,
      images
    );
    await onSubmit(payload);
  };

  const handleFabricImageUpload = async (file: File | undefined) => {
    if (!file || !shop?.id) return;
    setFabricImageUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await api.post(`/shops/${shop.id}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = res.data?.data?.url || res.data?.url || '';
      setFormData(prev => ({ ...prev, fabric_image_url: url }));
    } catch {
      alert('Failed to upload fabric image.');
    } finally {
      setFabricImageUploading(false);
    }
  };

  const isRentable = formData.listing_type === 'for_rent' || formData.listing_type === 'rent_or_sale';
  const isSaleOnly = formData.listing_type !== 'for_rent';
  const saveDisabled = submitting || !formData.name || (!isSaleOnly ? false : !formData.price) || images.every(i => !i.url);

  return (
    <form onSubmit={handleFormSubmit} className="bg-[#FAF6F3] min-h-screen text-[#2D2A26] pb-16 font-sans selection:bg-[#EBE6E0]">
      {/* Top Header Panel */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#EBE6E0] pb-6">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/catalog"
              className="p-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#827A73] hover:text-[#2D2A26] hover:shadow-xs transition-all shrink-0"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-2xl font-serif font-bold text-[#2D2A26] tracking-tight">{title}</h1>
              <p className="text-[#827A73] text-sm mt-0.5">{description}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/catalog"
              className="px-5 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-sm font-semibold text-[#524A44] hover:bg-[#FAF6F3] transition-colors flex items-center justify-center animate-fade-in"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saveDisabled}
              className="px-5 py-2.5 bg-taupe hover:bg-taupe/90 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs cursor-pointer animate-fade-in"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
              {submitLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Main Form Fields */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-medium text-[#2D2A26] border-b border-[#FAF6F3] pb-3">Basic Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="catalog-name" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">
                    Product / Design Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="catalog-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Traditional Jusi Barong"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                  />
                </div>

                {/* Sale Price — hidden when listing type is 'For Rent Only' */}
                {formData.listing_type !== 'for_rent' && (
                  <div>
                    <label htmlFor="catalog-price" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">
                      Sale Price (PHP) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="catalog-price"
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="e.g. 24999"
                      className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="catalog-material" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">Fabric / Material</label>
                  <input
                    id="catalog-material"
                    type="text"
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                    placeholder="e.g. Cocoon Silk, Piña"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                  />
                  {/* Fabric Texture Image Upload */}
                  <div className="mt-2">
                    {formData.fabric_image_url ? (
                      <div className="relative inline-flex items-center gap-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-xs">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={formData.fabric_image_url} alt="Fabric texture" className="w-10 h-10 object-cover rounded border border-[#EBE6E0]" />
                        <span className="text-[#524A44] font-medium">Fabric texture uploaded</span>
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, fabric_image_url: '' }))}
                          className="ml-1 text-[#B26959] hover:text-[#B26959]/80 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-[#827A73] hover:text-taupe transition-colors">
                        {fabricImageUploading ? (
                          <Loader2 size={14} className="animate-spin text-taupe" />
                        ) : (
                          <UploadCloud size={14} />
                        )}
                        <span>{fabricImageUploading ? 'Uploading texture...' : 'Upload fabric texture image (optional)'}</span>
                        <input
                          ref={fabricImageInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={fabricImageUploading}
                          onChange={e => handleFabricImageUpload(e.target.files?.[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="catalog-color" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">Color</label>
                  <input
                    id="catalog-color"
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    placeholder="e.g. Ivory, Navy Blue"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="catalog-garment" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">Garment Type</label>
                  <input
                    id="catalog-garment"
                    type="text"
                    name="garment_type"
                    value={formData.garment_type}
                    onChange={handleChange}
                    placeholder="e.g. Barong, Gown, Suit"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                  />
                </div>
              </div>

              {/* Listing Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="catalog-listing" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">Listing Type</label>
                  <select
                    id="catalog-listing"
                    name="listing_type"
                    value={formData.listing_type}
                    onChange={e => setFormData({ ...formData, listing_type: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:outline-none focus:border-taupe text-sm"
                  >
                    <option value="made_to_order">Made To Order (Custom Sizing)</option>
                    <option value="ready_to_wear">Ready-To-Wear (In-Stock Retail)</option>
                    <option value="for_rent">For Rent Only</option>
                    <option value="for_sale">For Sale Only</option>
                    <option value="rent_or_sale">For Rent and Sale</option>
                    <option value="used_liquidated">Used / Liquidated (Pre-loved)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="catalog-gallery" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">External Gallery Link (Optional)</label>
                  <input
                    id="catalog-gallery"
                    type="url"
                    name="external_gallery_url"
                    value={formData.external_gallery_url}
                    onChange={handleChange}
                    placeholder="e.g. Pinterest board, Google Drive link"
                    className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                  />
                </div>
              </div>

              {/* Active / Paused toggle */}
              <div className="flex items-center gap-3 pt-1">
                <input
                  id="catalog-is-active"
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
                />
                <label htmlFor="catalog-is-active" className="text-sm font-medium text-[#524A44]">
                  Active &amp; Visible to Customers{' '}
                  <span className="block text-xs font-normal text-[#A8A19A]">
                    Uncheck to pause this item (e.g. out of stock) without deleting it — it&apos;s hidden from your public storefront but stays in your own catalog list.
                  </span>
                </label>
              </div>

              {/* ── More Details Toggle ────────────────────────────────── */}
              <div className="border-t border-[#EBE6E0] pt-4">
                <button
                  type="button"
                  onClick={() => setShowMoreDetails(v => !v)}
                  className="flex items-center gap-2 text-xs font-semibold text-[#9A8073] hover:text-[#2D2A26] transition-colors"
                >
                  <span className={`w-5 h-5 rounded-full border border-[#EBE6E0] bg-[#FAF6F3] flex items-center justify-center transition-transform ${showMoreDetails ? 'rotate-180' : ''}`}>
                    <ChevronDown size={12} />
                  </span>
                  {showMoreDetails ? 'Hide optional details' : 'Add rental pricing, sizes & availability →'}
                </button>

                {showMoreDetails && (
                  <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="catalog-rental-price" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">
                        Rental Price (PHP){isRentable ? <span className="text-rose-500"> *</span> : <span className="text-[#A8A19A] normal-case"> — for rentals</span>}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A] text-sm font-medium">₱</span>
                        <input
                          id="catalog-rental-price"
                          type="number"
                          name="rental_price"
                          value={formData.rental_price}
                          onChange={handleChange}
                          placeholder="e.g. 1500"
                          className="w-full pl-7 pr-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="catalog-rental-deposit" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">Rental Deposit (PHP)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A] text-sm font-medium">₱</span>
                        <input
                          id="catalog-rental-deposit"
                          type="number"
                          name="rental_deposit"
                          value={formData.rental_deposit}
                          onChange={handleChange}
                          placeholder="e.g. 3000"
                          className="w-full pl-7 pr-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="catalog-sizes" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">
                        Available Sizes <span className="text-[#A8A19A] normal-case">— comma separated</span>
                      </label>
                      <input
                        id="catalog-sizes"
                        type="text"
                        name="sizes"
                        value={formData.sizes}
                        onChange={handleChange}
                        placeholder="e.g. XS, S, M, L, XL, XXL — or leave blank for made-to-order"
                        className="w-full px-4 py-2.5 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="catalog-desc" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-2">Description</label>
                <textarea
                  id="catalog-desc"
                  rows={4}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell clients about the design, silhouette details, and styling recommendations..."
                  className="w-full px-4 py-3 bg-white border border-[#EBE6E0] rounded-xl text-[#2D2A26] placeholder-[#A8A19A] focus:outline-none focus:border-taupe text-sm"
                />
              </div>
            </div>

            {/* Accordion Sections for Specifications, Fit Guide, Care */}
            <div className="space-y-4">
              {/* Accordion 1: Specifications */}
              <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleAccordion('specs')}
                  className="w-full flex items-center justify-between p-5 text-left font-medium text-[#2D2A26] hover:bg-[#FAF6F3]/50 transition-colors"
                >
                  <div>
                    <span className="font-semibold text-sm">Product Specifications</span>
                    <p className="text-xs text-[#827A73] mt-0.5">Collar designs, cuffs, embroidery details, linings</p>
                  </div>
                  {accordionOpen.specs ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {accordionOpen.specs && (
                  <div className="p-5 border-t border-[#EBE6E0] bg-[#FAF6F3]/20 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#827A73]">Dynamic details that list out product specifications.</span>
                      <button
                        type="button"
                        onClick={() => setFeatures([...features, { id: Math.random().toString(), text: '' }])}
                        className="text-taupe text-xs font-semibold hover:text-taupe-hover flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Bullet
                      </button>
                    </div>
                    <div className="space-y-3">
                      {features.map((feat, idx) => (
                        <div key={feat.id} className="flex gap-2">
                          <input
                            type="text"
                            value={feat.text}
                            onChange={e => {
                              const newF = [...features];
                              newF[idx] = { ...newF[idx], text: e.target.value };
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

                    <div className="border-t border-[#EBE6E0] pt-4 mt-4">
                      <label htmlFor="features-upload" className="block text-xs font-semibold text-[#524A44] mb-2">
                        Section Visual Guide / Image (Optional)
                      </label>
                      <SectionImageUpload
                        imageUrl={featuresImage}
                        uploading={uploadingSection === 'specs'}
                        uploadId="features-upload"
                        alt="Features Spec Guide"
                        onRemove={() => setFeaturesImage('')}
                        onChange={file => handleSectionUpload(file, 'specs')}
                      />
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
                        onClick={() => setFitGuide([...fitGuide, { id: Math.random().toString(), text: '' }])}
                        className="text-taupe text-xs font-semibold hover:text-taupe-hover flex items-center gap-1"
                      >
                        <Plus size={14} /> Add Bullet
                      </button>
                    </div>
                    <div className="space-y-3">
                      {fitGuide.map((feat, idx) => (
                        <div key={feat.id} className="flex gap-2">
                          <input
                            type="text"
                            value={feat.text}
                            onChange={e => {
                              const newF = [...fitGuide];
                              newF[idx] = { ...newF[idx], text: e.target.value };
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

                    <div className="border-t border-[#EBE6E0] pt-4 mt-4">
                      <label htmlFor="fit-upload" className="block text-xs font-semibold text-[#524A44] mb-2">
                        Section Visual Guide / Image (Optional)
                      </label>
                      <SectionImageUpload
                        imageUrl={fitGuideImage}
                        uploading={uploadingSection === 'fit'}
                        uploadId="fit-upload"
                        alt="Fit Guide"
                        onRemove={() => setFitGuideImage('')}
                        onChange={file => handleSectionUpload(file, 'fit')}
                      />
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

                    <div className="border-t border-[#EBE6E0] pt-4 mt-2">
                      <label htmlFor="care-upload" className="block text-xs font-semibold text-[#524A44] mb-2">
                        Section Visual Guide / Image (Optional)
                      </label>
                      <SectionImageUpload
                        imageUrl={careImage}
                        uploading={uploadingSection === 'care'}
                        uploadId="care-upload"
                        alt="Garment Care Guide"
                        onRemove={() => setCareImage('')}
                        onChange={file => handleSectionUpload(file, 'care')}
                      />
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
                  type="button"
                  onClick={() => setImages([...images, { id: Math.random().toString(), url: '', angle: 'Default', is_primary: false }])}
                  className="text-taupe text-xs font-semibold hover:text-taupe-hover flex items-center gap-1"
                >
                  <Plus size={14} /> Add Image Slot
                </button>
              </div>
              <div className="space-y-4">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="space-y-3 p-4 bg-white border border-[#EBE6E0] rounded-xl relative group hover:border-[#9A8073]/50 transition-colors shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-white border border-[#EBE6E0] text-[#827A73] hover:text-rose-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"
                    >
                      <X size={14} />
                    </button>

                    {img.url ? (
                      <div className="relative aspect-square sm:aspect-video bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg overflow-hidden group/img">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const newI = [...images];
                            newI[idx].url = '';
                            setImages(newI);
                          }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white text-sm font-medium gap-2"
                        >
                          <ImageOff size={16} /> Remove
                        </button>
                      </div>
                    ) : (
                      <label className="relative flex flex-col items-center justify-center aspect-square sm:aspect-video border-2 border-dashed border-[#D5CEC8] rounded-lg bg-[#FAF6F3] hover:bg-[#F0EAE3] hover:border-[#9A8073] transition-colors cursor-pointer group/upload">
                        {img.uploading ? (
                          <div className="flex flex-col items-center gap-2 text-[#9A8073]">
                            <Loader2 className="w-6 h-6 animate-spin" />
                            <span className="text-xs font-medium">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <div className="p-3 bg-white rounded-full shadow-sm text-[#9A8073] mb-2 group-hover/upload:scale-110 transition-transform">
                              <UploadCloud size={20} />
                            </div>
                            <span className="text-sm font-semibold text-[#524A44]">Click to upload image</span>
                            <span className="text-xs text-[#827A73] mt-1">JPEG, PNG up to 5MB</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={img.uploading}
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file && shop?.id) {
                              uploadCatalogImage({
                                file,
                                shopId: shop.id,
                                index: idx,
                                images,
                                setImages,
                              });
                            }
                          }}
                        />
                      </label>
                    )}

                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={img.angle}
                          onChange={e => {
                            const newI = [...images];
                            newI[idx].angle = e.target.value;
                            setImages(newI);
                          }}
                          placeholder="Variation (e.g. Front, Detail)"
                          className="w-full px-3 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-md text-[#2D2A26] text-sm focus:outline-none focus:border-[#9A8073] focus:ring-1 focus:ring-[#9A8073] transition-shadow"
                        />
                      </div>
                      <label className={`flex items-center gap-2 text-sm px-3 py-2 rounded-md border cursor-pointer transition-colors ${img.is_primary ? 'bg-[#9A8073]/10 border-[#9A8073] text-[#9A8073] font-medium' : 'bg-white border-[#EBE6E0] text-[#827A73] hover:bg-[#FAF6F3]'}`}>
                        <input
                          type="radio"
                          name="is_primary"
                          checked={img.is_primary}
                          onChange={() => {
                            const newI = images.map((im, i) => ({ ...im, is_primary: i === idx }));
                            setImages(newI);
                          }}
                          className="accent-[#9A8073] w-4 h-4"
                        />
                        <span>Primary</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-[#EBE6E0] pt-6">
                <button
                  type="submit"
                  disabled={saveDisabled}
                  className="w-full bg-taupe hover:bg-taupe/90 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save size={18} />}
                  {submitLabel}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
