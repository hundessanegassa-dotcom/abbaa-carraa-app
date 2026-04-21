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
      // 5 Banners as requested
      setBanners([
        { 
          id: 1, 
          title: '📢 Advertise Here', 
          description: 'Reach thousands of potential customers. Promote your business on Abbaa Carraa. Contact us for rates!', 
          link_url: '/contact', 
          button_text: 'Contact Us',
          bgColor: 'from-gray-600 to-gray-800',
          icon: '📢',
          isLandscape: true
        },
        { 
          id: 2, 
          title: '🏭 Become a Vendor', 
          description: 'List your products as prizes. Winner gets FREE product. Non-winners get exclusive discounts from you!', 
          link_url: '/vendor/register', 
          button_text: 'Join as Vendor',
          bgColor: 'from-purple-500 to-purple-600',
          icon: '🏭',
          isLandscape: false
        },
        { 
          id: 3, 
          title: '🤝 Become an Agent', 
          description: 'List products from local businesses, build your community, and earn 10% commission on every pool you create!', 
          link_url: '/agent/register', 
          button_text: 'Register as Agent',
          bgColor: 'from-blue-500 to-blue-600',
          icon: '🤝',
          isLandscape: false
        },
        { 
          id: 4, 
          title: '🏢 Become an Organization Organizer', 
          description: 'Create private pools for your members only. Perfect for banks, NGOs, schools, and community groups!', 
          link_url: '/organization/register', 
          button_text: 'Register Organization',
          bgColor: 'from-green-500 to-green-600',
          icon: '🏢',
          isLandscape: false
        },
        { 
          id: 5, 
          title: '🎯 Join as a Participant', 
          description: 'Join existing pools for a chance to win amazing prizes. Cars, electronics, furniture, and more!', 
          link_url: '/register', 
          button_text: 'Join Now',
          bgColor: 'from-teal-500 to-teal-600',
          icon: '🎯',
          isLandscape: false
        }
      ]);
    }
  }

  return (
    <div className="space-y-3 py-3">
      {banners.map((banner) => (
        <div 
          key={banner.id} 
          className={`bg-gradient-to-r ${banner.bgColor} text-white shadow-md hover:shadow-lg transition-all duration-300 ${banner.isLandscape ? 'w-full' : 'rounded-xl'}`}
        >
          <div className={`container mx-auto px-4 ${banner.isLandscape ? 'py-6 md:py-8' : 'py-4'}`}>
            {banner.isLandscape ? (
              // Landscape banner (like hero section)
              <div className="flex flex-col items-center justify-center text-center">
                <span className="text-5xl mb-3">{banner.icon}</span>
                <p className="font-bold text-xl md:text-2xl mb-2">{banner.title}</p>
                <p className="text-sm md:text-base opacity-90 max-w-2xl mb-4">{banner.description}</p>
                {banner.link_url && (
                  <Link href={banner.link_url}>
                    <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-2 rounded-full text-sm font-semibold transition-all duration-200 border border-white/30">
                      {banner.button_text} →
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              // Portrait banner (smaller cards)
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{banner.icon}</span>
                  <div>
                    <p className="font-semibold text-sm sm:text-base">{banner.title}</p>
                    <p className="text-xs opacity-90">{banner.description}</p>
                  </div>
                </div>
                {banner.link_url && (
                  <Link href={banner.link_url}>
                    <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border border-white/30 whitespace-nowrap">
                      {banner.button_text} →
                    </button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
