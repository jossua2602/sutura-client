'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Scissors, UserCog, Package, Settings, Users, Building2, Calendar, ShoppingBag, LogOut, User, Grip, ChevronDown, LifeBuoy, Tag, Home, Ruler } from 'lucide-react';
import api from '@/lib/axios';
import NotificationBell from '@/components/NotificationBell';
import BrandLogo from '@/components/BrandLogo';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, logout, setAuth, token } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setIsSidebarOpen(false);
    setPrevPathname(pathname);
  }

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (!user && token) {

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
        });
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

  // Handled during render instead of effect to avoid cascading renders

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

  if (!mounted || !isAuthenticated) return null;

  const NAV_ITEMS = [
    { name: 'Home',          path: '/dashboard',             icon: Home },
    { name: 'Jobs',          path: '/dashboard/jobs',        icon: Scissors },
    { name: 'Premade Orders',path: '/dashboard/orders',      icon: Package },
    { name: 'Appointments',  path: '/dashboard/appointments',icon: Calendar },
    { name: 'Catalog',       path: '/dashboard/catalog',     icon: ShoppingBag },
    { name: 'Customers',     path: '/dashboard/customers',   icon: Users },
    { name: 'Services',      path: '/dashboard/services',    icon: Package },
    { name: 'Specializations',path: '/dashboard/specializations',icon: Tag },
    { name: 'Staff',         path: '/dashboard/staff',       icon: UserCog },
    { name: 'Branches',      path: '/dashboard/branches',    icon: Building2 },
    { name: 'Support',       path: '/dashboard/support',     icon: LifeBuoy },
    { name: 'Reports',       path: '/dashboard/reports',     icon: LayoutDashboard },
    { name: 'Shop Settings', path: '/dashboard/settings',    icon: Settings },
  ];

  const getNavItemClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
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
              <div className="w-10 h-10 rounded-full overflow-hidden bg-[#9A8073] flex items-center justify-center text-white font-semibold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] bg-[#EBE6E0] rounded-full border-[1.5px] border-white flex items-center justify-center text-[#524A44]">
                <ChevronDown size={12} strokeWidth={3} />
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] py-2 z-50">
                <div className="px-4 py-3 border-b border-[#EBE6E0] mb-2">
                  <p className="text-sm font-semibold text-[#2D2A26] truncate">{user?.name}</p>
                  <p className="text-xs text-[#827A73] truncate">{user?.roles[0]?.name?.replace('_', ' ') || 'Shop Owner'}</p>
                </div>
                
                <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#524A44] hover:bg-[#F0EAE3] hover:text-[#2D2A26] transition-colors" onClick={() => setIsProfileOpen(false)}>
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
          <div 
            className="absolute inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`absolute inset-y-0 left-0 z-40 w-[280px] bg-[#FAF6F3] overflow-y-auto transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="py-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link key={item.path} href={item.path} className={getNavItemClass(item.path)}>
                <item.icon size={20} className={pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path)) ? 'text-[#9A8073]' : 'text-[#827A73]'} />
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
