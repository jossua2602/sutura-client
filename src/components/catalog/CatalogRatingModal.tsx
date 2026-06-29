import React from 'react';
import Modal from '@/components/Modal';
import { Loader2, Star } from 'lucide-react';

interface CatalogRatingModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => Promise<void>;
  readonly ratingValue: number;
  readonly setRatingValue: (val: number) => void;
  readonly isSubmitting: boolean;
}

export default function CatalogRatingModal({
  isOpen,
  onClose,
  onSubmit,
  ratingValue,
  setRatingValue,
  isSubmitting,
}: CatalogRatingModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Catalog Item">
      <form onSubmit={onSubmit} className="space-y-6 text-[#2D2A26]">
        <div className="text-center">
          <p className="text-sm text-[#827A73] mb-4">How many stars would you give this item?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRatingValue(star)}
                className={`p-2 transition-transform hover:scale-125 cursor-pointer ${ratingValue >= star ? 'text-[#BCA89F]' : 'text-[#827A73]'}`}
              >
                <Star size={32} className={ratingValue >= star ? 'fill-current' : ''} />
              </button>
            ))}
          </div>
          <p className="text-xs text-[#A8A19A] mt-2 font-medium">{ratingValue} out of 5 stars</p>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-[#EBE6E0]">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#827A73] hover:text-[#2D2A26] transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-taupe hover:bg-taupe/90 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Submit Rating
          </button>
        </div>
      </form>
    </Modal>
  );
}
