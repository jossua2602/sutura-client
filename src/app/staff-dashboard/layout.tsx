'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Scissors, Users, LogOut, User, Grip, ChevronDown } from 'lucide-react';
import api from '@/lib/axios';
import NotificationBell from '@/components/NotificationBell';
import BrandLogo from '@/components/BrandLogo';

export default function StaffDashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, isAuthenticated, logout, setAuth, token, staffProfile } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const pathname = usePathname();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!user && token) {
      setTimeout(() => setRestoring(true), 0);
      api.get('/auth/me')
        .then(res => {
          if (res.data.success) {
            const { user, shop, staff_profile } = res.data.data;
            let activeShop = shop;
            if ((user.roles[0]?.name === 'staff' || user.roles[0]?.name === 'branch_manager') && staff_profile?.shop) {
              activeShop = staff_profile.shop;
            }
            setAuth(user, token, activeShop, staff_profile);
          }
        })
        .catch(() => {
          logout();
          router.push('/login');
        })
        .finally(() => {
          setTimeout(() => setRestoring(false), 0);
        });
    } else if (user && user.roles[0]?.name !== 'staff' && user.roles[0]?.name !== 'branch_manager') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, user, token, router, setAuth, logout]);

  // Handle click outside for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar on route change on mobile
  useEffect(() => {
    setTimeout(() => setIsSidebarOpen(false), 0);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      logout();
      router.push('/login');
    }
  };

  if (!mounted || !isAuthenticated || restoring) return null;

  const NAV_ITEMS = [
    { name: 'My Jobs', path: '/staff-dashboard', icon: Scissors },
    { name: 'Customers', path: '/staff-dashboard/customers', icon: Users },
  ];

  const getNavItemClass = (path: string) => {
    const isActive = pathname === path || (path !== '/staff-dashboard' && pathname.startsWith(path));
    return `flex items-center gap-3 px-4 py-3 mx-3 rounded-xl text-[15px] font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-[#F0EAE3] text-[#2D2A26]' 
        : 'text-[#827A73] hover:bg-[#FAF6F3] hover:text-[#2D2A26]'
    }`;
  };

  return (
    <div className="h-screen bg-[#FAF6F3] flex flex-col overflow-hidden">
      {/* Top Navigation Bar (Facebook Style) */}
      <header className="h-[64px] bg-white border-b border-[#EBE6E0] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center w-[256px]">
          <BrandLogo />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Mobile Menu Toggle (Grid Icon) */}
          <button 
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-[#EBE6E0] text-[#524A44] hover:bg-[#D1C7BD] transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Grip size={20} fill="currentColor" />
          </button>

          <NotificationBell />

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#D1C7BD] flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'S'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] bg-[#EBE6E0] rounded-full border-[1.5px] border-white flex items-center justify-center text-[#524A44]">
                <ChevronDown size={12} strokeWidth={3} />
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] py-2 z-50">
                <div className="px-4 py-3 border-b border-[#EBE6E0] mb-2">
                  <p className="text-sm font-semibold text-[#2D2A26] truncate">{user?.name}</p>
                  <p className="text-xs text-[#827A73] truncate">{staffProfile?.role || 'Staff'}</p>
                </div>
                
                <Link href="/staff-dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#524A44] hover:bg-[#F0EAE3] hover:text-[#2D2A26] transition-colors" onClick={() => setIsProfileOpen(false)}>
                  <User size={16} /> My Profile
                </Link>
                <div className="h-px bg-[#EBE6E0] my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-[#B26959] hover:bg-[#F0EAE3] transition-colors text-left"
                >
                  <LogOut size={16} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <button 
            type="button"
            aria-label="Close sidebar"
            className="absolute inset-0 bg-black/20 z-30 lg:hidden w-full h-full cursor-default"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`absolute inset-y-0 left-0 z-40 w-[280px] bg-[#FAF6F3] overflow-y-auto transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.path} href={item.path} className={getNavItemClass(item.path)}>
                <item.icon size={20} className={pathname === item.path || (item.path !== '/staff-dashboard' && pathname.startsWith(item.path)) ? 'text-[#9A8073]' : 'text-[#827A73]'} />
                {item.name}
              </Link>
            ))}
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#FAF6F3]">
          <div className="max-w-[1400px] mx-auto">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}
