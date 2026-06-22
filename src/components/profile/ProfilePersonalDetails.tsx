import React from 'react';
import { Loader2, Save } from 'lucide-react';

interface ProfilePersonalDetailsProps {
  email: string;
  personalForm: {
    name: string;
    phone: string;
  };
  setPersonalForm: React.Dispatch<React.SetStateAction<{ name: string; phone: string }>>;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export default function ProfilePersonalDetails({
  email,
  personalForm,
  setPersonalForm,
  onSubmit,
  loading,
}: ProfilePersonalDetailsProps) {
  return (
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
      <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Personal Details</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#524A44] mb-1">Full Name</label>
          <input
            required
            type="text"
            value={personalForm.name}
            onChange={e => setPersonalForm({ ...personalForm, name: e.target.value })}
            className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Email Address</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#A8A19A] cursor-not-allowed text-sm"
            />
            <p className="text-[10px] text-[#A8A19A] mt-1">Email cannot be changed.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#524A44] mb-1">Phone Number</label>
            <input
              type="text"
              value={personalForm.phone}
              onChange={e => setPersonalForm({ ...personalForm, phone: e.target.value })}
              className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe text-sm"
            />
          </div>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
