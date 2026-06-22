import React from 'react';
import {
  Crown, Swords, Trophy, Palette, Scissors, Layers, Sparkles, Tag
} from 'lucide-react';

export interface Specialization {
  id: number;
  category?: string;
  name: string;
  description: string;
  is_active: boolean;
  starting_price?: number;
  production_time_days?: number;
  min_order_qty?: number;
}

export const CATEGORIES: {
  name: string;
  icon: React.ElementType;
  items: string[];
}[] = [
  {
    name: 'Formal & Cultural Wear',
    icon: Crown,
    items: [
      'Barong Tagalog',
      'Filipiniana / Formal Wear',
      'Wedding Gown',
      'Evening Gown / Ball Gown',
      'Debut Gown',
      'Entourage / Motif Dress',
    ],
  },
  {
    name: 'Cosplay & Costume',
    icon: Swords,
    items: [
      'Heroes / Superhero Costume',
      'Cartoon / Anime Cosplay',
      'Fantasy / RPG Costume',
      'Historical / Period Costume',
      'Halloween Costume',
    ],
  },
  {
    name: 'Jerseys & Uniforms',
    icon: Trophy,
    items: [
      'Basketball Jerseys',
      'Sports Team Jerseys',
      'Cycling Jerseys',
      'Esports / Gaming Jerseys',
      'School / Student Org Uniforms',
      'Company / Corporate Uniforms',
      'Campaign / Org Shirts',
    ],
  },
  {
    name: 'Printing & Sublimation',
    icon: Palette,
    items: [
      'Full Sublimation Printing',
      'Custom T-shirt Printing',
      'Long Sleeve Printing',
      'Polo Shirt Printing',
      'Hoodie & Jacket Printing',
    ],
  },
  {
    name: 'Custom Tailoring',
    icon: Scissors,
    items: [
      'Customized Dress / Blouse',
      'Customized Shorts / Pants',
      'Jogging Pants / Shorts',
      'Sportswear / Athletic Wear',
      'Barkada Shirts',
      'Graphic Design / Logo Layout',
    ],
  },
  {
    name: 'Alteration & Repair Services',
    icon: Layers,
    items: [
      'Clothing Alteration',
      'Garment Repair',
      'Resizing / Tailoring Adjustments',
      'Zipper Replacement',
      'Hem & Seam Repair',
      'Embroidery & Patch Work',
    ],
  },
  {
    name: 'Other / Custom',
    icon: Sparkles,
    items: [
      'Custom Specialization',
      'Mixed Garment Work',
      'Special Projects',
    ],
  },
];

export const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  'Formal & Cultural Wear':        Crown,
  'Cosplay & Costume':             Swords,
  'Jerseys & Uniforms':            Trophy,
  'Printing & Sublimation':        Palette,
  'Custom Tailoring':              Scissors,
  'Alteration & Repair Services':  Layers,
  'Other / Custom':                Sparkles,
};

export const getCategoryIcon = (category?: string): React.ElementType => {
  return CATEGORY_ICON_MAP[category || ''] || Tag;
};

export const BLANK_FORM = {
  category: '',
  name: '',
  description: '',
  is_active: true,
  starting_price: 0,
  production_time_days: 0,
  min_order_qty: 1,
};
