'use client';

import { useEffect, useState, FormEvent, Suspense, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { ArrowLeft, ArrowRight, CheckCircle2, Calendar as CalendarIcon, Clock, MessageSquare, Ruler, Shirt, Scissors, Package, AlertCircle, MapPin } from 'lucide-react';
import Image from 'next/image';
import InteractiveCalendar from './InteractiveCalendar';

interface Branch {
  id: number;
  name: string;
  address?: string | null;
  city?: string | null;
}

interface Service {
  id: number;
  name: string;
  base_price?: string | number;
  estimated_days?: number;
}

interface ShopSettings {
  name: string;
  booking_policy?: string | null;
  booking_questions?: string[] | null;
  max_appointments_per_day?: number | null;
  operating_hours?: Record<string, { is_open: boolean; open: string; close: string }> | string | null;
  branches?: Branch[];
  services?: Service[];
  special_hours?: {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_closed: boolean;
    special_open_time: string | null;
    special_close_time: string | null;
    announcement_message: string | null;
  }[];
}

interface CatalogItemImage {
  id: number;
  image_url: string;
}

interface CatalogItem {
  id: number;
  name: string;
  price: string | number;
  listing_type: string;
  images: CatalogItemImage[];
}

// Mirrors the catalog item page's own getButtonText() mapping — a ready-to-wear
// or bulk item never actually needs a tailoring "fitting," so the label shown
// here (and the note logged for the shop) should match what got the customer here.
const INTENT_LABELS: Record<string, string> = {
  for_rent: 'Rental Inquiry',
  for_sale: 'Purchase Inquiry',
  used_liquidated: 'Purchase Inquiry',
  rent_or_sale: 'Rental/Purchase Inquiry',
  ready_to_wear: 'Reservation Inquiry',
  bulk_order: 'Bulk Order Inquiry',
  made_to_order: 'Fitting Request',
};

const INTENT_TYPE_LABELS: Record<string, string> = {
  for_rent: 'Rent',
  for_sale: 'Purchase',
  used_liquidated: 'Purchase',
  rent_or_sale: 'Rent/Purchase',
  ready_to_wear: 'Reservation',
  bulk_order: 'Bulk Order',
  made_to_order: 'Fitting',
};

function BookingWizardContent({ params }: Readonly<{ params: Promise<{ shop_id: string }> }>) {
  const { shop_id: shopId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get('item_id');
  const intent = searchParams.get('intent');

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [catalogItem, setCatalogItem] = useState<CatalogItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Data
  const [appointmentType, setAppointmentType] = useState<string>('consultation');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [remarks, setRemarks] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // New Catalog Order States
  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'shipping' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [rentalEndDate, setRentalEndDate] = useState('');

  const getSpecialHoursForDate = (dateStr: string) => {
    if (!shopSettings?.special_hours) return null;
    return shopSettings.special_hours.find(s => dateStr >= s.start_date && dateStr <= s.end_date) || null;
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post(`/public/shops/${shopId}/upload-receipt`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setPaymentReceiptUrl(res.data.data.url);
      }
    } catch (err) {
      console.error('Failed to upload receipt image:', err);
      alert('Failed to upload receipt. Please make sure it is a valid image (PNG/JPG/JPEG).');
    } finally {
      setUploadingReceipt(false);
    }
  };

  const TYPES_REQUIRING_SERVICE = ['measurement', 'fitting', 'alteration'];
  const BOOKING_TYPES = [
    { value: 'consultation', label: 'Consultation', icon: <MessageSquare size={18} />, hint: 'Discuss your garment idea with the shop' },
    { value: 'measurement', label: 'Measurement',  icon: <Ruler size={18} />,        hint: 'Get your body measurements taken' },
    { value: 'fitting',     label: 'Fitting',       icon: <Shirt size={18} />,         hint: 'Try on your garment for fitting' },
    { value: 'alteration',  label: 'Alteration',    icon: <Scissors size={18} />,      hint: 'Adjust an existing garment' },
  ];

  useEffect(() => {
    // Fetch shop settings
    api.get(`/catalog/${shopId}/booking-settings`)
      .then(res => {
        const settings = res.data.data;
        setShopSettings(settings);
        if (settings?.branches && settings.branches.length === 1) {
          setSelectedBranchId(settings.branches[0].id.toString());
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });

    // Fetch catalog item details if provided in query params
    if (itemId) {
      api.get(`/catalog/${shopId}/${itemId}`)
        .then(res => {
          setCatalogItem(res.data.data);
        })
        .catch(err => {
          console.error('Failed to fetch catalog item details:', err);
        });
    }
  }, [shopId, itemId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Combine date and time
    const scheduled_at = `${date}T${time}:00`;

    // Compile remarks and catalog item context
    let notesPayload = '';
    if (catalogItem) {
      const typeLabel = (intent && INTENT_TYPE_LABELS[intent]) || 'Fitting';
      notesPayload += `[${typeLabel} Inquiry: ${catalogItem.name} (ID: ${catalogItem.id})]\n`;
    }
    if (remarks.trim()) {
      notesPayload += `Remarks: ${remarks}`;
    }

    try {
      await api.post(`/catalog/${shopId}/book`, {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        appointment_type: appointmentType,
        scheduled_at,
        notes: notesPayload || null,
        answers,
        shop_branch_id: selectedBranchId ? Number(selectedBranchId) : null,
        service_id: selectedServiceId ? Number(selectedServiceId) : null,
        duration_minutes: Number(durationMinutes),
        payment_method: paymentMethod,
        payment_reference: paymentMethod !== 'cash' ? paymentReference : null,
        payment_receipt_path: paymentMethod !== 'cash' ? paymentReceiptUrl : null,
        catalog_item_id: catalogItem ? catalogItem.id : null,
        fulfillment_type: catalogItem ? fulfillmentType : 'pickup',
        delivery_address: catalogItem && fulfillmentType !== 'pickup' ? deliveryAddress : null,
        rental_start_date: catalogItem && catalogItem.listing_type === 'for_rent' ? date : null,
        rental_end_date: catalogItem && catalogItem.listing_type === 'for_rent' ? rentalEndDate : null,
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to book appointment. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FAF6F3] text-[#2D2A26]">Loading booking system...</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-[#FAF6F3] text-[#2D2A26] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-sm p-8 rounded-2xl text-center border border-[#EBE6E0]">
          <div className="w-16 h-16 bg-[#7A8B76]/20 text-[#7A8B76] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-[#827A73] mb-8">
            Your appointment request has been sent to {shopSettings?.name}. They will review it shortly.
          </p>
          <button 
            onClick={() => router.push(`/shop/${shopId}/catalog`)}
            className="w-full bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#2D2A26] font-medium py-3 rounded-lg transition-colors cursor-pointer"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F3] text-[#2D2A26] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="text-[#827A73] hover:text-[#2D2A26] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div className="text-sm font-medium text-[#A8A19A]">
            Step {step} of 3
          </div>
        </div>

        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Book an Appointment</h1>
          <p className="text-[#827A73]">{shopSettings?.name}</p>
        </div>

        {/* Selected Garment Summary */}
        {catalogItem && (
          <div className="mb-6 bg-white border border-[#EBE6E0] rounded-2xl p-4 flex gap-4 items-center shadow-xs">
            {catalogItem.images?.[0]?.image_url && (
              <div className="w-16 h-20 relative rounded-lg overflow-hidden bg-zinc-100 shrink-0">
                <Image 
                  src={catalogItem.images[0].image_url} 
                  alt={catalogItem.name} 
                  fill 
                  className="object-cover object-top"
                  unoptimized
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-[#9A8073] uppercase tracking-wider">
                {(intent && INTENT_LABELS[intent]) || 'Fitting Request'}
              </span>
              <h3 className="font-semibold text-sm text-[#2D2A26] truncate">{catalogItem.name}</h3>
              <p className="text-xs text-[#827A73]">₱{Number(catalogItem.price).toLocaleString()}</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 md:p-8 shadow-xl">
          
          {/* STEP 1: POLICY */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-medium border-b border-[#EBE6E0] pb-4">Service Details & Policy</h2>
              
              <div className="prose prose-invert max-w-none text-[#524A44]">
                {shopSettings?.booking_policy ? (
                  <div className="whitespace-pre-wrap">{shopSettings.booking_policy}</div>
                ) : (
                  <p className="italic text-[#A8A19A]">No specific booking policy provided by this shop.</p>
                )}
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => setStep(2)}
                  className="w-full bg-[#9A8073] hover:bg-[#91756A] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  Agree & Continue <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATE & TIME */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-medium border-b border-[#EBE6E0] pb-4">
                {catalogItem ? 'Select Schedule & Fulfillment' : 'Appointment Type & Schedule'}
              </h2>

              {/* Appointment Type Selector */}
              {!catalogItem && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#524A44] block">What are you coming in for? <span className="text-[#B26959]">*</span></label>
                  <div className="grid grid-cols-1 gap-2">
                    {BOOKING_TYPES.map(t => (
                      <button
                        type="button" key={t.value}
                        onClick={() => setAppointmentType(t.value)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                          appointmentType === t.value
                            ? 'border-[#9A8073] bg-[#9A8073]/5 ring-2 ring-[#9A8073]/20'
                            : 'border-[#EBE6E0] bg-white hover:border-[#9A8073]/40'
                        }`}
                      >
                        <span className={`${appointmentType === t.value ? 'text-[#9A8073]' : 'text-[#A8A19A]'}`}>{t.icon}</span>
                        <div>
                          <p className={`text-sm font-semibold ${appointmentType === t.value ? 'text-[#2D2A26]' : 'text-[#524A44]'}`}>{t.label}</p>
                          <p className="text-xs text-[#A8A19A]">{t.hint}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {TYPES_REQUIRING_SERVICE.includes(appointmentType) && (
                    <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} /> Please select a service below — required for {appointmentType} appointments.
                    </p>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Fulfillment for ready-to-wear / for_sale purchases */}
                {catalogItem && (catalogItem.listing_type === 'ready_to_wear' || catalogItem.listing_type === 'for_sale') && (
                  <div className="space-y-2 col-span-1 md:col-span-2 border-b border-[#EBE6E0] pb-4">
                    <label className="text-sm font-medium text-[#524A44] block">Fulfillment Method <span className="text-[#B26959]">*</span></label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => {
                          setFulfillmentType('pickup');
                          setDeliveryAddress('');
                        }}
                        className={`px-4 py-3 rounded-xl border text-left transition-all ${
                          fulfillmentType === 'pickup'
                            ? 'border-[#9A8073] bg-[#9A8073]/5 ring-2 ring-[#9A8073]/20 font-semibold'
                            : 'border-[#EBE6E0] bg-white hover:border-[#9A8073]/40'
                        }`}
                      >
                        🏪 Pickup at Shop (Reserve & Collect)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFulfillmentType('shipping')}
                        className={`px-4 py-3 rounded-xl border text-left transition-all ${
                          fulfillmentType === 'shipping' || fulfillmentType === 'delivery'
                            ? 'border-[#9A8073] bg-[#9A8073]/5 ring-2 ring-[#9A8073]/20 font-semibold'
                            : 'border-[#EBE6E0] bg-white hover:border-[#9A8073]/40'
                        }`}
                      >
                        🚚 Request Delivery / Shipping
                      </button>
                    </div>
                  </div>
                )}

                {catalogItem && fulfillmentType !== 'pickup' && (
                  <div className="space-y-2 col-span-1 md:col-span-2 bg-[#FAF6F3]/50 p-4 border border-[#EBE6E0] rounded-xl animate-in slide-in-from-top-2">
                    <label htmlFor="shipping-address" className="text-sm font-medium text-[#524A44] block">Shipping Address <span className="text-[#B26959]">*</span></label>
                    <textarea
                      id="shipping-address"
                      required
                      rows={3}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Enter your complete delivery address (Street, Barangay, City, Province, Zip Code)..."
                      className="w-full bg-white border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-[#9A8073] text-sm resize-none"
                    />
                    <p className="text-[11px] text-[#827A73]">Note: The shop owner will calculate the shipping fee manually and contact you to coordinate delivery.</p>
                  </div>
                )}

                <div className="col-span-1 md:col-span-2">
                  <InteractiveCalendar 
                    shopId={shopId}
                    selectedBranchId={selectedBranchId ? String(selectedBranchId) : null}
                    durationMinutes={appointmentType === 'consultation' ? 30 : 60}
                    operatingHours={shopSettings?.operating_hours as any}
                    specialHours={shopSettings?.special_hours as any}
                    maxAppointmentsPerDay={shopSettings?.max_appointments_per_day ?? null}
                    selectedDate={date}
                    selectedTime={time}
                    onDateChange={setDate}
                    onTimeChange={setTime}
                    isRental={catalogItem?.listing_type === 'for_rent'}
                  />
                </div>

                {/* Return Date for rentals */}
                {catalogItem && catalogItem.listing_type === 'for_rent' && (
                  <div className="space-y-2 col-span-1 md:col-span-2 mt-4">
                    <label htmlFor="booking-return-date" className="text-sm font-medium text-[#524A44] flex items-center gap-2">
                      <CalendarIcon size={16} /> Return Date <span className="text-[#B26959]">*</span>
                    </label>
                    <input 
                      id="booking-return-date"
                      type="date" 
                      required
                      min={date || new Date().toISOString().split('T')[0]}
                      value={rentalEndDate}
                      onChange={(e) => setRentalEndDate(e.target.value)}
                      className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                    />
                  </div>
                )}
              </div>

              {/* Deposit Warning for rentals */}
              {catalogItem && catalogItem.listing_type === 'for_rent' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2.5 text-xs text-[#826A50] animate-in slide-in-from-top-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-bold">Refundable Security Deposit Required</p>
                    <p className="mt-0.5">A refundable security deposit and a valid government ID are required physically upon collection/pickup at the shop.</p>
                  </div>
                </div>
              )}

              {(() => {
                if (!date) return null;
                const special = getSpecialHoursForDate(date);
                if (!special) return null;

                if (special.is_closed) {
                  return (
                    <div className="bg-[#B26959]/10 border border-[#B26959]/20 rounded-xl p-4 flex gap-2.5 text-xs text-[#B26959] animate-in slide-in-from-top-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Temporarily Closed ({special.title})</p>
                        <p className="mt-0.5">We are fully closed on this date. Please choose a different date for your appointment.</p>
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-2.5 text-xs text-[#826A50] animate-in slide-in-from-top-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Special Holiday Hours ({special.title})</p>
                        <p className="mt-0.5">Custom hours for this date: {special.special_open_time} - {special.special_close_time}.</p>
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Branch Selector (if multi-branch) */}
              {shopSettings?.branches && shopSettings.branches.length > 1 && (
                <div className="space-y-2">
                  <label htmlFor="booking-branch" className="text-sm font-medium text-[#524A44] block">
                    Select Branch <span className="text-[#B26959]">*</span>
                  </label>
                  <select
                    id="booking-branch"
                    required
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  >
                    <option value="" disabled>Choose a branch...</option>
                    {shopSettings.branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name} ({b.address || ''}, {b.city || ''})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Branch Location & In-Person Warning Alerts */}
              {(() => {
                const currentBranch = shopSettings?.branches?.find(b => b.id.toString() === selectedBranchId) || 
                                      (shopSettings?.branches?.length === 1 ? shopSettings.branches[0] : null);
                
                if (!currentBranch) return null;

                return (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
                    <p className="font-semibold text-amber-800 flex items-center gap-1.5">
                      <MapPin size={14} className="shrink-0 text-amber-700" />
                      Physical Store Visit Required
                    </p>
                    <p className="text-amber-700 leading-relaxed">
                      This is an <strong>in-person session</strong>. You must physically visit the selected branch on the scheduled date:
                    </p>
                    <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/50 shadow-xs">
                      <p className="font-bold text-zinc-800">{currentBranch.name}</p>
                      {currentBranch.address && <p className="text-zinc-600 mt-0.5">{currentBranch.address}</p>}
                      {currentBranch.city && <p className="text-zinc-700 font-medium mt-0.5">{currentBranch.city}</p>}
                    </div>
                    {appointmentType === 'consultation' ? (
                      <p className="text-amber-800/80 mt-1.5 leading-normal">
                        💡 <strong>Located far away?</strong> You can avoid traveling and message us directly using the <strong>"💬 Chat Shop"</strong> button on our homepage to start an online consultation!
                      </p>
                    ) : (
                      <p className="text-amber-800/80 mt-1.5 leading-normal font-semibold">
                        ⚠️ Warning: If you are located far from this branch (e.g. Luzon to Mindanao), please do not book this session as it cannot be done online.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Service Selector — Required for measurement/alteration, Optional for consultation, Hidden for fitting */}
              {appointmentType !== 'fitting' && shopSettings?.services && shopSettings.services.length > 0 && (
                <div className="space-y-2">
                  <label htmlFor="booking-service" className="text-sm font-medium text-[#524A44] block">
                    Service {appointmentType === 'measurement' || appointmentType === 'alteration' ? <span className="text-[#B26959]">*</span> : '(Optional)'}
                  </label>
                  <select
                    id="booking-service"
                    value={selectedServiceId}
                    required={appointmentType === 'measurement' || appointmentType === 'alteration'}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  >
                    <option value="">{appointmentType === 'measurement' || appointmentType === 'alteration' ? 'Select a service...' : 'No specific service (General Consultation)'}</option>
                    {shopSettings.services.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Order Reference Input — Required only for Fittings */}
              {appointmentType === 'fitting' && (
                <div className="space-y-2">
                  <label htmlFor="booking-order-reference" className="text-sm font-medium text-[#524A44] block">
                    Ongoing Order Number or Garment Description <span className="text-[#B26959]">*</span>
                  </label>
                  <input
                    id="booking-order-reference"
                    type="text"
                    required
                    placeholder="e.g., Order #1002 or Blue Wedding Gown"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  />
                  <p className="text-[11px] text-[#827A73]">
                    💡 Tell the designer which ongoing order you are coming in to fit.
                  </p>
                </div>
              )}

              {/* Duration Selector */}
              <div className="space-y-2">
                <label htmlFor="booking-duration" className="text-sm font-medium text-[#524A44] block">
                  Estimated Duration
                </label>
                <select
                  id="booking-duration"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                >
                  <option value="30">30 minutes (Quick Consultation)</option>
                  <option value="60">60 minutes (Standard Fitting/Measurement)</option>
                  <option value="90">90 minutes (Detailed Fitting/Consultation)</option>
                  <option value="120">120 minutes (Comprehensive Session)</option>
                </select>
              </div>

              {/* Render Operating Hours */}
              {(() => {
                const hours = shopSettings?.operating_hours;
                if (!hours) return null;
                try {
                  const parsed = typeof hours === 'string' ? JSON.parse(hours) : hours;
                  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                  return (
                    <div className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl p-4 mt-4 space-y-2.5">
                      <h4 className="text-xs font-bold text-[#827A73] uppercase tracking-wider">Shop Operating Hours</h4>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-[#524A44]">
                        {days.map(d => {
                          const h = parsed[d];
                          return (
                            <div key={d} className="flex justify-between border-b border-[#EBE6E0]/40 pb-1.5">
                              <span className="capitalize font-medium text-[#2D2A26]">{d}</span>
                              <span className="text-[#827A73]">
                                {h?.is_open 
                                  ? `${h.open} - ${h.close}`
                                  : <span className="text-[#B26959] font-medium">Closed</span>
                                }
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                } catch (e) {
                  return null;
                }
              })()}

              <div className="pt-6">
                <button 
                  onClick={() => setStep(3)}
                  disabled={
                    !date || 
                    !time || 
                    !!getSpecialHoursForDate(date)?.is_closed || 
                    (catalogItem?.listing_type === 'for_rent' && !rentalEndDate) ||
                    (catalogItem && (fulfillmentType === 'shipping' || fulfillmentType === 'delivery') && !deliveryAddress.trim()) ||
                    (!!shopSettings?.branches && shopSettings.branches.length > 1 && !selectedBranchId)
                  }
                  className="w-full bg-[#9A8073] hover:bg-[#91756A] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
                >
                  Next Step <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: DETAILS & SUBMIT */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-medium border-b border-[#EBE6E0] pb-4">Your Details</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="customer-name" className="text-sm font-medium text-[#524A44] mb-1 block">Full Name *</label>
                  <input 
                    id="customer-name"
                    type="text" required
                    value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  />
                </div>
                <div>
                  <label htmlFor="customer-email" className="text-sm font-medium text-[#524A44] mb-1 block">Email Address *</label>
                  <input 
                    id="customer-email"
                    type="email" required
                    value={customer.email} onChange={(e) => setCustomer({...customer, email: e.target.value})}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  />
                </div>
                <div>
                  <label htmlFor="customer-phone" className="text-sm font-medium text-[#524A44] mb-1 block">Phone Number</label>
                  <input 
                    id="customer-phone"
                    type="tel" 
                    value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                  />
                </div>
              </div>

              {/* Inquiry Remarks Field */}
              <div className="pt-4 border-t border-[#EBE6E0]">
                <label htmlFor="customer-remarks" className="text-sm font-medium text-[#524A44] mb-1 block">Remarks / Special Instructions</label>
                <textarea 
                  id="customer-remarks"
                  rows={4}
                  value={remarks} 
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={intent === 'for_rent' ? "Specify requested sizes, rental period dates, or customization instructions..." : "Specify sizing, alterations, shipping notes, or other details..."}
                  className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2.5 text-[#2D2A26] text-sm focus:outline-none focus:border-[#9A8073]"
                />
              </div>

              {shopSettings?.booking_questions && shopSettings.booking_questions.length > 0 && (
                <div className="pt-4 space-y-4 border-t border-[#EBE6E0]">
                  <h3 className="text-lg font-medium">Additional Information</h3>
                  {shopSettings.booking_questions.map((question: string, idx: number) => (
                    <div key={question}>
                      <label htmlFor={`question-${idx}`} className="text-sm font-medium text-[#524A44] mb-1 block">{question}</label>
                      <input 
                        id={`question-${idx}`}
                        type="text"
                        required
                        value={answers[question] || ''} 
                        onChange={(e) => setAnswers({...answers, [question]: e.target.value})}
                        className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-[#9A8073]"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Manual Payment Section */}
              <div className="pt-4 border-t border-[#EBE6E0] space-y-4">
                <h3 className="text-lg font-medium">Payment / Booking Deposit</h3>
                <p className="text-xs text-[#827A73]">Select how you would like to handle your reservation/fitting deposit (if applicable).</p>
                
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'cash', label: 'Cash on Shop' },
                    { value: 'gcash', label: 'GCash' },
                    { value: 'bank_transfer', label: 'Bank Transfer' }
                  ].map(m => (
                    <button
                      type="button" key={m.value}
                      onClick={() => setPaymentMethod(m.value)}
                      className={`py-2.5 px-3 rounded-lg border text-center text-xs font-semibold transition-all cursor-pointer ${
                        paymentMethod === m.value
                          ? 'border-[#9A8073] bg-[#9A8073]/5 text-[#2D2A26]'
                          : 'border-[#EBE6E0] bg-white text-[#524A44] hover:border-[#9A8073]/40'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {paymentMethod !== 'cash' && (
                  <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-xl space-y-3">
                    <p className="text-xs text-zinc-700">
                      Please send payment to the shop&apos;s verified GCash / Bank details:
                      <br />
                      <strong className="text-zinc-950 font-bold">GCash: 0950 5585 800 (Printify Shop)</strong>
                      <br />
                      <strong className="text-zinc-950 font-bold">Bank: BPI - 1234-5678-90 (Sutura Account)</strong>
                    </p>
                    
                    <div className="space-y-2">
                      <label htmlFor="ref-code" className="text-xs font-medium text-[#524A44] block">Transaction Reference Code *</label>
                      <input 
                        id="ref-code"
                        type="text" required
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Enter the 13-digit GCash/Bank Ref Code"
                        className="w-full bg-white border border-[#EBE6E0] rounded-lg px-3 py-2 text-[#2D2A26] text-xs focus:outline-none focus:border-[#9A8073]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="receipt-file" className="text-xs font-medium text-[#524A44] block">Upload Receipt Image *</label>
                      <input 
                        id="receipt-file"
                        type="file" required={!paymentReceiptUrl}
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="w-full text-xs text-[#827A73]"
                      />
                      {uploadingReceipt && <p className="text-[10px] text-[#9A8073] animate-pulse">Uploading proof of payment...</p>}
                      {paymentReceiptUrl && <p className="text-[10px] text-green-600 font-medium">✓ Proof of payment uploaded successfully!</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-6">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#9A8073] hover:bg-[#91756A] text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {submitting ? 'Processing...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}

export default function BookingWizard({ params }: Readonly<{ params: Promise<{ shop_id: string }> }>) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#FAF6F3] text-[#2D2A26] animate-pulse">Loading booking system...</div>}>
      <BookingWizardContent params={params} />
    </Suspense>
  );
}
