
export interface ServicePricing {
  id: number;
  service_id: number;
  apparel_specialization_id: number | null;
  label: string;
  amount: string;
  apparel_specialization?: {
    id: number;
    name: string;
  } | null;
}

export interface Specialization {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export interface ServiceField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
}

export interface Service {
  id: number;
  name: string;
  description: string;
  category: string;
  base_price: string | null;
  estimated_days: number;
  is_active: boolean;
  image_url?: string | null;
  custom_fields?: ServiceField[] | null;
  pricing?: ServicePricing[];
  tags?: string[];
}

export const SERVICE_CATEGORIES = [
  { group: 'Formal & Cultural Wear', items: [
    'Barong Tagalog Tailoring',
    'Filipiniana & Formal Dressmaking',
    'Gown & Evening Wear Designing',
    'Suit & Tuxedo Tailoring',
    'Custom Bridal Tailoring',
  ]},
  { group: 'Custom Apparel & Printing', items: [
    'Custom Jersey Printing',
    'Uniform Sublimation Printing',
    'Corporate & Team Uniforms',
    'Custom T-shirt Printing',
  ]},
  { group: 'Alterations & Adjustments', items: [
    'General Clothing Alterations',
    'Gown & Suit Sizing Adjustment',
    'Hemming & Sleeve Shortening',
    'Embroidery & Custom Accents',
  ]},
  { group: 'Design & Consultation', items: [
    'Design Consultation',
    'Pattern & Layout Design',
  ]},
  { group: 'Other', items: ['Other / Custom Category'] },
];
