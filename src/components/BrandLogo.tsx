import React from 'react';

export default function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className="font-heading text-4xl text-[var(--foreground)] tracking-tight lowercase">
        sutura
      </span>
    </div>
  );
}
