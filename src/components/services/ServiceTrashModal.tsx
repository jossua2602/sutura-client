import React, { useEffect, useState, useCallback } from 'react';
import Modal from '@/components/Modal';
import { Loader2, RotateCcw, Trash2 } from 'lucide-react';
import api from '@/lib/axios';
import { Service } from './serviceHelpers';

interface ServiceTrashModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly shopId: number;
  readonly onRestored: (service: Service) => void;
}

export default function ServiceTrashModal({ isOpen, onClose, shopId, onRestored }: ServiceTrashModalProps) {
  const [trashed, setTrashed] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const loadTrashed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/shops/${shopId}/services`, { params: { trashed: 1 } });
      setTrashed(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    if (isOpen) {
      Promise.resolve().then(() => loadTrashed());
    }
  }, [isOpen, loadTrashed]);

  const handleRestore = async (service: Service) => {
    setRestoringId(service.id);
    try {
      const res = await api.post(`/shops/${shopId}/services/${service.id}/restore`);
      setTrashed(prev => prev.filter(s => s.id !== service.id));
      onRestored(res.data.data);
    } catch (err) {
      console.error(err);
      alert('Failed to restore this service.');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Deleted Services">
      <div className="space-y-4 text-[#2D2A26]">
        <p className="text-xs text-[#827A73]">
          Services you&apos;ve deleted stay here so an accidental click doesn&apos;t cost you the whole listing —
          restore any of them back into your active catalog.
        </p>

        {loading ? (
          <div className="text-center py-10 text-xs text-[#A8A19A] flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin text-taupe" />
            Loading deleted services...
          </div>
        ) : trashed.length === 0 ? (
          <div className="text-center py-10 text-xs text-[#A8A19A] border border-dashed border-[#EBE6E0] rounded-xl flex flex-col items-center gap-2">
            <Trash2 size={20} className="text-[#C5BDBA]" />
            Nothing in the trash right now.
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {trashed.map(service => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 bg-white border border-[#EBE6E0] rounded-lg"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-[#2D2A26] truncate">{service.name}</p>
                  <p className="text-[11px] text-[#A8A19A] truncate">{service.categories && service.categories.length > 0 ? service.categories.join(', ') : 'Uncategorized'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRestore(service)}
                  disabled={restoringId === service.id}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#7A8B76]/10 text-[#7A8B76] hover:bg-[#7A8B76]/20 border border-[#7A8B76]/20 transition-colors disabled:opacity-50"
                >
                  {restoringId === service.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-[#EBE6E0] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
