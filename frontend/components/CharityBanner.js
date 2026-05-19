import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CharityBanner() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('charity-banner-dismissed');
      if (saved) setDismissed(true);
    } catch (e) {}
  }, []);

  if (!mounted || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('charity-banner-dismissed', 'true');
  };

  return (
    <div className="w-full bg-gradient-to-r from-red-600 to-pink-600 text-white">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">💚</span>
            <span className="font-medium">2% of every contribution supports kidney & heart disease patients</span>
          </div>
          <div className="flex gap-2">
            <Link href="/about#charity" className="text-white underline text-xs">Learn More</Link>
            <button onClick={handleDismiss} className="text-white/80 hover:text-white text-xs">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}
