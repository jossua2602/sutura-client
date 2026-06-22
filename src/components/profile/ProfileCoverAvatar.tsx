import React from 'react';
import { Star } from 'lucide-react';

interface ProfileCoverAvatarProps {
  user: {
    name: string;
    email: string;
    phone?: string;
    cover_photo?: string | null;
    profile_picture?: string | null;
  } | null;
  shop: {
    name: string;
  } | null;
  isCoverDropdownOpen: boolean;
  setIsCoverDropdownOpen: (open: boolean) => void;
  isAvatarDropdownOpen: boolean;
  setIsAvatarDropdownOpen: (open: boolean) => void;
  onViewImage: (url: string) => void;
  onImageUpload: (file: File, type: 'avatar' | 'cover') => Promise<void>;
}

export default function ProfileCoverAvatar({
  user,
  shop,
  isCoverDropdownOpen,
  setIsCoverDropdownOpen,
  isAvatarDropdownOpen,
  setIsAvatarDropdownOpen,
  onViewImage,
  onImageUpload,
}: ProfileCoverAvatarProps) {
  return (
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
                if (user?.cover_photo) onViewImage(user.cover_photo);
                setIsCoverDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors"
            >
              See Cover Photo
            </button>
            <label className="block w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors cursor-pointer">
              Choose Cover Photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files?.[0]) onImageUpload(e.target.files[0], 'cover');
                  setIsCoverDropdownOpen(false);
                }}
              />
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
                  if (user?.profile_picture) onViewImage(user.profile_picture);
                  setIsAvatarDropdownOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors"
              >
                See Profile Picture
              </button>
              <label className="block w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors cursor-pointer">
                Choose Profile Picture
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) onImageUpload(e.target.files[0], 'avatar');
                    setIsAvatarDropdownOpen(false);
                  }}
                />
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
  );
}
