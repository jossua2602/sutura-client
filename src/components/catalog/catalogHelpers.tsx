import React from 'react';
import api from '@/lib/axios';
import { BulletItem, ImageItem, CatalogFormData, CatalogItemResponse } from './catalogTypes';

export interface CatalogItem {
  id: number;
  name: string;
  price: string;
  material: string;
  description?: string;
  garment_type?: string;
  listing_type?: string;
  images: { id: number; image_url: string; is_primary: boolean }[];
  views_count: number;
  saves_count: number;
  reviews_avg_rating: number | null;
  reviews_count: number;
}

export function formatCatalogPrice(price: string | number, listingType?: string): string {
  const numericPrice = Number(price);
  
  if (listingType === 'portfolio') {
    return 'Showcase Only';
  }

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
    case 'portfolio':
      return 'Inquire';
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
    case 'portfolio':
      return 'Portfolio Showcase';
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
    default:
      return 'Showcase';
  }
}

export function parseFeatures(featuresStr?: string): { bullets: BulletItem[]; imageUrl: string } {
  let bullets: BulletItem[] = [{ id: 'init', text: '' }];
  let imageUrl = '';
  if (featuresStr) {
    try {
      const parsed = JSON.parse(featuresStr);
      if (parsed && typeof parsed === 'object' && 'bullets' in parsed) {
        bullets = (parsed.bullets || ['']).map((b: string, i: number) => ({ id: `feat-${i}`, text: b }));
        imageUrl = parsed.image_url || '';
      } else if (Array.isArray(parsed)) {
        bullets = parsed.map((b: string, i: number) => ({ id: `feat-${i}`, text: b }));
      }
    } catch (e) {
      console.error('Failed to parse features', e);
    }
  }
  return { bullets, imageUrl };
}

export function parseFitGuide(fitGuideStr?: string): { bullets: BulletItem[]; imageUrl: string } {
  let bullets: BulletItem[] = [{ id: 'init', text: '' }];
  let imageUrl = '';
  if (fitGuideStr) {
    try {
      const parsed = JSON.parse(fitGuideStr);
      if (parsed && typeof parsed === 'object' && 'bullets' in parsed) {
        bullets = (parsed.bullets || ['']).map((b: string, i: number) => ({ id: `fit-${i}`, text: b }));
        imageUrl = parsed.image_url || '';
      } else if (Array.isArray(parsed)) {
        bullets = parsed.map((b: string, i: number) => ({ id: `fit-${i}`, text: b }));
      }
    } catch (e) {
      console.error('Failed to parse fit guide', e);
    }
  }
  return { bullets, imageUrl };
}

export function parseCareInstructions(careInstructionsStr?: string): { text: string; imageUrl: string } {
  let text = '';
  let imageUrl = '';
  if (careInstructionsStr) {
    try {
      const parsed = JSON.parse(careInstructionsStr);
      if (parsed && typeof parsed === 'object' && ('text' in parsed || 'image_url' in parsed)) {
        text = parsed.text || '';
        imageUrl = parsed.image_url || '';
      } else {
        text = careInstructionsStr;
      }
    } catch {
      text = careInstructionsStr;
    }
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
    description: item.description ?? '',
    care_instructions: careText,
    garment_type: item.garment_type ?? '',
    listing_type: item.listing_type ?? 'made_to_order',
    external_gallery_url: item.external_gallery_url ?? '',
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
    images: filteredImages.map(img => ({
      url: img.url,
      angle: img.angle,
      is_primary: img.is_primary,
    })),
    external_gallery_url: formData.external_gallery_url || null,
  };
}
