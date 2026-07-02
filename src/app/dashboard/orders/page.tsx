'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { Search, ShoppingBag, Truck, Package, CheckCircle2, Clock } from 'lucide-react';

import { CatalogOrder } from '@/components/orders/orderHelpers';
import OrderListItem from '@/components/orders/OrderListItem';

type TypeFilter = 'walkin' | 'online';
type StatusFilter = 'all' | 'pending' | 'out_for_delivery' | 'ready' | 'completed';

const STATUS_TABS: { id: StatusFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'all',             label: 'All',         icon: <ShoppingBag size={14} /> },
  { id: 'pending',         label: 'Pending',     icon: <Clock size={14} /> },
  { id: 'out_for_delivery',label: 'Out for Delivery', icon: <Truck size={14} /> },
  { id: 'ready',           label: 'Ready',       icon: <Package size={14} /> },
  { id: 'completed',       label: 'Completed',   icon: <CheckCircle2 size={14} /> },
];

export default function OrdersPage() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const [orders, setOrders] = useState<CatalogOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeTab, setTypeTab] = useState<TypeFilter>('online');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<number | null>(null);

  const fetchOrders = useCallback(() => {
    if (!shop) return;
    const timer = setTimeout(() => setLoading(true), 0);
    api.get(`/shops/${shop.id}/catalog-orders`)
      .then(res => {
        setOrders(res.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    return () => clearTimeout(timer);
  }, [shop]);

  useEffect(() => {
    if (shop) {
      const cleanup = fetchOrders();
      return () => {
        if (cleanup) cleanup();
      };
    } else if (user) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [shop, user, fetchOrders]);

  const updateStatus = async (orderId: number, newStatus: string, extra: Record<string, string> = {}) => {
    if (!shop) return;
    setUpdating(orderId);
    try {
      await api.put(`/shops/${shop.id}/catalog-orders/${orderId}`, { status: newStatus, ...extra });
      toast.success(`Order status updated to "${newStatus.replaceAll('_', ' ')}"`);
      fetchOrders();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update order status.');
    } finally {
      setUpdating(null);
    }
  };

  // Filter logic
  const byType   = orders.filter(o => o.type === typeTab);
  const byStatus = statusFilter === 'all' ? byType : byType.filter(o => o.status === statusFilter);
  const filtered = search
    ? byStatus.filter(o =>
        (o.catalog_item?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (o.customer?.name || '').toLowerCase().includes(search.toLowerCase())
      )
    : byStatus;

  // Status counts for badges
  const countFor = (s: StatusFilter) =>
    s === 'all' ? byType.length : byType.filter(o => o.status === s).length;

  let noOrdersMessage = '';
  if (search) {
    noOrdersMessage = `No results for "${search}"`;
  } else {
    const orderTypeLabel = typeTab === 'online' ? 'delivery' : 'walk-in';
    const statusLabel = statusFilter === 'all' ? '' : `with status "${statusFilter}" `;
    noOrdersMessage = `No ${orderTypeLabel} orders ${statusLabel}yet.`;
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8A7E72]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[#2D2A26]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Ready-to-Wear Orders</h1>
          <p className="text-sm text-[#827A73] mt-1">
            Manage ready-made catalog purchases — online deliveries and walk-in pickups.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-[#A8A19A]">
          <ShoppingBag size={16} />
          <span>{orders.length} total orders</span>
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm">
        {/* Type tabs (online / walk-in) */}
        <div className="flex items-center border-b border-[#EBE6E0] bg-[#FAF6F3]">
          <button
            onClick={() => { setTypeTab('online'); setStatusFilter('all'); }}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              typeTab === 'online'
                ? 'border-taupe text-taupe bg-white'
                : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
            }`}
          >
            <Truck size={15} />
            Online Deliveries
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-600">
              {orders.filter(o => o.type === 'online').length}
            </span>
          </button>
          <button
            onClick={() => { setTypeTab('walkin'); setStatusFilter('all'); }}
            className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              typeTab === 'walkin'
                ? 'border-taupe text-taupe bg-white'
                : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
            }`}
          >
            <ShoppingBag size={15} />
            Walk-in Pickups
            <span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-[#F0EAE3] text-[#827A73]">
              {orders.filter(o => o.type === 'walkin').length}
            </span>
          </button>

          {/* Search */}
          <div className="ml-auto pr-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={15} />
              <input
                type="text"
                placeholder="Search product or customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe w-52"
              />
            </div>
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-[#EBE6E0] overflow-x-auto">
          {STATUS_TABS.map(t => {
            const count = countFor(t.id);
            return (
              <button
                key={t.id}
                onClick={() => setStatusFilter(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors whitespace-nowrap ${
                  statusFilter === t.id
                    ? 'bg-taupe text-white'
                    : 'bg-[#FAF6F3] border border-[#EBE6E0] text-[#827A73] hover:border-taupe hover:text-[#2D2A26]'
                }`}
              >
                {t.icon}
                {t.label}
                {count > 0 && (
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full ${
                    statusFilter === t.id ? 'bg-white/20 text-white' : 'bg-[#EBE6E0] text-[#827A73]'
                  }`}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Orders list */}
        <div className="p-5">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto h-12 w-12 text-[#C5BDBA] mb-3" />
              <h3 className="font-semibold text-[#2D2A26]">No orders found</h3>
              <p className="text-sm text-[#827A73] mt-1">
                {noOrdersMessage}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(order => (
                <OrderListItem
                  key={order.id}
                  order={order}
                  activeTab={typeTab}
                  updating={updating}
                  onUpdateStatus={updateStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
