import React from 'react';
import { Loader2 } from 'lucide-react';
import Modal from '@/components/Modal';

interface SpecializationDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

export default function SpecializationDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}: SpecializationDeleteModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Deletion">
      <div className="space-y-4">
        <p className="text-[#524A44] text-sm">
          Are you sure you want to remove this specialization? This action cannot be undone.
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
            className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Yes, Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
