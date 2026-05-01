import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';

export default function Listings() {
  const { t } = useTranslation();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPools();
  }, []);

  async function fetchPools() {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPools(data || []);
    } catch (error) {
      console.error('Error loading pools:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>{t('common.browse_prizes')} - Abbaa Carraa</title>
        <meta name="description" content={t('common.tagline')} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-2">{t('common.browse_prizes')}</h1>
          <p className="text-center text-gray-600 mb-8">{t('common.join_prize_pools')}</p>
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">{t('pools.no_pools')}</p>
              <Link href="/create-pool" className="text-green-600 hover:text-green-700">
                {t('common.create_first_pool')} →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map((pool) => (
                <div key={pool.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
                  {pool.image_url ? (
                    <img src={pool.image_url} alt={pool.prize_name} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-r from-green-100 to-blue-100 flex items-center justify-center">
                      <span className="text-4xl">🎁</span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-xl font-bold text-green-600 mb-2">{pool.prize_name}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{pool.description || t('pools.join_now')}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">{t('pools.target_amount')}:</span>
                        <span className="font-bold">ETB {pool.target_amount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">{t('pools.entry_fee')}:</span>
                        <span className="font-bold text-green-600">ETB {pool.contribution_amount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">{t('filters.city')}:</span>
                        <span className="font-semibold">{pool.city || t('common.all_cities')}</span>
                      </div>
                    </div>
                    <Link href={`/pools/${pool.id}`}>
                      <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition">
                        {t('pools.join_now')}
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
