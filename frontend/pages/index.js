// Trigger redeploy - May 7 2026
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
  const [mounted, setMounted] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ category: 'all', city: 'all' });
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_agents: 0,
    total_raised: 0
  });
  const [error, setError] = useState(null);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
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
  }, [mounted]);

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

  // Don't render during SSR to prevent hydration errors
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

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
        <title>Abbaa Carraa - Win Amazing Prizes</title>
        <meta name="description" content="Win amazing prizes through community savings. 2% supports kidney & heart disease patients." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=yes" />
      </Head>

      <div className="min-h-screen flex flex-col w-full overflow-x-hidden">
        <main suppressHydrationWarning className="flex-1 w-full">
          {/* Top Banners */}
          <CashEquivalentBanner />
          <CharityBanner />

          {/* ============ PROFESSIONAL HERO SECTION ============ */}
          <section className="w-full">
            {/* Background Image - Fixed for all devices */}
            <div className="w-full bg-gradient-to-b from-green-800 to-teal-800">
              <img 
                src="/images/abbaa-carraa-bg.png"
                alt="Abbaa Carraa - Win Amazing Prizes"
                className="w-full h-auto max-h-[300px] sm:max-h-[400px] md:max-h-[500px] object-contain mx-auto"
                loading="eager"
                fetchPriority="high"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            
            {/* Content Section - Below the image */}
            <div className="bg-white py-10 sm:py-12 md:py-16">
              <div className="container mx-auto px-4 text-center">
                {/* Ethiopia's #1 Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold mb-4 sm:mb-6 shadow-md">
                  <span className="text-sm sm:text-base">🔥</span>
                  <span>Ethiopia's #1 Prize Platform</span>
                </div>
                
                {/* Main Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3">
                  <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    Abbaa Carraa
                  </span>
                  <span className="block text-sm sm:text-base md:text-lg text-gray-500 font-normal mt-1 sm:mt-2">
                    Your Ethiopian Digital Eta
                  </span>
                </h1>
                
                {/* Tagline */}
                <p className="text-xs sm:text-sm md:text-base text-gray-600 max-w-2xl mx-auto mb-4 sm:mb-6 px-4">
                  Win cars, houses, machinery, electronics, and more!
                  <span className="block text-green-600 font-semibold mt-1">💚 2% of every contribution supports kidney & heart disease patients</span>
                </p>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-10">
                  <Link 
                    href="/register" 
                    className="group bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-5 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 inline-flex items-center justify-center gap-2"
                  >
                    <span className="text-sm sm:text-base">🎁</span>
                    Start Winning Now
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </Link>
                  <Link 
                    href="/register" 
                    className="group bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1 inline-flex items-center justify-center gap-2 border border-gray-200"
                  >
                    <span className="text-sm sm:text-base">👑</span>
                    Become an Agent
                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                  </Link>
                </div>
                
                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 pt-4 sm:pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-gray-500">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-[10px] sm:text-xs">✓</span>
                    </div>
                    <span>Cash Guarantee</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-gray-500">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-[10px] sm:text-xs">✓</span>
                    </div>
                    <span>Blockchain Verified</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs md:text-sm text-gray-500">
                    <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-500 text-[10px] sm:text-xs">💚</span>
                    </div>
                    <span>2% for Health</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Counters */}
          <div className="bg-white border-t border-gray-200 py-4 shadow-sm">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
                <div className="text-center min-w-[70px]">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.total_pools}+</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{t('stats.active_pools') || 'Active Pools'}</div>
                </div>
                <div className="text-center min-w-[70px]">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.total_winners}+</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{t('stats.winners') || 'Winners'}</div>
                </div>
                <div className="text-center min-w-[70px]">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{stats.total_agents}+</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{t('stats.agents') || 'Agents'}</div>
                </div>
                <div className="text-center min-w-[70px]">
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">ETB {Math.floor(stats.total_raised / 1000)}K+</div>
                  <div className="text-[10px] sm:text-xs text-gray-500">{t('stats.raised') || 'Raised'}</div>
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
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8">
                ⭐ {t('pools.featured_pools') || 'Featured Prize Pools'}
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
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8">
              {activeFilters.category !== 'all' || activeFilters.city !== 'all' 
                ? (t('filters.title') || 'Filtered Pools')
                : (t('pools.active_pools') || 'Active Prize Pools')}
            </h2>
            {filteredPools.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">{t('pools.no_pools') || 'No pools found'}</p>
                <button 
                  onClick={() => applyFilters({ category: 'all', city: 'all' })} 
                  className="text-green-600 hover:text-green-700"
                >
                  {t('common.clear_filters') || 'Clear Filters'} →
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
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-8">{t('how_it_works.title') || 'How It Works'}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">1</span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg mb-2">{t('how_it_works.find_pool') || 'Find a Pool'}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{t('how_it_works.find_pool_desc') || 'Browse available prize pools'}</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg mb-2">{t('how_it_works.contribute') || 'Contribute'}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{t('how_it_works.contribute_desc') || 'Make your contribution securely'}</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">3</span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg mb-2">{t('how_it_works.win') || 'Win'}</h3>
                  <p className="text-xs sm:text-sm text-gray-600">{t('how_it_works.win_desc') || 'Win amazing prizes!'}</p>
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
