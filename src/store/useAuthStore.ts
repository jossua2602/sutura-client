import { create } from 'zustand';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profile_picture?: string;
  cover_photo?: string;
  roles: { id: number; name: string }[];
}

export interface Shop {
  id: number;
  name: string;
  slug: string;
  status: string;
  business_type?: string;
}

export interface StaffProfile {
  id: number;
  role: string;
  shop?: Shop;
}

interface AuthState {
  user: User | null;
  shop: Shop | null;
  staffProfile: StaffProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, shop?: Shop, staffProfile?: StaffProfile) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  shop: null,
  staffProfile: null,
  token: typeof globalThis.window !== 'undefined' ? localStorage.getItem('sutura_token') : null,
  isAuthenticated: !!(typeof window !== 'undefined' && localStorage.getItem('sutura_token')),
  
  setAuth: (user, token, shop, staffProfile) => {
    if (typeof globalThis.window !== 'undefined') {
      localStorage.setItem('sutura_token', token);
    }
    set({ user, token, shop: shop || null, staffProfile: staffProfile || null, isAuthenticated: true });
  },

  logout: () => {
    if (typeof globalThis.window !== 'undefined') {
      localStorage.removeItem('sutura_token');
    }
    set({ user: null, shop: null, staffProfile: null, token: null, isAuthenticated: false });
  },
}));
