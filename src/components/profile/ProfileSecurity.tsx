import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface ProfileSecurityProps {
  passwordForm: {
    current_password: string;
    password: string;
    password_confirmation: string;
  };
  setPasswordForm: React.Dispatch<React.SetStateAction<{
    current_password: string;
    password: string;
    password_confirmation: string;
  }>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export default function ProfileSecurity({
  passwordForm,
  setPasswordForm,
  onSubmit,
  loading,
}: ProfileSecurityProps) {
  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
      <h2 className="text-lg font-medium text-[#2D2A26] mb-4 flex items-center gap-2">
        <ShieldCheck size={20} className="text-taupe" />
        Security
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#524A44] mb-1">Current Password</label>
          <input
            required
            type="password"
            value={passwordForm.current_password}
            onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">New Password</label>
            <input
              required
              type="password"
              value={passwordForm.password}
              onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Confirm New Password</label>
            <input
              required
              type="password"
              value={passwordForm.password_confirmation}
              onChange={e => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
            />
          </div>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#2D2A26] px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  );
}
