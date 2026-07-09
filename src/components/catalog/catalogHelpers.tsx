import React from 'react';
import api from '@/lib/axios';
import { BulletItem, ImageItem, CatalogFormData, CatalogItemResponse } from './catalogTypes';
export { getActiveSale } from '@/lib/salePricing';

export interface CatalogItem {
  id: number;
  name: string;
  price: string;
  sale_price?: string | number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  rental_price?: string | number | null;
  rental_deposit?: string | number | null;
  material: string;
  color?: string;
  fabric_image_url?: string;
  sizes?: string[] | null;
  description?: string;
  garment_type?: string;
  listing_type?: string;
  images: { id: number; image_url: string; is_primary: boolean }[];
  views_count: number;
  saves_count: number;
  reviews_avg_rating: number | null;
  reviews_count: number;
  features?: unknown;
  fit_guide?: unknown;
  care_instructions?: unknown;
  external_gallery_url?: string;
  total_revenue?: number;
  order_count?: number;
  is_active?: boolean;
}

export function formatCatalogPrice(price: string | number, listingType?: string): string {
  const numericPrice = Number(price);

  const formattedPrice = Number.isNaN(numericPrice) ? '0' : numericPrice.toLocaleString();

  if (listingType === 'made_to_order') {
    return `Starting at ₱${formattedPrice}`;
  }
  
  if (listingType === 'for_rent' || listingType === 'rent_or_sale') {
    return `Rent from ₱${formattedPrice}`;
  }

  return `₱${formattedPrice}`;
}

export function getCatalogActionLabel(listingType?: string): string {
  switch (listingType) {
    case 'made_to_order':
      return 'Book / Measure';
    case 'for_rent':
    case 'rent_or_sale':
      return 'Book Fitting / Rent';
    case 'ready_to_wear':
    case 'for_sale':
    default:
      return 'Buy / View Details';
  }
}

export function getListingTypeLabel(listingType?: string): string {
  switch (listingType) {
    case 'made_to_order':
      return 'Made to Order';
    case 'bulk_order':
      return 'Bulk Order';
    case 'ready_to_wear':
      return 'Ready to Wear';
    case 'for_rent':
      return 'For Rent';
    case 'for_sale':
      return 'For Sale';
    case 'rent_or_sale':
      return 'For Rent/Sale';
    case 'used_liquidated':
      return 'Used / Liquidated';
    default:
      return 'Showcase';
  }
}

export function parseFeatures(featuresInput?: unknown): { bullets: BulletItem[]; imageUrl: string } {
  let bullets: BulletItem[] = [{ id: 'init', text: '' }];
  let imageUrl = '';
  if (!featuresInput) return { bullets, imageUrl };

  let parsed: unknown = featuresInput;
  if (typeof featuresInput === 'string') {
    const trimmed = featuresInput.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsed = JSON.parse(featuresInput);
      } catch (e) {
        console.error('Failed to parse features JSON string', e);
      }
    } else {
      return { bullets: [{ id: 'feat-0', text: featuresInput }], imageUrl };
    }
  }

  if (parsed && typeof parsed === 'object') {
    const parsedObj = parsed as Record<string, unknown>;
    if ('bullets' in parsedObj) {
      const bulletsArr = Array.isArray(parsedObj.bullets) ? parsedObj.bullets : [''];
      bullets = bulletsArr.map((b: unknown, i: number) => ({ id: `feat-${i}`, text: String(b) }));
      imageUrl = typeof parsedObj.image_url === 'string' ? parsedObj.image_url : '';
    } else if (Array.isArray(parsedObj)) {
      bullets = parsedObj.map((b: unknown, i: number) => ({ id: `feat-${i}`, text: String(b) }));
    }
  }
  return { bullets, imageUrl };
}

export function parseFitGuide(fitGuideInput?: unknown): { bullets: BulletItem[]; imageUrl: string } {
  let bullets: BulletItem[] = [{ id: 'init', text: '' }];
  let imageUrl = '';
  if (!fitGuideInput) return { bullets, imageUrl };

  let parsed: unknown = fitGuideInput;
  if (typeof fitGuideInput === 'string') {
    const trimmed = fitGuideInput.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsed = JSON.parse(fitGuideInput);
      } catch (e) {
        console.error('Failed to parse fit guide JSON string', e);
      }
    } else {
      return { bullets: [{ id: 'fit-0', text: fitGuideInput }], imageUrl };
    }
  }

  if (parsed && typeof parsed === 'object') {
    const parsedObj = parsed as Record<string, unknown>;
    if ('bullets' in parsedObj) {
      const bulletsArr = Array.isArray(parsedObj.bullets) ? parsedObj.bullets : [''];
      bullets = bulletsArr.map((b: unknown, i: number) => ({ id: `fit-${i}`, text: String(b) }));
      imageUrl = typeof parsedObj.image_url === 'string' ? parsedObj.image_url : '';
    } else if (Array.isArray(parsedObj)) {
      bullets = parsedObj.map((b: unknown, i: number) => ({ id: `fit-${i}`, text: String(b) }));
    }
  }
  return { bullets, imageUrl };
}

export function parseCareInstructions(careInstructionsInput?: unknown): { text: string; imageUrl: string } {
  let text = '';
  let imageUrl = '';
  if (!careInstructionsInput) return { text, imageUrl };

  let parsed: unknown = careInstructionsInput;
  if (typeof careInstructionsInput === 'string') {
    const trimmed = careInstructionsInput.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        parsed = JSON.parse(careInstructionsInput);
      } catch (e) {
        console.error('Failed to parse care instructions JSON string', e);
      }
    } else {
      return { text: careInstructionsInput, imageUrl };
    }
  }

  if (parsed && typeof parsed === 'object') {
    const parsedObj = parsed as Record<string, unknown>;
    if ('text' in parsedObj || 'image_url' in parsedObj) {
      text = typeof parsedObj.text === 'string' ? parsedObj.text : '';
      imageUrl = typeof parsedObj.image_url === 'string' ? parsedObj.image_url : '';
    } else {
      text = JSON.stringify(parsedObj);
    }
  } else if (careInstructionsInput !== null && careInstructionsInput !== undefined) {
    text = typeof careInstructionsInput === 'object' ? JSON.stringify(careInstructionsInput) : String(careInstructionsInput as string | number | boolean);
  }
  return { text, imageUrl };
}

export function mapCatalogItemToState(item: CatalogItemResponse) {
  const { bullets: parsedFeatures, imageUrl: featuresImgUrl } = parseFeatures(item.features);
  const { bullets: parsedFitGuide, imageUrl: fitGuideImgUrl } = parseFitGuide(item.fit_guide);
  const { text: careText, imageUrl: careImgUrl } = parseCareInstructions(item.care_instructions);

  const form = {
    name: item.name,
    price: item.price.toString(),
    material: item.material ?? '',
    color: item.color ?? '',
    fabric_image_url: item.fabric_image_url ?? '',
    description: item.description ?? '',
    care_instructions: careText,
    garment_type: item.garment_type ?? '',
    listing_type: item.listing_type ?? 'made_to_order',
    rental_price: item.rental_price != null ? String(item.rental_price) : '',
    rental_deposit: item.rental_deposit != null ? String(item.rental_deposit) : '',
    sizes: Array.isArray(item.sizes) ? item.sizes : [],
    external_gallery_url: item.external_gallery_url ?? '',
    is_active: item.is_active ?? true,
  };

  const imgs = (item.images || []).map((img, i) => ({
    id: `img-${i}`,
    url: img.image_url,
    angle: img.angle ?? 'Default',
    is_primary: img.is_primary === 1,
  }));

  return {
    features: parsedFeatures,
    featuresImage: featuresImgUrl,
    fitGuide: parsedFitGuide,
    fitGuideImage: fitGuideImgUrl,
    careImage: careImgUrl,
    formData: form,
    images: imgs.length > 0 ? imgs : [{ id: 'init', url: '', angle: 'Default', is_primary: true }],
  };
}

export async function uploadSectionImage({
  file,
  shopId,
  section,
  setUploadingSection,
  setFeaturesImage,
  setFitGuideImage,
  setCareImage,
}: {
  file: File;
  shopId: number;
  section: 'specs' | 'fit' | 'care';
  setUploadingSection: (sec: 'specs' | 'fit' | 'care' | null) => void;
  setFeaturesImage: (url: string) => void;
  setFitGuideImage: (url: string) => void;
  setCareImage: (url: string) => void;
}) {
  setUploadingSection(section);
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await api.post(`/shops/${shopId}/upload`, fd, {
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
}

export async function uploadCatalogImage({
  file,
  shopId,
  index,
  images,
  setImages,
}: {
  file: File;
  shopId: number;
  index: number;
  images: ImageItem[];
  setImages: React.Dispatch<React.SetStateAction<ImageItem[]>>;
}) {
  const fd = new FormData();
  fd.append('file', file);
  
  const uploadStart = [...images];
  uploadStart[index].uploading = true;
  setImages(uploadStart);

  try {
    const res = await api.post(`/shops/${shopId}/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    const newI = [...images];
    newI[index].url = res.data.data.url;
    newI[index].uploading = false;
    setImages(newI);
  } catch (err) {
    console.error('Upload failed', err);
    alert('Failed to upload image. File may be too large.');
    const newI = [...images];
    newI[index].uploading = false;
    setImages(newI);
  }
}

export function buildSavePayload(
  formData: CatalogFormData,
  features: BulletItem[],
  featuresImage: string,
  fitGuide: BulletItem[],
  fitGuideImage: string,
  careImage: string,
  images: ImageItem[]
) {
  const filteredFeatures = features.map(f => f.text).filter(t => t.trim() !== '');
  const filteredFit = fitGuide.map(f => f.text).filter(t => t.trim() !== '');
  const filteredImages = images.filter(img => img.url.trim() !== '');

  return {
    ...formData,
    // sale_price is intentionally NOT sent here — it's managed separately via
    // the "Set Sale" quick action on the catalog card, not the main form, so
    // saving this form must never overwrite an existing discount.
    fabric_image_url: formData.fabric_image_url || null,
    sizes: formData.sizes,
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
    images: filteredImages.map(img => ({
      url: img.url,
      angle: img.angle,
      is_primary: img.is_primary,
    })),
    external_gallery_url: formData.external_gallery_url || null,
  };
}
