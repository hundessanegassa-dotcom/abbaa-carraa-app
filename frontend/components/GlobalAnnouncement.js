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
        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
          return;
        }
        setAnnouncement(data);
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
    }
  }

  const getTypeStyles = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-yellow-500 text-black';
      case 'success':
        return 'bg-green-600 text-white';
      case 'alert':
        return 'bg-red-600 text-white';
      default:
        return 'bg-blue-600 text-white';
    }
  };

  if (!announcement || dismissed) return null;

  return (
    <div className={`${getTypeStyles(announcement.type)} py-2.5 px-4 text-center text-sm font-medium relative z-50`}>
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-center gap-2">
        <span className="font-semibold">{announcement.title}:</span>
        <span>{announcement.message}</span>
        {announcement.link_url && (
          <Link href={announcement.link_url} className="underline font-semibold ml-1">
            {announcement.link_text || 'Learn More'} →
          </Link>
        )}
        <button 
          onClick={() => setDismissed(true)} 
          className="absolute right-4 opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
