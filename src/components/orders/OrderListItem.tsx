import React, { useState } from 'react';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import { CatalogOrder, StatusBadge } from './orderHelpers';

interface OrderListItemProps {
  readonly order: CatalogOrder;
  readonly activeTab: 'walkin' | 'online';
  readonly updating: number | null;
  readonly onUpdateStatus: (orderId: number, status: string, extra?: Record<string, string>) => Promise<void>;
}

export default function OrderListItem({
  order,
  activeTab,
  updating,
  onUpdateStatus,
}: Readonly<OrderListItemProps>) {
  const isUpdating = updating === order.id;
  const [showCourierForm, setShowCourierForm] = useState(false);
  const [courierName, setCourierName] = useState(order.courier_name || '');
  const [courierTracking, setCourierTracking] = useState(order.courier_tracking_number || '');

  return (
    <div className="flex flex-col md:flex-row gap-6 p-4 rounded-xl border border-[#EBE6E0] bg-[#FAFAFA] hover:bg-white transition-colors text-[#2D2A26]">
      {/* Image & Product Info */}
      <div className="flex gap-4 md:w-1/3">
        <div className="h-20 w-20 rounded-lg bg-[#EBE6E0] overflow-hidden shrink-0 relative">
          {order.catalog_item?.images?.[0] ? (
            <Image src={order.catalog_item.images[0]} alt="Product" fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-[#8A7E72]">No Image</div>
          )}
        </div>
        <div>
          <h4 className="font-medium text-[#2D2A26]">{order.catalog_item?.title || 'Unknown Product'}</h4>
          <p className="text-sm font-semibold text-[#8A7E72] mt-1">₱{Number.parseFloat(order.total_amount).toLocaleString()}</p>
          <div className="mt-2">
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {/* Customer & Delivery Info */}
      <div className="md:w-1/3 space-y-2">
        <p className="text-sm">
          <span className="text-[#8A7E72]">Customer: </span>
          <span className="font-medium text-[#2D2A26]">{order.customer?.name || 'Guest User'}</span>
        </p>
        <p className="text-sm">
          <span className="text-[#8A7E72]">Payment: </span>
          <span className="font-medium text-[#2D2A26] capitalize">{order.payment_status}</span>
        </p>
        {activeTab === 'online' && (
          <div className="space-y-1.5 mt-2 bg-white p-3 rounded-lg border border-[#EBE6E0]">
            <div className="flex gap-2 items-start">
              <MapPin className="w-4 h-4 text-[#8A7E72] shrink-0 mt-0.5" />
              <span className="text-xs text-[#524A44]">{order.delivery_address || 'No address provided'}</span>
            </div>
            {(order.courier_name || order.courier_tracking_number) && (
              <div className="pt-1.5 border-t border-zinc-100 text-xs text-[#8A7E72] flex flex-col gap-0.5">
                <span className="font-semibold text-zinc-950">Shipping Details:</span>
                <span>Courier: <strong className="text-zinc-800 font-bold">{order.courier_name || 'N/A'}</strong></span>
                <span>Tracking / Rider: <strong className="text-zinc-800 font-mono font-bold">{order.courier_tracking_number || 'N/A'}</strong></span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="md:w-1/3 flex flex-col justify-center gap-2 items-end">
        <p className="text-xs text-[#8A7E72] mb-2">{new Date(order.created_at).toLocaleString()}</p>
        
        {activeTab === 'online' && order.status === 'pending' && (
          <div className="w-full space-y-2">
            {showCourierForm ? (
              <div className="bg-white border border-[#EBE6E0] p-3 rounded-lg flex flex-col gap-2 w-64 shadow-xs">
                <p className="text-[10px] font-bold text-[#8A7E72] uppercase">Courier Details</p>
                <input 
                  type="text" 
                  placeholder="Courier Name (e.g. Maxim)"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full border border-[#EBE6E0] px-2 py-1 rounded text-xs focus:outline-none focus:border-[#9A8073]"
                />
                <input 
                  type="text" 
                  placeholder="Tracking / Rider Phone"
                  value={courierTracking}
                  onChange={(e) => setCourierTracking(e.target.value)}
                  className="w-full border border-[#EBE6E0] px-2 py-1 rounded text-xs focus:outline-none focus:border-[#9A8073]"
                />
                <div className="flex gap-1 justify-end">
                  <button 
                    onClick={() => setShowCourierForm(false)}
                    className="px-2 py-1 text-xs border border-[#EBE6E0] rounded hover:bg-zinc-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      await onUpdateStatus(order.id, 'out_for_delivery', {
                        courier_name: courierName,
                        courier_tracking_number: courierTracking,
                      });
                      setShowCourierForm(false);
                    }}
                    className="px-2 py-1 text-xs bg-[#2D2A26] text-white rounded hover:bg-black cursor-pointer"
                  >
                    Ship Order
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowCourierForm(true)}
                disabled={isUpdating}
                className="w-full sm:w-auto px-4 py-2 bg-[#2D2A26] text-white text-sm font-medium rounded-lg hover:bg-[#1a1816] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? 'Updating...' : 'Send Out for Delivery'}
              </button>
            )}
          </div>
        )}
        
        {activeTab === 'online' && order.status === 'out_for_delivery' && (
          <button 
            onClick={() => onUpdateStatus(order.id, 'completed')}
            disabled={isUpdating}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isUpdating ? 'Updating...' : 'Mark Delivered'}
          </button>
        )}

        {activeTab === 'walkin' && order.status === 'ready' && (
          <button 
            onClick={() => onUpdateStatus(order.id, 'completed')}
            disabled={isUpdating}
            className="w-full sm:w-auto px-4 py-2 bg-[#2D2A26] text-white text-sm font-medium rounded-lg hover:bg-[#1a1816] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isUpdating ? 'Updating...' : 'Confirm Pickup'}
          </button>
        )}

        {order.status === 'completed' && (
          <p className="text-sm font-medium text-green-600">Order Fulfilled</p>
        )}
      </div>
    </div>
  );
}
