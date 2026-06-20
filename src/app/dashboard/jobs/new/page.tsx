'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2, Store, ShoppingBag, Truck, Navigation } from 'lucide-react';
import Link from 'next/link';
import { serializeCourierName } from '@/lib/fulfillment';

const COURIER_OPTIONS = [
  { id: 'lalamove', label: 'Lalamove', type: 'delivery' },
  { id: 'toktok', label: 'Toktok', type: 'delivery' },
  { id: 'grab', label: 'Grab Express', type: 'delivery' },
  { id: 'jnt', label: 'J&T Express', type: 'shipping' },
  { id: 'lbc', label: 'LBC Express', type: 'shipping' },
  { id: 'jrs', label: 'JRS Express', type: 'shipping' },
];

interface CustomerData { id: number; name: string }
interface ServiceField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select';
  required: boolean;
  options?: string[];
}
interface ServiceData {
  id: number;
  name: string;
  custom_fields?: ServiceField[] | null;
}
interface StaffData { id: number; user: { id: number; name: string }, role: string }

export default function NewJobOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { shop , user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [staff, setStaff] = useState<StaffData[]>([]);

  // Fulfillment states for online orders
  const [fulfillmentType, setFulfillmentType] = useState<'shipping' | 'delivery' | 'pickup'>('shipping');
  const [fulfillmentProvider, setFulfillmentProvider] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [supportedCouriers, setSupportedCouriers] = useState<string[]>([]);

interface CustomerMeasurement {
  id: number;
  profile_name: string;
  updated_at: string;
}

  const [customerMeasurements, setCustomerMeasurements] = useState<CustomerMeasurement[]>([]);

  const [formData, setFormData] = useState({
    order_type: 'walk_in',
    customer_id: '',
    service_id: '',
    assigned_staff_id: '',
    measurement_id: '',
    total_amount: '',
    downpayment: '',
    due_date: '',
    notes: '',
    shipping_address: '',
  });
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (shop) {
      Promise.all([
        api.get(`/shops/${shop.id}/customers`),
        api.get(`/shops/${shop.id}/services`),
        api.get(`/shops/${shop.id}/staff`),
        api.get(`/shops/${shop.id}`) // Fetch full shop details to get supported couriers
      ]).then(([resCustomers, resServices, resStaff, resShop]) => {
        const custs = resCustomers.data.data || [];
        const servs = resServices.data.data || [];
        setCustomers(custs);
        setServices(servs);
        setStaff(resStaff.data.data || []);
        
        const shopDetails = resShop.data.data || {};
        setSupportedCouriers(Array.isArray(shopDetails.supported_couriers) ? shopDetails.supported_couriers : []);
        
        // Prefill from query params
        const qCust = searchParams.get('customer_id') || '';
        const qServ = searchParams.get('service_id') || '';
        const qNotes = searchParams.get('notes') || '';
        
        setFormData(prev => ({
          ...prev,
          customer_id: qCust,
          service_id: qServ,
          notes: qNotes
        }));

        if (qServ) {
          const selectedService = servs.find((s: ServiceData) => s.id.toString() === qServ);
          const fields = selectedService?.custom_fields || [];
          const initialValues: Record<string, string> = {};
          fields.forEach((f: ServiceField) => {
            initialValues[f.label] = '';
          });
          setCustomFieldValues(initialValues);
        }
        
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setError('Failed to load data.');
        setLoading(false);
      });
    } else if (user && !shop) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop, user, searchParams]);

  // Load customer measurements when customer is selected
  useEffect(() => {
    if (shop && formData.customer_id) {
      api.get(`/shops/${shop.id}/measurements?customer_id=${formData.customer_id}`)
        .then(res => {
          const measurements = res.data.data || [];
          setCustomerMeasurements(measurements);
          
          // Prefill measurement_id from search params if it matches one, or select the first one by default
          const qMeas = searchParams.get('measurement_id') || '';
          setFormData(prev => ({
            ...prev,
            measurement_id: qMeas || (measurements[0]?.id?.toString() || '')
          }));
        })
        .catch(err => {
          console.error('Failed to load customer measurements', err);
        });
    } else {
      const timer = setTimeout(() => {
        setCustomerMeasurements([]);
        setFormData(prev => ({ ...prev, measurement_id: '' }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [shop, formData.customer_id, searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shop) return;
    
    setSubmitting(true);
    setError('');

    const balance = Number.parseFloat(formData.total_amount) - Number.parseFloat(formData.downpayment || '0');
    
    const isOnline = formData.order_type === 'online';
    const addressVal = isOnline 
      ? (fulfillmentType === 'pickup' ? 'Store Pickup' : (formData.shipping_address || null))
      : null;
    const courierNameVal = isOnline 
      ? serializeCourierName(fulfillmentType, fulfillmentProvider || 'Other')
      : null;
    const courierTrackingVal = isOnline && fulfillmentType !== 'pickup' 
      ? (trackingNumber || null)
      : null;

    try {
      await api.post(`/shops/${shop.id}/jobs`, {
        order_type: formData.order_type,
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        assigned_staff_id: formData.assigned_staff_id || null,
        measurement_id: formData.measurement_id ? Number(formData.measurement_id) : null,
        total_amount: formData.total_amount,
        balance: balance,
        due_date: formData.due_date || null,
        notes: formData.notes,
        shipping_address: addressVal,
        courier_name: courierNameVal,
        courier_tracking_number: courierTrackingVal,
        custom_order_data: customFieldValues,
      });
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create job order.');
      setSubmitting(false);
    }
  };

  const getFilteredCouriers = () => {
    const options = COURIER_OPTIONS.filter(c => c.type === fulfillmentType);
    if (supportedCouriers.length === 0) return options;
    const filtered = options.filter(c => supportedCouriers.includes(c.id));
    return filtered.length > 0 ? filtered : options;
  };

  if (loading) {
    return <div className="py-12 text-center text-[#A8A19A] animate-pulse">Loading form data...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/jobs" className="p-2 bg-white shadow-sm border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#827A73] hover:text-[#2D2A26] transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Create Job Order</h1>
          <p className="text-[#827A73] text-sm mt-1">Start a new garment production workflow.</p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        {error && (
          <div className="mb-6 bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Type Toggle */}
          <div>
            <span className="block text-sm font-medium text-[#524A44] mb-2">Order Type <span className="text-[#B26959]">*</span></span>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({...formData, order_type: 'walk_in'})}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  formData.order_type === 'walk_in'
                    ? 'border-taupe bg-[#FAF6F3] text-[#2D2A26]'
                    : 'border-[#EBE6E0] text-[#A8A19A] hover:border-[#D1C7BD]'
                }`}
              >
                <Store size={18} />
                Walk-in
                <span className="text-[10px] font-normal opacity-70">Customer visits shop</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, order_type: 'online'})}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  formData.order_type === 'online'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-[#EBE6E0] text-[#A8A19A] hover:border-[#D1C7BD]'
                }`}
              >
                <ShoppingBag size={18} />
                Online
                <span className="text-[10px] font-normal opacity-70">Ships via courier</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="customer_id" className="block text-sm font-medium text-[#524A44] mb-1">Customer <span className="text-[#B26959]">*</span></label>
              <select
                id="customer_id"
                required
                value={formData.customer_id}
                onChange={e => setFormData({...formData, customer_id: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="" disabled>Select a customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="measurement_id" className="block text-sm font-medium text-[#524A44] mb-1">Measurement Profile</label>
              {formData.customer_id ? (
                customerMeasurements.length > 0 ? (
                  <select
                    id="measurement_id"
                    value={formData.measurement_id}
                    onChange={e => setFormData({...formData, measurement_id: e.target.value})}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] focus:outline-none focus:border-taupe"
                  >
                    <option value="">No profile selected / Consultation Only</option>
                    {customerMeasurements.map(m => (
                      <option key={m.id} value={m.id}>{m.profile_name} (Updated: {new Date(m.updated_at).toLocaleDateString()})</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-[#B26959] bg-[#B26959]/5 border border-[#B26959]/10 rounded-lg p-2.5 flex items-center justify-between">
                    <span>No measurement profiles found.</span>
                    <Link
                      href={`/dashboard/measurements?customer_id=${formData.customer_id}`}
                      className="font-semibold underline text-[#B26959] hover:text-[#B26959]/80 ml-2"
                    >
                      Record Measurements
                    </Link>
                  </div>
                )
              ) : (
                <p className="text-xs text-[#A8A19A] italic py-3">Please select a customer first.</p>
              )}
            </div>

            <div>
              <label htmlFor="service_id" className="block text-sm font-medium text-[#524A44] mb-1">Service Category <span className="text-[#B26959]">*</span></label>
              <select
                id="service_id"
                required
                value={formData.service_id}
                onChange={e => {
                  const val = e.target.value;
                  setFormData({...formData, service_id: val});
                  const selectedService = services.find(s => s.id.toString() === val);
                  const fields = selectedService?.custom_fields || [];
                  const initialValues: Record<string, string> = {};
                  fields.forEach(f => {
                    initialValues[f.label] = '';
                  });
                  setCustomFieldValues(initialValues);
                }}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="" disabled>Select a service</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assigned_staff_id" className="block text-sm font-medium text-[#524A44] mb-1">Assigned Staff</label>
              <select
                id="assigned_staff_id"
                value={formData.assigned_staff_id}
                onChange={e => setFormData({...formData, assigned_staff_id: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="">Unassigned</option>
                {staff.map(s => (
                  <option key={s.id} value={s.user.id}>{s.user.name} ({s.role})</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-[#524A44] mb-1">Due Date</label>
              <input 
                id="due_date"
                type="date" 
                value={formData.due_date}
                onChange={e => setFormData({...formData, due_date: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label htmlFor="total_amount" className="block text-sm font-medium text-[#524A44] mb-1">Total Amount (₱) <span className="text-[#B26959]">*</span></label>
              <input 
                id="total_amount"
                type="number" 
                required
                min="0"
                step="0.01"
                value={formData.total_amount}
                onChange={e => setFormData({...formData, total_amount: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] focus:outline-none focus:border-taupe"
                placeholder="0.00"
              />
            </div>

            <div>
              <label htmlFor="downpayment" className="block text-sm font-medium text-[#524A44] mb-1">Downpayment (₱)</label>
              <input 
                id="downpayment"
                type="number" 
                min="0"
                step="0.01"
                value={formData.downpayment}
                onChange={e => setFormData({...formData, downpayment: e.target.value})}
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] focus:outline-none focus:border-taupe"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Dynamic Custom Fields Section */}
          {formData.service_id && services.find(s => s.id.toString() === formData.service_id)?.custom_fields?.length ? (
            <div className="bg-[#FAF6F3]/50 border border-[#EBE6E0] rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-semibold text-[#2D2A26] border-b border-[#EBE6E0] pb-2">
                📋 Custom Specifications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.find(s => s.id.toString() === formData.service_id)?.custom_fields?.map((field) => (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="block text-xs font-semibold text-[#524A44] mb-1">
                      {field.label} {field.required && <span className="text-[#B26959]">*</span>}
                    </label>
                    {field.type === 'select' ? (
                      <select
                        id={field.id}
                        required={field.required}
                        value={customFieldValues[field.label] || ''}
                        onChange={e => setCustomFieldValues({
                          ...customFieldValues,
                          [field.label]: e.target.value
                        })}
                        className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
                      >
                        <option value="">Select an option</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={field.id}
                        type={field.type === 'number' ? 'number' : 'text'}
                        required={field.required}
                        value={customFieldValues[field.label] || ''}
                        onChange={e => setCustomFieldValues({
                          ...customFieldValues,
                          [field.label]: e.target.value
                        })}
                        className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-[#524A44] mb-1">Notes & Instructions</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-taupe min-h-32 resize-y"
              placeholder="Enter measurements, specific requests, or design notes here..."
            />
          </div>

          {/* Shipping / Delivery / Pickup — only for online orders */}
          {formData.order_type === 'online' && (
            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-5 space-y-4">
              <div>
                <span className="block text-sm font-semibold text-blue-800 mb-2">📦 Fulfillment Method</span>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'shipping', label: 'Shipping', desc: 'Standard courier', icon: Truck },
                    { id: 'delivery', label: 'Local Delivery', desc: 'Same-day rider', icon: Navigation },
                    { id: 'pickup', label: 'Store Pickup', desc: 'In-store collection', icon: Store },
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
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border text-center transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-100/50 text-blue-700 font-semibold shadow-sm'
                            : 'border-blue-200/40 bg-white/70 text-blue-600 hover:border-blue-300'
                        }`}
                      >
                        <Icon size={16} className="mb-1" />
                        <span className="text-xs">{method.label}</span>
                        <span className="text-[9px] opacity-70 font-normal mt-0.5">{method.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {fulfillmentType !== 'pickup' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fulfillment_provider" className="block text-xs font-semibold text-blue-800 mb-1">
                      Service Provider / Courier
                    </label>
                    <select
                      id="fulfillment_provider"
                      value={fulfillmentProvider}
                      onChange={e => setFulfillmentProvider(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
                    >
                      <option value="">— Select provider —</option>
                      {getFilteredCouriers().map(c => (
                        <option key={c.id} value={c.label}>{c.label}</option>
                      ))}
                      <option value="Other">Other / Self-Managed</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tracking_number" className="block text-xs font-semibold text-blue-800 mb-1">
                      {fulfillmentType === 'shipping' ? 'Tracking Number' : 'Booking Link / Rider Contact'}
                    </label>
                    <input
                      id="tracking_number"
                      type="text"
                      value={trackingNumber}
                      onChange={e => setTrackingNumber(e.target.value)}
                      placeholder={fulfillmentType === 'shipping' ? 'e.g. JT-123456' : 'e.g. Grab link or phone'}
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
              )}

              {fulfillmentType !== 'pickup' ? (
                <div>
                  <label htmlFor="shipping_address" className="block text-xs font-semibold text-blue-800 mb-1">
                    {fulfillmentType === 'shipping' ? 'Shipping Address' : 'Delivery Address'}
                  </label>
                  <input
                    id="shipping_address"
                    type="text"
                    value={formData.shipping_address}
                    onChange={e => setFormData({...formData, shipping_address: e.target.value})}
                    placeholder="Enter complete delivery details..."
                    className="w-full bg-white border border-blue-200 rounded-lg px-4 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
                  />
                </div>
              ) : (
                <div className="bg-blue-100/30 border border-blue-200/50 rounded-lg p-3 text-xs text-blue-700 flex items-center gap-2">
                  <Store size={16} className="shrink-0" />
                  <span>Customer will pick up the garments in-store. (Shop address will be used)</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-6 border-t border-[#EBE6E0] flex justify-end gap-4">
            <Link 
              href="/dashboard/jobs"
              className="px-6 py-2.5 rounded-lg font-medium text-[#827A73] hover:text-[#2D2A26] hover:bg-[#F0EAE3] transition-colors"
            >
              Cancel
            </Link>
            <button 
              type="submit"
              disabled={submitting}
              className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-[#9A8073]/20"
            >
              {submitting && <Loader2 size={18} className="animate-spin" />}
              Create Job Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
