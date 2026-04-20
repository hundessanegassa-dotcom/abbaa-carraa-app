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

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-2 px-4 text-center text-sm">
      {banners.map((banner) => (
        <div key={banner.id} className="inline-block mx-2">
          <span>{banner.title}</span>
          {banner.description && <span className="ml-1 opacity-90">- {banner.description}</span>}
          {banner.link_url && (
            <Link href={banner.link_url} className="ml-2 underline hover:no-underline">
              {banner.button_text || 'Learn More'}
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
