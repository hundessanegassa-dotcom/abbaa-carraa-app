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
import PoolFilters from '../components/PoolFilters';

export default function Home() {
  const { t } = useTranslation();
  const [pools, setPools] = useState([]);
  const [filteredPools, setFilteredPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({ category: 'all', city: 'all', creator: 'all' });
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

  useEffect(() => {
    if (pools.length > 0) {
      applyFilters(activeFilters);
    } else {
      setFilteredPools(pools);
    }
  }, [pools, activeFilters]);

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

  const applyFilters = (filters) => {
    setActiveFilters(filters);
    let filtered = [...pools];
    
    if (filters.category !== 'all') {
      const categoryKeywords = {
        vehicle: ['car', 'truck', 'v8', 'sino', 'toyota', 'motorcycle', 'bike'],
        machinery: ['excavator', 'loader', 'block machine', 'tractor', 'machine', 'cnc'],
        electronics: ['laptop', 'phone', 'computer', 'tv', 'dell', 'iphone'],
        property: ['house', 'home', 'villa', 'apartment', 'land'],
        furniture: ['furniture', 'sofa', 'bed', 'table', 'chair']
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

    if (filters.creator !== 'all') {
      filtered = filtered.filter(pool => pool.creator_type === filters.creator);
    }
    
    setFilteredPools(filtered);
  };

  return (
    <>
      <Head>
        <title>Abbaa Carraa - Community Prize Platform</title>
        <meta name="description" content={t('common.tagline')} />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main>
        {/* Hero Section - Mobile First, Full Image Visible */}
        <section className="relative bg-green-900 text-white overflow-hidden">
          <div className="relative w-full">
            <img 
              src="/images/abbaa carraa.png"
              alt="Abbaa Carraa"
              className="w-full h-auto max-h-[60vh] sm:max-h-[70vh] md:max-h-none md:h-full md:object-cover object-contain bg-green-900"
            />
            <div className="absolute inset-0 bg-black/30"></div>
            
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-8 text-center bg-gradient-to-t from-black/70 via-black/30 to-transparent">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 drop-shadow-lg">
                Welcome to <span className="text-yellow-300">Abbaa Carraa</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base mb-3 max-w-2xl mx-auto drop-shadow-md opacity-95 px-2">
                {t('common.tagline')}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Link href="/register" className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 sm:px-5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm transition-all shadow-lg">
                  {t('common.get_started')}
                </Link>
                <Link href="/listings" className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 py-1.5 sm:px-5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm transition-all border border-white/30">
                  {t('common.browse_prizes')}
                </Link>
              </div>
            </div>
          </div>
        </section>

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

        <PoolFilters onFilterChange={applyFilters} />

        <div className="container mx-auto px-4 pb-2">
          <p className="text-sm text-gray-500">
            Showing {filteredPools.length} of {pools.length} active pools
            {activeFilters.category !== 'all' && <span className="ml-1">• Category: {activeFilters.category}</span>}
            {activeFilters.city !== 'all' && <span className="ml-1">• City: {activeFilters.city}</span>}
          </p>
        </div>

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

        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {activeFilters.category !== 'all' || activeFilters.city !== 'all' || activeFilters.creator !== 'all' 
              ? 'Filtered Results' 
              : 'Active Pools'}
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : filteredPools.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No pools match your filters.</p>
              <button 
                onClick={() => applyFilters({ category: 'all', city: 'all', creator: 'all' })} 
                className="text-green-600 hover:text-green-700"
              >
                Clear filters →
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
