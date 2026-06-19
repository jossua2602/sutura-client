'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Search, Plus, Tag, Loader2, Pencil, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';

interface Specialization {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

export default function SpecializationsPage() {
  const { shop, user } = useAuthStore();
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  const fetchSpecializations = () => {
    if (!shop) {
      if (user) setTimeout(() => setLoading(false), 0);
      return;
    }
    api.get(`/shops/${shop.id}/specializations`)
      .then(res => {
        setSpecializations(res.data.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSpecializations();
  }, [shop, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/specializations/${editingId}`, formData);
        setSpecializations(prev => prev.map(s => s.id === editingId ? res.data.data : s));
      } else {
        const res = await api.post(`/shops/${shop.id}/specializations`, formData);
        setSpecializations(prev => [res.data.data, ...prev]);
      }
      closeModal();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to save specialization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (spec: Specialization) => {
    setEditingId(spec.id);
    setFormData({
      name: spec.name,
      description: spec.description || '',
      is_active: spec.is_active
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shop.id}/specializations/${deletingId}`);
      setSpecializations(prev => prev.filter(s => s.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete specialization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', description: '', is_active: true });
    setError('');
  };

  const filtered = specializations.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Apparel Specializations</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage the specific garments and styles your shop specializes in.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', description: '', is_active: true });
            setError('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Specialization
        </button>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#EBE6E0] flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
            <input 
              type="text" 
              placeholder="Search specializations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#524A44]">
            <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
              <tr>
                <th className="px-6 py-4 font-medium">Specialization</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBE6E0]">
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#A8A19A]">
                    Loading specializations...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#A8A19A]">
                    No specializations declared yet.
                  </td>
                </tr>
              )}
              {!loading && filtered.length > 0 && (
                filtered.map((spec) => (
                  <tr key={spec.id} className="hover:bg-[#F0EAE3]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F0EAE3] flex items-center justify-center text-[#827A73]">
                          <Tag size={16} />
                        </div>
                        <span className="font-medium text-[#2D2A26]">{spec.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#827A73] max-w-md truncate">
                      {spec.description || '-'}
                    </td>
                    <td className="px-6 py-4">
                      {spec.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-zinc-500/10 text-[#827A73] border-zinc-500/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditClick(spec)} className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(spec.id)} className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingId ? "Edit Specialization" : "Add Specialization"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-[#B26959]/10 border border-[#B26959]/50 text-[#B26959] px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Name <span className="text-[#B26959]">*</span></label>
            <input 
              type="text" 
              required
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe"
              placeholder="e.g. Barong Tagalog, Filipiniana, Corporate Uniforms"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Description</label>
            <textarea 
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              className="w-full bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg px-4 py-2 text-[#2D2A26] focus:outline-none focus:border-taupe h-24 resize-none"
              placeholder="Describe your expertise and experience with this apparel type..."
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="is_active" 
              checked={formData.is_active}
              onChange={e => setFormData({...formData, is_active: e.target.checked})}
              className="w-4 h-4 text-taupe border-[#EBE6E0] rounded focus:ring-taupe"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-[#524A44]">
              Active Specialization
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
            <button 
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {editingId ? "Save Changes" : "Save Specialization"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-[#524A44] text-sm">
            Are you sure you want to remove this specialization from your profile? This action cannot be undone.
          </p>
          <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
            <button 
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
