'use client';

import { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends ImageProps {
  fallbackSrc?: string;
}

const DEFAULT_FALLBACK = 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1000&auto=format&fit=crop';

export const SafeImage = ({ src, fallbackSrc = DEFAULT_FALLBACK, alt, ...props }: SafeImageProps) => {
  const [error, setError] = useState(false);

  const isBadDomain = typeof src === 'string' && src.includes('nhasachmienphi.com');
  const displaySrc = error || isBadDomain ? fallbackSrc : src;

  return (
    <Image
      {...props}
      key={typeof src === 'string' ? src : undefined}
      src={displaySrc}
      alt={alt}
      onError={() => {
        setError(true);
      }}
    />
  );
};
