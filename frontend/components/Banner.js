import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Banner() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveBanners();
  }, []);

  async function fetchActiveBanners() {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (!error && data && data.length > 0) {
        setBanners(data);
      } else {
        console.log('No active banners found');
      }
    } catch (error) {
      console.error('Error fetching banners:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return null;
  if (banners.length === 0) return null;

  return (
    <div className="space-y-2 py-2">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className={`${banner.bg_color || 'bg-gradient-to-r from-green-600 to-blue-600'} text-white py-3 px-4 shadow-md`}
        >
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex-1 text-center sm:text-left">
              <p className="font-bold text-lg">{banner.title}</p>
              <p className="text-sm opacity-90">{banner.description}</p>
              {banner.discount && (
                <p className="text-xs font-semibold mt-1 bg-yellow-500 inline-block px-2 py-0.5 rounded-full">
                  🎁 {banner.discount}
                </p>
              )}
            </div>
            {banner.link_url && (
              <Link href={banner.link_url}>
                <button className="bg-white text-gray-800 px-5 py-1.5 rounded-full text-sm font-semibold hover:bg-gray-100 transition shadow-md">
                  {banner.button_text || 'Learn More'} →
                </button>
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
