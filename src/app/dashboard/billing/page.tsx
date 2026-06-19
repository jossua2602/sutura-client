'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';
import { CreditCard, CheckCircle, Zap, ShieldCheck, Loader2 } from 'lucide-react';

export default function BillingPage() {
  const { shop , user } = useAuthStore();
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingTo, setUpgradingTo] = useState<number | null>(null);

  const fetchBillingData = async () => {
    if (!shop) {
      if (user) setTimeout(() => setLoading(false), 0);
      return;
    }
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get(`/shops/${shop.id}/subscription`)
      ]);
      setPlans(plansRes.data.data);
      setCurrentSubscription(subRes.data.data);
    } catch (err) {
      console.error('Failed to fetch billing data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [shop, user]);

  const handleSubscribe = async (planId: number) => {
    if (!shop) return;
    setUpgradingTo(planId);
    try {
      await api.post(`/shops/${shop.id}/subscription`, {
        plan_id: planId,
        billing_cycle: 'monthly'
      });
      // Refresh
      await fetchBillingData();
    } catch (err) {
      console.error('Subscription failed', err);
    } finally {
      setUpgradingTo(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[#A8A19A]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const activePlanId = currentSubscription?.plan_id;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2D2A26] mb-2">Billing & Plans</h1>
        <p className="text-[#827A73]">Manage your subscription, billing cycle, and payment methods.</p>
      </div>

      {/* Current Subscription Status */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#9A8073]/20 text-taupe rounded-full flex items-center justify-center border border-[#9A8073]/30">
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="text-lg font-medium text-[#2D2A26]">
                Current Plan: <span className="text-taupe font-bold">{currentSubscription?.plan?.name || 'No Active Plan'}</span>
              </h3>
              <p className="text-sm text-[#827A73]">
                {currentSubscription?.status === 'trial' ? 'Your trial ends on ' : 'Your next billing date is '}
                {new Date(currentSubscription?.ends_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#2D2A26]">₱{currentSubscription?.plan?.price_monthly} <span className="text-sm font-normal text-[#A8A19A]">/mo</span></div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#7A8B76]/10 text-[#7A8B76] border border-[#7A8B76]/20 mt-2">
              <CheckCircle size={14} />
              {currentSubscription?.status?.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            className={`relative bg-white shadow-sm border rounded-2xl p-6 flex flex-col ${
              activePlanId === plan.id 
                ? 'border-[#9A8073] ring-1 ring-[#9A8073] shadow-[0_0_20px_rgba(99,102,241,0.1)]' 
                : 'border-[#EBE6E0] hover:border-[#D1C7BD]'
            }`}
          >
            {plan.slug === 'pro' && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#9A8073] text-[#2D2A26] text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1 shadow-lg">
                <Zap size={12} /> Recommended
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-xl font-bold text-[#2D2A26] mb-2">{plan.name}</h3>
              <p className="text-sm text-[#827A73] h-10">{plan.description}</p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-[#2D2A26]">₱{plan.price_monthly}</span>
                <span className="text-[#A8A19A]">/mo</span>
              </div>
            </div>

            <div className="space-y-3 mb-8 flex-1">
              {JSON.parse(plan.features || '[]').map((feature: string, idx: number) => (
                <div key={idx} className="flex items-start gap-3">
                  <ShieldCheck size={18} className="text-taupe shrink-0 mt-0.5" />
                  <span className="text-sm text-[#524A44]">{feature}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={activePlanId === plan.id || upgradingTo !== null}
              className={`w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center ${
                activePlanId === plan.id
                  ? 'bg-[#F0EAE3] text-[#A8A19A] cursor-not-allowed'
                  : plan.slug === 'pro'
                    ? 'bg-taupe hover:bg-taupe/90 text-[#2D2A26] shadow-lg'
                    : 'bg-[#F0EAE3] hover:bg-[#EBE6E0] text-white'
              }`}
            >
              {upgradingTo === plan.id ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : activePlanId === plan.id ? (
                'Current Plan'
              ) : activePlanId && plan.price_monthly > (currentSubscription?.plan?.price_monthly || 0) ? (
                'Upgrade'
              ) : (
                'Select Plan'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
