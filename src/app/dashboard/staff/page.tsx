'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Search, Plus, UserCircle, X, Loader2, Pencil, Trash2 } from 'lucide-react';

interface Staff {
  id: number;
  user: { name: string; email: string };
  role: string;
  is_active: boolean;
  hired_at: string;
  specialization?: string;
  active_jobs?: number;
}

export default function StaffPage() {
  const { shop , user } = useAuthStore();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'tailor',
    specialization: '',
    hired_at: new Date().toISOString().split('T')[0]
  });

  const fetchStaff = () => {
    if (shop) {
      api.get(`/shops/${shop.id}/staff`)
        .then(res => {
          setStaff(res.data.data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (user && !shop) {
      setTimeout(() => setLoading(false), 0);
    }
  };

  useEffect(() => {
    fetchStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!shop) return;
    setSaving(true);
    
    try {
      const payload = {
        ...formData,
        specialization: formData.specialization // just send string
      };

      if (editingId) {
        // For updates, we might only send role and specialization depending on backend rules
        await api.put(`/shops/${shop.id}/staff/${editingId}`, {
          role: payload.role,
          specialization: payload.specialization,
        });
      } else {
        await api.post(`/shops/${shop.id}/staff`, payload);
      }
      
      setShowModal(false);
      setEditingId(null);
      setFormData({
        name: '', email: '', password: '', phone: '', role: 'tailor', specialization: '', hired_at: new Date().toISOString().split('T')[0]
      });
      fetchStaff();
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (member: Staff) => {
    setEditingId(member.id);
    setFormData({
      name: member.user?.name || '',
      email: member.user?.email || '',
      password: '',
      phone: '', // Not strictly needed for edit view since it's not on the list API yet
      role: member.role || 'tailor',
      specialization: member.specialization || '',
      hired_at: member.hired_at || new Date().toISOString().split('T')[0]
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!shop || !deletingId) return;
    setSaving(true);
    try {
      await api.delete(`/shops/${shop.id}/staff/${deletingId}`);
      setIsDeleteModalOpen(false);
      setDeletingId(null);
      fetchStaff();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || 'Failed to remove staff');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Staff Management</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage your tailors, cutters, and front desk team.</p>
        </div>
        <button 
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', email: '', password: '', phone: '', role: 'tailor', specialization: '', hired_at: new Date().toISOString().split('T')[0] });
            setShowModal(true);
          }}
          className="flex items-center gap-2 bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#EBE6E0] flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A19A]" size={18} />
            <input 
              type="text" 
              placeholder="Search staff..." 
              className="pl-10 pr-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-sm text-[#2D2A26] focus:outline-none focus:border-taupe focus:ring-1 focus:ring-taupe transition-colors w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[#524A44]">
            <thead className="bg-[#FAF6F3]/50 text-xs uppercase text-[#A8A19A] border-b border-[#EBE6E0]">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Active Jobs</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Hire Date</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#A8A19A]">
                    Loading staff...
                  </td>
                </tr>
              ) : staff.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-[#A8A19A]">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-[#F0EAE3]/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#F0EAE3] flex items-center justify-center text-[#827A73]">
                          <UserCircle size={18} />
                        </div>
                        <div>
                          <div className="font-medium text-[#2D2A26]">{member.user?.name}</div>
                          <div className="text-xs text-[#A8A19A]">{member.user?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F0EAE3] text-[#524A44]">
                        {member.role?.charAt(0).toUpperCase() + member.role?.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold bg-[#2D2A26] text-white">
                        {member.active_jobs || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-zinc-500/10 text-[#827A73] border-zinc-500/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-[#827A73]">
                      {member.hired_at ? new Date(member.hired_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditClick(member)} className="text-[#A8A19A] hover:text-[#2D2A26] transition-colors p-1">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteClick(member.id)} className="text-[#A8A19A] hover:text-[#B26959] transition-colors p-1">
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

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-[#EBE6E0]">
              <h2 className="text-xl font-bold text-[#2D2A26]">{editingId ? "Edit Staff Role" : "Create Staff Account"}</h2>
              <button onClick={() => setShowModal(false)} className="text-[#827A73] hover:text-[#2D2A26] transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddStaff} className="p-6 space-y-4">
              {!editingId && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="staff_name" className="block text-sm font-medium text-[#524A44] mb-1">Name</label>
                      <input id="staff_name" required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" />
                    </div>
                    <div>
                      <label htmlFor="staff_phone" className="block text-sm font-medium text-[#524A44] mb-1">Phone Number</label>
                      <input id="staff_phone" type="text" name="phone" value={formData.phone} onChange={handleInputChange} disabled={!!editingId} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe disabled:opacity-50" />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="staff_email" className="block text-sm font-medium text-[#524A44] mb-1">Email</label>
                    <input id="staff_email" required type="email" name="email" value={formData.email} onChange={handleInputChange} disabled={!!editingId} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe disabled:opacity-50" />
                  </div>

                  <div>
                    <label htmlFor="staff_password" className="block text-sm font-medium text-[#524A44] mb-1">Password</label>
                    <input id="staff_password" required={!editingId} type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="staff_role" className="block text-sm font-medium text-[#524A44] mb-1">Role</label>
                  <select id="staff_role" name="role" value={formData.role} onChange={handleInputChange} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe">
                    <option value="tailor">Tailor</option>
                    <option value="cutter">Cutter</option>
                    <option value="seamstress">Seamstress</option>
                    <option value="quality_control">Quality Control</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="staff_hired_at" className="block text-sm font-medium text-[#524A44] mb-1">Hire Date</label>
                  <input id="staff_hired_at" required type="date" name="hired_at" value={formData.hired_at} onChange={handleInputChange} className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" />
                </div>
              </div>

              <div>
                <label htmlFor="staff_specialization" className="block text-sm font-medium text-[#524A44] mb-1">Specialization (Optional)</label>
                <input id="staff_specialization" type="text" name="specialization" value={formData.specialization} onChange={handleInputChange} placeholder="e.g. Suits, Gowns, Alterations" className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-[#827A73] hover:text-[#2D2A26] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingId ? 'Save Changes' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden p-6">
            <h2 className="text-xl font-bold text-[#2D2A26] mb-4">Confirm Deletion</h2>
            <p className="text-[#524A44] text-sm mb-6">
              Are you sure you want to remove this staff member? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-[#524A44] hover:text-[#2D2A26] transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                disabled={saving}
                className="bg-[#B26959] hover:bg-[#B26959]/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
