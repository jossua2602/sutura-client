'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import { Loader2, Save, ShieldCheck, CheckCircle, X } from 'lucide-react';

export default function OwnerProfilePage() {
  const { user, shop } = useAuthStore();
  
  const [personalForm, setPersonalForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });

  const [loadingPersonal, setLoadingPersonal] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);
  const [isCoverDropdownOpen, setIsCoverDropdownOpen] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

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

  const handleImageUpload = async (file: File, type: 'avatar' | 'cover') => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('type', type);
    try {
      // In a real app, you might want a loading spinner over the image
      const res = await api.post('/profile/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Force reload auth store to get new images
      // Or just reload page for simplicity
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      alert('Failed to upload image. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-[#2D2A26] tracking-tight">Account Profile</h1>
        <p className="text-[#827A73] text-sm mt-1">Manage your personal security and billing details.</p>
      </div>

      {/* Cover & Avatar Section */}
      <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-2xl overflow-visible relative mb-16">
        {/* Cover Photo */}
        <div className="h-48 bg-[#F0EAE3] relative rounded-t-2xl overflow-hidden">
          {user?.cover_photo ? (
            <img 
              src={user.cover_photo} 
              alt="Cover" 
              className="w-full h-full object-cover cursor-pointer" 
              onClick={() => setIsCoverDropdownOpen(!isCoverDropdownOpen)} 
            />
          ) : (
            <div 
              className="w-full h-full bg-linear-to-r from-[#F0EAE3] to-[#EBE6E0] cursor-pointer" 
              onClick={() => setIsCoverDropdownOpen(!isCoverDropdownOpen)}
            />
          )}

          {isCoverDropdownOpen && (
            <div className="absolute top-4 right-4 w-48 bg-white rounded-xl shadow-lg border border-[#EBE6E0] py-2 z-10">
              <button 
                onClick={() => {
                  if (user?.cover_photo) setViewerImage(user.cover_photo);
                  setIsCoverDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors"
              >
                See Cover Photo
              </button>
              <label className="block w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors cursor-pointer">
                Choose Cover Photo
                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                  if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'cover');
                  setIsCoverDropdownOpen(false);
                }} />
              </label>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="px-6 relative">
          <div className="absolute -top-12 left-6">
            <button 
              onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
              className="w-24 h-24 rounded-full border-4 border-white bg-[#F0EAE3] relative overflow-hidden shadow-sm hover:opacity-90 transition-opacity"
            >
              {user?.profile_picture ? (
                <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-taupe text-3xl font-bold bg-[#F0EAE3]">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </button>
            
            {isAvatarDropdownOpen && (
              <div className="absolute top-28 left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#EBE6E0] py-2 z-50">
                <button 
                  onClick={() => {
                    if (user?.profile_picture) setViewerImage(user.profile_picture);
                    setIsAvatarDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors"
                >
                  See Profile Picture
                </button>
                <label className="block w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors cursor-pointer">
                  Choose Profile Picture
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'avatar');
                    setIsAvatarDropdownOpen(false);
                  }} />
                </label>
              </div>
            )}
          </div>
          <div className="ml-28 pt-4 pb-6">
            <h2 className="text-xl font-bold text-[#2D2A26]">{user?.name}</h2>
            <p className="text-[#827A73] text-sm">Shop Owner • {shop?.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Forms */}
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
                  <p className="text-xs text-[#A8A19A] mt-1">Email cannot be changed.</p>
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

      {viewerImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" 
          onClick={() => setViewerImage(null)}
        >
          <img src={viewerImage} alt="View" className="max-w-full max-h-full rounded-lg object-contain shadow-2xl" />
          <button className="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors">
            <X size={32} />
          </button>
        </div>
      )}
    </div>
  );
}
