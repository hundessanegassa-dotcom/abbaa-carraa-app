import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CharityBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const dismissedBanner = localStorage.getItem('charity-banner-dismissed');
    if (dismissedBanner === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    setIsVisible(false);
    localStorage.setItem('charity-banner-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="w-full bg-gradient-to-r from-red-600 via-pink-500 to-red-600 text-white overflow-hidden">
      <div className="relative">
        {/* Animated background pulse */}
        <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
        
        <div className="container mx-auto px-3 py-2.5 relative z-10">
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-xs sm:text-sm">
            {/* Heartbeat icon */}
            <div className="flex items-center gap-1">
              <span className="text-base sm:text-lg animate-pulse">❤️</span>
              <span className="text-base sm:text-lg">💚</span>
              <span className="text-base sm:text-lg animate-pulse">❤️</span>
            </div>
            
            {/* Main message */}
            <div className="text-center sm:text-left">
              <span className="font-bold text-white">2% of ALL income</span>
              <span className="mx-1">→</span>
              <span className="font-semibold">Supporting Ethiopians fighting kidney & heart disease</span>
            </div>
            
            {/* Call to action */}
            <Link href="/about#charity" className="bg-white/20 hover:bg-white/30 px-3 py-0.5 rounded-full text-xs font-semibold transition whitespace-nowrap">
              Join the Movement →
            </Link>
            
            {/* Dismiss button */}
            <button 
              onClick={handleDismiss}
              className="ml-1 text-white/60 hover:text-white transition text-xs"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      
      {/* Bottom shine effect */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
    </div>
  );
}
