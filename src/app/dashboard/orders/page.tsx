'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

import { CatalogOrder } from '@/components/orders/orderHelpers';
import OrderListView from '@/components/orders/OrderListView';

export default function OrdersPage() {
  const { shop, user } = useAuthStore();
  const [orders, setOrders] = useState<CatalogOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'walkin' | 'online'>('online');
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchOrders = () => {
    if (!shop) return;
    setLoading(true);
    api.get(`/shops/${shop.id}/catalog-orders`)
      .then(res => {
        setOrders(res.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (shop) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchOrders();
    } else if (user) {
      setTimeout(() => setLoading(false), 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, user]);

  const updateStatus = async (orderId: number, newStatus: string, extra = {}) => {
    if (!shop) return;
    setUpdating(orderId);
    try {
      await api.put(`/shops/${shop.id}/catalog-orders/${orderId}`, { status: newStatus, ...extra });
      fetchOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(null);
    }
  };

  const filteredOrders = orders.filter(o => o.type === activeTab);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8A7E72]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#2D2A26]">
      <div>
        <h1 className="text-2xl font-semibold text-[#2D2A26]">Ready-to-Wear Orders</h1>
        <p className="text-sm text-[#524A44] mt-1">Manage premade catalog purchases and deliveries</p>
      </div>

      <OrderListView
        filteredOrders={filteredOrders}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        updating={updating}
        onUpdateStatus={updateStatus}
      />
    </div>
  );
}
