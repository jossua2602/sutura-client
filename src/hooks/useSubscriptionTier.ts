import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';

export type SubscriptionTier = 'basic' | 'pro' | 'premium';

/**
 * Feature keys and which minimum tier unlocks them:
 *
 * BASIC:   customer_management | appointments | order_tracking | measurements
 * PRO:     portfolio | staff | analytics | notifications | inquiry | boosted_visibility
 * PREMIUM: reports | featured_visibility | custom_branding | advanced_dashboard
 */
export type GatedFeature =
  | 'portfolio'
  | 'staff'
  | 'analytics'
  | 'notifications'
  | 'inquiry'
  | 'boosted_visibility'
  | 'reports'
  | 'featured_visibility'
  | 'custom_branding'
  | 'advanced_dashboard';

export interface UseSubscriptionTierReturn {
  tier: SubscriptionTier;
  loading: boolean;
  isGated: (feature: GatedFeature) => boolean;
}

export function useSubscriptionTier(): UseSubscriptionTierReturn {
  const { shop } = useAuthStore();
  // Default to 'premium' so no features are prematurely gated during load
  const [tier, setTier] = useState<SubscriptionTier>('premium');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop?.id) {
      setTimeout(() => setLoading(false), 0);
      return;
    }

    api.get(`/shops/${shop.id}/subscription`)
      .then(res => {
        const sub = res.data.data;
        const planSlug: string = (sub?.plan?.slug || sub?.plan?.name || '').toLowerCase();

        if (planSlug.includes('premium')) {
          setTier('premium');
        } else if (planSlug.includes('pro')) {
          setTier('pro');
        } else if (planSlug.includes('basic')) {
          setTier('basic');
        } else {
          // No active subscription — treat as Basic
          setTier('basic');
        }
        setLoading(false);
      })
      .catch(() => {
        // On API error, default to premium to avoid accidental lockout during dev
        setTier('premium');
        setLoading(false);
      });
  }, [shop?.id]);

  /**
   * Returns true if the feature is locked for the current tier.
   *
   * Tier hierarchy:
   *   basic  — cannot use PRO or PREMIUM features
   *   pro    — can use PRO features, cannot use PREMIUM features
   *   premium — full access to everything
   */
  const isGated = (feature: GatedFeature): boolean => {
    if (loading) return false;
    if (tier === 'premium') return false;

    // Features that require at least PRO
    const proFeatures = new Set<GatedFeature>([
      'portfolio',
      'staff',
      'analytics',
      'notifications',
      'inquiry',
      'boosted_visibility',
    ]);

    // Features that require PREMIUM
    const premiumFeatures = new Set<GatedFeature>([
      'reports',
      'featured_visibility',
      'custom_branding',
      'advanced_dashboard',
    ]);

    if (tier === 'pro') {
      // Pro users are gated only from premium-only features
      return premiumFeatures.has(feature);
    }

    if (tier === 'basic') {
      // Basic users are gated from everything PRO and PREMIUM
      return proFeatures.has(feature) || premiumFeatures.has(feature);
    }

    return false;
  };

  return { tier, loading, isGated };
}
