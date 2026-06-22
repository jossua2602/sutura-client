import React from 'react';
import Link from 'next/link';
import { BookOpen, Tag, Package, Settings, Scissors } from 'lucide-react';

export default function WelcomeView() {
  const onboardingSteps = [
    {
      step: "Step 1",
      title: "Declare Specializations",
      desc: "Go to Specializations to pick categories (Gown, Barong, Jersey, Cosplay) or add custom ones. Set starting prices, MOQ, and sewing days so customers know exactly what you offer.",
      icon: Tag,
      href: "/dashboard/specializations"
    },
    {
      step: "Step 2",
      title: "Configure Services & Fields",
      desc: "Go to Services to define what garments you sew. Enable customized dynamic specifications (like custom name/number fields) so customers provide all measurements correctly during fittings.",
      icon: Package,
      href: "/dashboard/services"
    },
    {
      step: "Step 3",
      title: "Setup Operating Hours & Coordinates",
      desc: "Open Shop Settings to select your Business Type, set map coordinates (so your branch gets discoverable), define operating hours, and customize rental deposits or fitting policies.",
      icon: Settings,
      href: "/dashboard/settings"
    },
    {
      step: "Step 4",
      title: "Track Garment Production",
      desc: "Use the Jobs panel to monitor active sewing workflows (cutting, sewing, fitted, finished). Assign staff, track downpayments, and coordinate order statuses in real-time.",
      icon: Scissors,
      href: "/dashboard/jobs"
    }
  ];

  return (
    <div className="bg-white border border-[#EBE6E0] rounded-3xl p-8 max-w-4xl mx-auto shadow-xs space-y-8 animate-fade-in text-[#2D2A26]">
      <div className="text-center space-y-3 pb-6 border-b border-[#FAF6F3]">
        <div className="w-16 h-16 bg-[#FAF6F3] rounded-full flex items-center justify-center mx-auto text-[#9A8073]">
          <BookOpen size={28} />
        </div>
        <h2 className="text-2xl font-heading font-semibold text-[#2D2A26]">Welcome to SUTURA Tailoring Tracker</h2>
        <p className="text-[#827A73] text-sm max-w-md mx-auto">Here is a quick guide on how to configure and maximize your digital storefront to capture more business.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {onboardingSteps.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="bg-[#FAF6F3] border border-[#EBE6E0] rounded-2xl p-6 flex gap-4 transition-all hover:border-[#D1C7BD]">
              <div className="bg-white border border-[#EBE6E0] w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs text-[#9A8073]">
                <Icon size={22} />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-[#9A8073] uppercase tracking-wider">{item.step}</span>
                <h4 className="font-semibold text-sm text-[#2D2A26]">{item.title}</h4>
                <p className="text-xs text-[#827A73] leading-relaxed mb-3">{item.desc}</p>
                <Link href={item.href} className="text-xs font-semibold text-[#9A8073] hover:text-[#91756A] flex items-center gap-1.5 transition-colors">
                  Configure now →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-6 border-t border-[#FAF6F3] flex justify-between items-center flex-wrap gap-4 text-xs text-[#A8A19A]">
        <p>Need support? Feel free to contact our administrative team via Support Tickets.</p>
        <Link href="/dashboard/support" className="px-4 py-2 bg-[#9A8073] hover:bg-[#91756A] text-white rounded-lg font-medium transition-all shadow-xs">
          Create Ticket
        </Link>
      </div>
    </div>
  );
}
