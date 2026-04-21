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
      // Complete banners with all roles and promotional
      setBanners([
        // Promotional Banner
        { 
          id: 1, 
          title: '🎉 SPECIAL PROMOTION', 
          description: 'Register today and get 10% bonus on your first pool creation! Limited time offer.', 
          link_url: '/register', 
          button_text: 'Claim Offer',
          bgColor: 'from-red-500 to-pink-500',
          icon: '🎉',
          isPromo: true
        },
        // Organizer Banner
        { 
          id: 2, 
          title: '💰 Become an Organizer', 
          description: 'Create a pool and earn 10% commission when it completes. Anyone can be an organizer! No upfront costs.', 
          link_url: '/register', 
          button_text: 'Start Earning',
          bgColor: 'from-amber-500 to-orange-500',
          icon: '💰'
        },
        // Vendor Banner
        { 
          id: 3, 
          title: '🏭 Become a Vendor Organizer', 
          description: 'List your products as prizes. Winner gets product FREE. Non-winners get exclusive discounts from you!', 
          link_url: '/vendor/register', 
          button_text: 'Join as Vendor',
          bgColor: 'from-purple-500 to-pink-500',
          icon: '🏭'
        },
        // Agent Banner
        { 
          id: 4, 
          title: '🤝 Become an Agent Organizer', 
          description: 'List products from local businesses, build your community, and earn 10% commission on every pool you create!', 
          link_url: '/agent/register', 
          button_text: 'Register as Agent',
          bgColor: 'from-yellow-500 to-orange-500',
          icon: '🤝'
        },
        // Organization Banner
        { 
          id: 5, 
          title: '🏢 Become an Organization Organizer', 
          description: 'Create private pools for your members only. Perfect for banks, NGOs, schools, and community groups!', 
          link_url: '/organization/register', 
          button_text: 'Register Organization',
          bgColor: 'from-blue-500 to-indigo-500',
          icon: '🏢'
        },
        // Participant Banner
        { 
          id: 6, 
          title: '🎯 Join as a Participant', 
          description: 'Join existing pools for a chance to win amazing prizes. Cars, electronics, furniture, and more! No commission, just winning!', 
          link_url: '/register', 
          button_text: 'Join Now',
          bgColor: 'from-emerald-500 to-teal-500',
          icon: '🎯'
        }
      ]);
    }
  }

  return (
    <div className="space-y-2 py-3">
      {banners.map((banner) => (
        <div 
          key={banner.id} 
          className={`bg-gradient-to-r ${banner.bgColor} text-white shadow-md hover:shadow-lg transition-all duration-300 ${banner.isPromo ? 'animate-pulse' : ''}`}
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <span className="text-3xl">{banner.icon}</span>
                <div>
                  <p className="font-bold text-base sm:text-lg">{banner.title}</p>
                  <p className="text-sm opacity-90">{banner.description}</p>
                </div>
              </div>
              {banner.link_url && (
                <Link href={banner.link_url}>
                  <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 border border-white/30 whitespace-nowrap">
                    {banner.button_text} →
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
