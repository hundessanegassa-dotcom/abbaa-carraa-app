import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Banner() {
  const { t } = useTranslation();
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
        { id: 1, title: t('banners.agent'), description: t('banners.agent_desc'), link_url: '/agent/register', button_text: t('common.register'), bgColor: 'from-yellow-500 to-orange-500', icon: '🤝' },
        { id: 2, title: t('banners.vendor'), description: t('banners.vendor_desc'), link_url: '/vendor/register', button_text: t('common.join'), bgColor: 'from-purple-500 to-pink-500', icon: '🏭' },
        { id: 3, title: t('banners.organization'), description: t('banners.organization_desc'), link_url: '/organization/register', button_text: t('common.register'), bgColor: 'from-blue-500 to-indigo-500', icon: '🏢' },
        { id: 4, title: t('banners.individual'), description: t('banners.individual_desc'), link_url: '/register', button_text: t('common.join_now'), bgColor: 'from-emerald-500 to-teal-500', icon: '👤' }
      ]);
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {banners.map((banner) => (
          <div key={banner.id} className={`bg-gradient-to-r ${banner.bgColor} rounded-xl p-4 text-white shadow-lg hover:shadow-xl transition-all`}>
            <div className="text-3xl mb-2">{banner.icon}</div>
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
