import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/axios';

/**
 * Print pages live outside the dashboard route tree (so they render with a
 * plain white background instead of the sidebar/header), which means they
 * miss the two things dashboard/layout.tsx normally does for free: redirect
 * to /login when unauthenticated, and rehydrate `user`/`shop` via /auth/me —
 * useAuthStore only persists the raw token to localStorage, so on a fresh
 * tab `shop` is always null until something explicitly re-fetches it, which
 * otherwise silently stalls any page that fetches by shop.id.
 */
export function usePrintAuthGuard() {
  const { user, shop, token, isAuthenticated, setAuth, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!shop && token) {
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            const { user: freshUser, shop: freshShop, staff_profile } = res.data.data;
            let activeShop = freshShop;
            if ((freshUser?.roles?.[0]?.name === 'staff' || freshUser?.roles?.[0]?.name === 'branch_manager') && staff_profile?.shop) {
              activeShop = staff_profile.shop;
            }
            setAuth(freshUser, token, activeShop, staff_profile);
          }
        })
        .catch(() => {
          logout();
          router.push('/login');
        });
    }
  }, [isAuthenticated, user, shop, token, router, setAuth, logout]);
}
