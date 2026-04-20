import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Banner() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    fetchBanners();
  }, []);

  async function fetchBanners() {
    const { data } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });
    
    if (data && data.length > 0) {
      setBanners(data);
    }
  }

  // Color schemes for each banner type - attractive but not overwhelming
  const bannerColors = {
    1: 'from-amber-500 to-orange-500',      // Agent - warm gold
    2: 'from-purple-500 to-pink-500',        // Vendor - royal purple
    3: 'from-blue-500 to-indigo-500',        // Organization - trust blue
    4: 'from-emerald-500 to-teal-500'        // Individual - fresh green
  };

  const bannerIcons = {
    1: '🤝',
    2: '🏭',
    3: '🏢',
    4: '👤'
  };

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 py-2">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`bg-gradient-to-r ${bannerColors[index + 1] || 'from-green-600 to-blue-600'} text-white shadow-md`}
        >
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{bannerIcons[index + 1] || '✨'}</span>
                <div>
                  <p className="font-semibold text-sm sm:text-base">{banner.title}</p>
                  {banner.description && (
                    <p className="text-xs opacity-90 hidden sm:block">{banner.description}</p>
                  )}
                </div>
              </div>
              {banner.link_url && (
                <Link href={banner.link_url}>
                  <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border border-white/30">
                    {banner.button_text || 'Learn More'} →
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
