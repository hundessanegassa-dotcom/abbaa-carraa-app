import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function GlobalAnnouncement() {
  const { t } = useTranslation();
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

  // Only show database announcements, NOT cash policy (handled by CashEquivalentBanner)
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
      <div className={`bg-gradient-to-r ${getTypeStyles(announcement.type)} relative z-10 text-white`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
            <p className="text-sm sm:text-base font-medium">
              {announcement.title}: {announcement.message}
            </p>
            
            {announcement.link_url && (
              <Link href={announcement.link_url} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-sm font-semibold transition">
                {announcement.link_text || t('common.learn_more')} →
              </Link>
            )}
            
            <button 
              onClick={() => setDismissed(true)} 
              className="absolute right-4 opacity-70 hover:opacity-100 transition"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
