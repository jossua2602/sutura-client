'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowLeft, Loader2, Store, ShoppingBag, Truck, Navigation } from 'lucide-react';
import Link from 'next/link';
import { serializeCourierName } from '@/lib/fulfillment';

const COURIER_OPTIONS = [
  // Same-Day / Local Delivery
  { id: 'lalamove', label: 'Lalamove', type: 'delivery' },
  { id: 'grab', label: 'Grab Express', type: 'delivery' },
  { id: 'transportify', label: 'Transportify', type: 'delivery' },
  { id: 'toktok', label: 'Toktok', type: 'delivery' },
  { id: 'borzo', label: 'Borzo (Mr. Speedy)', type: 'delivery' },
  { id: 'joyride', label: 'JoyRide Delivery', type: 'delivery' },
  { id: 'angkas', label: 'Angkas Express', type: 'delivery' },
  { id: 'moveit', label: 'Move It Delivery', type: 'delivery' },
  { id: 'dingdong', label: 'Dingdong Delivery', type: 'delivery' },

  // Standard Shipping / Nationwide Express
  { id: 'jnt', label: 'J&T Express', type: 'shipping' },
  { id: 'lbc', label: 'LBC Express', type: 'shipping' },
  { id: 'flash', label: 'Flash Express', type: 'shipping' },
  { id: 'ninjavan', label: 'Ninja Van', type: 'shipping' },
  { id: 'jrs', label: 'JRS Express', type: 'shipping' },
  { id: '2go', label: '2GO Express', type: 'shipping' },
  { id: 'abest', label: 'Abest Express', type: 'shipping' },
  { id: 'entrego', label: 'Entrego', type: 'shipping' },
  { id: 'apcargo', label: 'AP Cargo', type: 'shipping' },
  { id: 'airspeed', label: 'Airspeed', type: 'shipping' },
  { id: 'xde', label: 'XDE Logistics', type: 'shipping' },
  { id: 'spx', label: 'SPX Express (Shopee)', type: 'shipping' },
];

interface CustomerData {
  id: number;
  name: string;
}

interface ServiceField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'radio' | 'checkbox';
  required: boolean;
  options?: string[];
}

interface ServiceData {
  id: number;
  name: string;
  category?: string;
  base_price?: string | number;
  custom_fields?: ServiceField[] | null;
}

interface StaffData {
  id: number;
  user: {
    id: number;
    name: string;
  };
  role: string;
}

interface CustomerMeasurement {
  id: number;
  profile_name: string;
  updated_at: string;
}

export default function JobCreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { shop, user } = useAuthStore();
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
  const [customerMeasurements, setCustomerMeasurements] = useState<CustomerMeasurement[]>([]);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [isTotalAmountCustom, setIsTotalAmountCustom] = useState(false);
  
  // Bulk Team Roster State
  const [isBulkOrder, setIsBulkOrder] = useState(false);
  const [roster, setRoster] = useState<{ name: string; number: string; size: string; custom_details?: string }[]>([
    { name: '', number: '', size: 'M', custom_details: '' }
  ]);

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
    is_outsourced: false,
    partner_shop_name: '',
    is_rush: false,
    rush_fee: '',
  });

  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (shop) {
      Promise.all([
        api.get(`/shops/${shop.id}/customers`),
        api.get(`/shops/${shop.id}/services`),
        api.get(`/shops/${shop.id}/staff`),
        api.get(`/shops/${shop.id}`), // Fetch full shop details to get supported couriers
      ])
        .then(([resCustomers, resServices, resStaff, resShop]) => {
          const custs = resCustomers.data.data || [];
          const servs = resServices.data.data || [];
          setCustomers(custs);
          setServices(servs);
          setStaff(resStaff.data.data || []);

          const shopDetails = resShop.data.data || {};
          setSupportedCouriers(
            Array.isArray(shopDetails.supported_couriers)
              ? shopDetails.supported_couriers
              : []
          );

          // Prefill from query params
          const qCust = searchParams.get('customer_id') || '';
          const qServ = searchParams.get('service_id') || '';
          const qNotes = searchParams.get('notes') || '';
          const qAptId = searchParams.get('appointment_id') || '';

          setAppointmentId(qAptId || null);

          setFormData((prev) => ({
            ...prev,
            customer_id: qCust,
            service_id: qServ,
            notes: qNotes,
          }));

          if (qServ) {
            const selectedService = servs.find(
              (s: ServiceData) => s.id.toString() === qServ
            );
            const fields = selectedService?.custom_fields || [];
            const initialValues: Record<string, string> = {};
            fields.forEach((f: ServiceField) => {
              initialValues[f.label] = '';
            });
            setCustomFieldValues(initialValues);
          }

          setLoading(false);
        })
        .catch((err) => {
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
      api
        .get(`/shops/${shop.id}/measurements?customer_id=${formData.customer_id}`)
        .then((res) => {
          const measurements = res.data.data || [];
          setCustomerMeasurements(measurements);

          // Prefill measurement_id from search params if it matches one, or select the first one by default
          const qMeas = searchParams.get('measurement_id') || '';
          setFormData((prev) => ({
            ...prev,
            measurement_id: qMeas || (measurements[0]?.id?.toString() || ''),
          }));
        })
        .catch((err) => {
          console.error('Failed to load customer measurements', err);
        });
    } else {
      const timer = setTimeout(() => {
        setCustomerMeasurements([]);
        setFormData((prev) => ({ ...prev, measurement_id: '' }));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [shop, formData.customer_id, searchParams]);

  // Auto-calculate suggested total price based on service base price and rush fee
  useEffect(() => {
    if (!isTotalAmountCustom && formData.service_id) {
      const selected = services.find((s) => s.id.toString() === formData.service_id);
      if (selected) {
        const basePrice = parseFloat(selected.base_price?.toString() || '0');
        const rushFee = formData.is_rush ? (parseFloat(formData.rush_fee) || 0) : 0;
        const suggested = basePrice + rushFee;
        setFormData((prev) => ({
          ...prev,
          total_amount: suggested > 0 ? suggested.toFixed(2) : '',
        }));
      }
    }
  }, [formData.service_id, formData.is_rush, formData.rush_fee, services, isTotalAmountCustom]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shop) return;

    setSubmitting(true);
    setError('');

    const totalAmt = parseFloat(formData.total_amount) || 0;
    const downPay = parseFloat(formData.downpayment || '0');
    const rushFee = formData.is_rush ? (parseFloat(formData.rush_fee) || 0) : 0;

    if (formData.is_rush && totalAmt < rushFee) {
      setError(`Total Amount must be greater than or equal to the Rush Fee (₱${rushFee.toFixed(2)}).`);
      setSubmitting(false);
      return;
    }

    if (downPay > totalAmt) {
      setError(`Downpayment (₱${downPay.toFixed(2)}) cannot be greater than the Total Amount (₱${totalAmt.toFixed(2)}).`);
      setSubmitting(false);
      return;
    }

    const balance = totalAmt - downPay;

    const isOnline = formData.order_type === 'online';
    const addressVal = isOnline
      ? fulfillmentType === 'pickup'
        ? 'Store Pickup'
        : formData.shipping_address || null
      : null;
    const courierNameVal = isOnline
      ? serializeCourierName(fulfillmentType, fulfillmentProvider || 'Other')
      : null;
    const courierTrackingVal =
      isOnline && fulfillmentType !== 'pickup' ? trackingNumber || null : null;

    try {
      await api.post(`/shops/${shop.id}/jobs`, {
        order_type: formData.order_type,
        customer_id: formData.customer_id,
        service_id: formData.service_id,
        assigned_staff_id: formData.assigned_staff_id || null,
        measurement_id: formData.measurement_id
          ? Number(formData.measurement_id)
          : null,
        total_amount: formData.total_amount,
        balance: balance,
        due_date: formData.due_date || null,
        notes: formData.notes,
        shipping_address: addressVal,
        courier_name: courierNameVal,
        courier_tracking_number: courierTrackingVal,
        custom_order_data: { ...customFieldValues, roster: isBulkOrder ? roster : null },
        is_outsourced: formData.is_outsourced,
        partner_shop_name: formData.is_outsourced ? formData.partner_shop_name : null,
        appointment_id: appointmentId ? Number(appointmentId) : null,
        is_rush: formData.is_rush,
        rush_fee: formData.is_rush ? Number(formData.rush_fee) : 0,
      });
      router.push('/dashboard/jobs');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to create job order.');
      setSubmitting(false);
    }
  };

  const getFilteredCouriers = () => {
    const options = COURIER_OPTIONS.filter((c) => c.type === fulfillmentType);
    if (supportedCouriers.length === 0) return options;
    const filtered = options.filter((c) => supportedCouriers.includes(c.id));
    return filtered.length > 0 ? filtered : options;
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-[#A8A19A] animate-pulse flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-taupe" />
        <span>Loading form data...</span>
      </div>
    );
  }

  const selectedService = services.find(
    (s) => s.id.toString() === formData.service_id
  );

  const isCustomTailoring = selectedService
    ? selectedService.category !== 'Alterations & Adjustments'
    : true;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/jobs"
          className="p-2 bg-white shadow-sm border border-[#EBE6E0] rounded-lg hover:bg-[#F0EAE3] text-[#827A73] hover:text-[#2D2A26] transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">
            Create Job Order
          </h1>
          <p className="text-[#827A73] text-sm mt-1">
            Start a new garment production workflow.
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
        {error && (
          <div className="mb-6 bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {appointmentId && (
          <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm flex items-center justify-between">
            <div>
              <span className="font-semibold">Linked Booking:</span> This Job Order will automatically link to and update Appointment <span className="font-mono bg-blue-100 px-1.5 py-0.5 rounded text-xs font-bold">#{appointmentId}</span>.
            </div>
            <button
              type="button"
              onClick={() => setAppointmentId(null)}
              className="text-blue-500 hover:text-blue-700 text-xs font-semibold"
            >
              Clear Link
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Customer & Service Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#524A44] border-b border-[#EBE6E0] pb-2">
              Customer & Service Details
            </h3>

            {/* Order Type Toggle */}
            <div>
              <span className="block text-xs font-semibold text-[#827A73] mb-2 uppercase tracking-wider">
                Order Type <span className="text-[#B26959]">*</span>
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, order_type: 'walk_in' })
                  }
                  className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    formData.order_type === 'walk_in'
                      ? 'border-taupe bg-[#FAF6F3] text-[#2D2A26]'
                      : 'border-[#EBE6E0] text-[#A8A19A] hover:border-[#D1C7BD]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Store size={18} />
                    <span>Walk-in</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-70">
                    Customer visits shop
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, order_type: 'online' })
                  }
                  className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                    formData.order_type === 'online'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-[#EBE6E0] text-[#A8A19A] hover:border-[#D1C7BD]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={18} />
                    <span>Online</span>
                  </div>
                  <span className="text-[10px] font-normal opacity-70">
                    Shipping, delivery, or store pickup
                  </span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="customer_id"
                  className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
                >
                  Customer <span className="text-[#B26959]">*</span>
                </label>
                <select
                  id="customer_id"
                  required
                  value={formData.customer_id}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_id: e.target.value })
                  }
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                >
                  <option value="" disabled>
                    Select a customer
                  </option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="measurement_id"
                  className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
                >
                  Measurement Profile
                </label>
                {isBulkOrder ? (
                  <p className="text-xs text-[#827A73] italic py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 h-[38px] flex items-center">
                    Bulk Order (Roster Sheet will be used)
                  </p>
                ) : formData.customer_id ? (
                  customerMeasurements.length > 0 ? (
                    (() => {
                      // Sort oldest first to assign sequential version numbers (v1, v2, v3...)
                      const chronological = [...customerMeasurements].sort(
                        (a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
                      );

                      // Map them to include their version number
                      const measurementsWithVersion = customerMeasurements.map((m) => {
                        const versionIndex = chronological.findIndex((c) => c.id === m.id);
                        return {
                          ...m,
                          version: versionIndex !== -1 ? versionIndex + 1 : 1,
                        };
                      });

                      // Sort latest first for display in the dropdown
                      const displayMeasurements = [...measurementsWithVersion].sort(
                        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
                      );

                      return (
                        <select
                          id="measurement_id"
                          value={formData.measurement_id}
                          onChange={(e) =>
                            setFormData({ ...formData, measurement_id: e.target.value })
                          }
                          className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                        >
                          <option value="">
                            No profile selected / Consultation Only
                          </option>
                          {displayMeasurements.map((m) => (
                            <option key={m.id} value={m.id}>
                              V{m.version} - {m.profile_name}
                            </option>
                          ))}
                        </select>
                      );
                    })()
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
                  <p className="text-xs text-[#A8A19A] italic py-3">
                    Please select a customer first.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="service_id"
                  className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
                >
                  Service Category <span className="text-[#B26959]">*</span>
                </label>
                <select
                  id="service_id"
                  required
                  value={formData.service_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setIsTotalAmountCustom(false); // Reset custom price flag on service change
                    setFormData({ ...formData, service_id: val });
                    const selected = services.find(
                      (s) => s.id.toString() === val
                    );
                    const fields = selected?.custom_fields || [];
                    const initialValues: Record<string, string> = {};
                    fields.forEach((f) => {
                      initialValues[f.label] = '';
                    });
                    setCustomFieldValues(initialValues);
                  }}
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                >
                  <option value="" disabled>
                    Select a service
                  </option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="assigned_staff_id"
                  className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
                >
                  Assigned Staff
                </label>
                <select
                  id="assigned_staff_id"
                  value={formData.assigned_staff_id}
                  onChange={(e) =>
                    setFormData({ ...formData, assigned_staff_id: e.target.value })
                  }
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.user.id}>
                      {s.user.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Custom Specifications & Notes */}
          <div className="space-y-4 border-t border-[#EBE6E0] pt-6">
            <h3 className="text-sm font-bold text-[#524A44] border-b border-[#EBE6E0] pb-2">
              Custom Specifications & Notes
            </h3>

            {/* Dynamic Custom Fields Section */}
            {formData.service_id && selectedService?.custom_fields?.length ? (
              <div className="space-y-4 border border-[#EBE6E0] rounded-xl p-4">
                <h4 className="text-xs font-bold text-[#2D2A26] border-b border-[#EBE6E0] pb-2 uppercase tracking-wider">
                  Custom Service Fields
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedService.custom_fields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      <label
                        htmlFor={field.id}
                        className="block text-xs font-semibold text-[#524A44]"
                      >
                        {field.label}{' '}
                        {field.required && <span className="text-[#B26959]">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          id={field.id}
                          required={field.required}
                          value={customFieldValues[field.label] || ''}
                          onChange={(e) =>
                            setCustomFieldValues({
                              ...customFieldValues,
                              [field.label]: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                        >
                          <option value="">Select an option</option>
                          {field.options?.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'radio' ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {field.options?.map((opt) => {
                            const isSelected =
                              customFieldValues[field.label] === opt;
                            return (
                              <label
                                key={opt}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                                  isSelected
                                    ? 'border-taupe bg-[#FAF6F3] text-[#2D2A26]'
                                    : 'border-[#EBE6E0] bg-white text-[#827A73] hover:border-[#D1C7BD] hover:text-[#2D2A26]'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={field.id}
                                  value={opt}
                                  checked={isSelected}
                                  onChange={() =>
                                    setCustomFieldValues({
                                      ...customFieldValues,
                                      [field.label]: opt,
                                    })
                                  }
                                  className="sr-only"
                                />
                                <div
                                  className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                    isSelected
                                      ? 'border-taupe bg-taupe text-white'
                                      : 'border-[#A8A19A]'
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                  )}
                                </div>
                                {opt}
                              </label>
                            );
                          })}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {field.options?.map((opt) => {
                            const currentVal =
                              customFieldValues[field.label] || '';
                            const selected = currentVal
                              ? currentVal
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean)
                              : [];
                            const isChecked = selected.includes(opt);
                            return (
                              <label
                                key={opt}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                                  isChecked
                                    ? 'border-taupe bg-[#FAF6F3] text-[#2D2A26]'
                                    : 'border-[#EBE6E0] bg-white text-[#827A73] hover:border-[#D1C7BD] hover:text-[#2D2A26]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  name={field.id}
                                  value={opt}
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    let nextSelected = [...selected];
                                    if (checked) {
                                      if (!nextSelected.includes(opt)) {
                                        nextSelected.push(opt);
                                      }
                                    } else {
                                      nextSelected = nextSelected.filter(
                                        (s) => s !== opt
                                      );
                                    }
                                    setCustomFieldValues({
                                      ...customFieldValues,
                                      [field.label]: nextSelected.join(', '),
                                    });
                                  }}
                                  className="sr-only"
                                />
                                <div
                                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                    isChecked
                                      ? 'border-taupe bg-taupe text-white'
                                      : 'border-[#A8A19A]'
                                  }`}
                                >
                                  {isChecked && (
                                    <svg
                                      className="w-2 h-2 fill-current"
                                      viewBox="0 0 20 20"
                                    >
                                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                                    </svg>
                                  )}
                                </div>
                                {opt}
                              </label>
                            );
                          })}
                        </div>
                      ) : (
                        <input
                          id={field.id}
                          type={field.type === 'number' ? 'number' : 'text'}
                          required={field.required}
                          value={customFieldValues[field.label] || ''}
                          onChange={(e) =>
                            setCustomFieldValues({
                              ...customFieldValues,
                              [field.label]: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <label
                htmlFor="notes"
                className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
              >
                Notes & Instructions
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe min-h-24 resize-y"
                placeholder="Enter measurements, specific requests, or design notes here..."
              />
            </div>

            {/* Team Roster / Size Sheet Toggle */}
            <div className="border-t border-[#EBE6E0] pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBulkOrder}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsBulkOrder(checked);
                    if (checked) {
                      setFormData((prev) => ({ ...prev, measurement_id: '' }));
                    }
                  }}
                  className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
                />
                <span className="text-sm font-semibold text-[#524A44]">
                  Include Team Roster / Size Sheet (For Bulk Sublimation / Uniforms)
                </span>
              </label>

              {isBulkOrder && (
                <div className="mt-4 bg-zinc-50 border border-zinc-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#827A73] uppercase tracking-wider">Roster List</h4>
                    <button
                      type="button"
                      onClick={() => setRoster([...roster, { name: '', number: '', size: 'M', custom_details: '' }])}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                    >
                      + Add Row
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs divide-y divide-zinc-200">
                      <thead>
                        <tr>
                          <th className="pb-2 font-semibold text-zinc-600">Player/Employee Name</th>
                          <th className="pb-2 font-semibold text-zinc-600 w-24">Number</th>
                          <th className="pb-2 font-semibold text-zinc-600 w-24">Size</th>
                          <th className="pb-2 text-right"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-150">
                        {roster.map((row, idx) => (
                          <tr key={idx}>
                            <td className="py-2 pr-2">
                              <input
                                type="text"
                                required
                                value={row.name}
                                placeholder="e.g. J. Arabejo"
                                onChange={(e) => {
                                  const newRoster = [...roster];
                                  newRoster[idx].name = e.target.value;
                                  setRoster(newRoster);
                                }}
                                className="w-full bg-white border border-[#EBE6E0] rounded px-2 py-1 text-xs focus:outline-none focus:border-taupe"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <input
                                type="text"
                                value={row.number}
                                placeholder="e.g. 12"
                                onChange={(e) => {
                                  const newRoster = [...roster];
                                  newRoster[idx].number = e.target.value;
                                  setRoster(newRoster);
                                }}
                                className="w-full bg-white border border-[#EBE6E0] rounded px-2 py-1 text-xs focus:outline-none focus:border-taupe"
                              />
                            </td>
                            <td className="py-2 pr-2">
                              <select
                                value={row.size}
                                onChange={(e) => {
                                  const newRoster = [...roster];
                                  newRoster[idx].size = e.target.value;
                                  if (e.target.value !== 'Custom') {
                                    newRoster[idx].custom_details = '';
                                  }
                                  setRoster(newRoster);
                                }}
                                className="w-full bg-white border border-[#EBE6E0] rounded px-2 py-1 text-xs focus:outline-none"
                              >
                                {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Custom'].map(sz => (
                                  <option key={sz} value={sz}>{sz}</option>
                                ))}
                              </select>
                              {row.size === 'Custom' && (
                                <input
                                  type="text"
                                  required
                                  value={row.custom_details || ''}
                                  placeholder="e.g. Chest: 36, L: 28"
                                  onChange={(e) => {
                                    const newRoster = [...roster];
                                    newRoster[idx].custom_details = e.target.value;
                                    setRoster(newRoster);
                                  }}
                                  className="w-full bg-white border border-[#EBE6E0] rounded px-2 py-1 text-[10px] mt-1 focus:outline-none focus:border-taupe placeholder:text-[9px]"
                                />
                              )}
                            </td>
                            <td className="py-2 text-right">
                              {roster.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setRoster(roster.filter((_, i) => i !== idx))}
                                  className="text-red-500 hover:text-red-700 font-semibold"
                                >
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Production & Fulfillment */}
          <div className="space-y-4 border-t border-[#EBE6E0] pt-6">
            <h3 className="text-sm font-bold text-[#524A44] border-b border-[#EBE6E0] pb-2">
              Production & Fulfillment
            </h3>

            {/* Outsourcing Details */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_outsourced}
                  onChange={(e) =>
                    setFormData({ ...formData, is_outsourced: e.target.checked })
                  }
                  className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
                />
                <span className="text-sm font-semibold text-[#524A44]">
                  Outsource this production (Sent to external shop/tailor)
                </span>
              </label>

              {formData.is_outsourced && (
                <div className="mt-3 max-w-md">
                  <label
                    htmlFor="partner_shop_name"
                    className="block text-xs font-semibold text-[#827A73] mb-1"
                  >
                    Partner Shop / Sewer Name <span className="text-[#B26959]">*</span>
                  </label>
                  <input
                    id="partner_shop_name"
                    type="text"
                    required
                    value={formData.partner_shop_name}
                    onChange={(e) =>
                      setFormData({ ...formData, partner_shop_name: e.target.value })
                    }
                    placeholder="e.g. Maria's Dressmaking Shop"
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                  />
                </div>
              )}
            </div>

            {/* Shipping / Delivery / Pickup — only for online orders */}
            {formData.order_type === 'online' && (
              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-4 space-y-4 mt-2">
                <div>
                  <span className="block text-sm font-semibold text-blue-800 mb-2">
                    Fulfillment Method
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {
                        id: 'shipping',
                        label: 'Shipping',
                        desc: 'Standard courier',
                        icon: Truck,
                      },
                      {
                        id: 'delivery',
                        label: 'Local Delivery',
                        desc: 'Same-day rider',
                        icon: Navigation,
                      },
                      {
                        id: 'pickup',
                        label: 'Store Pickup',
                        desc: 'In-store collection',
                        icon: Store,
                      },
                    ].map((method) => {
                      const Icon = method.icon;
                      const isSelected = fulfillmentType === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => {
                            setFulfillmentType(
                              method.id as 'shipping' | 'delivery' | 'pickup'
                            );
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
                          <span className="text-[9px] opacity-70 font-normal mt-0.5">
                            {method.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {fulfillmentType !== 'pickup' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="fulfillment_provider"
                        className="block text-xs font-semibold text-blue-800 mb-1"
                      >
                        Service Provider / Courier
                      </label>
                      <select
                        id="fulfillment_provider"
                        value={fulfillmentProvider}
                        onChange={(e) => setFulfillmentProvider(e.target.value)}
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
                      >
                        <option value="">— Select provider —</option>
                        {getFilteredCouriers().map((c) => (
                          <option key={c.id} value={c.label}>
                            {c.label}
                          </option>
                        ))}
                        <option value="Other">Other / Self-Managed</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="tracking_number"
                        className="block text-xs font-semibold text-blue-800 mb-1"
                      >
                        {fulfillmentType === 'shipping'
                          ? 'Tracking Number'
                          : 'Booking Link / Rider Contact'}
                      </label>
                      <input
                        id="tracking_number"
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder={
                          fulfillmentType === 'shipping'
                            ? 'e.g. JT-123456'
                            : 'e.g. Grab link or phone'
                        }
                        className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                )}

                {fulfillmentType !== 'pickup' ? (
                  <div>
                    <label
                      htmlFor="shipping_address"
                      className="block text-xs font-semibold text-blue-800 mb-1"
                    >
                      {fulfillmentType === 'shipping'
                        ? 'Shipping Address'
                        : 'Delivery Address'}
                    </label>
                    <input
                      id="shipping_address"
                      type="text"
                      value={formData.shipping_address}
                      onChange={(e) =>
                        setFormData({ ...formData, shipping_address: e.target.value })
                      }
                      placeholder="Enter complete delivery details..."
                      className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                ) : (
                  <div className="bg-blue-100/30 border border-blue-200/50 rounded-lg p-3 text-xs text-blue-700 flex items-center gap-2">
                    <Store size={16} className="shrink-0" />
                    <span>
                      Customer will pick up the garments in-store. (Shop address will be used)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Timeline & Financial Summary */}
          <div className="space-y-4 border-t border-[#EBE6E0] pt-6">
            <h3 className="text-sm font-bold text-[#524A44] border-b border-[#EBE6E0] pb-2">
              Timeline & Invoice Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="due_date"
                  className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
                >
                  Due Date {isCustomTailoring && <span className="text-[#B26959]">*</span>}
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1">
                    <input
                      id="due_date"
                      type="date"
                      required={isCustomTailoring}
                      value={formData.due_date}
                      onChange={(e) =>
                        setFormData({ ...formData, due_date: e.target.value })
                      }
                      className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 sm:h-[38px] sm:mt-0 mt-1">
                    <input
                      type="checkbox"
                      checked={formData.is_rush}
                      onChange={(e) =>
                        setFormData({ ...formData, is_rush: e.target.checked })
                      }
                      className="rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
                    />
                    <span className="text-sm font-semibold text-[#524A44]">
                      Mark as Rush Order
                    </span>
                  </label>
                </div>
              </div>

              {/* Rush Order Details */}
              <div>
                {formData.is_rush && (
                  <div>
                    <label
                      htmlFor="rush_fee"
                      className="block text-xs font-semibold text-[#827A73] mb-1 uppercase tracking-wider"
                    >
                      Rush Fee (₱) <span className="text-[#B26959]">*</span>
                    </label>
                    <input
                      id="rush_fee"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.rush_fee}
                      onChange={(e) =>
                        setFormData({ ...formData, rush_fee: e.target.value })
                      }
                      placeholder="0.00"
                      className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                    />
                    <p className="text-[10px] text-[#827A73] mt-1">
                      This fee is automatically added to the Total Amount below.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Invoice Box */}
            <div className="space-y-4 mt-2">
              <span className="text-xs font-bold text-[#827A73] uppercase tracking-wider block border-b border-[#EBE6E0] pb-2">
                Invoice & Balance Summary
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* Total Amount Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="total_amount"
                      className="block text-xs font-semibold text-[#827A73] uppercase tracking-wider"
                    >
                      Total Amount (₱) <span className="text-[#B26959]">*</span>
                    </label>
                    {isTotalAmountCustom && selectedService && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsTotalAmountCustom(false);
                          const basePrice = parseFloat(selectedService.base_price?.toString() || '0');
                          const rushFee = formData.is_rush ? (parseFloat(formData.rush_fee) || 0) : 0;
                          const suggested = basePrice + rushFee;
                          setFormData((prev) => ({
                            ...prev,
                            total_amount: suggested.toFixed(2),
                          }));
                        }}
                        className="text-[10px] font-bold text-taupe hover:underline uppercase tracking-wider"
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                  <input
                    id="total_amount"
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => {
                      setIsTotalAmountCustom(true);
                      setFormData({ ...formData, total_amount: e.target.value });
                    }}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                    placeholder="0.00"
                  />
                  {formData.is_rush && parseFloat(formData.total_amount) < (parseFloat(formData.rush_fee) || 0) && (
                    <p className="text-[10px] text-[#B26959] mt-1 font-semibold">
                      Must be ≥ Rush Fee (₱{parseFloat(formData.rush_fee).toFixed(2)})
                    </p>
                  )}
                </div>

                {/* Downpayment Input */}
                <div>
                  <label
                    htmlFor="downpayment"
                    className="block text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-1"
                  >
                    Downpayment (₱)
                  </label>
                  <input
                    id="downpayment"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.downpayment}
                    onChange={(e) =>
                      setFormData({ ...formData, downpayment: e.target.value })
                    }
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 py-2 text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe"
                    placeholder="0.00"
                  />
                  {(parseFloat(formData.downpayment) || 0) > (parseFloat(formData.total_amount) || 0) && (
                    <p className="text-[10px] text-[#B26959] mt-1 font-semibold">
                      Cannot exceed Total Amount (₱{parseFloat(formData.total_amount || '0').toFixed(2)})
                    </p>
                  )}
                </div>

                {/* Remaining Balance card */}
                <div>
                  <label className="block text-xs font-semibold text-[#827A73] uppercase tracking-wider mb-1">
                    Remaining Balance
                  </label>
                  <div className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-3 flex items-center justify-between h-[38px] select-none">
                    <span className="font-bold text-sm text-[#2D2A26]">
                      ₱{Math.max(0, (parseFloat(formData.total_amount) || 0) - (parseFloat(formData.downpayment) || 0)).toFixed(2)}
                    </span>
                    {parseFloat(formData.total_amount) > 0 ? (
                      (parseFloat(formData.downpayment) || 0) >= parseFloat(formData.total_amount) ? (
                        <span className="text-[9px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Paid
                        </span>
                      ) : (parseFloat(formData.downpayment) || 0) > 0 ? (
                        <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Partial
                        </span>
                      ) : (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                          Unpaid
                        </span>
                      )
                    ) : (
                      <span className="text-[9px] bg-zinc-100 text-zinc-600 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
                        —
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

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
