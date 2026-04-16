import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import PoolCard from '../components/PoolCard';

export default function Home() {
  const { t } = useTranslation();
  const [pools, setPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPools();
  }, []);

  async function fetchPools() {
    try {
      // Fetch all active pools including date columns
      const { data, error } = await supabase
        .from('pools')
        .select('*, start_date, end_date, days_remaining')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPools(data || []);
      setFeaturedPools(data?.filter(pool => pool.is_featured) || []);
    } catch (error) {
      console.error('Error loading pools:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Abbaa Carraa - Community Prize Platform</title>
        <meta name="description" content="Join community prize pools and win amazing prizes" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10B981" />
      </Head>

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">{t('common.welcome')}</h1>
            <p className="text-xl md:text-2xl mb-8">{t('common.tagline')}</p>
            <Link href="/register" className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all">
              Get Started
            </Link>
          </div>
        </section>

        {/* Featured Pools */}
        {featuredPools.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Pools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPools.map(pool => (
                <PoolCard key={pool.id} pool={pool} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Active Pools */}
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-8 text-center">{t('pools.activePools')}</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No active pools at the moment. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map(pool => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
