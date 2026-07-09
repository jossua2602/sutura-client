'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Package, BarChart3 } from 'lucide-react';

const TABS = [
  { label: 'Design Catalog', href: '/dashboard/catalog', icon: ShoppingBag },
  { label: 'Ready-to-Wear Orders', href: '/dashboard/orders', icon: Package },
  { label: 'Analytics', href: '/dashboard/catalog/analytics', icon: BarChart3 },
];

/**
 * Module-level tabs that unite the Design Catalog (product listings), the
 * Ready-to-Wear Orders (sales fulfillment), and Analytics under one module,
 * so RTW is no longer a separate sidebar item.
 */
export default function CatalogModuleTabs() {
  const pathname = usePathname();

  // Pick whichever tab's href is the longest matching prefix, so a sub-route
  // like /dashboard/catalog/analytics doesn't also light up the Design
  // Catalog tab just because it shares the same /dashboard/catalog prefix.
  const activeHref = TABS
    .map(t => t.href)
    .filter(href => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <div className="flex items-center gap-1 border-b border-[#EBE6E0]">
      {TABS.map(tab => {
        const active = tab.href === activeHref;
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
