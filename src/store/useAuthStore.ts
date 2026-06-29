import { create } from 'zustand';

export interface UserSocialLinks {
  instagram?: string;
  youtube?: string;
  website?: string;
}

export interface UserExperience {
  title: string;
  company: string;
  duration: string;
}

export interface UserEducation {
  degree: string;
  school: string;
  year: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  profile_picture?: string;
  cover_photo?: string;
  roles: { id: number; name: string }[];
  bio?: string;
  skills?: string[];
  social_links?: UserSocialLinks;
  experience?: UserExperience[];
  education?: UserEducation[];
  creations_gallery?: string[];
}

export interface Shop {
  id: number;
  name: string;
  slug: string;
  status: string;
  business_type?: string;
  city?: string;
  province?: string;
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
  token: globalThis.window === undefined ? null : localStorage.getItem('sutura_token'),
  isAuthenticated: globalThis.window !== undefined && localStorage.getItem('sutura_token') !== null,
  
  setAuth: (user, token, shop, staffProfile) => {
    if (globalThis.window !== undefined) {
      localStorage.setItem('sutura_token', token);
    }
    set({ user, token, shop: shop || null, staffProfile: staffProfile || null, isAuthenticated: true });
  },

  logout: () => {
    if (globalThis.window !== undefined) {
      localStorage.removeItem('sutura_token');
    }
    set({ user: null, shop: null, staffProfile: null, token: null, isAuthenticated: false });
  },
}));
