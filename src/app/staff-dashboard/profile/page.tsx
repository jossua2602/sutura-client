'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, Save, ShieldCheck, Scissors, Award, ToggleRight, ToggleLeft } from 'lucide-react';

export default function StaffProfilePage() {
  const { user, shop, staffProfile } = useAuthStore();
  
  const [personalForm, setPersonalForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });

  const [isAvailable, setIsAvailable] = useState(true);
  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Initialize availability from user data
  useEffect(() => {
    // @ts-ignore
    if (staffProfile?.is_available !== undefined) {
      // @ts-ignore
      setIsAvailable(staffProfile.is_available);
    }
  }, [staffProfile]);

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPersonal(true);
    try {
      await api.put('/profile/personal', personalForm);
      alert('Profile updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setLoadingPersonal(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPassword(true);
    try {
      await api.put('/profile/password', passwordForm);
      alert('Password updated successfully');
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      console.error(err);
      alert('Failed to update password. Check your current password.');
    } finally {
      setLoadingPassword(false);
    }
  };

  const toggleAvailability = async () => {
    const newStatus = !isAvailable;
    setIsAvailable(newStatus); // Optimistic UI
    setLoadingAvailability(true);
    try {
      await api.put('/profile/availability', { is_available: newStatus });
    } catch (err) {
      console.error(err);
      setIsAvailable(!newStatus); // Revert
      alert('Failed to update availability status.');
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    try {
      await api.post('/profile/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Craftsman Portfolio</h1>
          <p className="text-[#827A73] text-sm mt-1">Manage your identity, settings, and view your craftsmanship metrics.</p>
        </div>
        
        {/* Availability Toggle */}
        <button 
          onClick={toggleAvailability}
          disabled={loadingAvailability}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors border ${
            isAvailable 
            ? 'bg-[#7A8B76]/10 text-[#7A8B76] border-[#7A8B76]/30 hover:bg-[#7A8B76]/20' 
            : 'bg-[#F0EAE3] text-[#827A73] border-[#D1C7BD] hover:bg-[#EBE6E0]'
          }`}
        >
          {isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
          {isAvailable ? 'Available for Work' : 'On Leave / Away'}
        </button>
      </div>

      {/* Cover & Avatar Section */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-hidden relative">
        {/* Cover Photo */}
        <div className="h-48 bg-[#F0EAE3] relative group">
          {user?.cover_photo ? (
            <img src={user.cover_photo} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-zinc-800 to-zinc-900" />
          )}
          <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-[#2D2A26] text-sm font-medium bg-black/50 px-4 py-2 rounded-full">Change Cover Photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'cover');
            }} />
          </label>
        </div>

        {/* Avatar */}
        <div className="px-6 pb-6 relative">
          <div className="absolute -top-12 left-6">
            <div className="w-24 h-24 rounded-full border-4 border-zinc-900 bg-[#F0EAE3] relative group overflow-hidden">
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#827A73] text-2xl font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-[#2D2A26] text-[10px] font-medium text-center leading-tight">Change<br/>Avatar</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'avatar');
                }} />
              </label>
            </div>
          </div>
          <div className="ml-32 pt-2">
            <h2 className="text-xl font-bold text-[#2D2A26]">{user?.name}</h2>
            <p className="text-[#827A73] text-sm">Craftsman • {shop?.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Metrics & Tags */}
        <div className="space-y-6">
          <div className="bg-linear-to-br from-zinc-900 to-zinc-950 border border-[#EBE6E0] rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Award size={64} className="text-[#2D2A26]" />
            </div>
            <h2 className="text-sm font-medium text-[#827A73] mb-1">Total Garments Crafted</h2>
            <div className="text-4xl font-bold text-[#2D2A26] mb-6">47</div>
            
            <h2 className="text-sm font-medium text-[#827A73] mb-1">Active Tasks</h2>
            <div className="text-2xl font-semibold text-taupe mb-6">3</div>

            <div className="space-y-2">
              <h2 className="text-sm font-medium text-[#827A73] mb-2">My Specialties</h2>
              {/* Mock Specialties, normally fetched from staff tags */}
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#9A8073]/20 text-indigo-300 text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                  <Scissors size={12} /> Master Cutter
                </span>
                <span className="bg-[#BCA89F]/20 text-amber-300 text-xs px-2.5 py-1 rounded-full font-medium">
                  Suit Jackets
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4">Personal Details</h2>
            <form onSubmit={handlePersonalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#524A44] mb-1">Full Name</label>
                <input 
                  required 
                  type="text" 
                  value={personalForm.name} 
                  onChange={e => setPersonalForm({...personalForm, name: e.target.value})}
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#524A44] mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={user?.email || ''} 
                    disabled
                    className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#A8A19A] cursor-not-allowed" 
                  />
                  <p className="text-xs text-[#A8A19A] mt-1">Contact your shop owner to change email.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#524A44] mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    value={personalForm.phone} 
                    onChange={e => setPersonalForm({...personalForm, phone: e.target.value})}
                    className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" 
                  />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loadingPersonal} className="bg-taupe hover:bg-taupe/90 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  {loadingPersonal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[#2D2A26] mb-4 flex items-center gap-2">
              <ShieldCheck size={20} className="text-taupe" />
              Security
            </h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#524A44] mb-1">Current Password</label>
                <input 
                  required 
                  type="password" 
                  value={passwordForm.current_password} 
                  onChange={e => setPasswordForm({...passwordForm, current_password: e.target.value})}
                  className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#524A44] mb-1">New Password</label>
                  <input 
                    required 
                    type="password" 
                    value={passwordForm.password} 
                    onChange={e => setPasswordForm({...passwordForm, password: e.target.value})}
                    className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#524A44] mb-1">Confirm New Password</label>
                  <input 
                    required 
                    type="password" 
                    value={passwordForm.password_confirmation} 
                    onChange={e => setPasswordForm({...passwordForm, password_confirmation: e.target.value})}
                    className="w-full px-4 py-2 bg-[#FAF6F3] border border-[#EBE6E0] rounded-lg text-[#2D2A26] focus:border-taupe" 
                  />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" disabled={loadingPassword} className="bg-[#F0EAE3] hover:bg-[#EBE6E0] text-[#2D2A26] px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  {loadingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
