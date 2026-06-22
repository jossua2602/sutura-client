import React from 'react';
import Modal from '@/components/Modal';
import { Loader2 } from 'lucide-react';

interface CatalogDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

export default function CatalogDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: CatalogDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Item">
      <div className="space-y-4 text-[#2D2A26]">
        <p className="text-[#524A44] text-sm">
          Are you sure you want to delete this item from the catalog? This action cannot be undone.
        </p>
        <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            disabled={isSubmitting}
            className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Yes, Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
