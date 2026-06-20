'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2, Save, Trash2, Truck, ShoppingBag, Store, Navigation, ExternalLink } from 'lucide-react';
import Modal from '@/components/Modal';
import Link from 'next/link';
import { parseCourierName, serializeCourierName } from '@/lib/fulfillment';

const COURIER_OPTIONS = [
  { id: 'lalamove', label: 'Lalamove', type: 'delivery' },
  { id: 'toktok', label: 'Toktok', type: 'delivery' },
  { id: 'grab', label: 'Grab Express', type: 'delivery' },
  { id: 'jnt', label: 'J&T Express', type: 'shipping' },
  { id: 'lbc', label: 'LBC Express', type: 'shipping' },
  { id: 'jrs', label: 'JRS Express', type: 'shipping' },
];

interface Job {
  id: number;
  order_number: string;
  order_type: string;
  status: string;
  payment_status: string;
  balance: number | string;
  total_amount: number | string;
  notes?: string;
  deadline?: string;
  due_date?: string;
  courier_name?: string;
  courier_tracking_number?: string;
  shipping_address?: string;
  customer?: { name: string; id: number };
  service?: { name: string; id: number };
  assigned_staff?: { name: string; id: number };
  staff_stages?: { id: number; pivot: { stage: string; completed_at?: string } }[];
  custom_order_data?: Record<string, string> | null;
}

interface Staff {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

export default function JobDetailPage({ params }: Readonly<{ params: Readonly<{ id: string }> }>) {
  const { shop } = useAuthStore();
  const router = useRouter();
  
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

  // Fulfillment states
  const [fulfillmentType, setFulfillmentType] = useState<'shipping' | 'delivery' | 'pickup'>('shipping');
  const [fulfillmentProvider, setFulfillmentProvider] = useState('');
  const [supportedCouriers, setSupportedCouriers] = useState<string[]>([]);

  // Staff Assignment
  const [allStaff, setAllStaff] = useState<Staff[]>([]);
  const [staffAssignments, setStaffAssignments] = useState<Record<string, string>>({
    cutting: '',
    sewing: '',
    finishing: ''
  });
  const [staffCompletions, setStaffCompletions] = useState<Record<string, string | null>>({
    cutting: null,
    sewing: null,
    finishing: null
  });
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    if (shop && params.id) {
      // Fetch Job Details
      api.get(`/shops/${shop.id}/jobs/${params.id}`)
        .then(res => {
          const data = res.data.data;
          setJob(data);
          setStatus(data.status);
          setPaymentStatus(data.payment_status);
          setBalance(data.balance);
          setNotes(data.notes || '');
          setCourierTracking(data.courier_tracking_number || '');
          setShippingAddress(data.shipping_address || '');
          
          const parsed = parseCourierName(data.courier_name);
          setFulfillmentType(parsed.type);
          setFulfillmentProvider(parsed.name);
          
          // Populate existing staff stages
          const assignments: Record<string, string> = { cutting: '', sewing: '', finishing: '' };
          const completions: Record<string, string | null> = { cutting: null, sewing: null, finishing: null };
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
    }
  }, [shop, params.id]);

  const handleUpdate = async () => {
    if (!shop) return;
    setSaving(true);
    
    const isPickup = fulfillmentType === 'pickup';
    const courierNameVal = serializeCourierName(fulfillmentType, fulfillmentProvider || 'Other');

    try {
      await api.put(`/shops/${shop.id}/jobs/${params.id}`, {
        status,
        payment_status: paymentStatus,
        balance: Number.parseFloat(balance),
        notes,
        courier_name: courierNameVal,
        courier_tracking_number: isPickup ? null : (courierTracking || null),
        shipping_address: isPickup ? 'Store Pickup' : (shippingAddress || null),
      });
      // Refresh
      const res = await api.get(`/shops/${shop.id}/jobs/${params.id}`);
      const data = res.data.data;
      setJob(data);
      setCourierTracking(data.courier_tracking_number || '');
      setShippingAddress(data.shipping_address || '');
      
      const parsed = parseCourierName(data.courier_name);
      setFulfillmentType(parsed.type);
      setFulfillmentProvider(parsed.name);
    } catch (err) {
      console.error('Failed to update', err);
    } finally {
      setSaving(false);
    }
  };

  const getFilteredCouriers = () => {
    const options = COURIER_OPTIONS.filter(c => c.type === fulfillmentType);
    if (supportedCouriers.length === 0) return options;
    const filtered = options.filter(c => supportedCouriers.includes(c.id));
    return filtered.length > 0 ? filtered : options;
  };

  const handleUpdateStaff = async () => {
    if (!shop) return;
    setSavingStaff(true);
    try {
      const assignments = Object.entries(staffAssignments)
        .filter(([, userId]) => userId) // only non-empty
        .map(([stage, userId]) => ({ stage, user_id: userId }));

      await api.post(`/shops/${shop.id}/jobs/${params.id}/staff`, {
        assignments
      });
      
      const res = await api.get(`/shops/${shop.id}/jobs/${params.id}`);
      setJob(res.data.data);
      alert('Staff assigned successfully!');
    } catch (err: unknown) {
      console.error('Failed to update staff', err);
      alert('Failed to update staff assignments.');
    } finally {
      setSavingStaff(false);
    }
  };

  const handleDelete = async () => {
    if (!shop || !job) return;
    setIsDeleting(true);
    try {
      await api.delete(`/shops/${shop.id}/jobs/${job.id}`);
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete job order.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#A8A19A]">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading job order details...
      </div>
    );
  }

  if (!job) {
    return <div className="text-[#A8A19A]">Job Order not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#827A73] hover:text-[#2D2A26] transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight flex items-center gap-2">
              {job.order_number}
              {job.order_type === 'online' ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  <ShoppingBag size={11} /> Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold bg-[#F0EAE3] text-[#827A73] px-2 py-0.5 rounded-full">
                  <Store size={11} /> Walk-in
                </span>
              )}
            </h1>
            <p className="text-[#827A73] text-sm mt-1">Manage lifecycle and financials</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 rounded-lg bg-white shadow-sm border border-[#EBE6E0] text-[#A8A19A] hover:text-[#B26959] transition-colors flex items-center gap-2"
          >
            <Trash2 size={18} />
          </button>
          <button
            onClick={handleUpdate}
            disabled={saving}
            className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Job Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[#A8A19A] block mb-1">Customer</span>
                {job.customer ? (
                  <Link 
                    href={`/dashboard/customers/${job.customer.id}`} 
                    className="text-[#9A8073] hover:text-[#9A8073]/80 hover:underline font-semibold flex items-center gap-1.5"
                  >
                    {job.customer.name}
                    <span className="text-[10px] text-[#A8A19A] font-normal">(View Profile)</span>
                  </Link>
                ) : (
                  <span className="text-[#524A44] font-medium">Unspecified</span>
                )}
              </div>
              <div>
                <span className="text-[#A8A19A] block mb-1">Service</span>
                <span className="text-[#524A44] font-medium">{job.service?.name}</span>
              </div>
              <div>
                <span className="text-[#A8A19A] block mb-1">Assigned Staff</span>
                <span className="text-[#524A44] font-medium">{job.assigned_staff?.name || 'Unassigned'}</span>
              </div>
              <div>
                <span className="text-[#A8A19A] block mb-1">Total Amount</span>
                <span className="text-[#524A44] font-medium">₱{Number.parseFloat(job.total_amount as string).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Custom Specifications Card */}
          {job.custom_order_data && Object.keys(job.custom_order_data).length > 0 ? (
            <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
              <h2 className="text-lg font-medium text-[#2D2A26] mb-4">📋 Custom Specifications</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(job.custom_order_data).map(([label, value]) => (
                  <div key={label}>
                    <span className="text-[#A8A19A] block mb-1">{label}</span>
                    <span className="text-[#524A44] font-medium">{value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-5">Production Timeline</h2>

            {(() => {
              const STAGES = [
                { key: 'pending',          label: 'Pending',     emoji: '🕐' },
                { key: 'cutting',          label: 'Cutting',     emoji: '✂️' },
                { key: 'sewing',           label: 'Sewing',      emoji: '🧵' },
                { key: 'fitting',          label: 'Fitting',     emoji: '📐' },
                { key: 'ready_for_pickup', label: 'Ready',       emoji: '📦' },
                { key: 'completed',        label: 'Completed',   emoji: '✅' },
              ];
              const cancelled = status === 'cancelled';
              const currentIdx = STAGES.findIndex(s => s.key === status);
              return (
                <div className="mb-6">
                  {cancelled ? (
                    <div className="flex items-center justify-center gap-3 py-4 bg-red-50 border border-red-200 rounded-xl">
                      <span className="text-xl">🚫</span>
                      <span className="text-sm font-semibold text-red-600">Order Cancelled</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      {STAGES.map((stage, idx) => {
                        const isDone     = idx < currentIdx;
                        const isCurrent  = idx === currentIdx;
                        let iconClass = 'bg-[#F0EAE3] border-[#EBE6E0] text-[#A8A19A] group-hover:border-[#9A8073]/40';
                        if (isDone) {
                          iconClass = 'bg-[#7A8B76] border-[#7A8B76] text-white';
                        } else if (isCurrent) {
                          iconClass = 'bg-[#9A8073] border-[#9A8073] text-white shadow-lg ring-2 ring-[#9A8073]/30';
                        }

                        let labelColor = 'text-[#A8A19A]';
                        if (isCurrent) {
                          labelColor = 'text-[#9A8073]';
                        } else if (isDone) {
                          labelColor = 'text-[#7A8B76]';
                        }

                        return (
                          <div key={stage.key} className="flex items-center flex-1 min-w-0">
                            <button
                              onClick={() => setStatus(stage.key)}
                              className="flex flex-col items-center gap-1.5 flex-1 min-w-0 group"
                              title={`Set to ${stage.label}`}
                            >
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base transition-all border-2 ${iconClass}`}>
                                {isDone ? '✓' : stage.emoji}
                              </div>
                              <span className={`text-[10px] font-medium text-center leading-tight px-0.5 ${labelColor}`}>
                                {stage.label}
                              </span>
                            </button>
                            {idx < STAGES.length - 1 && (
                              <div className={`h-0.5 shrink-0 w-3 ${idx < currentIdx ? 'bg-[#7A8B76]' : 'bg-[#EBE6E0]'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {!cancelled && (
                    <div className="mt-4 px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl flex items-center justify-between">
                      <span className="text-xs text-[#A8A19A]">Current stage</span>
                      <span className="text-sm font-semibold text-[#9A8073]">
                        {STAGES.find(s => s.key === status)?.label ?? status}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="update-production-phase" className="text-sm font-medium text-[#524A44]">Update Production Phase</label>
                <select
                  id="update-production-phase"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                >
                  <option value="pending">Pending</option>
                  <option value="cutting">Cutting</option>
                  <option value="sewing">Sewing</option>
                  <option value="fitting">Fitting</option>
                  {job.order_type === 'walk_in' && (
                    <option value="ready_for_pickup">Ready for Pickup</option>
                  )}
                  {job.order_type === 'online' && (
                    <>
                      <option value="packed">Packed</option>
                      <option value="handed_to_courier">
                        {fulfillmentType === 'delivery' ? 'Dispatched / Handed to Rider' :
                         fulfillmentType === 'pickup' ? 'Ready for Pickup / Handed Over' :
                         'Shipped / Handed to Courier'}
                      </option>
                    </>
                  )}
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="space-y-1">
                <label htmlFor="notes-remarks" className="text-sm font-medium text-[#524A44]">Notes / Remarks</label>
                <textarea
                  id="notes-remarks"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                  placeholder="e.g. Needs adjustments on the sleeves..."
                />
              </div>
            </div>
          </div>

          {/* Fulfillment Details Section — Online orders only */}
          {job.order_type === 'online' && (
            <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {fulfillmentType === 'delivery' ? (
                    <Navigation className="w-5 h-5 text-blue-600 animate-pulse" />
                  ) : fulfillmentType === 'pickup' ? (
                    <Store className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Truck className="w-5 h-5 text-blue-600" />
                  )}
                  <h2 className="text-lg font-medium text-[#2D2A26]">Fulfillment Details</h2>
                </div>
                {fulfillmentType !== 'pickup' && courierTracking?.startsWith('http') && (
                  <a
                    href={courierTracking}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Track Delivery <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <p className="text-xs text-blue-700 bg-blue-100/60 px-3 py-2 rounded-lg">
                Update fulfillment method, service provider, and tracking details. Customers see this info.
              </p>

              <div>
                <span className="block text-sm font-medium text-blue-800 mb-2">Fulfillment Method</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'shipping', label: 'Shipping', icon: Truck },
                    { id: 'delivery', label: 'Local Delivery', icon: Navigation },
                    { id: 'pickup', label: 'Store Pickup', icon: Store },
                  ].map(method => {
                    const Icon = method.icon;
                    const isSelected = fulfillmentType === method.id;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => {
                          setFulfillmentType(method.id as 'shipping' | 'delivery' | 'pickup');
                          setFulfillmentProvider('');
                        }}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-100/50 text-blue-700 font-semibold shadow-sm'
                            : 'border-blue-200/40 bg-white/70 text-blue-600 hover:border-blue-300'
                        }`}
                      >
                        <Icon size={14} className="mb-0.5" />
                        <span className="text-[11px]">{method.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {fulfillmentType !== 'pickup' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="courier-delivery-service" className="block text-xs font-semibold text-blue-800 mb-1">
                      Service Provider / Courier
                    </label>
                    <select
                      id="courier-delivery-service"
                      value={fulfillmentProvider}
                      onChange={e => setFulfillmentProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
                    >
                      <option value="">— Select provider —</option>
                      {getFilteredCouriers().map(c => (
                        <option key={c.id} value={c.label}>{c.label}</option>
                      ))}
                      <option value="Other">Other / Self-Managed</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="tracking-number" className="block text-xs font-semibold text-blue-800 mb-1">
                      {fulfillmentType === 'shipping' ? 'Tracking Number' : 'Booking Link / Rider Contact'}
                    </label>
                    <input
                      id="tracking-number"
                      type="text"
                      placeholder={fulfillmentType === 'shipping' ? 'e.g. J&T-12345678' : 'e.g. Grab Link / Contact'}
                      value={courierTracking}
                      onChange={e => setCourierTracking(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              )}

              {fulfillmentType !== 'pickup' ? (
                <div>
                  <label htmlFor="shipping-address" className="block text-xs font-semibold text-blue-800 mb-1">
                    {fulfillmentType === 'shipping' ? 'Shipping Address' : 'Delivery Address'}
                  </label>
                  <input
                    id="shipping-address"
                    type="text"
                    placeholder="Customer's address details..."
                    value={shippingAddress}
                    onChange={e => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
                  />
                </div>
              ) : (
                <div className="bg-blue-100/30 border border-blue-200/50 rounded-lg p-3 text-xs text-blue-700 flex items-center gap-2">
                  <Store size={14} className="shrink-0" />
                  <span>Customer will pick up garments in-store. (Shop address will be used)</span>
                </div>
              )}
            </div>
          )}

          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Multi-Stage Staff Assignment</h2>
            <div className="space-y-4">
              {['cutting', 'sewing', 'finishing'].map(stage => (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[#524A44] capitalize">{stage} Staff</label>
                    {staffAssignments[stage] && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        staffCompletions[stage] 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {staffCompletions[stage] ? 'Completed' : 'In Progress'}
                      </span>
                    )}
                  </div>
                  <select
                    value={staffAssignments[stage]}
                    onChange={(e) => setStaffAssignments({...staffAssignments, [stage]: e.target.value})}
                    className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                  >
                    <option value="">Unassigned</option>
                    {allStaff.map(staff => (
                      <option key={staff.id} value={staff.user.id}>{staff.user.name} ({staff.user.email})</option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="pt-2">
                <button
                  onClick={handleUpdateStaff}
                  disabled={savingStaff}
                  className="w-full bg-[#F0EAE3] hover:bg-[#EBE6E0] border border-[#D1C7BD] text-[#2D2A26] px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingStaff ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={18} />}
                  Save Staff Assignments
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Financials (POS)</h2>
            <div className="space-y-6">
              
              <div className="flex justify-between items-end border-b border-[#EBE6E0] pb-4">
                <div>
                  <div className="text-sm text-[#A8A19A] mb-1">Total Amount</div>
                  <div className="text-xl font-medium text-[#2D2A26]">₱{Number.parseFloat(job.total_amount as string).toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-[#A8A19A] mb-1">Status</div>
                  {(() => {
                    let badgeClass = 'bg-[#B26959]/10 text-[#B26959] border border-[#B26959]/20';
                    if (job.payment_status === 'paid') {
                      badgeClass = 'bg-[#7A8B76]/10 text-[#7A8B76] border border-[#7A8B76]/20';
                    } else if (job.payment_status === 'partial') {
                      badgeClass = 'bg-[#BCA89F]/10 text-[#BCA89F] border border-[#BCA89F]/20';
                    }
                    return (
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium shadow-sm uppercase tracking-wide ${badgeClass}`}>
                        {job.payment_status}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="bg-[#FAF6F3] p-4 rounded-xl border border-[#EBE6E0]">
                <div className="text-sm text-[#A8A19A] mb-2">Remaining Balance</div>
                <div className="text-3xl font-bold text-taupe mb-4">
                  ₱{Number.parseFloat(job.balance as string).toFixed(2)}
                </div>

                {Number.parseFloat(job.balance as string) > 0 ? (
                  <form 
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formEl = e.currentTarget;
                      const input = formEl.elements.namedItem('amount') as HTMLInputElement;
                      const amt = Number.parseFloat(input.value);
                      if (!amt || amt <= 0) return;
                      
                      setSaving(true);
                      try {
                        await api.post(`/shops/${shop?.id}/jobs/${job.id}/pay`, { amount: amt });
                        const res = await api.get(`/shops/${shop?.id}/jobs/${job.id}`);
                        setJob(res.data.data);
                        setBalance(res.data.data.balance);
                        setPaymentStatus(res.data.data.payment_status);
                        input.value = '';
                        alert('Payment successfully logged!');
                      } catch(err: unknown) {
                        const error = err as { response?: { data?: { message?: string } } };
                        alert(error.response?.data?.message || 'Payment failed');
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className="space-y-3"
                  >
                    <label htmlFor="payment-amount" className="text-xs font-medium text-[#827A73] block">Log a Payment</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]">₱</span>
                        <input 
                          id="payment-amount"
                          type="number" 
                          name="amount"
                          step="0.01" 
                          max={Number.parseFloat(String(job.balance))}
                          required
                          placeholder="0.00"
                          className="w-full pl-8 pr-4 py-2 bg-white shadow-sm border border-[#D1C7BD] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={saving}
                        className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                      >
                        Charge
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="text-center py-4 bg-[#7A8B76]/10 rounded-lg border border-[#7A8B76]/20 text-[#7A8B76] font-medium text-sm">
                    Fully Paid
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-[#524A44] text-sm">
            Are you sure you want to delete this job order? This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
            <button 
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isDeleting && <Loader2 size={16} className="animate-spin" />}
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
