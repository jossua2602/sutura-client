'use client';

import { useState } from 'react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/useAuthStore';
import ProfileCoverAvatar from '@/components/profile/ProfileCoverAvatar';
import ProfilePersonalDetails from '@/components/profile/ProfilePersonalDetails';
import ProfileSecurity from '@/components/profile/ProfileSecurity';
import ProfileImageViewer from '@/components/profile/ProfileImageViewer';

export default function OwnerProfilePage() {
  const { user, shop } = useAuthStore();

  const [personalForm, setPersonalForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
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
      await api.post('/profile/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
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

      <ProfileCoverAvatar
        user={user}
        shop={shop}
        isCoverDropdownOpen={isCoverDropdownOpen}
        setIsCoverDropdownOpen={setIsCoverDropdownOpen}
        isAvatarDropdownOpen={isAvatarDropdownOpen}
        setIsAvatarDropdownOpen={setIsAvatarDropdownOpen}
        onViewImage={setViewerImage}
        onImageUpload={handleImageUpload}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <ProfilePersonalDetails
            email={user?.email || ''}
            personalForm={personalForm}
            setPersonalForm={setPersonalForm}
            onSubmit={handlePersonalSubmit}
            loading={loadingPersonal}
          />

          <ProfileSecurity
            passwordForm={passwordForm}
            setPasswordForm={setPasswordForm}
            onSubmit={handlePasswordSubmit}
            loading={loadingPassword}
          />
        </div>
      </div>

      <ProfileImageViewer imageUrl={viewerImage} onClose={() => setViewerImage(null)} />
    </div>
  );
}
