import React from 'react';
import { X } from 'lucide-react';

interface ProfileImageViewerProps {
  readonly imageUrl: string | null;
  readonly onClose: () => void;
}

export default function ProfileImageViewer({ imageUrl, onClose }: ProfileImageViewerProps) {
  if (!imageUrl) return null;

  return (
    <button
      type="button"
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 w-full border-none outline-none"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
      aria-label="Close image viewer"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="View"
        className="max-w-full max-h-full rounded-lg object-contain shadow-2xl"
      />
      <span className="absolute top-4 right-4 text-white hover:text-zinc-300 transition-colors pointer-events-none">
        <X size={32} />
      </span>
    </button>
  );
}
