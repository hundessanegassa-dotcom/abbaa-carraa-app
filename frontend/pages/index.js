import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import PoolCard from '../components/PoolCard';
import NewsletterSubscribe from '../components/NewsletterSubscribe';
import Banner from '../components/Banner';
import MovingAd from '../components/MovingAd';
import AdvertisingBanner from '../components/AdvertisingBanner';

export default function Home() {
  const { t } = useTranslation();
  const [pools, setPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_agents: 0,
    total_raised: 0
  });

  useEffect(() => {
    fetchStats();
    fetchPools();
  }, []);

  async function fetchStats() {
    try {
      const [poolsResult, winnersResult, agentsResult, contributionsResult] = await Promise.all([
        supabase.from('pools').select('*', { count: 'exact', head: true }),
        supabase.from('pools').select('*', { count: 'exact', head: true }).not('winner_id', 'is', null),
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('contributions').select('amount').eq('status', 'completed')
      ]);
      
      const total_pools = poolsResult.count || 0;
      const total_winners = winnersResult.count || 0;
      const total_agents = agentsResult.count || 0;
      const total_raised = contributionsResult.data?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
      
      setStats({ total_pools, total_winners, total_agents, total_raised });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function fetchPools() {
    try {
      // Simplified query - no complex joins that cause errors
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setPools(data || []);
      setFeaturedPools(data?.filter(pool => pool.is_featured === true) || []);
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
        <meta name="description" content={t('common.tagline')} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-green-900/90 to-blue-900/90 text-white overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="/images/abbaa carraa.png"
              alt="Abbaa Carraa"
              className="w-full h-full object-contain md:object-cover bg-green-900"
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
          
          <div className="relative z-10 container mx-auto px-4 flex flex-col justify-end min-h-[450px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px]">
            <div className="pb-8 sm:pb-12 md:pb-16 text-center">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-2 drop-shadow-lg">
                Welcome to <span className="text-yellow-300">Abbaa Carraa</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg mb-4 sm:mb-6 max-w-2xl mx-auto drop-shadow-md opacity-95 px-2">
                {t('common.tagline')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link href="/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all shadow-lg">
                  {t('common.get_started')}
                </Link>
                <Link href="/listings" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-2 sm:px-5 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all border border-white/30">
                  {t('common.browse_prizes')}
                </Link>
              </div>
            </div>
          </div>
        </section>
{/* Cash Prize Policy Banner - Animated */}
<div className="relative overflow-hidden bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-500">
  {/* Light shimmer from top */}
  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
  
  {/* Diagonal light sweep */}
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"></div>
  
  {/* Second light sweep */}
  <div className="absolute inset-0 -translate-x-full animate-[shimmer_4s_infinite] bg-gradient-to-r from-transparent via-yellow-200/20 to-transparent skew-x-12 delay-1000"></div>
  
  <div className="container mx-auto px-4 py-3">
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
      {/* Glowing icon */}
      <div className="flex items-center gap-2">
        <span className="text-2xl animate-pulse drop-shadow-lg">💰</span>
        <span className="font-black text-sm sm:text-base text-white drop-shadow-md tracking-wide">
          ⚡ CASH EQUIVALENT POLICY ⚡
        </span>
      </div>
      
      <p className="text-white/95 text-sm sm:text-base font-medium">
        Winners receive <span className="font-bold underline decoration-yellow-300 underline-offset-4">CASH at original listed price</span> — locked & guaranteed!
      </p>
      
      <Link href="/terms">
        <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg border border-white/30">
          Details →
        </button>
      </Link>
    </div>
  </div>
  
  {/* Bottom light ray */}
  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-yellow-300 to-transparent animate-pulse"></div>
</div>

<style jsx>{`
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`}</style>
        {/* Counters Section */}
        <div className="bg-white border-b border-gray-200 py-3">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-4 md:gap-12">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-green-600">{stats.total_pools}+</div>
                <div className="text-xs text-gray-500">{t('stats.active_pools')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-green-600">{stats.total_winners}+</div>
                <div className="text-xs text-gray-500">{t('stats.winners')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-green-600">{stats.total_agents}+</div>
                <div className="text-xs text-gray-500">{t('stats.agents')}</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-green-600">ETB {Math.floor(stats.total_raised / 1000)}K+</div>
                <div className="text-xs text-gray-500">{t('stats.raised')}</div>
              </div>
            </div>
          </div>
        </div>

        <MovingAd />
        <AdvertisingBanner />

        {/* Featured Pools */}
        {featuredPools.length > 0 && (
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">⭐ Featured Pools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPools.map(pool => (
                <PoolCard key={pool.id} pool={pool} featured={true} />
              ))}
            </div>
          </section>
        )}

        {/* All Active Pools */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t('pools.active_pools')}</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
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

        <Banner />

        <section className="bg-gray-100 py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t('how_it_works.title')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">1</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{t('how_it_works.find_pool')}</h3>
                <p className="text-gray-600">{t('how_it_works.find_pool_desc')}</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">2</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{t('how_it_works.contribute')}</h3>
                <p className="text-gray-600">{t('how_it_works.contribute_desc')}</p>
              </div>
              <div>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-green-600">3</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{t('how_it_works.win')}</h3>
                <p className="text-gray-600">{t('how_it_works.win_desc')}</p>
              </div>
            </div>
          </div>
        </section>

        <NewsletterSubscribe />
      </main>
    </>
  );
}
