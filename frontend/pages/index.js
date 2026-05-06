import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import PoolCard from '../components/PoolCard';
import NewsletterSubscribe from '../components/NewsletterSubscribe';
import MovingAd from '../components/MovingAd';
import AdvertisingBanner from '../components/AdvertisingBanner';
import SimpleFilters from '../components/SimpleFilters';
import RoleBanners from '../components/RoleBanners';
import CashEquivalentBanner from '../components/CashEquivalentBanner';
import CharityBanner from '../components/CharityBanner';
import Testimonials from '../components/Testimonials';

export default function Home() {
  const { t, i18n } = useTranslation();
  const [pools, setPools] = useState([]);
  const [filteredPools, setFilteredPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({ category: 'all', city: 'all' });
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_agents: 0,
    total_raised: 0
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const loadData = async () => {
      try {
        setError(null);
        await Promise.all([fetchStats(), fetchPools()]);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Loading error:', err);
          setError('Failed to load data. Please refresh the page.');
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    loadData();

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (pools.length > 0) {
      applyFilters(activeFilters);
    } else {
      setFilteredPools(pools);
    }
  }, [pools, activeFilters]);

  async function fetchStats() {
    try {
      const results = await Promise.allSettled([
        supabase.from('pools').select('*', { count: 'exact', head: true }),
        supabase.from('pools').select('*', { count: 'exact', head: true }).not('winner_id', 'is', null),
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('contributions').select('amount').eq('status', 'completed')
      ]);
      
      const total_pools = results[0]?.value?.count || 0;
      const total_winners = results[1]?.value?.count || 0;
      const total_agents = results[2]?.value?.count || 0;
      const contributions = results[3]?.value?.data || [];
      const total_raised = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
      
      setStats({ total_pools, total_winners, total_agents, total_raised });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function fetchPools() {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPools(data || []);
      setFeaturedPools(data?.filter(pool => pool.is_featured === true) || []);
    } catch (error) {
      console.error('Error loading pools:', error);
      setError('Could not load prize pools. Please try again.');
    }
  }

  const applyFilters = (filters) => {
    setActiveFilters(filters);
    let filtered = [...pools];
    
    if (filters.category !== 'all') {
      const categoryKeywords = {
        vehicle: ['car', 'truck', 'v8', 'sino', 'toyota', 'motorcycle', 'bike', 'vitara'],
        machinery: ['excavator', 'loader', 'block machine', 'tractor', 'machine', 'cnc'],
        electronics: ['laptop', 'phone', 'computer', 'tv', 'dell', 'iphone', 'samsung'],
        property: ['house', 'home', 'villa', 'apartment', 'land'],
        furniture: ['furniture', 'sofa', 'bed', 'table', 'chair', 'cabinet']
      };
      const keywords = categoryKeywords[filters.category] || [];
      filtered = filtered.filter(pool => 
        keywords.some(keyword => 
          pool.prize_name?.toLowerCase().includes(keyword) || 
          pool.description?.toLowerCase().includes(keyword)
        )
      );
    }

    if (filters.city !== 'all') {
      filtered = filtered.filter(pool => pool.city === filters.city);
    }
    
    setFilteredPools(filtered);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
        <p className="text-gray-500 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-200 rounded-lg mb-8"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Abbaa Carraa - {t('common.tagline')}</title>
        <meta name="description" content={t('common.tagline')} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=yes" />
      </Head>

      <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
        <main suppressHydrationWarning className="flex-1 w-full">
          {/* Top Banners */}
          <CashEquivalentBanner />
          <CharityBanner />

          {/* Hero Section - New Full Screen Hero */}
          <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-900 to-blue-900">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
              <img 
                src="/images/abbaa-carraa-bg.png"
                alt="Abbaa Carraa Background"
                className="w-full h-full object-cover object-center"
                loading="eager"
                fetchPriority="high"
                onError={(e) => e.target.style.display = 'none'}
              />
              <div className="absolute inset-0 bg-black/45"></div>
            </div>
            
            {/* Content */}
            <div className="relative z-10 text-center text-white px-4 py-8 max-w-4xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 drop-shadow-lg">
                <span className="text-yellow-400">{t('common.welcome')}</span>
              </h1>
              <p className="text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-6 sm:mb-8 opacity-95 px-2">
                {t('common.tagline')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Link 
                  href="/register" 
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition shadow-lg w-full sm:w-auto text-center"
                >
                  {t('common.get_started')}
                </Link>
                <Link 
                  href="/listings" 
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-2.5 sm:px-8 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition border border-white/30 w-full sm:w-auto text-center"
                >
                  {t('common.browse_prizes')}
                </Link>
              </div>
            </div>
          </section>

          {/* Stats Counters */}
          <div className="bg-white border-b border-gray-200 py-4">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
                <div className="text-center min-w-[80px]">
                  <div className="text-xl md:text-2xl font-bold text-green-600">{stats.total_pools}+</div>
                  <div className="text-xs text-gray-500">{t('stats.active_pools')}</div>
                </div>
                <div className="text-center min-w-[80px]">
                  <div className="text-xl md:text-2xl font-bold text-green-600">{stats.total_winners}+</div>
                  <div className="text-xs text-gray-500">{t('stats.winners')}</div>
                </div>
                <div className="text-center min-w-[80px]">
                  <div className="text-xl md:text-2xl font-bold text-green-600">{stats.total_agents}+</div>
                  <div className="text-xs text-gray-500">{t('stats.agents')}</div>
                </div>
                <div className="text-center min-w-[80px]">
                  <div className="text-xl md:text-2xl font-bold text-green-600">ETB {Math.floor(stats.total_raised / 1000)}K+</div>
                  <div className="text-xs text-gray-500">{t('stats.raised')}</div>
                </div>
              </div>
            </div>
          </div>

          <MovingAd />
          <AdvertisingBanner />
          <SimpleFilters onFilterChange={applyFilters} />

          {(activeFilters.category !== 'all' || activeFilters.city !== 'all') && (
            <div className="container mx-auto px-4 py-2">
              <p className="text-sm text-gray-500">
                {t('common.showing')} {filteredPools.length} {t('common.of')} {pools.length} {t('common.active_pools')}
                {activeFilters.category !== 'all' && <span className="ml-1">• {t('filters.category')}: {activeFilters.category}</span>}
                {activeFilters.city !== 'all' && <span className="ml-1">• {t('filters.city')}: {activeFilters.city}</span>}
              </p>
            </div>
          )}

          {/* Featured Pools */}
          {featuredPools.length > 0 && (
            <section className="container mx-auto px-4 py-8">
              <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
                ⭐ {t('pools.featured_pools')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPools.map(pool => (
                  <PoolCard key={pool.id} pool={pool} featured={true} />
                ))}
              </div>
            </section>
          )}

          {/* All Active Pools */}
          <section id="pools-grid" className="container mx-auto px-4 py-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
              {activeFilters.category !== 'all' || activeFilters.city !== 'all' 
                ? t('filters.title') 
                : t('pools.active_pools')}
            </h2>
            {filteredPools.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">{t('pools.no_pools')}</p>
                <button 
                  onClick={() => applyFilters({ category: 'all', city: 'all' })} 
                  className="text-green-600 hover:text-green-700"
                >
                  {t('common.clear_filters')} →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPools.map(pool => (
                  <PoolCard key={pool.id} pool={pool} />
                ))}
              </div>
            )}
          </section>

          <section className="container mx-auto px-4 py-8">
            <RoleBanners />
          </section>

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

          <Testimonials />
          <NewsletterSubscribe />
        </main>
      </div>
    </>
  );
}
