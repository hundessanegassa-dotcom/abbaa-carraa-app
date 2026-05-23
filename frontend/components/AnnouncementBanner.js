import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        setUserType(profile?.user_type || 'individual');
      } else {
        setUserType('individual');
      }
    };
    getUser();
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

    if (!error && data && data.length > 0) {
      const ann = data[0];
      
      // Check expiry
      if (ann.expires_at && new Date(ann.expires_at) < new Date()) {
        return;
      }
      
      // Check audience targeting
      if (ann.target_audience === 'all' || 
          ann.target_audience === userType ||
          (ann.target_audience === 'individuals' && userType === 'individual') ||
          (ann.target_audience === 'agents' && userType === 'agent') ||
          (ann.target_audience === 'vendors' && userType === 'vendor')) {
        setAnnouncement(ann);
      }
    }
  }

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('announcement_dismissed', 'true');
  };

  if (!announcement || dismissed) return null;

  const getTypeStyles = () => {
    switch (announcement.type) {
      case 'warning':
        return { bg: 'from-yellow-500 to-orange-500', text: 'text-yellow-100', icon: '⚠️' };
      case 'success':
        return { bg: 'from-green-500 to-teal-500', text: 'text-green-100', icon: '🎉' };
      case 'alert':
        return { bg: 'from-red-500 to-pink-500', text: 'text-red-100', icon: '🔴' };
      default:
        return { bg: 'from-blue-500 to-indigo-500', text: 'text-blue-100', icon: '📢' };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${styles.bg} rounded-xl shadow-lg mb-6`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="white" />
        </svg>
      </div>
      
      <div className="relative z-10">
        {/* Banner Image Section */}
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
        
        {/* Content */}
        <div className="p-5">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{styles.icon}</span>
                <h3 className={`font-bold text-lg ${styles.text}`}>{announcement.title}</h3>
                {!announcement.banner_image && (
                  <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                    {announcement.target_audience === 'all' ? '📢 All Users' :
                     announcement.target_audience === 'agents' ? '🤝 Agents' :
                     announcement.target_audience === 'vendors' ? '🏪 Vendors' : '👤 Individuals'}
                  </span>
                )}
              </div>
              <p className="text-white/90 text-sm md:text-base leading-relaxed">
                {announcement.content}
              </p>
              {announcement.link_url && (
                <Link 
                  href={announcement.link_url} 
                  className="inline-flex items-center gap-1 text-white font-semibold text-sm mt-3 hover:underline"
                >
                  {announcement.link_text || 'Learn More'} 
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
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
