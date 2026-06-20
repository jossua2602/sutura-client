'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Plus, Building2, MapPin, Users, Briefcase, Loader2, Star,
  Pencil, Trash2, Clock, Phone, ExternalLink, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import Modal from '@/components/Modal';

interface ShopBranch {
  id: number;
  name: string;
  address: string;
  city: string;
  contact_number: string | null;
  is_main: boolean;
  latitude?: string | null;
  longitude?: string | null;
  operating_hours?: string | null;
  status?: string;
  staff_profiles_count?: number;
  job_orders_count?: number;
}

const EMPTY_FORM = {
  name: '',
  address: '',
  city: '',
  contact_number: '',
  latitude: '',
  longitude: '',
  operating_hours: '',
  status: 'active',
};

function StatusBadge({ status }: { status?: string }) {
  if (status === 'active') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle size={11} className="fill-emerald-200" /> Active
      </span>
    );
  }
  if (status === 'inactive') {
    return (
      <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 border border-zinc-200">
        <XCircle size={11} /> Inactive
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      <AlertCircle size={11} /> Pending Verification
    </span>
  );
}

export default function BranchesPage() {
  const { shop, user } = useAuthStore();
  const [branches, setBranches] = useState<ShopBranch[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState(EMPTY_FORM);

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

  const openAddModal = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setErrorMsg('');
    setIsModalOpen(true);
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
      operating_hours: branch.operating_hours || '',
      status: branch.status || 'active',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (editingId) {
        const res = await api.put(`/shops/${shop.id}/branches/${editingId}`, formData);
        const updated = res.data.data;
        setBranches(prev => prev.map(b => b.id === editingId ? { ...b, ...updated } : b));
      } else {
        const res = await api.post(`/shops/${shop.id}/branches`, formData);
        const created = res.data.data;
        setBranches(prev => [...prev, created]);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
    } catch (err: unknown) {
      console.error(err);
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMsg(error.response?.data?.message || 'Failed to save branch.');
    } finally {
      setIsSubmitting(false);
    }
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
      setBranches(prev => prev.filter(b => b.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to delete branch');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMapUrl = (branch: ShopBranch) => {
    if (branch.latitude && branch.longitude) {
      return `https://www.google.com/maps?q=${branch.latitude},${branch.longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.address}, ${branch.city}`)}`;
  };

  if (loading) {
    return <div className="text-[#A8A19A] py-12 text-center animate-pulse">Loading branches...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Shop Branches</h1>
          <p className="text-[#827A73] text-sm mt-1">
            Manage all physical locations of your tailoring shop. Each branch appears on the customer discovery map.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Branch
        </button>
      </div>

      {/* Summary Bar */}
      {branches.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-[#EBE6E0] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-[#F0EAE3] rounded-lg">
              <Building2 className="w-5 h-5 text-taupe" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#2D2A26]">{branches.length}</div>
              <div className="text-xs text-[#827A73]">Total Branches</div>
            </div>
          </div>
          <div className="bg-white border border-[#EBE6E0] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#2D2A26]">{branches.filter(b => b.status === 'active').length}</div>
              <div className="text-xs text-[#827A73]">Active Branches</div>
            </div>
          </div>
          <div className="bg-white border border-[#EBE6E0] rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-[#F0EAE3] rounded-lg">
              <MapPin className="w-5 h-5 text-taupe" />
            </div>
            <div>
              <div className="text-xl font-bold text-[#2D2A26]">{branches.filter(b => b.latitude && b.longitude).length}</div>
              <div className="text-xs text-[#827A73]">Map-Pinned</div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {branches.length === 0 ? (
        <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-[#F0EAE3] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-taupe" />
          </div>
          <h3 className="text-lg font-semibold text-[#2D2A26] mb-2">No Branches Yet</h3>
          <p className="text-[#827A73] text-sm mb-6 max-w-sm mx-auto">
            Add your first branch location. It will appear on the customer discovery map after admin verification.
          </p>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} />
            Add Main Branch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white border border-[#EBE6E0] rounded-2xl overflow-hidden hover:border-[#D1C7BD] hover:shadow-md transition-all duration-200 flex flex-col">
              {/* Card Header */}
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#F0EAE3] rounded-xl shrink-0">
                      <Building2 className="w-5 h-5 text-taupe" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#2D2A26] leading-tight">{branch.name}</h3>
                      {branch.is_main && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#BCA89F] uppercase tracking-wider mt-0.5">
                          <Star size={10} className="fill-current" /> Main Branch
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={branch.status} />
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex items-start gap-2 text-sm text-[#524A44]">
                    <MapPin className="w-4 h-4 text-[#A8A19A] shrink-0 mt-0.5" />
                    <span>{branch.address}, {branch.city}</span>
                  </div>
                  {branch.contact_number && (
                    <div className="flex items-center gap-2 text-sm text-[#524A44]">
                      <Phone className="w-4 h-4 text-[#A8A19A] shrink-0" />
                      <span>{branch.contact_number}</span>
                    </div>
                  )}
                  {branch.operating_hours && (
                    <div className="flex items-center gap-2 text-sm text-[#524A44]">
                      <Clock className="w-4 h-4 text-[#A8A19A] shrink-0" />
                      <span>{branch.operating_hours}</span>
                    </div>
                  )}
                  {branch.latitude && branch.longitude && (
                    <div className="flex items-center gap-2 text-xs text-[#A8A19A]">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>{parseFloat(branch.latitude).toFixed(4)}, {parseFloat(branch.longitude).toFixed(4)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="bg-[#FAF6F3]/60 px-5 py-3 border-t border-[#EBE6E0] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#827A73]">
                    <Users size={13} />
                    {branch.staff_profiles_count ?? 0} Staff
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-[#827A73]">
                    <Briefcase size={13} />
                    {branch.job_orders_count ?? 0} Orders
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={getMapUrl(branch)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="View on Map"
                    className="p-1.5 text-[#A8A19A] hover:text-taupe transition-colors rounded"
                  >
                    <ExternalLink size={15} />
                  </a>
                  <button
                    onClick={() => handleEditClick(branch)}
                    title="Edit Branch"
                    className="p-1.5 text-[#A8A19A] hover:text-[#2D2A26] transition-colors rounded"
                  >
                    <Pencil size={15} />
                  </button>
                  {!branch.is_main && (
                    <button
                      onClick={() => handleDeleteClick(branch.id)}
                      title="Delete Branch"
                      className="p-1.5 text-[#A8A19A] hover:text-red-500 transition-colors rounded"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Branch' : 'Add New Branch'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMsg && (
            <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Branch Name */}
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Branch Name <span className="text-red-400">*</span></label>
            <input
              required
              type="text"
              placeholder="e.g. Matina Branch"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Street Address <span className="text-red-400">*</span></label>
            <input
              required
              type="text"
              placeholder="e.g. 123 JP Laurel Avenue"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe"
            />
          </div>

          {/* City & Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">City / District <span className="text-red-400">*</span></label>
              <input
                required
                type="text"
                placeholder="e.g. Davao City"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Contact Number</label>
              <input
                type="text"
                placeholder="e.g. 09123456789"
                value={formData.contact_number}
                onChange={e => setFormData({ ...formData, contact_number: e.target.value })}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe"
              />
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Operating Hours</label>
            <input
              type="text"
              placeholder="e.g. Mon–Sat 8:00 AM – 6:00 PM"
              value={formData.operating_hours}
              onChange={e => setFormData({ ...formData, operating_hours: e.target.value })}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe"
            />
          </div>

          {/* Map Coordinates */}
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">
              Map Coordinates
              <span className="text-[#A8A19A] font-normal ml-1">(required for map discovery)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Latitude (e.g. 7.1907)"
                value={formData.latitude}
                onChange={e => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:outline-none focus:border-taupe"
              />
              <input
                type="text"
                placeholder="Longitude (e.g. 125.4553)"
                value={formData.longitude}
                onChange={e => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] text-sm focus:outline-none focus:border-taupe"
              />
            </div>
            <p className="text-xs text-[#A8A19A] mt-1.5">
              💡 Tip: Open Google Maps, right-click your shop location, and copy the coordinates.
            </p>
          </div>

          {/* Status (only for edit) */}
          {editingId && (
            <div>
              <label className="block text-sm font-medium text-[#524A44] mb-1">Branch Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:outline-none focus:border-taupe"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-[#EBE6E0]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm text-[#827A73] hover:text-[#2D2A26] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingId ? 'Save Changes' : 'Add Branch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Branch">
        <div className="space-y-4">
          <p className="text-[#524A44] text-sm">
            Are you sure you want to delete this branch? This cannot be undone. Branches with active orders or staff cannot be deleted.
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
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
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
