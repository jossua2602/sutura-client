'use client';

import { useEffect, useState, use } from 'react';
import api from '@/lib/axios';
import { Ruler, Info, ShieldCheck, Calendar as CalendarIcon, ArrowLeft, Star, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getActiveSale } from '@/components/catalog/catalogHelpers';

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

interface CatalogItemReview {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user: { name: string } | null;
}

interface CatalogItem {
  id: number;
  name: string;
  price: string | number;
  sale_price?: string | number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  description?: string;
  listing_type: string;
  material?: string;
  color?: string;
  garment_type?: string;
  sizes?: string[] | null;
  features?: string[] | { bullets: string[]; image_url: string };
  size_chart_image_url?: string | null;
  size_chart_columns?: string[] | null;
  size_chart_rows?: { size: string; values: string[] }[] | null;
  care_instructions?: string;
  images: CatalogItemImage[];
  recommendations?: Recommendation[];
  external_gallery_url?: string;
  reviews_avg_rating?: number | null;
  reviews_count?: number;
  reviews?: CatalogItemReview[];
}

const LISTING_TYPE_LABELS: Record<string, string> = {
  made_to_order: 'Made to Order',
  bulk_order: 'Bulk Order',
  ready_to_wear: 'Ready to Wear',
  portfolio: 'Portfolio Showcase',
  for_rent: 'For Rent',
  for_sale: 'For Sale',
  rent_or_sale: 'For Rent or Sale',
  used_liquidated: 'Pre-Loved / Liquidated',
};

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

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[type] || 'bg-zinc-100 text-zinc-800 border-zinc-200'}`}>
      {LISTING_TYPE_LABELS[type] || type}
    </span>
  );
}

export default function PublicProductDetailPage({ params }: Readonly<{ params: Promise<{ shop_id: string; item_id: string; }> }>) {
  const { shop_id: shopId, item_id: itemId } = use(params);
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariation, setSelectedVariation] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [showFAQ, setShowFAQ] = useState(false);
  const [rentalDates, setRentalDates] = useState<{ start: string; end: string }[]>([]);

  useEffect(() => {
    api.get(`/catalog/${shopId}/${itemId}`)
      .then(res => {
        setItem(res.data.data);
        const primary = res.data.data.images.find((i: CatalogItemImage) => i.is_primary) || res.data.data.images[0];
        if (primary) {
          setSelectedImage(primary.image_url);
          setSelectedVariation(primary.view_angle || '');
        }
        setLoading(false);
        // Real customer view — fire-and-forget, no need to block or reflect
        // this locally since the owner reads views_count from their own
        // dashboard/analytics, not from this page.
        api.post(`/catalog/${shopId}/${itemId}/view`).catch(() => {
          // Non-critical — a failed view count shouldn't affect the shopper's page.
        });
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [shopId, itemId]);

  useEffect(() => {
    if (!item || (item.listing_type !== 'for_rent' && item.listing_type !== 'rent_or_sale')) return;
    api.get(`/catalog/${shopId}/${itemId}/rental-dates`)
      .then(res => setRentalDates(res.data.data || []))
      .catch(() => {
        // Fall back silently — booked-dates list just won't show
      });
  }, [shopId, itemId, item]);

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
      case 'used_liquidated':
        return 'Inquire Purchase';
      case 'rent_or_sale':
        return 'Rent or Purchase';
      case 'ready_to_wear':
        return 'Reserve for Pickup';
      case 'bulk_order':
        return 'Request a Quote';
      case 'made_to_order':
        return 'Book a Fitting';
      default:
        return 'Inquire About This Item';
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

  const sizeChartColumns = item.size_chart_columns || [];
  const sizeChartRows = item.size_chart_rows || [];
  const sizeChartImage = item.size_chart_image_url || '';

  const activeSale = getActiveSale(item);

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
      <Link
        href={`/shop/${shopId}/catalog`}
        className="inline-flex items-center gap-2 text-sm font-medium text-[#827A73] hover:text-zinc-900 transition-colors mb-8"
      >
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Images Column — sticky/fixed-height side-by-side gallery only makes sense
            once the grid is actually side-by-side (lg:); below that it must scroll
            away normally and show the whole garment instead of a tall cropped sliver. */}
        <div className="flex gap-4 lg:h-[800px] lg:sticky lg:top-24">
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
          <div className="flex-1 bg-zinc-100 overflow-hidden relative aspect-3/4 lg:aspect-auto">
            {selectedImage ? (
              <>
                <Image src={selectedImage} alt={item.name} className="w-full h-full object-contain lg:object-cover object-top" fill unoptimized />
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
          {!!item.reviews_count && (
            <div className="flex items-center gap-1.5 mt-2 text-sm">
              <div className="flex items-center gap-0.5 text-amber-500">
                {[1, 2, 3, 4, 5].map(n => (
                  <Star key={n} size={14} fill={n <= Math.round(item.reviews_avg_rating || 0) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <span className="font-semibold text-zinc-900">{item.reviews_avg_rating?.toFixed(1)}</span>
              <span className="text-[#A8A19A]">({item.reviews_count} review{item.reviews_count === 1 ? '' : 's'})</span>
            </div>
          )}
          {activeSale ? (
            <p className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-lg text-[#A8A19A] line-through">₱{activeSale.original.toLocaleString()}</span>
              <span className="text-xl font-bold text-rose-600">₱{activeSale.sale.toLocaleString()}</span>
              <span className="text-xs font-bold text-white bg-rose-600 px-2 py-0.5 rounded-full uppercase tracking-wider">{activeSale.percentOff}% Off</span>
            </p>
          ) : (
            <p className="text-xl text-[#827A73] mt-3">₱{Number(item.price).toLocaleString()} <span className="text-sm text-[#827A73] font-normal">PHP</span></p>
          )}

          {item.sizes && item.sizes.length > 0 && (
            <div className="mt-8 pt-8 border-t border-zinc-200">
              <h3 className="text-sm font-semibold text-zinc-900 mb-3">
                Select Size <span className="text-[#B26959]">*</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      selectedSize === size
                        ? 'border-zinc-900 bg-zinc-900 text-white'
                        : 'border-zinc-300 text-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="text-xs text-[#B26959] mt-2">Please select a size to continue.</p>
              )}
            </div>
          )}

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
              {(() => {
                const specRows: [string, string][] = [];
                if (item.garment_type) specRows.push(['Garment Type', item.garment_type]);
                if (item.material) specRows.push(['Material', item.material]);
                if (item.color) specRows.push(['Color', item.color]);
                if (item.sizes && item.sizes.length > 0) specRows.push(['Sizes Available', item.sizes.join(', ')]);
                specRows.push(['Listing Type', LISTING_TYPE_LABELS[item.listing_type] || item.listing_type]);
                return specRows.length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody>
                      {specRows.map(([label, value]) => (
                        <tr key={label} className="border-b border-zinc-100 last:border-0">
                          <td className="py-2 pr-4 text-[#A8A19A] font-medium w-2/5 align-top">{label}</td>
                          <td className="py-2 text-zinc-800">{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null;
              })()}
              {featuresList.length > 0 && (
                <div className="mt-4 pt-4 border-t border-zinc-200">
                  <h4 className="text-xs font-semibold text-[#A8A19A] uppercase tracking-wider mb-2">Additional Details</h4>
                  <ul className="space-y-2 text-sm text-[#827A73]">
                    {featuresList.map((feat: string) => (
                      <li key={feat}>• {feat}</li>
                    ))}
                  </ul>
                </div>
              )}
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
              {sizeChartColumns.length > 0 ? (
                <div className="overflow-x-auto border border-zinc-200 rounded-lg bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-zinc-50">
                        <th className="px-3 py-2 text-left font-semibold text-zinc-700">Size</th>
                        {sizeChartColumns.map(col => (
                          <th key={col} className="px-3 py-2 text-left font-semibold text-zinc-700">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sizeChartRows.map(row => (
                        <tr key={row.size} className="border-t border-zinc-200">
                          <td className="px-3 py-2 font-semibold text-zinc-900 whitespace-nowrap">{row.size}</td>
                          {row.values.map((val, ci) => (
                            <td key={`${row.size}-${ci}`} className="px-3 py-2 text-zinc-700">{val || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-sm text-[#A8A19A]">Custom tailored to your measurements.</div>
              )}
              {sizeChartImage && (
                <div className="mt-4 relative w-full h-[240px] rounded-lg overflow-hidden border border-zinc-200 bg-white">
                  <Image src={sizeChartImage} alt="Size & Fit Guide visual" className="object-cover object-center" fill unoptimized />
                </div>
              )}
            </div>

            {/* Rental Availability Calendar widget */}
            {(item.listing_type === 'for_rent' || item.listing_type === 'rent_or_sale') && (
              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl space-y-4">
                <h3 className="font-semibold text-emerald-950 flex items-center gap-2">
                  <CalendarIcon size={18} /> Rental Availability
                </h3>
                <p className="text-xs text-emerald-700">
                  You choose your own pickup and return dates when booking. Below are the currently reserved dates:
                </p>
                <div className="bg-white rounded-lg p-3 border border-emerald-100 text-xs space-y-2">
                  {item.listing_type === 'for_rent' && (
                    <div className="flex justify-between">
                      <span className="text-[#827A73]">Security Deposit:</span>
                      <span className="font-semibold text-zinc-950">₱{(Number(item.price) * 0.5).toLocaleString(undefined, { minimumFractionDigits: 2 })} (Refundable)</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-zinc-100">
                    <span className="font-semibold text-emerald-800 block mb-1">Booked Dates:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {rentalDates.length === 0 ? (
                        <span className="text-[10px] text-emerald-600 font-semibold">✓ No dates currently reserved — fully open</span>
                      ) : (
                        <>
                          {rentalDates.map(d => (
                            <span key={`${d.start}-${d.end}`} className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 font-mono text-[10px]">
                              {new Date(d.start).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })} – {new Date(d.end).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                            </span>
                          ))}
                          <span className="text-[10px] text-emerald-600 font-semibold self-center ml-auto text-right w-full">✓ All other dates open</span>
                        </>
                      )}
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

          {item.sizes && item.sizes.length > 0 && !selectedSize ? (
            <button
              type="button"
              disabled
              className="w-full bg-zinc-300 text-white font-medium tracking-wide py-4 mt-4 rounded-xl uppercase cursor-not-allowed"
            >
              Select a Size to Continue
            </button>
          ) : (
            <Link
              href={`/shop/${shopId}/book?item_id=${item.id}&intent=${item.listing_type}${selectedVariation ? `&variation=${encodeURIComponent(selectedVariation)}` : ''}${selectedSize ? `&selected_size=${encodeURIComponent(selectedSize)}` : ''}`}
              className="w-full bg-[#2D2A26] hover:bg-black text-white font-medium tracking-wide py-4 mt-4 transition-colors flex items-center justify-center rounded-xl shadow-lg uppercase"
            >
              {getButtonText()}
            </Link>
          )}
        </div>
      </div>

      {/* Ratings & Reviews */}
      {!!item.reviews_count && (
        <div className="mt-24 pt-16 border-t border-zinc-200 max-w-3xl">
          <h2 className="text-2xl font-serif font-semibold text-zinc-900 mb-2">Ratings &amp; Reviews</h2>
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-0.5 text-amber-500">
              {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={16} fill={n <= Math.round(item.reviews_avg_rating || 0) ? 'currentColor' : 'none'} />
              ))}
            </div>
            <span className="font-semibold text-zinc-900">{item.reviews_avg_rating?.toFixed(1)}</span>
            <span className="text-[#A8A19A] text-sm">out of 5 · {item.reviews_count} review{item.reviews_count === 1 ? '' : 's'}</span>
          </div>

          <div className="space-y-6">
            {(item.reviews || []).map(review => (
              <div key={review.id} className="pb-6 border-b border-zinc-100 last:border-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-zinc-900">{review.user?.name || 'Anonymous Customer'}</span>
                  <span className="text-xs text-[#A8A19A]">
                    {new Date(review.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center gap-0.5 text-amber-500 mb-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <Star key={n} size={12} fill={n <= review.rating ? 'currentColor' : 'none'} />
                  ))}
                </div>
                {review.comment && (
                  <p className="text-sm text-[#524A44] leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))}
            {(item.reviews || []).length === 0 && (
              <p className="text-sm text-[#A8A19A] flex items-center gap-2">
                <MessageSquare size={14} /> No written reviews yet.
              </p>
            )}
          </div>
        </div>
      )}

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
                <Link href={`/shop/${shopId}/catalog/${recItem.id}`} key={recItem.id} className="group block text-center">
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
