'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2, Save, Plus, X } from 'lucide-react';
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
  });

  const [features, setFeatures] = useState<string[]>(['']);
  const [fitGuide, setFitGuide] = useState<string[]>(['']);
  const [images, setImages] = useState<{url: string, angle: string, is_primary: boolean}[]>([
    { url: '', angle: 'front', is_primary: true }
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!shop) return;
    setSaving(true);
    try {
      // Filter out empty arrays
      const filteredFeatures = features.filter(f => f.trim() !== '');
      const filteredFit = fitGuide.filter(f => f.trim() !== '');
      const filteredImages = images.filter(img => img.url.trim() !== '');

      await api.post(`/shops/${shop.id}/catalog`, {
        ...formData,
        features: filteredFeatures,
        fit_guide: filteredFit,
        images: filteredImages
      });
      router.push('/dashboard/catalog');
    } catch (err: unknown) {
      console.error(err);
      alert('Failed to save catalog item');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
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

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          {/* Basic Details */}
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Basic Details</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-[#524A44] mb-1">Product Name</label>
                <input id="name" required type="text" name="name" value={formData.name} onChange={handleChange} placeholder="e.g. Black Ellis Shawl Collar Tuxedo" className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-[#524A44] mb-1">Price (PHP)</label>
                  <input id="price" required type="number" name="price" value={formData.price} onChange={handleChange} placeholder="e.g. 24999" className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" />
                </div>
                <div>
                  <label htmlFor="material" className="block text-sm font-medium text-[#524A44] mb-1">Material (Hover Detail)</label>
                  <input id="material" type="text" name="material" value={formData.material} onChange={handleChange} placeholder="e.g. 100% Merino Wool" className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" />
                </div>
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-[#524A44] mb-1">Description</label>
                <textarea id="description" rows={4} name="description" value={formData.description} onChange={handleChange} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="garment_type" className="block text-sm font-medium text-[#524A44] mb-1">Garment Type</label>
                  <select id="garment_type" name="garment_type" value={formData.garment_type} onChange={e => setFormData({...formData, garment_type: e.target.value})} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm">
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
                  <label htmlFor="listing_type" className="block text-sm font-medium text-[#524A44] mb-1">Listing Type</label>
                  <select id="listing_type" name="listing_type" value={formData.listing_type} onChange={e => setFormData({...formData, listing_type: e.target.value})} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm">
                    {(shop?.business_type === 'tailoring_shop' || shop?.business_type === 'hybrid') && (
                      <>
                        <option value="made_to_order">Made to Order (Custom)</option>
                        <option value="bulk_order">Bulk / Group Order</option>
                      </>
                    )}
                    {(shop?.business_type === 'fashion_designer' || shop?.business_type === 'hybrid') && (
                      <>
                        <option value="ready_to_wear">Ready to Wear (Premade)</option>
                        <option value="portfolio">Portfolio / Past Work</option>
                      </>
                    )}
                    {/* Fallback if business_type is somewhat undefined */}
                    {!shop?.business_type && (
                      <>
                        <option value="made_to_order">Made to Order (Custom)</option>
                        <option value="ready_to_wear">Ready to Wear (Premade)</option>
                        <option value="bulk_order">Bulk / Group Order</option>
                        <option value="portfolio">Portfolio / Past Work</option>
                      </>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[#2D2A26]">Features / Specs</h2>
              <button onClick={() => setFeatures([...features, ''])} className="text-taupe text-sm hover:text-taupe-hover flex items-center gap-1"><Plus size={16}/> Add Bullet</button>
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
                    placeholder="e.g. Half-Canvas Construction" 
                    className="flex-1 px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm" 
                  />
                  <button onClick={() => setFeatures(features.filter((_, i) => i !== idx))} className="p-2 text-[#A8A19A] hover:text-[#B26959]"><X size={18}/></button>
                </div>
              ))}
            </div>
          </div>

          {/* Fit & Sizing Guide */}
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[#2D2A26]">Fit & Sizing Guide</h2>
              <button onClick={() => setFitGuide([...fitGuide, ''])} className="text-taupe text-sm hover:text-taupe-hover flex items-center gap-1"><Plus size={16}/> Add Bullet</button>
            </div>
            <p className="text-sm text-[#827A73] mb-4">Explain the fit of the garment, what size the model is wearing, or special measurement instructions.</p>
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
                    placeholder="e.g. Slim fit through the waist" 
                    className="flex-1 px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm" 
                  />
                  <button onClick={() => setFitGuide(fitGuide.filter((_, i) => i !== idx))} className="p-2 text-[#A8A19A] hover:text-[#B26959]"><X size={18}/></button>
                </div>
              ))}
            </div>
          </div>
          
          {/* Care Instructions */}
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Garment Care & Alterations FAQ</h2>
            <textarea rows={5} name="care_instructions" value={formData.care_instructions} onChange={handleChange} placeholder="Enter your detailed FAQ regarding alterations, refunds, and professional dry-cleaning here..." className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm" />
          </div>
        </div>

        <div className="space-y-6">
          {/* Images */}
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-[#2D2A26]">Images</h2>
              <button onClick={() => setImages([...images, {url: '', angle: 'front', is_primary: false}])} className="text-taupe text-sm hover:text-taupe-hover flex items-center gap-1"><Plus size={16}/> Add Image Slot</button>
            </div>
            <div className="space-y-4">
              {images.map((img, idx) => (
                <div key={`image-${idx}`} className="space-y-2 p-3 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg relative group">
                  <button onClick={() => setImages(images.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-[#F0EAE3] text-[#827A73] hover:text-[#B26959] rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X size={14}/></button>
                  
                  {img.url ? (
                    <div className="relative aspect-video bg-white shadow-sm border border-[#EBE6E0] rounded overflow-hidden">
                      <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => {
                          const newI = [...images];
                          newI[idx].url = '';
                          setImages(newI);
                        }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-[#2D2A26] text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-[#EBE6E0] rounded p-4 text-center">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file && shop) {
                            const fd = new FormData();
                            fd.append('file', file);
                            
                            try {
                              const res = await api.post(`/shops/${shop.id}/upload`, fd, {
                                headers: { 'Content-Type': 'multipart/form-data' }
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
                        className="text-xs text-[#827A73] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#F0EAE3] file:text-indigo-700 hover:file:bg-[#EBE6E0]" 
                      />
                    </div>
                  )}

                  <div className="flex gap-2 mt-2">
                    <select 
                      value={img.angle}
                      onChange={e => {
                        const newI = [...images];
                        newI[idx].angle = e.target.value;
                        setImages(newI);
                      }}
                      className="flex-1 px-3 py-1.5 bg-white shadow-sm border border-[#EBE6E0] rounded text-[#524A44] text-xs focus:border-taupe"
                    >
                      <option value="front">Front View</option>
                      <option value="back">Back View</option>
                      <option value="left">Left Profile</option>
                      <option value="right">Right Profile</option>
                    </select>
                    <label className="flex items-center gap-2 text-xs text-[#827A73] bg-white shadow-sm px-3 py-1.5 border border-[#EBE6E0] rounded cursor-pointer">
                      <input 
                        type="radio" 
                        name="is_primary"
                        checked={img.is_primary} 
                        onChange={() => {
                          const newI = images.map((im, i) => ({...im, is_primary: i === idx}));
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
                disabled={saving || !formData.name || !formData.price || images.every(i => !i.url)}
                className="w-full bg-taupe hover:bg-taupe/90 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
