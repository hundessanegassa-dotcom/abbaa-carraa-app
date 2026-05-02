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

  return (
    <div className="w-full bg-gradient-to-r from-green-700 to-blue-700 text-white">
      <div className="container mx-auto px-3 py-1.5">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
          <span className="text-sm sm:text-base">📢</span>
          <span className="font-medium">
            {announcement.title}: {announcement.message}
          </span>
          {announcement.link_url && (
            <>
              <span className="hidden sm:inline text-gray-300">•</span>
              <Link href={announcement.link_url} className="text-yellow-200 hover:text-yellow-100 transition underline decoration-yellow-200/50 underline-offset-2">
                {announcement.link_text || t('common.learn_more')} →
              </Link>
            </>
          )}
          <button 
            onClick={() => setDismissed(true)} 
            className="ml-1 opacity-60 hover:opacity-100 transition text-xs"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
