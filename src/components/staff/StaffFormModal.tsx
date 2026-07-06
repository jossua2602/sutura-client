import React from 'react';
import { X, Loader2 } from 'lucide-react';
import { useBranch } from '@/context/BranchContext';

interface StaffFormModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (e: React.SyntheticEvent<HTMLFormElement>) => void;
  readonly editingId: number | null;
  readonly saving: boolean;
  readonly formData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    specialization: string;
    hired_at: string;
    is_active: boolean;
    shop_branch_id: string;
    is_branch_manager: boolean;
  };
  readonly setFormData: React.Dispatch<React.SetStateAction<{
    name: string;
    email: string;
    password: string;
    phone: string;
    role: string;
    specialization: string;
    hired_at: string;
    is_active: boolean;
    shop_branch_id: string;
    is_branch_manager: boolean;
  }>>;
}

export default function StaffFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingId,
  saving,
  formData,
  setFormData,
}: StaffFormModalProps) {
  const { branches } = useBranch();
  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-[#EBE6E0] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-[#EBE6E0]">
          <h2 className="text-xl font-bold text-[#2D2A26]">
            {editingId ? 'Edit Staff Member' : 'Create Staff Account'}
          </h2>
          <button onClick={onClose} className="text-[#827A73] hover:text-[#2D2A26] transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="staff_name" className="block text-sm font-medium text-[#524A44] mb-1">
                Name
              </label>
              <input
                id="staff_name"
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
              />
            </div>
            <div>
              <label htmlFor="staff_phone" className="block text-sm font-medium text-[#524A44] mb-1">
                Phone Number
              </label>
              <input
                id="staff_phone"
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="staff_email" className="block text-sm font-medium text-[#524A44] mb-1">
              Email
            </label>
            <input
              id="staff_email"
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
            />
          </div>

          <div>
            <label htmlFor="staff_password" className="block text-sm font-medium text-[#524A44] mb-1">
              Password{editingId ? <>{' '}<span className="text-xs text-[#A8A19A]">(Leave blank to keep current)</span></> : null}
            </label>
            <input
              id="staff_password"
              required={!editingId}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="staff_role" className="block text-sm font-medium text-[#524A44] mb-1">
                Role
              </label>
              <select
                id="staff_role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
              >
                <option value="tailor">Tailor</option>
                <option value="head_tailor">Head Tailor</option>
                <option value="cutter">Cutter</option>
                <option value="seamstress">Seamstress</option>
                <option value="designer">Fashion Designer</option>
                <option value="pattern_maker">Pattern Maker</option>
                <option value="assistant">Assistant</option>
                <option value="receptionist">Receptionist</option>
                <option value="quality_control">Quality Control</option>
                <option value="subcontractor">Subcontractor (Partner Shop)</option>
              </select>
            </div>
            <div>
              <label htmlFor="staff_hired_at" className="block text-sm font-medium text-[#524A44] mb-1">
                Hire Date
              </label>
              <input
                id="staff_hired_at"
                required
                type="date"
                name="hired_at"
                value={formData.hired_at}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="staff_specialization" className="block text-sm font-medium text-[#524A44] mb-1">
              Specialization (Optional)
            </label>
            <input
              id="staff_specialization"
              type="text"
              name="specialization"
              value={formData.specialization}
              onChange={handleInputChange}
              placeholder="e.g. Suits, Gowns, Alterations (comma-separated)"
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
            />
          </div>

          {branches.length > 0 && (
            <div>
              <label htmlFor="staff_branch" className="block text-sm font-medium text-[#524A44] mb-1">
                Assigned Branch
              </label>
              <select
                id="staff_branch"
                name="shop_branch_id"
                value={formData.shop_branch_id}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
              >
                <option value="">Unassigned (works across all branches)</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}{b.is_main ? ' (Main)' : ''}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <input
              id="staff_is_branch_manager"
              type="checkbox"
              checked={formData.is_branch_manager}
              onChange={e => setFormData(prev => ({ ...prev, is_branch_manager: e.target.checked }))}
              className="w-4 h-4 rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
            />
            <label htmlFor="staff_is_branch_manager" className="text-sm font-medium text-[#524A44]">
              Make Branch Manager{' '}
              <span className="block text-xs font-normal text-[#A8A19A]">
                Can collect payments, assign staff, and manage job orders for their branch without owner access.
              </span>
            </label>
          </div>

          {/* Active toggle — only shown when editing */}
          {editingId && (
            <div className="flex items-center gap-3 pt-1">
              <input
                id="staff_is_active"
                type="checkbox"
                checked={formData.is_active}
                onChange={e => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="w-4 h-4 rounded border-[#EBE6E0] text-taupe focus:ring-taupe"
              />
              <label htmlFor="staff_is_active" className="text-sm font-medium text-[#524A44]">
                Active Staff Member{' '}
                <span className="block text-xs font-normal text-[#A8A19A]">
                  Uncheck to mark as inactive (they won&apos;t appear in job assignment lists)
                </span>
              </label>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-[#827A73] hover:text-[#2D2A26] transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-taupe hover:bg-taupe/90 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {!saving && (editingId ? 'Save Changes' : 'Create Account')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
