import React from 'react';
import { ShoppingBag, Truck } from 'lucide-react';
import { CatalogOrder } from './orderHelpers';
import OrderListItem from './OrderListItem';

interface OrderListViewProps {
  filteredOrders: CatalogOrder[];
  activeTab: 'walkin' | 'online';
  setActiveTab: (tab: 'walkin' | 'online') => void;
  updating: number | null;
  onUpdateStatus: (orderId: number, status: string, extra?: any) => Promise<void>;
}

export default function OrderListView({
  filteredOrders,
  activeTab,
  setActiveTab,
  updating,
  onUpdateStatus,
}: OrderListViewProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EBE6E0] overflow-hidden text-[#2D2A26]">
      <div className="border-b border-[#EBE6E0]">
        <div className="flex px-4">
          <button
            onClick={() => setActiveTab('online')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'online' ? 'border-[#8A7E72] text-[#2D2A26]' : 'border-transparent text-[#524A44] hover:text-[#2D2A26]'
            }`}
          >
            <Truck className="w-4 h-4" />
            Online Deliveries
          </button>
          <button
            onClick={() => setActiveTab('walkin')}
            className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
              activeTab === 'walkin' ? 'border-[#8A7E72] text-[#2D2A26]' : 'border-transparent text-[#524A44] hover:text-[#2D2A26]'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Walk-in Pickups
          </button>
        </div>
      </div>

      <div className="p-6">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-[#B8B2A9]" />
            <h3 className="mt-2 text-sm font-semibold text-[#2D2A26]">No orders found</h3>
            <p className="mt-1 text-sm text-[#524A44]">You don&apos;t have any {activeTab === 'online' ? 'delivery' : 'walk-in'} orders right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <OrderListItem
                key={order.id}
                order={order}
                activeTab={activeTab}
                updating={updating}
                onUpdateStatus={onUpdateStatus}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
