'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Package } from 'lucide-react';

const TABS = [
  { label: 'Design Catalog', href: '/dashboard/catalog', icon: ShoppingBag },
  { label: 'Ready-to-Wear Orders', href: '/dashboard/orders', icon: Package },
];

/**
 * Module-level tabs that unite the Design Catalog (product listings) and the
 * Ready-to-Wear Orders (sales fulfillment) under one module, so RTW is no longer
 * a separate sidebar item.
 */
export default function CatalogModuleTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-[#EBE6E0]">
      {TABS.map(tab => {
        const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
              active
                ? 'border-[#9A8073] text-[#2D2A26]'
                : 'border-transparent text-[#827A73] hover:text-[#2D2A26]'
            }`}
          >
            <Icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
