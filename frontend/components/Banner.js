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
        { 
          id: 1, 
          title: '📢 Advertise Here', 
          description: 'Reach thousands of potential customers. Promote your business on Abbaa Carraa. Contact us for rates!', 
          link_url: '/contact', 
          button_text: 'Contact Us',
          bgColor: 'from-gray-700 to-gray-900',
          icon: '📢',
          isLandscape: true
        },
        { 
          id: 2, 
          title: '🏭 Become a Vendor', 
          description: 'List your products as prizes. Winner gets FREE product. Non-winners get exclusive discounts from you!', 
          link_url: '/vendor/register', 
          button_text: 'Join as Vendor',
          bgColor: 'from-purple-500 to-purple-700',
          icon: '🏭',
          isLandscape: false
        },
        { 
          id: 3, 
          title: '🤝 Become an Agent', 
          description: 'List products from local businesses, build your community, and earn 10% commission on every pool you create!', 
          link_url: '/agent/register', 
          button_text: 'Register as Agent',
          bgColor: 'from-blue-500 to-blue-700',
          icon: '🤝',
          isLandscape: false
        },
        { 
          id: 4, 
          title: '🏢 Become an Organization Organizer', 
          description: 'Create private pools for your members only. Perfect for banks, NGOs, schools, and community groups!', 
          link_url: '/organization/register', 
          button_text: 'Register Organization',
          bgColor: 'from-green-500 to-green-700',
          icon: '🏢',
          isLandscape: false
        },
        { 
          id: 5, 
          title: '🎯 Join as a Participant', 
          description: 'Join existing pools for a chance to win amazing prizes. Cars, electronics, furniture, and more!', 
          link_url: '/register', 
          button_text: 'Join Now',
          bgColor: 'from-teal-500 to-teal-700',
          icon: '🎯',
          isLandscape: false
        }
      ]);
    }
  }

  return (
    <div className="space-y-4 py-4">
      {banners.map((banner) => (
        <div 
          key={banner.id} 
          className={`bg-gradient-to-r ${banner.bgColor} text-white shadow-lg overflow-hidden rounded-xl`}
        >
          {banner.isLandscape ? (
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-red-500/20 to-pink-500/20 animate-pulse"></div>
              <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
              <div className="relative z-10 container mx-auto px-6 py-8 md:py-10">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4 animate-bounce">{banner.icon}</div>
                  <p className="font-bold text-2xl md:text-3xl mb-3">{banner.title}</p>
                  <p className="text-sm md:text-base opacity-95 max-w-2xl mb-5">{banner.description}</p>
                  {banner.link_url && (
                    <Link href={banner.link_url}>
                      <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-8 py-2.5 rounded-full text-base font-semibold transition-all duration-300 border border-white/30 hover:scale-105">
                        {banner.button_text} →
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="container mx-auto px-4 py-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="text-3xl bg-white/20 rounded-full w-12 h-12 flex items-center justify-center">
                    {banner.icon}
                  </div>
                  <div>
                    <p className="font-bold text-base sm:text-lg">{banner.title}</p>
                    <p className="text-xs opacity-90">{banner.description}</p>
                  </div>
                </div>
                {banner.link_url && (
                  <Link href={banner.link_url}>
                    <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border border-white/30 whitespace-nowrap hover:scale-105">
                      {banner.button_text} →
                    </button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
