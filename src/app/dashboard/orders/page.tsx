'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ShoppingBag, Truck, MapPin, CheckCircle, Clock } from 'lucide-react';
import Image from 'next/image';

interface CatalogOrder {
  id: number;
  catalog_item_id: number;
  customer_id: number | null;
  type: string;
  status: string;
  total_amount: string;
  delivery_address: string | null;
  payment_status: string;
  created_at: string;
  catalog_item: {
    title: string;
    images: string[];
    price: string;
  };
  customer: {
    name: string;
  } | null;
}

export default function OrdersPage() {
  const { shop } = useAuthStore();
  const [orders, setOrders] = useState<CatalogOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'walkin' | 'online'>('online');
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    if (shop) {
      fetchOrders();
    }
  }, [shop]);

  function fetchOrders() {
    if (!shop) return;
    setLoading(true);
    api.get(`/shops/${shop.id}/catalog-orders`)
      .then(res => {
        setOrders(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const updateStatus = async (orderId: number, newStatus: string) => {
    if (!shop) return;
    setUpdating(orderId);
    try {
      await api.put(`/shops/${shop.id}/catalog-orders/${orderId}`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = orders.filter(o => o.type === activeTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3"/> Pending Prep</span>;
      case 'ready': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1"><ShoppingBag className="w-3 h-3"/> Ready for Pickup</span>;
      case 'out_for_delivery': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center gap-1"><Truck className="w-3 h-3"/> Out for Delivery</span>;
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3"/> Completed</span>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8A7E72]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#2D2A26]">Ready-to-Wear Orders</h1>
          <p className="text-sm text-[#524A44] mt-1">Manage premade catalog purchases and deliveries</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#EBE6E0] overflow-hidden">
        <div className="border-b border-[#EBE6E0]">
          <div className="flex px-4">
            <button
              onClick={() => setActiveTab('online')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'online' ? 'border-[#8A7E72] text-[#2D2A26]' : 'border-transparent text-[#524A44] hover:text-[#2D2A26]'
              }`}
            >
              <Truck className="w-4 h-4" />
              Online Deliveries
            </button>
            <button
              onClick={() => setActiveTab('walkin')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
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
                <div key={order.id} className="flex flex-col md:flex-row gap-6 p-4 rounded-xl border border-[#EBE6E0] bg-[#FAFAFA] hover:bg-white transition-colors">
                  
                  {/* Image & Product Info */}
                  <div className="flex gap-4 md:w-1/3">
                    <div className="h-20 w-20 rounded-lg bg-[#EBE6E0] overflow-hidden flex-shrink-0 relative">
                      {order.catalog_item?.images?.[0] ? (
                        <Image src={order.catalog_item.images[0]} alt="Product" fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#8A7E72]">No Image</div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-[#2D2A26]">{order.catalog_item?.title || 'Unknown Product'}</h4>
                      <p className="text-sm font-semibold text-[#8A7E72] mt-1">₱{parseFloat(order.total_amount).toLocaleString()}</p>
                      <div className="mt-2">
                        {getStatusBadge(order.status)}
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
                      <div className="flex gap-2 items-start mt-2 bg-white p-2 rounded-lg border border-[#EBE6E0]">
                        <MapPin className="w-4 h-4 text-[#8A7E72] flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-[#524A44]">{order.delivery_address || 'No address provided'}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="md:w-1/3 flex flex-col justify-center gap-2 items-end">
                    <p className="text-xs text-[#8A7E72] mb-2">{new Date(order.created_at).toLocaleString()}</p>
                    
                    {activeTab === 'online' && order.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'out_for_delivery')}
                        disabled={updating === order.id}
                        className="w-full sm:w-auto px-4 py-2 bg-[#2D2A26] text-white text-sm font-medium rounded-lg hover:bg-[#1a1816] transition-colors disabled:opacity-50"
                      >
                        {updating === order.id ? 'Updating...' : 'Send Out for Delivery'}
                      </button>
                    )}
                    
                    {activeTab === 'online' && order.status === 'out_for_delivery' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'completed')}
                        disabled={updating === order.id}
                        className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {updating === order.id ? 'Updating...' : 'Mark Delivered'}
                      </button>
                    )}

                    {activeTab === 'walkin' && order.status === 'ready' && (
                      <button 
                        onClick={() => updateStatus(order.id, 'completed')}
                        disabled={updating === order.id}
                        className="w-full sm:w-auto px-4 py-2 bg-[#2D2A26] text-white text-sm font-medium rounded-lg hover:bg-[#1a1816] transition-colors disabled:opacity-50"
                      >
                        {updating === order.id ? 'Updating...' : 'Confirm Pickup'}
                      </button>
                    )}

                    {order.status === 'completed' && (
                      <p className="text-sm font-medium text-green-600">Order Fulfilled</p>
                    )}
                  </div>

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
