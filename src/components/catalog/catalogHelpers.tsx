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

  const formattedPrice = isNaN(numericPrice) ? '0' : numericPrice.toLocaleString();

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
