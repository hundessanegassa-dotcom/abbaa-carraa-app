import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function LazyImage({ src, alt, className, width, height, priority = false }) {
  const [isVisible, setIsVisible] = useState(false);
  const [imgSrc, setImgSrc] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (priority) {
      setImgSrc(src);
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setImgSrc(src);
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    
    const element = document.getElementById(`lazy-img-${alt.replace(/\s/g, '')}`);
    if (element) observer.observe(element);
    
    return () => observer.disconnect();
  }, [src, alt, priority]);

  if (!imgSrc && !priority) {
    return (
      <div 
        id={`lazy-img-${alt.replace(/\s/g, '')}`}
        className={`bg-gray-100 animate-pulse ${className}`}
        style={{ width, height }}
      >
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          📷
        </div>
      </div>
    );
  }

  if (error || !imgSrc) {
    return (
      <div className={`bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center ${className}`}>
        <span className="text-4xl">🎁</span>
      </div>
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 500}
      height={height || 300}
      className={className}
      onError={() => setError(true)}
      priority={priority}
      loading={priority ? 'eager' : 'lazy'}
    />
  );
}
