'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { ArrowLeft, ArrowRight, CheckCircle2, Calendar as CalendarIcon, Clock } from 'lucide-react';

export default function BookingWizard({ params }: { params: { shop_id: string } }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [shopSettings, setShopSettings] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form Data
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [customer, setCustomer] = useState({ name: '', email: '', phone: '' });
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    api.get(`/catalog/${params.shop_id}/booking-settings`)
      .then(res => {
        setShopSettings(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.shop_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Combine date and time
    const scheduled_at = `${date}T${time}:00`;

    try {
      await api.post(`/catalog/${params.shop_id}/book`, {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        scheduled_at,
        answers
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to book appointment. Please check all fields.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-[#2D2A26]">Loading booking system...</div>;

  if (success) {
    return (
      <div className="min-h-screen bg-black text-[#2D2A26] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white shadow-sm p-8 rounded-2xl text-center border border-[#EBE6E0]">
          <div className="w-16 h-16 bg-[#7A8B76]/20 text-[#7A8B76] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-[#827A73] mb-8">
            Your appointment request has been sent to {shopSettings?.name}. They will review it shortly.
          </p>
          <button 
            onClick={() => router.push(`/shop/${params.shop_id}/catalog`)}
            className="w-full bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#2D2A26] font-medium py-3 rounded-lg transition-colors"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-[#2D2A26] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="text-[#827A73] hover:text-[#2D2A26] flex items-center gap-2 transition-colors"
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

        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6 md:p-8 shadow-xl">
          
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
                  className="w-full bg-white text-black hover:bg-zinc-200 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  Agree & Continue <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DATE & TIME */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-xl font-medium border-b border-[#EBE6E0] pb-4">Select Date and Time</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#524A44] flex items-center gap-2">
                    <CalendarIcon size={16} /> Date
                  </label>
                  <input 
                    type="date" 
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#524A44] flex items-center gap-2">
                    <Clock size={16} /> Time
                  </label>
                  <input 
                    type="time" 
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-3 text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => setStep(3)}
                  disabled={!date || !time}
                  className="w-full bg-white text-black hover:bg-zinc-200 font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <label className="text-sm font-medium text-[#524A44] mb-1 block">Full Name *</label>
                  <input 
                    type="text" required
                    value={customer.name} onChange={(e) => setCustomer({...customer, name: e.target.value})}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#524A44] mb-1 block">Email Address *</label>
                  <input 
                    type="email" required
                    value={customer.email} onChange={(e) => setCustomer({...customer, email: e.target.value})}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#524A44] mb-1 block">Phone Number</label>
                  <input 
                    type="tel" 
                    value={customer.phone} onChange={(e) => setCustomer({...customer, phone: e.target.value})}
                    className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              {shopSettings?.booking_questions?.length > 0 && (
                <div className="pt-4 space-y-4 border-t border-[#EBE6E0]">
                  <h3 className="text-lg font-medium">Additional Information</h3>
                  {shopSettings.booking_questions.map((question: string, idx: number) => (
                    <div key={idx}>
                      <label className="text-sm font-medium text-[#524A44] mb-1 block">{question}</label>
                      <input 
                        type="text"
                        required
                        value={answers[question] || ''} 
                        onChange={(e) => setAnswers({...answers, [question]: e.target.value})}
                        className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-zinc-600"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-6">
                <button 
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[var(--brand-taupe)] hover:bg-[var(--brand-taupe)]/90 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
