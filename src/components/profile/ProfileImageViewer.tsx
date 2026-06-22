import React from 'react';
import { X } from 'lucide-react';

interface ProfileImageViewerProps {
  imageUrl: string | null;
  onClose: () => void;
}

export default function ProfileImageViewer({ imageUrl, onClose }: ProfileImageViewerProps) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <img
        src={imageUrl}
        alt="View"
        className="max-w-full max-h-full rounded-lg object-contain shadow-2xl"
      />
      <button className="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors">
        <X size={32} />
      </button>
    </div>
  );
}
