import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function GlobalAnnouncement() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
    const dismissedId = sessionStorage.getItem('announcement_dismissed');
    if (dismissedId) setDismissed(true);
  }, []);

  async function fetchAnnouncement() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching announcement:', error);
      return;
    }
    
    if (data && data.length > 0) {
      const ann = data[0];
      if (ann.expires_at && new Date(ann.expires_at) < new Date()) {
        return;
      }
      setAnnouncement(ann);
    }
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('announcement_dismissed', 'true');
  };

  if (!announcement || dismissed) return null;

  const typeStyles = {
    info: { bg: 'from-blue-500 to-indigo-500', text: 'text-blue-100', icon: '📢' },
    warning: { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-100', icon: '⚠️' },
    success: { bg: 'from-green-500 to-teal-500', text: 'text-green-100', icon: '🎉' },
    alert: { bg: 'from-red-500 to-pink-500', text: 'text-red-100', icon: '🔴' }
  };
  const style = typeStyles[announcement.type] || typeStyles.info;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${style.bg} rounded-xl shadow-lg mb-6`}>
      <div className="relative z-10">
        {announcement.banner_image && (
          <div className="w-full h-32 md:h-40 relative">
            <img 
              src={announcement.banner_image} 
              alt={announcement.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
        )}
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{style.icon}</span>
                <h3 className={`font-bold text-lg ${style.text}`}>{announcement.title}</h3>
              </div>
              <p className="text-white/90 text-sm md:text-base leading-relaxed">
                {announcement.content}
              </p>
              {announcement.link_url && (
                <Link 
                  href={announcement.link_url} 
                  className="inline-flex items-center gap-1 text-white font-semibold text-sm mt-3 hover:underline"
                >
                  {announcement.link_text || 'Learn More'} →
                </Link>
              )}
            </div>
            <button 
              onClick={handleDismiss} 
              className="text-white/70 hover:text-white transition ml-3"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
