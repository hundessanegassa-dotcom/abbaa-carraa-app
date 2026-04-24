import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function GlobalAnnouncement() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  async function fetchAnnouncement() {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
        
      if (data && !error) {
        setAnnouncement(data);
      }
    } catch (error) {
      console.error('No active announcement:', error);
    }
  }

  if (!announcement || dismissed) return null;

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return 'from-yellow-500 to-amber-600';
      case 'success':
        return 'from-green-500 to-emerald-600';
      case 'alert':
        return 'from-red-500 to-rose-600';
      default:
        return 'from-blue-500 to-indigo-600';
    }
  };

  return (
    <div className="relative overflow-hidden">
      {/* Animated gradient background */}
      <div className={`bg-gradient-to-r ${getTypeStyles(announcement.type)} relative z-10`}>
        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
        
        {/* Light rays from top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-300/80 to-transparent animate-pulse"></div>
        
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            {/* Animated icon */}
            <div className="flex items-center gap-2 animate-bounce">
              <span className="text-xl">💰</span>
              <span className="font-bold text-sm sm:text-base">CASH PRIZE POLICY:</span>
            </div>
            
            <p className="text-sm sm:text-base">
              Winners receive the <span className="font-bold underline decoration-yellow-300">CASH EQUIVALENT</span> of the prize value LISTED when pool was created. Locked & guaranteed!
            </p>
            
            <Link href="/terms" className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm font-semibold transition-all duration-200">
              Learn More 
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            
            {/* Dismiss button */}
            <button 
              onClick={() => setDismissed(true)} 
              className="absolute right-4 opacity-70 hover:opacity-100 transition"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
        
        {/* Bottom light ray */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-300/60 to-transparent animate-pulse"></div>
      </div>
      
      {/* CSS for animations */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
