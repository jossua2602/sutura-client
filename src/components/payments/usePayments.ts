import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';

export type Tab = 'receipts' | 'job_balances' | 'catalog_orders';

export interface ReceiptItem {
  id: number;
  type: 'appointment' | 'catalog_order';
  customer_name: string;
  customer_email: string;
  itemName: string;
  payment_method: string;
  payment_reference: string;
  payment_receipt_path: string;
  amount: string | number;
  date: string;
  status: string;
  payment_status: string;
}

export interface JobBalanceItem {
  id: number;
  order_number: string;
  customer: { id: number; name: string } | null;
  total_amount: number;
  balance: number;
  payment_status: string;
  status: string;
}

export interface CatalogOrderItem {
  id: number;
  customer: { id: number; name: string } | null;
  catalog_item: { name: string } | null;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  status: string;
  created_at: string;
}

interface AppointmentReceiptSource {
  id: number;
  payment_method?: string;
  payment_status: string;
  customer?: { name?: string; email?: string } | null;
  appointment_type?: string;
  service?: { name?: string; base_price?: string | number } | null;
  payment_reference?: string;
  payment_receipt_path?: string;
  scheduled_at: string;
  status: string;
}

interface OrderReceiptSource {
  id: number;
  payment_method?: string;
  payment_status: string;
  customer?: { name?: string; email?: string } | null;
  catalog_item?: { name?: string } | null;
  payment_reference?: string;
  payment_receipt_path?: string;
  total_amount: string | number;
  created_at: string;
  status: string;
}

interface RawJobData {
  id: number;
  order_number?: string;
  customer: { id: number; name: string } | null;
  total_amount: string | number;
  balance: string | number;
  payment_status: string;
  status: string;
}

export function usePayments() {
  const { shop } = useAuthStore();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('receipts');

  // Receipts tab
  const [receipts, setReceipts] = useState<ReceiptItem[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptItem | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [receiptsLoading, setReceiptsLoading] = useState(true);

  // Job Balances tab
  const [jobBalances, setJobBalances] = useState<JobBalanceItem[]>([]);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [balanceSearch, setBalanceSearch] = useState('');
  const [logPaymentJob, setLogPaymentJob] = useState<JobBalanceItem | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [payNotes, setPayNotes] = useState('');
  const [payReference, setPayReference] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);

  // Catalog Orders tab
  const [catalogOrders, setCatalogOrders] = useState<CatalogOrderItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // Fetch receipts queue
  const fetchReceipts = useCallback(async () => {
    if (!shop) return;
    setReceiptsLoading(true);
    try {
      const [aptRes, ordRes] = await Promise.all([
        api.get(`/shops/${shop.id}/appointments`),
        api.get(`/shops/${shop.id}/catalog-orders`),
      ]);
      const items: ReceiptItem[] = [];
      if (aptRes.data.success) {
        aptRes.data.data.forEach((app: AppointmentReceiptSource) => {
          if (app.payment_method && app.payment_method !== 'cash' && app.payment_status === 'pending') {
            items.push({
              id: app.id, type: 'appointment',
              customer_name: app.customer?.name || 'Guest',
              customer_email: app.customer?.email || '',
              itemName: `${app.appointment_type?.toUpperCase()} – ${app.service?.name || 'Consultation'}`,
              payment_method: app.payment_method,
              payment_reference: app.payment_reference || 'N/A',
              payment_receipt_path: app.payment_receipt_path || '',
              amount: app.service?.base_price || '0.00',
              date: app.scheduled_at,
              status: app.status,
              payment_status: app.payment_status,
            });
          }
        });
      }
      if (ordRes.data.data) {
        ordRes.data.data.forEach((ord: OrderReceiptSource) => {
          if (ord.payment_method && ord.payment_method !== 'cash' && ord.payment_status === 'pending') {
            items.push({
              id: ord.id, type: 'catalog_order',
              customer_name: ord.customer?.name || 'Guest',
              customer_email: ord.customer?.email || '',
              itemName: ord.catalog_item?.name || 'Catalog Purchase',
              payment_method: ord.payment_method,
              payment_reference: ord.payment_reference || 'N/A',
              payment_receipt_path: ord.payment_receipt_path || '',
              amount: ord.total_amount,
              date: ord.created_at,
              status: ord.status,
              payment_status: ord.payment_status,
            });
          }
        });
      }
      setReceipts(items);
    } catch (err) {
      console.error(err);
    } finally {
      setReceiptsLoading(false);
    }
  }, [shop]);

  // Fetch job balances
  const fetchJobBalances = useCallback(async () => {
    if (!shop) return;
    setBalancesLoading(true);
    try {
      const res = await api.get(`/shops/${shop.id}/jobs`, { params: { per_page: 500 } });
      const raw = res.data.data;
      const jobs: RawJobData[] = Array.isArray(raw) ? raw : (raw?.data || []);
      const withBalance = jobs
        .filter(j => j.payment_status !== 'paid' && j.status !== 'cancelled')
        .map(j => ({
          id: j.id,
          order_number: j.order_number || `#${j.id}`,
          customer: j.customer || null,
          total_amount: Number.parseFloat(String(j.total_amount)),
          balance: Number.parseFloat(String(j.balance)),
          payment_status: j.payment_status,
          status: j.status,
        }));
      setJobBalances(withBalance);
    } catch (err) {
      console.error(err);
    } finally {
      setBalancesLoading(false);
    }
  }, [shop]);

  // Fetch catalog orders
  const fetchCatalogOrders = useCallback(async () => {
    if (!shop) return;
    setCatalogLoading(true);
    try {
      const res = await api.get(`/shops/${shop.id}/catalog-orders`);
      setCatalogOrders(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCatalogLoading(false);
    }
  }, [shop]);

  useEffect(() => {
    if (!shop) return;
    const timer = setTimeout(() => {
      fetchReceipts();
    }, 0);
    return () => clearTimeout(timer);
  }, [shop, fetchReceipts]);

  useEffect(() => {
    if (!shop) return;
    const timer = setTimeout(() => {
      if (activeTab === 'job_balances') fetchJobBalances();
      if (activeTab === 'catalog_orders') fetchCatalogOrders();
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, shop, fetchJobBalances, fetchCatalogOrders]);

  // Verify receipt
  const handleVerify = async (item: ReceiptItem, status: 'paid' | 'pending' | 'rejected') => {
    if (!shop) return;
    setProcessingId(item.id);
    try {
      const endpoint = item.type === 'appointment'
        ? `/shops/${shop.id}/appointments/${item.id}/verify-payment`
        : `/shops/${shop.id}/catalog-orders/${item.id}/verify-payment`;
      await api.put(endpoint, { payment_status: status });
      toast.success(status === 'rejected' ? 'Receipt rejected.' : 'Payment verified successfully!');
      setSelectedReceipt(null);
      fetchReceipts();
    } catch {
      toast.error('Failed to verify payment. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Log job payment
  const handleLogPayment = async () => {
    if (!shop || !logPaymentJob) return;
    const amt = Number.parseFloat(payAmount);
    if (!amt || amt <= 0) return;
    setPaySubmitting(true);
    try {
      const noteStr = [payReference ? `Ref: ${payReference}` : '', payNotes].filter(Boolean).join(' | ');
      await api.post(`/shops/${shop.id}/jobs/${logPaymentJob.id}/pay`, {
        amount: amt,
        payment_method: payMethod,
        notes: noteStr || undefined,
      });
      toast.success(`₱${amt.toFixed(2)} payment logged for ${logPaymentJob.order_number}`);
      setLogPaymentJob(null);
      setPayAmount('');
      setPayNotes('');
      setPayReference('');
      fetchJobBalances();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Payment failed');
    } finally {
      setPaySubmitting(false);
    }
  };

  const filteredBalances = jobBalances.filter(j => {
    if (!balanceSearch) return true;
    return j.order_number.toLowerCase().includes(balanceSearch.toLowerCase())
      || (j.customer?.name || '').toLowerCase().includes(balanceSearch.toLowerCase());
  });

  return {
    shop,
    activeTab,
    setActiveTab,
    receipts,
    selectedReceipt,
    setSelectedReceipt,
    processingId,
    receiptsLoading,
    jobBalances,
    balancesLoading,
    balanceSearch,
    setBalanceSearch,
    logPaymentJob,
    setLogPaymentJob,
    payAmount,
    setPayAmount,
    payMethod,
    setPayMethod,
    payNotes,
    setPayNotes,
    payReference,
    setPayReference,
    paySubmitting,
    catalogOrders,
    catalogLoading,
    handleVerify,
    handleLogPayment,
    filteredBalances,
  };
}
