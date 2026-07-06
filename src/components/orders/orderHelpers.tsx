import { ShoppingBag, Truck, CheckCircle, Clock, Calendar, Search, XCircle } from 'lucide-react';

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
  fulfillment_type: string;
  rental_start_date: string | null;
  rental_end_date: string | null;
  security_deposit_amount: string | null;
  valid_id_captured: boolean;
  valid_id_notes: string | null;
  return_inspection_notes: string | null;
  deposit_deduction_amount: string | null;
  catalog_item: {
    name: string;
    images: { id: number; image_url: string; view_angle: string; is_primary: boolean }[];
    price: string;
    listing_type?: string;
  };
  customer: {
    name: string;
  } | null;
}

export function StatusBadge({ status, listingType }: { readonly status: string; readonly listingType?: string }) {
  const isRental = listingType === 'for_rent';
  switch (status) {
    case 'pending':
      return (
        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium flex items-center gap-1">
          <Clock className="w-3 h-3"/> {isRental ? 'Pending Booking' : 'Pending Prep'}
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
          {isRental ? (
            <>
              <Calendar className="w-3 h-3"/> Active Rental
            </>
          ) : (
            <>
              <Truck className="w-3 h-3"/> Out for Delivery
            </>
          )}
        </span>
      );
    case 'returned_pending_inspection':
      return (
        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium flex items-center gap-1">
          <Search className="w-3 h-3"/> Inspecting Return
        </span>
      );
    case 'completed':
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3"/> {isRental ? 'Returned & Fulfilled' : 'Completed'}
        </span>
      );
    case 'cancelled':
      return (
        <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-full text-xs font-medium flex items-center gap-1">
          <XCircle className="w-3 h-3"/> Cancelled
        </span>
      );
    default:
      return null;
  }
}
