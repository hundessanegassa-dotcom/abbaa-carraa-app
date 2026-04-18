import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Banner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    fetchActiveBanner();
  }, []);

  async function fetchActiveBanner() {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!error && data) {
      setBanner(data);
    }
  }

  if (!banner) return null;

  return (
    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex-1">
          <p className="font-semibold">{banner.title}</p>
          <p className="text-sm opacity-90">{banner.description}</p>
        </div>
        {banner.link_url && (
          <Link href={banner.link_url}>
            <button className="bg-white text-orange-600 px-4 py-1 rounded-full text-sm font-semibold hover:bg-gray-100">
              {banner.button_text || 'Learn More'}
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
