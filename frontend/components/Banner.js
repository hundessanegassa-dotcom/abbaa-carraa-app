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
    } else {
      // Default banners if none in database
      setBanners([
        { id: 1, title: '🤝 Become an Agent', description: 'Earn 10% commission on every pool', link_url: '/agent/register', button_text: 'Register', bgColor: 'from-amber-500 to-orange-500' },
        { id: 2, title: '🏭 Become a Vendor', description: 'List your products as prizes', link_url: '/vendor/register', button_text: 'Join', bgColor: 'from-purple-500 to-pink-500' },
        { id: 3, title: '🏢 Become an Organization', description: 'Create private pools for members', link_url: '/organization/register', button_text: 'Register', bgColor: 'from-blue-500 to-indigo-500' },
        { id: 4, title: '👤 Join as Individual', description: 'Contribute for a chance to win big', link_url: '/register', button_text: 'Join Now', bgColor: 'from-emerald-500 to-teal-500' }
      ]);
    }
  }

  return (
    <div className="space-y-1">
      {banners.map((banner, index) => (
        <div key={banner.id} className={`bg-gradient-to-r ${banner.bgColor || 'from-green-600 to-blue-600'} text-white shadow-md`}>
          <div className="container mx-auto px-4 py-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{banner.title?.charAt(0) || '✨'}</span>
                <div>
                  <p className="font-semibold text-sm sm:text-base">{banner.title}</p>
                  {banner.description && <p className="text-xs opacity-90 hidden sm:block">{banner.description}</p>}
                </div>
              </div>
              {banner.link_url && (
                <Link href={banner.link_url}>
                  <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-3 py-1 rounded-full text-xs font-semibold transition">
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
