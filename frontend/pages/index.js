import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import PoolCard from '../components/PoolCard';
import NewsletterSubscribe from '../components/NewsletterSubscribe';
import PoolRecommendations from '../components/PoolRecommendations';

export default function Home() {
  const { t } = useTranslation();
  const [pools, setPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('all');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_agents: 0,
    total_raised: 0
  });

  useEffect(() => {
    fetchCities();
    fetchStats();
    fetchPools();
  }, []);

  useEffect(() => {
    fetchPools();
  }, [selectedCity]);

  async function fetchCities() {
    const { data } = await supabase
      .from('pools')
      .select('city')
      .eq('status', 'active');
    
    const uniqueCities = [...new Set(data?.map(p => p.city).filter(Boolean) || [])];
    setCities(uniqueCities);
  }

  async function fetchStats() {
    const [
      { count: total_pools },
      { count: total_winners },
      { count: total_agents },
      { data: contributions }
    ] = await Promise.all([
      supabase.from('pools').select('*', { count: 'exact', head: true }),
      supabase.from('pools').select('*', { count: 'exact', head: true }).not('winner_id', 'is', null),
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('contributions').select('amount').eq('status', 'completed')
    ]);
    
    const total_raised = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    setStats({ total_pools, total_winners, total_agents, total_raised });
  }

  async function fetchPools() {
    try {
      let query = supabase
        .from('pools')
        .select('*, agents!left(business_name, city)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (selectedCity !== 'all') {
        query = query.eq('city', selectedCity);
      }

      const { data, error } = await query;

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
        <title>Abbaa Carraa - {t('common.tagline')}</title>
        <meta name="description" content={t('common.tagline')} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16 md:py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4">
  {t('common.welcome')}
</h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-6 max-w-2xl mx-auto">
              {t('common.tagline')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-white text-green-600 px-6 md:px-8 py-2 md:py-3 rounded-full font-semibold hover:shadow-lg transition-all">
                {t('common.get_started')}
              </Link>
              <Link href="/listings" className="border-2 border-white text-white px-6 md:px-8 py-2 md:py-3 rounded-full font-semibold hover:bg-white hover:text-green-600 transition-all">
                {t('common.browse_prizes')}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-white border-b shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.total_pools}+</div>
                <div className="text-xs text-gray-500">{t('pools.active_pools')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.total_winners}+</div>
                <div className="text-xs text-gray-500">{t('common.winners')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.total_agents}+</div>
                <div className="text-xs text-gray-500">{t('common.trusted_agents')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">ETB {Math.floor(stats.total_raised / 1000)}K+</div>
                <div className="text-xs text-gray-500">{t('common.total_raised')}</div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Recommendations */}
        <PoolRecommendations />

        {/* City Filter */}
        {cities.length > 0 && (
          <section className="container mx-auto px-4 py-6">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedCity('all')}
                className={`px-4 py-2 rounded-full text-sm transition ${
                  selectedCity === 'all' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t('common.all_cities', 'All Cities')}
              </button>
              {cities.map(city => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-4 py-2 rounded-full text-sm transition ${
                    selectedCity === city 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Featured Pools */}
        {featuredPools.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">{t('pools.featured_pools')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPools.map(pool => (
                <PoolCard key={pool.id} pool={pool} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Active Pools */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">{t('pools.active_pools')}</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">{t('pools.no_pools')}</p>
              <Link href="/create-pool" className="text-green-600 hover:text-green-700">
                {t('common.create_pool')} →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map(pool => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          )}
        </section>

        {/* How It Works */}
        <section className="bg-gray-100 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t('how_it_works.title', 'How Abbaa Carraa Works')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">1</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{t('how_it_works.find_pool')}</h3>
                <p className="text-gray-600 text-sm">{t('how_it_works.find_pool_desc')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{t('how_it_works.contribute')}</h3>
                <p className="text-gray-600 text-sm">{t('how_it_works.contribute_desc')}</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{t('how_it_works.win')}</h3>
                <p className="text-gray-600 text-sm">{t('how_it_works.win_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Subscription */}
        <NewsletterSubscribe />
      </main>
    </>
  );
}
