'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { Plus } from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { ShopBranch, EMPTY_FORM } from './branchHelpers';
import BranchFormModal from './BranchFormModal';
import BranchDeleteModal from './BranchDeleteModal';
import BranchListView from './BranchListView';

interface BranchesTabProps {
  readonly shopId?: number;
}

export default function BranchesTab({ shopId }: Readonly<BranchesTabProps>) {
  const toast = useToast();
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
    if (!shopId) return;
    api.get(`/shops/${shopId}/branches`)
      .then(res => {
        setBranches(res.data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [shopId]);

  useEffect(() => {
    if (shopId) {
      fetchBranches();
    } else {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
  }, [shopId, fetchBranches]);

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
      guide_image_url: branch.guide_image_url || '',
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!shopId) return;
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (editingId) {
        const res = await api.put(`/shops/${shopId}/branches/${editingId}`, formData);
        setBranches(prev => prev.map(b => b.id === editingId ? { ...b, ...res.data.data } : b));
        toast.success('Branch updated successfully.');
      } else {
        const res = await api.post(`/shops/${shopId}/branches`, formData);
        setBranches(prev => [...prev, res.data.data]);
        toast.success('Branch added successfully.');
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData(EMPTY_FORM);
    } catch (err: unknown) {
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
    if (!shopId || !deletingId) return;
    setIsSubmitting(true);
    try {
      await api.delete(`/shops/${shopId}/branches/${deletingId}`);
      setBranches(prev => prev.filter(b => b.id !== deletingId));
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      toast.success('Branch deleted successfully.');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-[#A8A19A] animate-pulse text-sm">Loading branches...</div>;
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#2D2A26]">Shop Branches</h2>
          <p className="text-xs text-[#A8A19A] mt-0.5">Manage all physical locations of your shop.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-[#9A8073] hover:bg-[#8a7065] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus size={15} /> Add Branch
        </button>
      </div>

      <BranchListView
        branches={branches}
        onAddClick={openAddModal}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      <BranchFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingId={editingId}
        isSubmitting={isSubmitting}
        errorMsg={errorMsg}
        shopId={shopId}
        formData={formData}
        setFormData={setFormData}
      />

      <BranchDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
