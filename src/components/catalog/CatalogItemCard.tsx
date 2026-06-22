import React from 'react';
import Link from 'next/link';
import { Pencil, Trash2, Heart, Eye, Star, Image as ImageIcon } from 'lucide-react';
import { CatalogItem, formatCatalogPrice, getCatalogActionLabel, getListingTypeLabel } from './catalogHelpers';

interface CatalogItemCardProps {
  item: CatalogItem;
  onSave: (id: number) => Promise<void>;
  onView: (id: number) => Promise<void>;
  onOpenRating: (id: number) => void;
  onOpenDelete: (id: number) => void;
}

export default function CatalogItemCard({
  item,
  onSave,
  onView,
  onOpenRating,
  onOpenDelete,
}: CatalogItemCardProps) {
  const primaryImage = item.images.find(img => img.is_primary)?.image_url || item.images[0]?.image_url;

  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden group relative flex flex-col shadow-lg shadow-black/20 text-[#2D2A26]">
      {/* Image Section */}
      <div className="aspect-3/4 bg-[#F0EAE3] relative overflow-hidden">
        {primaryImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={primaryImage}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#827A73]">
            <ImageIcon size={32} />
          </div>
        )}
        <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-lg text-xs font-bold text-[#2D2A26] shadow-sm border border-white/10">
          {formatCatalogPrice(item.price, item.listing_type)}
        </div>

        <div className="absolute top-3 left-3 flex gap-2 z-20">
          <Link
            href={`/dashboard/catalog/${item.id}/edit`}
            className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[#524A44] hover:text-taupe transition-colors shadow-sm"
          >
            <Pencil size={16} />
          </Link>
          <button
            onClick={e => {
              e.preventDefault();
              onOpenDelete(item.id);
            }}
            className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg text-[#524A44] hover:text-[#B26959] transition-colors shadow-sm cursor-pointer"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/80 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm p-6 text-center z-10 translate-y-4 group-hover:translate-y-0">
          <h4 className="text-[#2D2A26] text-xs font-semibold uppercase tracking-wider mb-2 opacity-60">Material</h4>
          <p className="text-lg font-medium text-[#2D2A26] mb-6">{item.material || 'Premium Fabric'}</p>

          <div className="flex gap-3">
            <button
              onClick={() => onSave(item.id)}
              title="Toggle Save"
              className="p-3 bg-[#F0EAE3] hover:bg-[#B26959]/20 hover:text-[#B26959] rounded-full text-white transition-all transform hover:scale-110 shadow-lg cursor-pointer"
            >
              <Heart size={20} className={item.saves_count > 0 ? 'fill-current text-[#B26959]' : 'text-[#2D2A26]'} />
            </button>
            <button
              onClick={() => onView(item.id)}
              title="Simulate Click/View"
              className="p-3 bg-taupe hover:bg-[#9A8073] rounded-full text-white transition-all transform hover:scale-110 shadow-lg cursor-pointer"
            >
              <Eye size={20} />
            </button>
            <button
              onClick={() => onOpenRating(item.id)}
              title="Rate Item"
              className="p-3 bg-[#F0EAE3] hover:bg-[#BCA89F]/20 hover:text-[#BCA89F] rounded-full text-[#2D2A26] transition-all transform hover:scale-110 shadow-lg cursor-pointer"
            >
              <Star size={20} className={item.reviews_count > 0 ? 'fill-current text-[#BCA89F]' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Details Section */}
      <div className="p-4 flex flex-col flex-1 bg-linear-to-b from-zinc-900 to-zinc-950">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-[#BCA89F] bg-[#BCA89F]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {getListingTypeLabel(item.listing_type)}
          </span>
        </div>
        <h3 className="text-sm font-semibold text-[#2D2A26] truncate">{item.name}</h3>
        <p className="text-xs text-[#A8A19A] mt-1 truncate">{item.material || 'No material specified'}</p>

        <div className="mt-auto pt-4 flex flex-col gap-3 border-t border-[#EBE6E0]/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#BCA89F] bg-[#BCA89F]/10 px-2 py-1 rounded-md">
              <Star size={14} className="fill-current" />
              <span className="text-xs font-medium">
                {item.reviews_avg_rating ? item.reviews_avg_rating : '0'}{' '}
                <span className="text-[#A8A19A] ml-0.5">({item.reviews_count || 0})</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-[#827A73] text-xs font-medium">
              <span className="flex items-center gap-1.5 bg-[#F0EAE3]/50 px-2 py-1 rounded-md">
                <Eye size={14} /> {item.views_count || 0}
              </span>
              <span className="flex items-center gap-1.5 bg-[#F0EAE3]/50 px-2 py-1 rounded-md">
                <Heart size={14} className={item.saves_count > 0 ? 'fill-current text-[#B26959]' : ''} />{' '}
                {item.saves_count || 0}
              </span>
            </div>
          </div>

          <button
            onClick={() => onView(item.id)}
            className="w-full mt-1 bg-taupe hover:bg-taupe/90 text-white py-2 rounded-lg text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5"
          >
            {getCatalogActionLabel(item.listing_type)}
          </button>
        </div>
      </div>
    </div>
  );
}
