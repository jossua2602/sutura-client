export interface CatalogItemResponse {
  id: number;
  name: string;
  price: number;
  sale_price?: number | null;
  rental_price?: number | null;
  rental_deposit?: number | null;
  material?: string;
  color?: string;
  fabric_image_url?: string;
  sizes?: string[] | null;
  description?: string;
  features?: string;
  fit_guide?: string;
  care_instructions?: string;
  garment_type?: string;
  listing_type?: string;
  images: { id: number; image_url: string; angle?: string; is_primary: number }[];
  external_gallery_url?: string;
}

export interface BulletItem {
  id: string;
  text: string;
}

export interface ImageItem {
  id: string;
  url: string;
  angle: string;
  is_primary: boolean;
  uploading?: boolean;
}

export interface CatalogFormData {
  name: string;
  price: string;
  material: string;
  color: string;
  description: string;
  care_instructions: string;
  garment_type: string;
  listing_type: string;
  rental_price: string;
  rental_deposit: string;
  external_gallery_url: string;
}
