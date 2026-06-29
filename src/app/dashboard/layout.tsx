'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { LayoutDashboard, Scissors, UserCog, Package, Settings, Users, Building2, Calendar, ShoppingBag, LogOut, User, Grip, ChevronDown, LifeBuoy, Home, Star, CreditCard, Receipt, MapPin } from 'lucide-react';
import api from '@/lib/axios';
import NotificationBell from '@/components/NotificationBell';
import BrandLogo from '@/components/BrandLogo';
import { ToastProvider } from '@/context/ToastContext';
import { BranchProvider, useBranch } from '@/context/BranchContext';

function DashboardLayoutContent({ children }: { readonly children: React.ReactNode }) {
  const { user, isAuthenticated, logout, setAuth, token, shop } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const pathname = usePathname();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [prevPathname, setPrevPathname] = useState(pathname);
  
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const branchRef = useRef<HTMLDivElement>(null);

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
      if (branchRef.current && !branchRef.current.contains(event.target as Node)) {
        setIsBranchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const isShopOwner = user?.roles?.[0]?.name === 'shop_owner';

  const NAV_GROUPS = [
    {
      title: 'Command Center',
      items: [
        { name: 'Home',          path: '/dashboard',             icon: Home },
        { name: 'Appointments',  path: '/dashboard/appointments',icon: Calendar },
        { name: 'Payments Queue',path: '/dashboard/payments',    icon: CreditCard },
      ]
    },
    {
      title: 'Workroom',
      items: [
        { name: 'Custom Jobs',   path: '/dashboard/jobs',        icon: Scissors },
        { name: 'Ready-to-Wear', path: '/dashboard/orders',      icon: Package },
        { name: 'Customers',     path: '/dashboard/customers',   icon: Users },
      ]
    },
    {
      title: 'Showroom',
      items: [
        { name: 'Design Catalog',path: '/dashboard/catalog',     icon: ShoppingBag },
        { name: 'Services',      path: '/dashboard/services',    icon: Package },
        { name: 'Reviews',       path: '/dashboard/reviews',     icon: Star },
      ]
    },
    {
      title: 'Team & Performance',
      items: [
        { name: 'Team Members',  path: '/dashboard/staff',       icon: UserCog },
        { name: 'Insights',      path: '/dashboard/reports',     icon: LayoutDashboard },
      ]
    },
    {
      title: 'Configuration',
      items: [
        { name: 'Shop Settings', path: '/dashboard/settings',    icon: Settings },
        { name: 'Billing & Plans',path: '/dashboard/billing',   icon: Receipt },
        ...(isShopOwner ? [{ name: 'Branches', path: '/dashboard/branches', icon: Building2 }] : []),
      ]
    }
  ];

  const getNavItemClass = (path: string) => {
    const isActive = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
    return `flex items-center gap-3 px-4 py-2.5 mx-3 rounded-xl text-[14px] font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-[#F0EAE3] text-[#2D2A26]' 
        : 'text-[#827A73] hover:bg-[#FAF6F3] hover:text-[#2D2A26]'
    }`;
  };

  return (
    <div className="h-screen bg-[#FAF6F3] flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="print:hidden h-[64px] bg-white border-b border-[#EBE6E0] flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <BrandLogo />
          {shop?.id && branches.length > 0 && (
            <div className="relative hidden md:block animate-fade-in" ref={branchRef}>
              <button 
                onClick={() => setIsBranchOpen(!isBranchOpen)}
                className="flex items-center gap-2 bg-[#FAF6F3] border border-[#EBE6E0] px-3.5 py-1.5 rounded-xl hover:bg-[#F0EAE3] transition-colors cursor-pointer text-[13px] font-medium text-[#2D2A26] focus:outline-none"
              >
                <Building2 size={14} className="text-[#827A73]" />
                <span>
                  {selectedBranchId === null 
                    ? 'All Branches' 
                    : (branches.find(b => b.id === selectedBranchId)?.name || 'All Branches')}
                </span>
                <ChevronDown size={12} className={`text-[#827A73] transition-transform duration-200 ${isBranchOpen ? 'rotate-180' : ''}`} />
              </button>

              {isBranchOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] py-2 z-50 border border-[#EBE6E0] animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-4 py-2 border-b border-[#EBE6E0] mb-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#A8A19A]">Switch Location</p>
                  </div>

                  {/* All Branches Option */}
                  <button
                    onClick={() => {
                      setSelectedBranchId(null);
                      setIsBranchOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] hover:bg-[#F0EAE3] transition-colors text-left ${
                      selectedBranchId === null ? 'text-[#2D2A26] font-semibold bg-[#FAF6F3]' : 'text-[#524A44]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 size={14} className="text-[#827A73]" />
                      <span>All Branches</span>
                    </div>
                    {selectedBranchId === null && (
                      <span className="w-1.5 h-1.5 bg-[#9A8073] rounded-full" />
                    )}
                  </button>

                  {/* Individual Branches */}
                  {branches.map(b => (
                    <button
                      key={b.id}
                      onClick={() => {
                        setSelectedBranchId(b.id);
                        setIsBranchOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] hover:bg-[#F0EAE3] transition-colors text-left ${
                        selectedBranchId === b.id ? 'text-[#2D2A26] font-semibold bg-[#FAF6F3]' : 'text-[#524A44]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin size={14} className="text-[#827A73]" />
                        <span className="truncate max-w-[150px]">{b.name}</span>
                      </div>
                      {selectedBranchId === b.id && (
                        <span className="w-1.5 h-1.5 bg-[#9A8073] rounded-full" />
                      )}
                    </button>
                  ))}

                  <div className="h-px bg-[#EBE6E0] my-1"></div>

                  {/* Manage Branches Link */}
                  <Link
                    href="/dashboard/branches"
                    onClick={() => setIsBranchOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#9A8073] hover:bg-[#F0EAE3] hover:text-[#2D2A26] transition-colors font-medium"
                  >
                    <Settings size={14} />
                    <span>Manage Branches</span>
                  </Link>
                </div>
              )}
            </div>
          )}
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
                <Link href="/dashboard/account-settings" className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-[#524A44] hover:bg-[#F0EAE3] hover:text-[#2D2A26] transition-colors" onClick={() => setIsProfileOpen(false)}>
                  <Settings size={16} /> Account Settings
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
            className="absolute inset-0 bg-black/20 z-30 lg:hidden"
            aria-label="Close sidebar"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`print:hidden absolute inset-y-0 left-0 z-40 w-[280px] bg-[#FAF6F3] overflow-y-auto transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="py-4 flex flex-col justify-between h-full">
            <div className="space-y-6">
              {NAV_GROUPS.map((group) => (
                <div key={group.title} className="space-y-1.5">
                  <h3 className="px-7 text-[10px] font-bold uppercase tracking-wider text-[#A8A19A] select-none">
                    {group.title}
                  </h3>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <Link key={item.path} href={item.path} className={getNavItemClass(item.path)}>
                        <item.icon size={18} className={pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path)) ? 'text-[#9A8073]' : 'text-[#827A73]'} />
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Help & Support Footer inside sidebar */}
            <div className="pt-4 border-t border-[#EBE6E0] mt-6 mb-4">
              <Link href="/dashboard/support" className={getNavItemClass('/dashboard/support')}>
                <LifeBuoy size={18} className={pathname === '/dashboard/support' ? 'text-[#9A8073]' : 'text-[#827A73]'} />
                Help & Support
              </Link>
            </div>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#FAF6F3] print:p-0 print:overflow-visible print:bg-white">
          <div className="max-w-[1400px] mx-auto print:max-w-none">
             {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <ToastProvider>
      <BranchProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </BranchProvider>
    </ToastProvider>
  );
}
