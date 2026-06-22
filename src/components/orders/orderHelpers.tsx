import React from 'react';
import { ShoppingBag, Truck, CheckCircle, Clock } from 'lucide-react';

export interface CatalogOrder {
  id: number;
  catalog_item_id: number;
  customer_id: number | null;
  type: string;
  status: string;
  total_amount: string;
  delivery_address: string | null;
  payment_status: string;
  created_at: string;
  courier_name: string | null;
  courier_tracking_number: string | null;
  catalog_item: {
    title: string;
    images: string[];
    price: string;
  };
  customer: {
    name: string;
  } | null;
}

export function StatusBadge({ status }: { readonly status: string }) {
  switch (status) {
    case 'pending':
      return (
        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3"/> Pending Prep
        </span>
      );
    case 'ready':
      return (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1">
          <ShoppingBag className="w-3 h-3"/> Ready for Pickup
        </span>
      );
    case 'out_for_delivery':
      return (
        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1">
          <Truck className="w-3 h-3"/> Out for Delivery
        </span>
      );
    case 'completed':
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3"/> Completed
        </span>
      );
    default:
      return null;
  }
}
