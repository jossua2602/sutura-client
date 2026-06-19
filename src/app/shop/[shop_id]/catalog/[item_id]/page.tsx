'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { Ruler, Info, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function PublicProductDetailPage({ params }: { params: { shop_id: string, item_id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [showFAQ, setShowFAQ] = useState(false);

  useEffect(() => {
    api.get(`/shops/${params.shop_id}/catalog/${params.item_id}`)
      .then(res => {
        setItem(res.data.data);
        const primary = res.data.data.images.find((i:any) => i.is_primary) || res.data.data.images[0];
        if (primary) setSelectedImage(primary.image_url);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [params.shop_id, params.item_id]);

  if (loading) {
    return <div className="py-32 text-center text-[#A8A19A] animate-pulse">Loading garment details...</div>;
  }

  if (!item) {
    return <div className="py-32 text-center text-[#A8A19A]">Item not found.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        
        {/* Images Column */}
        <div className="flex gap-4 h-[800px] sticky top-24">
          <div className="w-24 flex flex-col gap-4 overflow-y-auto hidden md:flex">
            {item.images.map((img: any) => (
              <button 
                key={img.id}
                onClick={() => setSelectedImage(img.image_url)}
                className={`aspect-[3/4] w-full bg-zinc-100 overflow-hidden border-2 transition-all ${selectedImage === img.image_url ? 'border-zinc-900 opacity-100' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img.image_url} alt={img.view_angle} className="w-full h-full object-cover object-top" />
              </button>
            ))}
          </div>
          <div className="flex-1 bg-zinc-100 overflow-hidden relative">
            {selectedImage ? (
              <img src={selectedImage} alt={item.name} className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#827A73]">No Image</div>
            )}
          </div>
        </div>

        {/* Product Details Column */}
        <div className="py-8">
          <h1 className="text-3xl font-serif font-semibold text-zinc-900">{item.name}</h1>
          <p className="text-xl text-[#827A73] mt-3">₱{Number(item.price).toLocaleString()} <span className="text-sm text-[#827A73] font-normal">PHP</span></p>
          
          <div className="mt-8 pt-8 border-t border-zinc-200">
            <p className="text-[#827A73] leading-relaxed">
              {item.description}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="bg-zinc-50 p-6">
              <h3 className="font-medium text-zinc-900 flex items-center gap-2 mb-4">
                <Info size={18} /> Specifications
              </h3>
              <ul className="space-y-2 text-sm text-[#827A73]">
                {item.material && <li>• {item.material}</li>}
                {item.features?.map((feat: string, idx: number) => (
                  <li key={idx}>• {feat}</li>
                ))}
              </ul>
            </div>

            <div className="bg-zinc-50 p-6">
              <h3 className="font-medium text-zinc-900 flex items-center gap-2 mb-4">
                <Ruler size={18} /> Size & Fit Guide
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {item.fit_guide?.map((size: string, idx: number) => (
                  <div key={idx} className="border border-zinc-300 py-2 text-center text-sm font-medium text-zinc-700 bg-white">
                    {size}
                  </div>
                ))}
                {(!item.fit_guide || item.fit_guide.length === 0) && (
                  <div className="col-span-4 text-sm text-[#A8A19A]">Custom tailored to your measurements.</div>
                )}
              </div>
            </div>

            {/* Garment Care & Alterations Collapsible */}
            <div className="border border-zinc-200 bg-white">
              <button 
                onClick={() => setShowFAQ(!showFAQ)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <h3 className="font-medium text-zinc-900 flex items-center gap-2">
                  <ShieldCheck size={18} /> Garment Care & Alterations
                </h3>
                <span className="text-[#827A73] text-sm font-medium">{showFAQ ? 'Close' : 'Learn More'}</span>
              </button>
              {showFAQ && (
                <div className="px-6 pb-6 pt-2 text-sm text-[#827A73] leading-relaxed whitespace-pre-wrap border-t border-zinc-100">
                  {item.care_instructions || "Professional dry-clean only. Altered garments are final sale."}
                </div>
              )}
            </div>
          </div>

          <button className="w-full bg-white shadow-sm hover:bg-black text-[#2D2A26] font-medium tracking-wide py-4 mt-8 transition-colors">
            BOOK A FITTING
          </button>
        </div>
      </div>

      {/* Recommendations / Also Suggested */}
      {item.recommendations && item.recommendations.length > 0 && (
        <div className="mt-32 pt-16 border-t border-zinc-200">
          <h2 className="text-2xl font-serif font-semibold text-center text-zinc-900 mb-12">Also Suggested</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {item.recommendations.map((rec: any) => {
              const recItem = rec.recommendedItem;
              if (!recItem) return null;
              const recImage = recItem.images?.find((i:any) => i.is_primary)?.image_url || recItem.images?.[0]?.image_url;
              
              return (
                <Link href={`/shop/${params.shop_id}/catalog/${recItem.id}`} key={recItem.id} className="group block text-center">
                  <div className="aspect-square bg-zinc-100 overflow-hidden mb-4 relative">
                    {recImage ? (
                      <img src={recImage} alt={recItem.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#524A44]">No Image</div>
                    )}
                  </div>
                  <h4 className="text-sm font-medium text-zinc-900 group-hover:text-[#886E62]">{recItem.name}</h4>
                  <p className="text-xs text-[#A8A19A] mt-1">₱{Number(recItem.price).toLocaleString()}</p>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
