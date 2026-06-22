'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Ruler, Info, ShieldCheck, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface CatalogItemImage {
  id: number;
  image_url: string;
  view_angle: string;
  is_primary: boolean;
}

interface RecommendedItem {
  id: number;
  name: string;
  price: string | number;
  images?: CatalogItemImage[];
}

interface Recommendation {
  recommendedItem?: RecommendedItem;
}

interface CatalogItem {
  id: number;
  name: string;
  price: string | number;
  description?: string;
  listing_type: string;
  material?: string;
  features?: string[] | { bullets: string[]; image_url: string };
  fit_guide?: string[] | { bullets: string[]; image_url: string };
  care_instructions?: string;
  images: CatalogItemImage[];
  recommendations?: Recommendation[];
  external_gallery_url?: string;
}

function ListingTypeBadge({ type }: Readonly<{ type: string }>) {
  const styles: Record<string, string> = {
    made_to_order: 'bg-[#FAF6F3] text-[#827A73] border-[#EBE6E0]',
    bulk_order: 'bg-orange-50 text-orange-700 border-orange-200',
    ready_to_wear: 'bg-blue-50 text-blue-700 border-blue-200',
    portfolio: 'bg-purple-50 text-purple-700 border-purple-200',
    for_rent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    for_sale: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    rent_or_sale: 'bg-pink-50 text-pink-700 border-pink-200',
  };

  const labels: Record<string, string> = {
    made_to_order: 'Made to Order',
    bulk_order: 'Bulk Order',
    ready_to_wear: 'Ready to Wear',
    portfolio: 'Portfolio Showcase',
    for_rent: 'For Rent',
    for_sale: 'For Sale',
    rent_or_sale: 'For Rent or Sale',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[type] || 'bg-zinc-100 text-zinc-800 border-zinc-200'}`}>
      {labels[type] || type}
    </span>
  );
}

export default function PublicProductDetailPage({ params }: Readonly<{ params: Readonly<{ shop_id: string; item_id: string; }> }>) {
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const [showFAQ, setShowFAQ] = useState(false);

  useEffect(() => {
    api.get(`/catalog/${params.shop_id}/${params.item_id}`)
      .then(res => {
        setItem(res.data.data);
        const primary = res.data.data.images.find((i: CatalogItemImage) => i.is_primary) || res.data.data.images[0];
        if (primary) {
          setSelectedImage(primary.image_url);
          setSelectedVariation(primary.view_angle || '');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.shop_id, params.item_id]);

  if (loading) {
    return <div className="py-32 text-center text-[#A8A19A] animate-pulse">Loading garment details...</div>;
  }

  if (!item) {
    return <div className="py-32 text-center text-[#A8A19A]">Item not found.</div>;
  }

  const getButtonText = () => {
    switch (item.listing_type) {
      case 'for_rent':
        return 'Inquire Rental';
      case 'for_sale':
        return 'Inquire Purchase';
      case 'rent_or_sale':
        return 'Rent or Purchase';
      default:
        return 'Book a Fitting';
    }
  };

  // Parsing helper for structured lists and visual guides
  let featuresList: string[] = [];
  let featuresImage = '';
  if (item.features) {
    if (Array.isArray(item.features)) {
      featuresList = item.features;
    } else if (typeof item.features === 'object') {
      featuresList = (item.features as { bullets: string[] }).bullets || [];
      featuresImage = (item.features as { image_url: string }).image_url || '';
    } else {
      try {
        const parsed = JSON.parse(item.features as unknown as string);
        if (Array.isArray(parsed)) {
          featuresList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          featuresList = parsed.bullets || [];
          featuresImage = parsed.image_url || '';
        }
      } catch {
        // Ignored
      }
    }
  }

  let fitGuideList: string[] = [];
  let fitGuideImage = '';
  if (item.fit_guide) {
    if (Array.isArray(item.fit_guide)) {
      fitGuideList = item.fit_guide;
    } else if (typeof item.fit_guide === 'object') {
      fitGuideList = (item.fit_guide as { bullets: string[] }).bullets || [];
      fitGuideImage = (item.fit_guide as { image_url: string }).image_url || '';
    } else {
      try {
        const parsed = JSON.parse(item.fit_guide as unknown as string);
        if (Array.isArray(parsed)) {
          fitGuideList = parsed;
        } else if (parsed && typeof parsed === 'object') {
          fitGuideList = parsed.bullets || [];
          fitGuideImage = parsed.image_url || '';
        }
      } catch {
        // Ignored
      }
    }
  }

  let careText = '';
  let careImage = '';
  if (item.care_instructions) {
    try {
      const parsed = JSON.parse(item.care_instructions);
      if (parsed && typeof parsed === 'object' && ('text' in parsed || 'image_url' in parsed)) {
        careText = parsed.text || '';
        careImage = parsed.image_url || '';
      } else {
        careText = item.care_instructions;
      }
    } catch {
      careText = item.care_instructions;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Images Column */}
        <div className="flex gap-4 h-[800px] sticky top-24">
          <div className="w-24 flex-col gap-4 overflow-y-auto hidden md:flex">
            {item.images.map((img) => (
              <button 
                key={img.id}
                onClick={() => {
                  setSelectedImage(img.image_url);
                  setSelectedVariation(img.view_angle || '');
                }}
                className={`aspect-3/4 w-full bg-zinc-100 overflow-hidden border-2 transition-all flex flex-col justify-between ${selectedImage === img.image_url ? 'border-zinc-900 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <div className="relative w-full flex-1">
                  <Image src={img.image_url} alt={img.view_angle || 'Garment thumbnail'} className="w-full h-full object-cover object-top" fill unoptimized />
                </div>
                {img.view_angle && img.view_angle !== 'Default' && img.view_angle !== 'front' && (
                  <div className="bg-zinc-900 text-white text-[9px] py-0.5 text-center truncate px-1 w-full">
                    {img.view_angle}
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="flex-1 bg-zinc-100 overflow-hidden relative">
            {selectedImage ? (
              <>
                <Image src={selectedImage} alt={item.name} className="w-full h-full object-cover object-top" fill unoptimized />
                {selectedVariation && selectedVariation !== 'Default' && selectedVariation !== 'front' && (
                  <div className="absolute bottom-4 left-4 bg-zinc-900/80 text-white text-xs font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm z-10">
                    Design Variation: {selectedVariation}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#827A73]">No Image</div>
            )}
          </div>
        </div>

        {/* Product Details Column */}
        <div className="py-8">
          {item.listing_type && (
            <div className="mb-3">
              <ListingTypeBadge type={item.listing_type} />
            </div>
          )}
          <h1 className="text-3xl font-serif font-semibold text-zinc-900">{item.name}</h1>
          <p className="text-xl text-[#827A73] mt-3">₱{Number(item.price).toLocaleString()} <span className="text-sm text-[#827A73] font-normal">PHP</span></p>
          
          <div className="mt-8 pt-8 border-t border-zinc-200">
            <p className="text-[#827A73] leading-relaxed">
              {item.description}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
              <h3 className="font-medium text-zinc-900 flex items-center gap-2 mb-4">
                <Info size={18} /> Specifications
              </h3>
              <ul className="space-y-2 text-sm text-[#827A73]">
                {item.material && <li>• {item.material}</li>}
                {featuresList.map((feat: string) => (
                  <li key={feat}>• {feat}</li>
                ))}
              </ul>
              {featuresImage && (
                <div className="mt-4 relative w-full h-[240px] rounded-lg overflow-hidden border border-zinc-200 bg-white">
                  <Image src={featuresImage} alt="Specifications visual guide" className="object-cover object-center" fill unoptimized />
                </div>
              )}
            </div>

            <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-100">
              <h3 className="font-medium text-zinc-900 flex items-center gap-2 mb-4">
                <Ruler size={18} /> Size & Fit Guide
              </h3>
              {fitGuideList.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {fitGuideList.map((size: string) => (
                    <div key={size} className="border border-zinc-200 rounded py-2 px-1 text-center text-sm font-medium text-zinc-700 bg-white truncate">
                      {size}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-[#A8A19A]">Custom tailored to your measurements.</div>
              )}
              {fitGuideImage && (
                <div className="mt-4 relative w-full h-[240px] rounded-lg overflow-hidden border border-zinc-200 bg-white">
                  <Image src={fitGuideImage} alt="Size & Fit Guide visual" className="object-cover object-center" fill unoptimized />
                </div>
              )}
            </div>

            {/* Rental Availability Calendar widget */}
            {(item.listing_type === 'for_rent' || item.listing_type === 'rent_or_sale') && (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl space-y-4">
                <h3 className="font-semibold text-emerald-950 flex items-center gap-2">
                  <CalendarIcon size={18} /> Rental Availability Calendar
                </h3>
                <p className="text-xs text-emerald-700">
                  This item is available for rentals in Davao City. Below are the upcoming reserved dates:
                </p>
                <div className="bg-white rounded-lg p-3 border border-emerald-100 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#827A73]">Standard Period:</span>
                    <span className="font-semibold text-zinc-950">3 Days (Extendable)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#827A73]">Security Deposit:</span>
                    <span className="font-semibold text-zinc-950">₱1,500.00 (Refundable)</span>
                  </div>
                  <div className="pt-2 border-t border-zinc-100">
                    <span className="font-semibold text-emerald-800 block mb-1">Booked Dates:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 font-mono text-[10px]">June 26 - June 28</span>
                      <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 font-mono text-[10px]">July 04 - July 06</span>
                      <span className="text-[10px] text-emerald-600 font-semibold self-center ml-auto text-right w-full">✓ All other dates open</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Garment Care & Alterations Collapsible */}
            <div className="border border-zinc-200 rounded-xl overflow-hidden bg-white">
              <button 
                onClick={() => setShowFAQ(!showFAQ)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <h3 className="font-medium text-zinc-900 flex items-center gap-2">
                  <ShieldCheck size={18} /> Garment Care & Alterations
                </h3>
                <span className="text-[#827A73] text-sm font-medium">{showFAQ ? 'Close' : 'Learn More'}</span>
              </button>
              {showFAQ && (
                <div className="px-6 pb-6 pt-2 text-sm text-[#827A73] leading-relaxed whitespace-pre-wrap border-t border-zinc-100 space-y-4">
                  <div>
                    {careText || "Professional dry-clean only. Altered garments are final sale."}
                  </div>
                  {careImage && (
                    <div className="relative w-full h-[240px] rounded-lg overflow-hidden border border-zinc-200 bg-zinc-50">
                      <Image src={careImage} alt="Garment Care guide" className="object-cover object-center" fill unoptimized />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {item.external_gallery_url && (
            <a 
              href={item.external_gallery_url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full border border-zinc-300 hover:border-zinc-800 hover:bg-zinc-50 text-zinc-800 font-medium tracking-wide py-4 mt-8 transition-colors flex items-center justify-center rounded-xl shadow-sm uppercase gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Sample Designs (External Gallery)
            </a>
          )}

          <Link 
            href={`/shop/${params.shop_id}/book?item_id=${item.id}&intent=${item.listing_type}${selectedVariation ? `&variation=${encodeURIComponent(selectedVariation)}` : ''}`}
            className="w-full bg-[#2D2A26] hover:bg-black text-white font-medium tracking-wide py-4 mt-4 transition-colors flex items-center justify-center rounded-xl shadow-lg uppercase"
          >
            {getButtonText()}
          </Link>
        </div>
      </div>

      {/* Recommendations / Also Suggested */}
      {item.recommendations && item.recommendations.length > 0 && (
        <div className="mt-32 pt-16 border-t border-zinc-200">
          <h2 className="text-2xl font-serif font-semibold text-center text-zinc-900 mb-12">Also Suggested</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {item.recommendations.map((rec) => {
              const recItem = rec.recommendedItem;
              if (!recItem) return null;
              const recImage = recItem.images?.find((i: CatalogItemImage) => i.is_primary)?.image_url || recItem.images?.[0]?.image_url;
              
              return (
                <Link href={`/shop/${params.shop_id}/catalog/${recItem.id}`} key={recItem.id} className="group block text-center">
                  <div className="aspect-square bg-zinc-100 overflow-hidden mb-4 relative">
                    {recImage ? (
                      <Image src={recImage} alt={recItem.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" fill unoptimized />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#524A44]">No Image</div>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-zinc-900 group-hover:text-[#886E62]">{recItem.name}</h4>
                  <p className="text-xs text-[#A8A19A] mt-1">₱{Number(recItem.price).toLocaleString()}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
