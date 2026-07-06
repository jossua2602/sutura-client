'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useToast } from '@/context/ToastContext';
import api from '@/lib/axios';
import {
  CreditCard, CheckCircle, Zap, ShieldCheck, Loader2,
  Check, Crown, Rocket, Sparkles,
} from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  slug: string;
  price_monthly: number;
  description: string;
  features: string;
}

interface Subscription {
  plan_id: number;
  plan: Plan;
  status: string;
  ends_at: string;
}

// ── Per-plan metadata ─────────────────────────────────────────────────────────
const PLAN_META: Record<string, {
  icon: React.ElementType;
  badge?: string;
  badgeClass: string;
  cardClass: string;
  btnClass: string;
  iconBg: string;
}> = {
  basic: {
    icon: Rocket,
    badge: undefined,
    badgeClass: '',
    cardClass: 'border-[#EBE6E0] hover:border-[#D1C7BD]',
    btnClass: 'bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#524A44]',
    iconBg: 'bg-[#F0EAE3] text-[#9A8073]',
  },
  pro: {
    icon: Zap,
    badge: undefined,
    badgeClass: '',
    cardClass: 'border-[#EBE6E0] hover:border-[#D1C7BD]',
    btnClass: 'bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#524A44]',
    iconBg: 'bg-[#F0EAE3] text-[#9A8073]',
  },
  premium: {
    icon: Crown,
    badge: 'Most Popular',
    badgeClass: 'bg-gradient-to-r from-amber-500 to-amber-400 text-white',
    cardClass: 'border-amber-400 ring-1 ring-amber-300 shadow-[0_0_32px_rgba(251,191,36,0.15)]',
    btnClass: 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-white shadow-md',
    iconBg: 'bg-amber-50 text-amber-600',
  },
};

function getPlanMeta(slug: string) {
  return PLAN_META[slug] ?? PLAN_META.basic;
}

export default function BillingPage() {
  const { shop, user } = useAuthStore();
  const toast = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradingTo, setUpgradingTo] = useState<number | null>(null);

  const fetchBillingData = useCallback(async () => {
    if (!shop) {
      if (user) setTimeout(() => setLoading(false), 0);
      return;
    }
    try {
      const [plansRes, subRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get(`/shops/${shop.id}/subscription`),
      ]);
      // Sort: basic → pro → premium
      const order = ['basic', 'pro', 'premium'];
      const sorted = [...(plansRes.data.data ?? [])].sort(
        (a: Plan, b: Plan) => order.indexOf(a.slug) - order.indexOf(b.slug)
      );
      setPlans(sorted);
      setCurrentSubscription(subRes.data.data);
    } catch (err) {
      console.error('Failed to fetch billing data', err);
    } finally {
      setLoading(false);
    }
  }, [shop, user]);

  useEffect(() => {
    const t = setTimeout(fetchBillingData, 0);
    return () => clearTimeout(t);
  }, [fetchBillingData]);

  const handleSubscribe = async (planId: number) => {
    if (!shop) return;
    setUpgradingTo(planId);
    try {
      await api.post(`/shops/${shop.id}/subscription`, { plan_id: planId, billing_cycle: 'monthly' });
      await fetchBillingData();
      toast.success('Subscription updated successfully.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update subscription.');
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
  const activePlanSlug = currentSubscription?.plan?.slug ?? '';

  const getButtonContent = (plan: Plan) => {
    if (upgradingTo === plan.id) return <Loader2 className="w-5 h-5 animate-spin" />;
    if (activePlanId === plan.id) return <><Check size={15} /> Current Plan</>;
    const currentPrice = currentSubscription?.plan?.price_monthly ?? 0;
    if (plan.price_monthly > currentPrice) return 'Upgrade';
    if (plan.price_monthly < currentPrice) return 'Downgrade';
    return 'Select Plan';
  };

  // ── Status badge colour ──────────────────────────────────────────────────────
  const statusBadge: Record<string, string> = {
    active:    'bg-emerald-50 text-emerald-700 border-emerald-100',
    trial:     'bg-blue-50   text-blue-700   border-blue-100',
    cancelled: 'bg-rose-50   text-rose-700   border-rose-100',
    expired:   'bg-[#F0EAE3] text-[#827A73]  border-[#EBE6E0]',
  };
  const statusColor = statusBadge[currentSubscription?.status ?? ''] ?? statusBadge.expired;

  const getPlanIconData = () => {
    if (activePlanSlug === 'premium') {
      return { bgClass: 'bg-amber-50 text-amber-500', Icon: Crown };
    }
    if (activePlanSlug === 'pro') {
      return { bgClass: 'bg-[#F0EAE3] text-[#9A8073]', Icon: Zap };
    }
    return { bgClass: 'bg-[#F0EAE3] text-[#9A8073]', Icon: CreditCard };
  };

  const { bgClass: iconBgClass, Icon: PlanIcon } = getPlanIconData();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#2D2A26] mb-1">Billing &amp; Plans</h1>
        <p className="text-[#827A73]">Manage your subscription, unlock features, and scale your shop.</p>
      </div>

      {/* Current plan card */}
      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${iconBgClass}`}>
          <PlanIcon size={22} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-[#827A73]">Current Plan</p>
          <h3 className="text-xl font-bold text-[#2D2A26]">
            {currentSubscription?.plan?.name ?? 'No Active Plan'}
          </h3>
          {currentSubscription?.ends_at && (
            <p className="text-xs text-[#A8A19A] mt-0.5">
              {currentSubscription.status === 'trial' ? 'Trial ends on ' : 'Next billing: '}
              {new Date(currentSubscription.ends_at).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
        <div className="text-right">
          {currentSubscription?.plan?.price_monthly != null && (
            <p className="text-2xl font-bold text-[#2D2A26]">
              ₱{currentSubscription.plan.price_monthly.toLocaleString()}
              <span className="text-sm font-normal text-[#A8A19A]">/mo</span>
            </p>
          )}
          {currentSubscription?.status && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border mt-2 ${statusColor}`}>
              <CheckCircle size={12} />
              {currentSubscription.status.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Plans grid */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles size={16} className="text-amber-500" />
          <h2 className="text-lg font-semibold text-[#2D2A26]">Choose Your Plan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const meta = getPlanMeta(plan.slug);
            const Icon = meta.icon;
            const isActive = activePlanId === plan.id;
            let features: string[] = [];
            try { features = JSON.parse(plan.features || '[]'); } catch { features = []; }

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl p-6 flex flex-col border transition-all duration-200 ${
                  isActive ? 'border-[#9A8073] ring-1 ring-[#9A8073]' : meta.cardClass
                }`}
              >
                {/* Recommended badge */}
                {meta.badge && !isActive && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shadow ${meta.badgeClass}`}>
                    <Crown size={11} /> {meta.badge}
                  </div>
                )}
                {isActive && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#9A8073] text-white flex items-center gap-1 shadow">
                    <Check size={11} /> Active
                  </div>
                )}

                {/* Plan header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${meta.iconBg}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D2A26]">{plan.name}</h3>
                    <p className="text-xs text-[#A8A19A]">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[#2D2A26]">
                      ₱{plan.price_monthly.toLocaleString()}
                    </span>
                    <span className="text-sm text-[#A8A19A]">/mo</span>
                  </div>
                  <p className="text-xs text-[#A8A19A] mt-0.5">
                    ₱{(plan.price_monthly * 10).toLocaleString()}/yr (save 2 months)
                  </p>
                </div>

                {/* Feature list */}
                <div className="space-y-2.5 mb-6 flex-1">
                  {features.map(f => (
                    <div key={f} className="flex items-start gap-2.5">
                      <ShieldCheck
                        size={15}
                        className={`shrink-0 mt-0.5 ${plan.slug === 'premium' ? 'text-amber-500' : 'text-taupe'}`}
                      />
                      <span className="text-[13px] text-[#524A44]">{f}</span>
                    </div>
                  ))}
                </div>

                {/* CTA button */}
                <button
                  id={`plan-btn-${plan.slug}`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isActive || upgradingTo !== null}
                  className={`w-full py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm ${
                    isActive
                      ? 'bg-[#F0EAE3] text-[#A8A19A] cursor-not-allowed'
                      : meta.btnClass
                  }`}
                >
                  {getButtonContent(plan)}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-xs text-[#A8A19A] pb-4">
        All plans include a 30-day billing cycle. Upgrade or downgrade anytime.
        Payments are simulated — no actual charges are made during this phase.
      </p>
    </div>
  );
}
