'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';

interface CatalogItem {
  id: number;
  name: string;
  price: string;
  material: string;
  images: any[];
}

export default function PublicCatalogPage({ params }: { params: { shop_id: string } }) {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [shopName, setShopName] = useState('Bespoke Tailors');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We would ideally fetch the shop details here too.
    api.get(`/shops/${params.shop_id}/catalog`)
      .then(res => {
        setItems(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.shop_id]);

  if (loading) {
    return <div className="py-32 text-center text-[#A8A19A] animate-pulse">Curating showcase...</div>;
  }

  return (
    <div>
      <nav className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-serif font-bold text-xl tracking-tight text-zinc-900">
            {shopName}
          </div>
          <div className="flex gap-4">
            <Link 
              href={`/shop/${params.shop_id}/book`}
              className="bg-black text-[#2D2A26] hover:bg-[#F0EAE3] px-6 py-2 rounded-full font-medium transition-colors text-sm"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </nav>

      <div className="bg-zinc-50 py-20 border-b border-zinc-200 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-zinc-900 mb-4">
          The Sartorial Collection
        </h1>
        <p className="text-lg text-[#A8A19A] max-w-2xl mx-auto">
          Explore our premium tailored garments, crafted with the finest materials and meticulous attention to detail.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {items.map(item => {
            const primaryImage = item.images.find(img => img.is_primary)?.image_url || item.images[0]?.image_url;
            return (
              <Link href={`/shop/${params.shop_id}/catalog/${item.id}`} key={item.id} className="group block">
                <div className="aspect-[3/4] bg-zinc-100 overflow-hidden relative">
                  {primaryImage ? (
                    <img 
                      src={primaryImage} 
                      alt={item.name} 
                      className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#524A44] bg-zinc-100">No Image</div>
                  )}
                  
                  {/* Hover Overlay for Material */}
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                    <span className="text-sm font-medium tracking-widest uppercase text-zinc-900 border border-zinc-900 px-6 py-3">
                      {item.material || 'View Details'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <h3 className="text-lg font-medium text-zinc-900 group-hover:text-[#886E62] transition-colors">{item.name}</h3>
                  <p className="text-sm text-[#A8A19A] mt-1">₱{Number(item.price).toLocaleString()}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-20 text-[#A8A19A]">
            This shop hasn't published any showcase items yet.
          </div>
        )}
      </div>
    </div>
  );
}
