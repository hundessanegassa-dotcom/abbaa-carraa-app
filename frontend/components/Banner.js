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
      setBanners([
        { id: 1, title: '🏭 Become a Vendor', description: 'List your products as prizes. Winner gets FREE product!', link_url: '/vendor/register', button_text: 'Join as Vendor', bgColor: 'from-purple-500 to-pink-500' },
        { id: 2, title: '🤝 Become an Agent', description: 'Earn 10% commission on every pool you create!', link_url: '/agent/register', button_text: 'Register as Agent', bgColor: 'from-blue-500 to-indigo-500' },
        { id: 3, title: '🏢 Become an Organization', description: 'Create private pools for your members', link_url: '/organization/register', button_text: 'Register Organization', bgColor: 'from-green-500 to-teal-500' },
        { id: 4, title: '🎯 Join as Participant', description: 'Join existing pools for a chance to win amazing prizes', link_url: '/register', button_text: 'Join Now', bgColor: 'from-orange-500 to-red-500' }
      ]);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {banners.map((banner) => (
          <div key={banner.id} className={`bg-gradient-to-r ${banner.bgColor} rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all`}>
            <p className="font-bold text-lg mb-1">{banner.title}</p>
            <p className="text-xs opacity-90 mb-3">{banner.description}</p>
            <Link href={banner.link_url}>
              <button className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-semibold transition">
                {banner.button_text} →
              </button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
