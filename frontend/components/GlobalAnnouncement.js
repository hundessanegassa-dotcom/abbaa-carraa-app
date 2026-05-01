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

  if (!announcement || dismissed) return null;

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return 'from-yellow-600 to-amber-700';
      case 'success':
        return 'from-green-600 to-emerald-700';
      case 'alert':
        return 'from-red-600 to-rose-700';
      default:
        return 'from-gray-600 to-gray-800'; // ← Changed to gray
    }
  };

  return (
    <div className="relative overflow-hidden text-sm">
      <div className={`bg-gradient-to-r ${getTypeStyles(announcement.type)} text-white`}>
        <div className="container mx-auto px-4 py-1.5"> {/* ← Smaller padding */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-center">
            <p className="text-xs sm:text-sm">
              {announcement.title}: {announcement.message}
            </p>
            
            {announcement.link_url && (
              <Link href={announcement.link_url} className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full text-xs font-semibold transition">
                {announcement.link_text || t('common.learn_more')} →
              </Link>
            )}
            
            <button 
              onClick={() => setDismissed(true)} 
              className="absolute right-2 opacity-70 hover:opacity-100 transition text-xs"
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
