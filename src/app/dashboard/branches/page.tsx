'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus, Building2, MapPin, Users, Briefcase, Loader2, Star, Pencil, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';

interface ShopBranch {
  id: number;
  name: string;
  address: string;
  city: string;
  contact_number: string;
  is_main: boolean;
  latitude?: string;
  longitude?: string;
  staff_profiles_count?: number;
  job_orders_count?: number;
}

export default function BranchesPage() {
  const { shop , user } = useAuthStore();
  const [branches, setBranches] = useState<ShopBranch[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    contact_number: '',
    latitude: '',
    longitude: '',
  });

  const fetchBranches = useCallback(() => {
    if (shop) {
      api.get(`/shops/${shop.id}/branches`)
        .then(res => {
          setBranches(res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user && !shop) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop, user]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingId) {
        await api.put(`/shops/${shop.id}/branches/${editingId}`, formData);
      } else {
        await api.post(`/shops/${shop.id}/branches`, formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', address: '', city: '', contact_number: '', latitude: '', longitude: '' });
      fetchBranches();
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Failed to save branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (branch: ShopBranch) => {
    setEditingId(branch.id);
    setFormData({
      name: branch.name,
      address: branch.address,
      city: branch.city,
      contact_number: branch.contact_number || '',
      latitude: branch.latitude || '',
      longitude: branch.longitude || '',
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
      await api.delete(`/shops/${shop.id}/branches/${deletingId}`);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      fetchBranches();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-[#A8A19A] py-12 text-center animate-pulse">Loading branches...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Shop Branches</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage all locations for your tailoring shop.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', address: '', city: '', contact_number: '', latitude: '', longitude: '' });
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Branch
        </button>
      </div>

      {branches.length === 0 ? (
        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-12 text-center">
          <Building2 className="w-12 h-12 text-[#827A73] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#2D2A26] mb-2">No Branches Found</h3>
          <p className="text-[#827A73] text-sm mb-6 max-w-md mx-auto">
            It looks like you haven&apos;t set up your main branch yet. Click below to add your first location.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Add Main Branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden hover:border-[#D1C7BD] transition-colors shadow-sm relative group">
              {branch.is_main && (
                <div className="absolute top-4 right-4 bg-[#BCA89F]/10 text-[#BCA89F] text-xs px-2 py-1 rounded border border-[#BCA89F]/20 flex items-center gap-1 font-medium">
                  <Star size={12} className="fill-current" />
                  HQ / Main
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-[#F0EAE3] rounded-xl">
                    <Building2 className="w-6 h-6 text-taupe" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[#2D2A26] tracking-tight">{branch.name}</h3>
                    <p className="text-sm text-[#827A73]">{branch.contact_number || 'No contact number'}</p>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-[#A8A19A] shrink-0 mt-0.5" />
                    <span className="text-[#524A44]">{branch.address}, {branch.city}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF6F3]/50 p-4 border-t border-[#EBE6E0] flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#827A73]">
                    <Users size={14} />
                    {branch.staff_profiles_count || 0} Staff
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#827A73]">
                    <Briefcase size={14} />
                    {branch.job_orders_count || 0} Orders
                  </div>
                </div>
                {!branch.is_main && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditClick(branch)} className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDeleteClick(branch.id)} className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1">
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
                {branch.is_main && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEditClick(branch)} className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1">
                      <Pencil size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Branch Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Edit Branch" : "Add New Branch"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="bg-[#B26959]/10 text-[#B26959] text-sm p-3 rounded border border-[#B26959]/20">
              {errorMsg}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Branch Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. Downtown Branch"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Street Address</label>
            <input 
              required
              type="text" 
              placeholder="e.g. 123 Main Street"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">City</label>
              <input 
                required
                type="text" 
                placeholder="e.g. Davao City"
                value={formData.city}
                onChange={e => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Contact Number</label>
              <input 
                type="text" 
                placeholder="e.g. +63 912 345 6789"
                value={formData.contact_number}
                onChange={e => setFormData({...formData, contact_number: e.target.value})}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" 
              />
            </div>
          </div>

          <div className="mb-2">
            <label className="block text-sm font-medium text-[#524A44]">Map Coordinates</label>
            <p className="text-xs text-[#827A73] mb-2">Required for this branch to appear on the map.</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <input 
                  type="text" 
                  placeholder="Latitude (e.g. 7.1907)"
                  value={formData.latitude}
                  onChange={e => setFormData({...formData, latitude: e.target.value})}
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe" 
                />
              </div>
              <div>
                <input 
                  type="text" 
                  placeholder="Longitude (e.g. 125.4553)"
                  value={formData.longitude}
                  onChange={e => setFormData({...formData, longitude: e.target.value})}
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:border-taupe" 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-[#827A73] hover:text-[#2D2A26]"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Branch
            </button>
          </div>
        </form>
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Deletion">
        <div className="space-y-4">
          <p className="text-[#524A44] text-sm">
            Are you sure you want to delete this branch? This action cannot be undone.
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
              className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
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
