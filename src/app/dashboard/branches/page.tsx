'use client';

import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Plus } from 'lucide-react';
import { ShopBranch, EMPTY_FORM } from '@/components/branches/branchHelpers';
import BranchFormModal from '@/components/branches/BranchFormModal';
import BranchDeleteModal from '@/components/branches/BranchDeleteModal';
import BranchListView from '@/components/branches/BranchListView';

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
    if (shop?.id) {
      api
        .get(`/shops/${shop.id}/branches`)
        .then(res => {
          setBranches(res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user?.id && !shop?.id) {
      setTimeout(() => setLoading(false), 0);
    }
  }, [shop?.id, user?.id]);

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
      guide_image_url: branch.guide_image_url || '',
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
        setBranches(prev => prev.map(b => (b.id === editingId ? { ...b, ...updated } : b)));
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
            Manage all physical locations of your tailoring shop. Each branch appears on the customer discovery
            map.
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

      <BranchListView
        branches={branches}
        onAddClick={openAddModal}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {/* Add / Edit Modal */}
      <BranchFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editingId={editingId}
        isSubmitting={isSubmitting}
        errorMsg={errorMsg}
        shopId={shop?.id}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Delete Modal */}
      <BranchDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
