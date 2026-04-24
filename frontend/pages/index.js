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
  const [allPools, setAllPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_agents: 0,
    total_raised: 0
  });
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCreator, setSelectedCreator] = useState('all');
  const [cities, setCities] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Categories based on prize types
  const categories = [
    { value: 'all', label: 'All Categories', icon: '🎯' },
    { value: 'vehicle', label: 'Vehicles', icon: '🚗' },
    { value: 'machinery', label: 'Machinery', icon: '🏭' },
    { value: 'electronics', label: 'Electronics', icon: '💻' },
    { value: 'property', label: 'Property', icon: '🏠' },
    { value: 'furniture', label: 'Furniture', icon: '🛋️' },
    { value: 'other', label: 'Other', icon: '🎁' }
  ];

  // Creator types
  const creators = [
    { value: 'all', label: 'All Creators', icon: '👥' },
    { value: 'admin', label: 'Admin', icon: '👑' },
    { value: 'agent', label: 'Agents', icon: '🤝' },
    { value: 'vendor', label: 'Vendors', icon: '🏭' },
    { value: 'organization', label: 'Organizations', icon: '🏢' },
    { value: 'individual', label: 'Individuals', icon: '👤' }
  ];

  useEffect(() => {
    fetchStats();
    fetchPools();
    fetchCities();
  }, []);

  useEffect(() => {
    filterPools();
  }, [selectedCategory, selectedCity, selectedCreator, allPools]);

  async function fetchCities() {
    const { data } = await supabase
      .from('pools')
      .select('city')
      .eq('status', 'active');
    
    const uniqueCities = [...new Set(data?.map(p => p.city).filter(Boolean) || [])];
    setCities(uniqueCities);
  }

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
        .select('*, profiles!created_by(full_name, user_type, role)')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAllPools(data || []);
      setFeaturedPools(data?.filter(pool => pool.is_featured === true) || []);
    } catch (error) {
      console.error('Error loading pools:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterPools() {
    let filtered = [...allPools];

    // Filter by category (based on prize_name keywords)
    if (selectedCategory !== 'all') {
      const categoryKeywords = {
        vehicle: ['car', 'truck', 'v8', 'sino', 'toyota', 'motorcycle', 'bike'],
        machinery: ['excavator', 'loader', 'block machine', 'tractor', 'machine'],
        electronics: ['laptop', 'phone', 'computer', 'tv', 'dell', 'iphone'],
        property: ['house', 'home', 'villa', 'apartment', 'land'],
        furniture: ['furniture', 'sofa', 'bed', 'table', 'chair']
      };
      
      const keywords = categoryKeywords[selectedCategory] || [];
      filtered = filtered.filter(pool => 
        keywords.some(keyword => 
          pool.prize_name?.toLowerCase().includes(keyword) || 
          pool.description?.toLowerCase().includes(keyword)
        )
      );
    }

    // Filter by city
    if (selectedCity !== 'all') {
      filtered = filtered.filter(pool => pool.city === selectedCity);
    }

    // Filter by creator type
    if (selectedCreator !== 'all') {
      filtered = filtered.filter(pool => {
        const creatorType = pool.profiles?.user_type || pool.profiles?.role;
        if (selectedCreator === 'admin') return creatorType === 'admin';
        if (selectedCreator === 'agent') return creatorType === 'agent';
        if (selectedCreator === 'vendor') return creatorType === 'vendor';
        if (selectedCreator === 'organization') return creatorType === 'organization';
        if (selectedCreator === 'individual') return creatorType === 'individual' || creatorType === 'user';
        return true;
      });
    }

    setPools(filtered);
  }

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedCity('all');
    setSelectedCreator('all');
  };

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

        {/* Filter Bar */}
        <div className="container mx-auto px-4 py-4">
          {/* Mobile Filter Toggle */}
          <div className="md:hidden mb-4">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full bg-gray-100 text-gray-800 py-2 rounded-lg flex items-center justify-center gap-2"
            >
              <span>🔍</span> Filter Pools
              <svg className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Filter Options */}
          <div className={`${isFilterOpen ? 'block' : 'hidden md:block'} space-y-4 md:space-y-0 md:flex md:flex-wrap md:gap-4 md:items-center md:justify-between`}>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-semibold text-gray-700 self-center mr-2 hidden md:block">Category:</span>
              {categories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition flex items-center gap-1 ${
                    selectedCategory === cat.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            {/* City Filter */}
            {cities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCity('all')}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition ${
                    selectedCity === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🌍 All Cities
                </button>
                {cities.map(city => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition ${
                      selectedCity === city
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    📍 {city}
                  </button>
                ))}
              </div>
            )}

            {/* Creator Type Filter */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-semibold text-gray-700 self-center mr-2 hidden md:block">Creator:</span>
              {creators.map(creator => (
                <button
                  key={creator.value}
                  onClick={() => setSelectedCreator(creator.value)}
                  className={`px-3 py-1.5 rounded-full text-xs sm:text-sm transition flex items-center gap-1 ${
                    selectedCreator === creator.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span>{creator.icon}</span>
                  <span>{creator.label}</span>
                </button>
              ))}
            </div>

            {/* Reset Filters */}
            {(selectedCategory !== 'all' || selectedCity !== 'all' || selectedCreator !== 'all') && (
              <button
                onClick={resetFilters}
                className="text-red-600 text-sm hover:text-red-700 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Filter Results Count */}
        <div className="container mx-auto px-4 pb-2">
          <p className="text-sm text-gray-500">
            Showing {pools.length} of {allPools.length} active pools
          </p>
        </div>

        {/* Featured Pools */}
        {featuredPools.length > 0 && selectedCategory === 'all' && selectedCity === 'all' && selectedCreator === 'all' && (
          <section className="container mx-auto px-4 py-8">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">⭐ Featured Pools</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredPools.map(pool => (
                <PoolCard key={pool.id} pool={pool} featured={true} />
              ))}
            </div>
          </section>
        )}

        {/* All Active Pools (Filtered) */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {selectedCategory !== 'all' || selectedCity !== 'all' || selectedCreator !== 'all' 
              ? 'Filtered Results' 
              : 'Active Pools'}
          </h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-4">No pools match your filters.</p>
              <button onClick={resetFilters} className="text-green-600 hover:text-green-700">
                Clear filters →
              </button>
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
