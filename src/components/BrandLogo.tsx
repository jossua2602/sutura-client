import React from 'react';
import Image from 'next/image';

export default function BrandLogo({ className = "", iconOnly = false }: { readonly className?: string, readonly iconOnly?: boolean }) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Image 
        src="/sutura_logo_no_text.png" 
        alt="SUTURA Logo" 
        width={iconOnly ? 32 : 64} 
        height={iconOnly ? 32 : 64} 
        className="object-contain"
        priority
      />
    </div>
  );
}
