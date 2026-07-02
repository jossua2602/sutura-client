import React from 'react';
import { Camera, Edit3 } from 'lucide-react';

interface ProfileCoverAvatarProps {
  readonly user: {
    readonly name: string;
    readonly email: string;
    readonly phone?: string;
    readonly cover_photo?: string | null;
    readonly profile_picture?: string | null;
  } | null;
  readonly shop: {
    readonly name: string;
    readonly social_links?: {
      readonly facebook?: string;
      readonly instagram?: string;
      readonly tiktok?: string;
    } | null;
  } | null;
  readonly isCoverDropdownOpen: boolean;
  readonly setIsCoverDropdownOpen: (open: boolean) => void;
  readonly isAvatarDropdownOpen: boolean;
  readonly setIsAvatarDropdownOpen: (open: boolean) => void;
  readonly onViewImage: (url: string) => void;
  readonly onImageUpload: (file: File, type: 'avatar' | 'cover') => Promise<void>;
}

const getMessengerUrl = (facebookUrl?: string) => {
  if (!facebookUrl) return 'https://m.me/suturatailoring';
  try {
    const url = new URL(facebookUrl);
    const pathname = url.pathname.replace(/^\/|\/$/g, '');
    if (pathname && !pathname.includes('/') && pathname !== 'profile.php') {
      return `https://m.me/${pathname}`;
    }
  } catch (e) {
    // Ignore URL parse error
  }
  return 'https://m.me/suturatailoring';
};

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
    <div className="bg-white shadow-sm border border-[#EBE6E0] rounded-3xl overflow-visible relative mb-6">
      {/* Cover Photo */}
      <div className="h-64 sm:h-80 bg-[#FAF6F3] relative rounded-t-3xl overflow-hidden group">
        {user?.cover_photo ? (
          <button
            type="button"
            className="w-full h-full p-0 border-none outline-none focus:outline-none cursor-pointer"
            onClick={() => setIsCoverDropdownOpen(!isCoverDropdownOpen)}
            aria-label="Toggle cover menu"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.cover_photo}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          </button>
        ) : (
          <button
            type="button"
            className="w-full h-full p-0 border-none outline-none focus:outline-none cursor-pointer bg-linear-to-r from-[#FAF6F3] to-[#EBE6E0]"
            onClick={() => setIsCoverDropdownOpen(!isCoverDropdownOpen)}
            aria-label="Toggle cover menu"
          />
        )}

        {/* Edit Cover Button */}
        <button
          onClick={() => setIsCoverDropdownOpen(!isCoverDropdownOpen)}
          className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-[#2D2A26] px-4 py-2 rounded-xl text-sm font-medium shadow-md flex items-center gap-2 backdrop-blur-xs transition-all opacity-90 hover:opacity-100"
        >
          <Camera size={16} />
          Edit cover photo
        </button>

        {isCoverDropdownOpen && (
          <div className="absolute bottom-16 right-4 w-48 bg-white rounded-xl shadow-lg border border-[#EBE6E0] py-2 z-10">
            <button
              onClick={() => {
                if (user?.cover_photo) onViewImage(user.cover_photo);
                setIsCoverDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors"
            >
              See Cover Photo
            </button>
            <label htmlFor="cover-photo-upload" className="block w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors cursor-pointer">
              Choose Cover Photo
            </label>
            <input
              id="cover-photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                if (e.target.files?.[0]) onImageUpload(e.target.files[0], 'cover');
                setIsCoverDropdownOpen(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Avatar, Name Info, Actions */}
      <div className="px-8 pb-6 relative flex flex-col md:flex-row md:items-end justify-between gap-6 -mt-16 md:-mt-20">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
          {/* Avatar */}
          <div className="relative">
            <button
              onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
              className="w-32 h-32 md:w-36 md:h-36 rounded-full border-4 border-white bg-[#FAF6F3] relative overflow-hidden shadow-md hover:opacity-95 transition-opacity"
            >
              {user?.profile_picture ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={user.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#8C6B5D] text-4xl font-bold bg-[#FAF6F3]">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </button>

            {/* Change Avatar Overlay Icon */}
            <button
              onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
              className="absolute bottom-2 right-2 bg-[#FAF6F3] hover:bg-[#EBE6E0] text-[#2D2A26] p-2 rounded-full border border-[#EBE6E0] shadow-sm transition-all"
            >
              <Camera size={16} />
            </button>

            {isAvatarDropdownOpen && (
              <div className="absolute top-36 left-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[#EBE6E0] py-2 z-50">
                <button
                  onClick={() => {
                    if (user?.profile_picture) onViewImage(user.profile_picture);
                    setIsAvatarDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors"
                >
                  See Profile Picture
                </button>
                <label htmlFor="avatar-photo-upload" className="block w-full text-left px-4 py-2 text-sm text-[#524A44] hover:bg-[#FAF6F3] transition-colors cursor-pointer">
                  Choose Profile Picture
                </label>
                <input
                  id="avatar-photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    if (e.target.files?.[0]) onImageUpload(e.target.files[0], 'avatar');
                    setIsAvatarDropdownOpen(false);
                  }}
                />
              </div>
            )}
          </div>

          <div className="mb-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2D2A26]">{user?.name}</h2>
            <p className="text-[#827A73] text-sm font-medium mt-1">Shop Owner • {shop?.name}</p>
          </div>
        </div>

        {/* Buttons / Actions */}
        <div className="flex flex-wrap gap-3 mb-2 justify-center">
          <button className="px-4 py-2.5 bg-[#8C6B5D] hover:bg-[#72564A] text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-[#8C6B5D]/10 flex items-center gap-2">
            Professional dashboard
          </button>
          <a
            href={getMessengerUrl(shop?.social_links?.facebook)}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-[#EBE6E0] hover:bg-[#D1C7BD] text-[#2D2A26] rounded-xl text-sm font-medium transition-all flex items-center gap-2"
          >
            💬 Chat Shop
          </a>
          <button className="px-4 py-2.5 bg-[#FAF6F3] hover:bg-[#EBE6E0] text-[#2D2A26] border border-[#EBE6E0] rounded-xl text-sm font-medium transition-all flex items-center gap-2">
            <Edit3 size={16} />
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
}
