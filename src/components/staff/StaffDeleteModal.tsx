import React from 'react';
import { Loader2 } from 'lucide-react';

interface StaffDeleteModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly saving: boolean;
}

export default function StaffDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  saving,
}: StaffDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-[#EBE6E0] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
        <h2 className="text-xl font-bold text-[#2D2A26] mb-4">Confirm Deletion</h2>
        <p className="text-[#524A44] text-sm mb-6">
          Are you sure you want to remove this staff member? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Yes, Remove
          </button>
        </div>
      </div>
    </div>
  );
}
