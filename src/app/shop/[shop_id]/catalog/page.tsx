'use client';

import { useEffect, useState, use } from 'react';
import api from '@/lib/axios';
import Link from 'next/link';
import Image from 'next/image';
import { Search } from 'lucide-react';

interface CatalogItemImage {
  id: number;
  image_url: string;
  is_primary: boolean;
}

interface CatalogItem {
  id: number;
  name: string;
  price: string;
  material: string;
  garment_type?: string | null;
  images: CatalogItemImage[];
}

export default function PublicCatalogPage({ params }: Readonly<{ params: Promise<{ shop_id: string }> }>) {
  const { shop_id: shopId } = use(params);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopLogo, setShopLogo] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [garmentTypeFilter, setGarmentTypeFilter] = useState('');

  useEffect(() => {
    api.get(`/catalog/${shopId}`)
      .then(res => {
        setItems(res.data.data);
        setShopName(res.data.shop?.name || '');
        setShopDescription(res.data.shop?.description || '');
        setShopLogo(res.data.shop?.logo_path || '');
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [shopId]);

  if (loading) {
    return <div className="py-32 text-center text-[#A8A19A] animate-pulse">Curating showcase...</div>;
  }

  const garmentTypeOptions = Array.from(
    new Set(items.map(i => i.garment_type).filter((v): v is string => !!v && v.trim() !== ''))
  ).sort((a, b) => a.localeCompare(b));

  const filteredItems = items.filter(item =>
    (!search || item.name.toLowerCase().includes(search.toLowerCase())) &&
    (!garmentTypeFilter || item.garment_type === garmentTypeFilter)
  );

  return (
    <div>
      <nav className="border-b border-zinc-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/shop/${shopId}`} className="font-serif font-bold text-xl tracking-tight text-zinc-900 hover:text-[#886E62] transition-colors flex items-center gap-3">
            {shopLogo ? (
              <Image
                src={shopLogo}
                alt="Logo"
                width={32}
                height={32}
                className="w-8 h-8 rounded-full object-cover border border-zinc-200"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-[#827A73] font-serif text-sm shrink-0">
                {(shopName || 'S').charAt(0).toUpperCase()}
              </div>
            )}
            {shopName || 'Showcase'}
          </Link>
          <div className="flex gap-4">
            <Link
              href={`/shop/${shopId}/book`}
              className="bg-black text-white hover:bg-zinc-800 px-6 py-2 rounded-full font-medium transition-colors text-sm"
            >
              Book Appointment
            </Link>
          </div>
        </div>
      </nav>

      <div className="bg-zinc-50 py-20 border-b border-zinc-200 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-semibold tracking-tight text-zinc-900 mb-4">
          {shopName ? `${shopName}'s Collection` : 'The Sartorial Collection'}
        </h1>
        <p className="text-lg text-[#A8A19A] max-w-2xl mx-auto">
          {shopDescription || 'Explore our premium tailored garments, crafted with the finest materials and meticulous attention to detail.'}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={16} />
              <input
                type="text"
                placeholder="Search this collection... e.g. team jersey, barong, gown"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-full text-sm text-zinc-900 placeholder-[#A8A19A] focus:outline-none focus:border-zinc-400 transition-colors"
              />
            </div>
            {garmentTypeOptions.length > 1 && (
              <select
                value={garmentTypeFilter}
                onChange={e => setGarmentTypeFilter(e.target.value)}
                className="px-4 py-3 bg-white border border-zinc-200 rounded-full text-sm text-zinc-900 focus:outline-none focus:border-zinc-400 transition-colors"
              >
                <option value="">All Garment Types</option>
                {garmentTypeOptions.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {filteredItems.map(item => {
            const primaryImage = item.images.find(img => img.is_primary)?.image_url || item.images[0]?.image_url;
            return (
              <Link href={`/shop/${shopId}/catalog/${item.id}`} key={item.id} className="group block">
                <div className="aspect-3/4 bg-zinc-100 overflow-hidden relative">
                  {primaryImage ? (
                    <Image
                      src={primaryImage}
                      alt={item.name}
                      className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105"
                      fill
                      unoptimized
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
            This shop hasn&apos;t published any showcase items yet.
          </div>
        )}

        {items.length > 0 && filteredItems.length === 0 && (
          <div className="text-center py-20 text-[#A8A19A]">
            No items match your search. Try a different keyword or garment type.
          </div>
        )}
      </div>
    </div>
  );
}
