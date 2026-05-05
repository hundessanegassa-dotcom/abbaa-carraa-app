import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function CharityBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only run on client side to avoid hydration errors
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('charity-banner-dismissed');
      if (saved === 'true') {
        setDismissed(true);
      }
    } catch (e) {
      // localStorage error - ignore
      console.error('localStorage error:', e);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem('charity-banner-dismissed', 'true');
    } catch (e) {
      // localStorage error - ignore
      console.error('localStorage error:', e);
    }
  };

  // Don't render anything on server to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="w-full bg-gradient-to-r from-red-600 via-pink-500 to-red-600 text-white" style={{ minHeight: '44px' }}>
        <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-2">
          <div className="flex items-center gap-1">
            <span className="text-sm">❤️</span>
            <span className="text-sm">💚</span>
            <span className="text-sm">❤️</span>
          </div>
          <div className="text-center text-xs">
            <span className="font-bold">2% of income</span>
            <span> → </span>
            <span>Fighting kidney & heart disease</span>
          </div>
        </div>
      </div>
    );
  }

  if (dismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-pink-500 to-red-600 text-white" style={{ minHeight: '44px' }}>
      <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-2">
        <div className="flex items-center gap-1">
          <span className="text-sm">❤️</span>
          <span className="text-sm">💚</span>
          <span className="text-sm">❤️</span>
        </div>
        <div className="text-center text-xs">
          <span className="font-bold">2% of income</span>
          <span> → </span>
          <span>Fighting kidney & heart disease</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/about#charity" className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full text-xs">
            Join →
          </Link>
          <button 
            onClick={handleDismiss} 
            className="text-white/70 hover:text-white text-sm px-1"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
