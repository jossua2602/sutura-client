import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import { parseCourierName, serializeCourierName } from '@/lib/fulfillment';
import { Job, Staff } from './jobTypes';

export function useJobDetail(jobId: string) {
  const { shop } = useAuthStore();
  const router = useRouter();
  const toast = useToast();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Editable fields
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [balance, setBalance] = useState('');
  const [notes, setNotes] = useState('');
  const [courierTracking, setCourierTracking] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [completionPhotoUrl, setCompletionPhotoUrl] = useState('');
  
  // Outsourcing
  const [isOutsourced, setIsOutsourced] = useState(false);
  const [partnerShopName, setPartnerShopName] = useState('');
  const [outsourcingCost, setOutsourcingCost] = useState('');

  // Fulfillment states
  const [fulfillmentType, setFulfillmentType] = useState<'shipping' | 'delivery' | 'pickup'>('shipping');
  const [fulfillmentProvider, setFulfillmentProvider] = useState('');
  const [supportedCouriers, setSupportedCouriers] = useState<string[]>([]);

  // Staff Assignment
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<Record<string, string>>({
    design: '',
    pattern_making: '',
    cutting: '',
    sewing: '',
    finishing: ''
  });
  const [staffCompletions, setStaffCompletions] = useState<Record<string, string | null>>({
    design: null,
    pattern_making: null,
    cutting: null,
    sewing: null,
    finishing: null
  });
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (shop && jobId) {
      timer = setTimeout(() => setLoading(true), 0);
      // Fetch Job Details
      api.get(`/shops/${shop.id}/jobs/${jobId}`)
        .then(res => {
          const data = res.data.data;
          setJob(data);
          setStatus(data.status);
          setPaymentStatus(data.payment_status);
          setBalance(data.balance);
          setNotes(data.notes || '');
          setCourierTracking(data.courier_tracking_number || '');
          setShippingAddress(data.shipping_address || '');
          setCompletionPhotoUrl(data.completion_photo_url || '');
          setIsOutsourced(data.is_outsourced || false);
          setPartnerShopName(data.partner_shop_name || '');
          setOutsourcingCost(data.outsourcing_cost != null ? String(data.outsourcing_cost) : '');
          
          const parsed = parseCourierName(data.courier_name);
          setFulfillmentType(parsed.type);
          setFulfillmentProvider(parsed.name);
          
          // Populate existing staff stages
          const assignments: Record<string, string> = { design: '', pattern_making: '', cutting: '', sewing: '', fitting: '', finishing: '' };
          const completions: Record<string, string | null> = { design: null, pattern_making: null, cutting: null, sewing: null, fitting: null, finishing: null };
          if (data.staff_stages) {
             data.staff_stages.forEach((staff: { id: number; pivot: { stage: string; completed_at?: string } }) => {
                assignments[staff.pivot.stage] = staff.id.toString();
                completions[staff.pivot.stage] = staff.pivot.completed_at || null;
             });
          }
          setStaffAssignments(assignments);
          setStaffCompletions(completions);
          
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });

      // Fetch Staff for assignment dropdown
      api.get(`/shops/${shop.id}/staff`)
        .then(res => {
          setAllStaff(res.data.data);
        })
        .catch(console.error);

      // Fetch shop details for supported couriers
      api.get(`/shops/${shop.id}`)
        .then(res => {
          const s = res.data.data;
          setSupportedCouriers(Array.isArray(s.supported_couriers) ? s.supported_couriers : []);
        })
        .catch(console.error);
    } else {
      timer = setTimeout(() => setLoading(false), 0);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [shop, jobId]);

  const handleUpdate = async () => {
    if (!shop) return;
    setSaving(true);
    
    const isPickup = fulfillmentType === 'pickup';
    const courierNameVal = serializeCourierName(fulfillmentType, fulfillmentProvider || 'Other');

    try {
      await api.put(`/shops/${shop.id}/jobs/${jobId}`, {
        status,
        payment_status: paymentStatus,
        balance: Number.parseFloat(balance),
        notes,
        // The fulfillment type is also encoded as a prefix inside
        // courier_name (for this form's own round-trip), but other
        // components (Production Timeline, the header badge) read the raw
        // fulfillment_type column directly — it has to be sent here too or
        // those go stale after switching e.g. Shipping to Store Pickup.
        fulfillment_type: fulfillmentType,
        courier_name: courierNameVal,
        courier_tracking_number: isPickup ? null : (courierTracking || null),
        shipping_address: isPickup ? 'Store Pickup' : (shippingAddress || null),
        is_outsourced: isOutsourced,
        partner_shop_name: isOutsourced ? partnerShopName : null,
        outsourcing_cost: isOutsourced && outsourcingCost ? Number.parseFloat(outsourcingCost) : null,
        completion_photo_url: completionPhotoUrl || null,
      });
      // Refresh
      const res = await api.get(`/shops/${shop.id}/jobs/${jobId}`);
      const data = res.data.data;
      setJob(data);
      setStatus(data.status);
      setPaymentStatus(data.payment_status);
      setCourierTracking(data.courier_tracking_number || '');
      setShippingAddress(data.shipping_address || '');
      setCompletionPhotoUrl(data.completion_photo_url || '');

      const parsed = parseCourierName(data.courier_name);
      setFulfillmentType(parsed.type);
      setFulfillmentProvider(parsed.name);
      toast.success('Job details updated successfully.');
    } catch (err: unknown) {
      console.error('Failed to update', err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update details.');
      // The Production Timeline renders off this local `status` state
      // optimistically as soon as the owner picks a new phase — if the save
      // was rejected (e.g. balance not paid), it has to snap back to the
      // last confirmed server value instead of showing a phase that never
      // actually took effect until the next reload.
      if (job) {
        setStatus(job.status);
        setPaymentStatus(job.payment_status);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!shop) return;
    setSavingStaff(true);
    try {
      const assignments = Object.entries(staffAssignments)
        .filter(([, userId]) => userId) // only non-empty
        .map(([stage, userId]) => ({ stage, user_id: userId }));

      await api.post(`/shops/${shop.id}/jobs/${jobId}/staff`, {
        assignments
      });
      
      const res = await api.get(`/shops/${shop.id}/jobs/${jobId}`);
      const data = res.data.data;
      setJob(data);
      
      const completions: Record<string, string | null> = { design: null, pattern_making: null, cutting: null, sewing: null, fitting: null, finishing: null };
      if (data.staff_stages) {
         data.staff_stages.forEach((staff: { id: number; pivot: { stage: string; completed_at?: string } }) => {
            completions[staff.pivot.stage] = staff.pivot.completed_at || null;
         });
      }
      setStaffCompletions(completions);
      toast.success('Staff assigned successfully!');
    } catch (err: unknown) {
      console.error('Failed to update staff', err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update staff assignments.');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleChargePayment = async (amount: number, method: string, notesVal: string, reference?: string) => {
    if (!shop || !job) return;
    setSaving(true);
    try {
      await api.post(`/shops/${shop.id}/jobs/${job.id}/pay`, {
        amount,
        payment_method: method,
        reference: reference || undefined,
        notes: notesVal || undefined
      });
      const res = await api.get(`/shops/${shop.id}/jobs/${job.id}`);
      const updatedJob = res.data.data;
      setJob(updatedJob);
      setBalance(updatedJob.balance);
      setPaymentStatus(updatedJob.payment_status);

      // A payment below the 50% downpayment threshold is still valid (it
      // counts toward it), but saying just "logged successfully" reads as
      // if the shop's downpayment policy has been satisfied — so call out
      // the remaining shortfall instead of leaving that unqualified.
      const totalAmt = Number.parseFloat(String(updatedJob.total_amount)) || 0;
      const paidSoFar = totalAmt - (Number.parseFloat(String(updatedJob.balance)) || 0);
      const requiredDp = totalAmt * 0.5;
      if (paidSoFar < requiredDp) {
        toast.success(`₱${amount.toFixed(2)} payment logged. ₱${(requiredDp - paidSoFar).toFixed(2)} more is needed to reach the required 50% downpayment.`);
      } else {
        toast.success(`₱${amount.toFixed(2)} payment logged successfully!`);
      }
    } catch(err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Payment failed');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // Corrects a payment's method/reference/receipt/notes after the fact —
  // amount is deliberately never sent here, it stays locked once logged.
  const handleUpdatePayment = async (paymentId: number, fields: { payment_method: string; reference?: string; notes?: string; receipt_path?: string }) => {
    if (!shop || !job) return;
    setSaving(true);
    try {
      await api.put(`/shops/${shop.id}/jobs/${job.id}/payments/${paymentId}`, {
        payment_method: fields.payment_method,
        reference: fields.reference || undefined,
        notes: fields.notes || undefined,
        receipt_path: fields.receipt_path || undefined,
      });
      const res = await api.get(`/shops/${shop.id}/jobs/${job.id}`);
      setJob(res.data.data);
      toast.success('Payment updated successfully!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update payment');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!shop || !job) return;
    setIsDeleting(true);
    try {
      await api.delete(`/shops/${shop.id}/jobs/${job.id}`);
      toast.success('Job order deleted successfully.');
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete job order.');
      setIsDeleting(false);
    }
  };

  return {
    shop,
    router,
    job,
    loading,
    saving,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDeleting,
    status,
    setStatus,
    paymentStatus,
    setPaymentStatus,
    balance,
    setBalance,
    notes,
    setNotes,
    courierTracking,
    setCourierTracking,
    shippingAddress,
    setShippingAddress,
    completionPhotoUrl,
    setCompletionPhotoUrl,
    isOutsourced,
    setIsOutsourced,
    partnerShopName,
    setPartnerShopName,
    outsourcingCost,
    setOutsourcingCost,
    fulfillmentType,
    setFulfillmentType,
    fulfillmentProvider,
    setFulfillmentProvider,
    supportedCouriers,
    allStaff,
    staffAssignments,
    setStaffAssignments,
    staffCompletions,
    savingStaff,
    handleUpdate,
    handleUpdateStaff,
    handleChargePayment,
    handleUpdatePayment,
    handleDelete,
  };
}
