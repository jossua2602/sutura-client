import React, { useState } from 'react';
import { ShieldCheck, Loader2, KeyRound, Key, ChevronRight, X, Smartphone } from 'lucide-react';

interface ProfileSecurityProps {
  readonly passwordForm: {
    readonly current_password: string;
    readonly password: string;
    readonly password_confirmation: string;
  };
  readonly setPasswordForm: React.Dispatch<React.SetStateAction<{
    current_password: string;
    password: string;
    password_confirmation: string;
  }>>;
  readonly onSubmit: (e: React.SyntheticEvent) => void;
  readonly loading: boolean;
}

export default function ProfileSecurity({
  passwordForm,
  setPasswordForm,
  onSubmit,
  loading,
}: ProfileSecurityProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFormSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    onSubmit(e);
    // Modal closing logic can be handled here or assumed on success
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#EBE6E0] rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#2D2A26] mb-6 flex items-center gap-2">
          <ShieldCheck size={20} className="text-[#8C6B5D]" />
          Password and Security
        </h2>

        <div className="space-y-4">
          <div className="border-b border-[#FAF6F3] pb-4">
            <h3 className="text-xs font-semibold text-[#A8A19A] uppercase tracking-wider mb-3">Login & Recovery</h3>
            
            {/* Change Password Row */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full flex items-center justify-between p-3.5 hover:bg-[#FAF6F3] rounded-xl transition-all text-left border border-transparent hover:border-[#EBE6E0] group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#FAF6F3] flex items-center justify-center text-[#8C6B5D] group-hover:bg-white group-hover:shadow-sm transition-all">
                  <KeyRound size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D2A26]">Change password</p>
                  <p className="text-xs text-[#827A73]">It&apos;s a good idea to use a strong password that you don&apos;t use elsewhere</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#A8A19A] group-hover:text-[#2D2A26] transition-colors" />
            </button>
          </div>
 
          <div>
            <h3 className="text-xs font-semibold text-[#A8A19A] uppercase tracking-wider mb-3">Security Controls</h3>
            
            {/* Two-Factor Authentication Row */}
            <div className="w-full flex items-center justify-between p-3.5 hover:bg-[#FAF6F3] rounded-xl transition-all text-left border border-transparent hover:border-[#EBE6E0] group cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#FAF6F3] flex items-center justify-center text-[#8C6B5D] group-hover:bg-white group-hover:shadow-sm transition-all">
                  <Smartphone size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#2D2A26]">Two-factor authentication (2FA)</p>
                  <p className="text-xs text-[#827A73]">Protect your account by adding an extra layer of security</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-[#A8A19A]" />
            </div>
          </div>
        </div>
      </div>
 
      {/* Change Password Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="relative w-full max-w-md bg-white border border-[#EBE6E0] rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#A8A19A] hover:bg-[#FAF6F3] hover:text-[#2D2A26] transition-all"
            >
              <X size={18} />
            </button>
 
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#FAF6F3] flex items-center justify-center text-[#8C6B5D]">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#2D2A26]">Change Password</h3>
                <p className="text-xs text-[#827A73]">Enter your current and new password below.</p>
              </div>
            </div>
 
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="current_password" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-1.5">Current Password</label>
                <input
                  id="current_password"
                  required
                  type="password"
                  value={passwordForm.current_password}
                  onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] focus:ring-1 focus:ring-[#8C6B5D] outline-none text-sm transition-all"
                />
              </div>
              
              <div>
                <label htmlFor="new_password" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-1.5">New Password</label>
                <input
                  id="new_password"
                  required
                  type="password"
                  value={passwordForm.password}
                  onChange={e => setPasswordForm({ ...passwordForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] focus:ring-1 focus:ring-[#8C6B5D] outline-none text-sm transition-all"
                />
              </div>
 
              <div>
                <label htmlFor="password_confirmation" className="block text-xs font-semibold text-[#524A44] uppercase tracking-wider mb-1.5">Confirm New Password</label>
                <input
                  id="password_confirmation"
                  required
                  type="password"
                  value={passwordForm.password_confirmation}
                  onChange={e => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                  className="w-full px-4 py-2.5 bg-[#FAF6F3] border border-[#EBE6E0] rounded-xl text-[#2D2A26] focus:border-[#8C6B5D] focus:ring-1 focus:ring-[#8C6B5D] outline-none text-sm transition-all"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-[#EBE6E0] rounded-xl text-sm font-medium text-[#524A44] hover:bg-[#FAF6F3] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#8C6B5D] hover:bg-[#72564A] text-white px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
