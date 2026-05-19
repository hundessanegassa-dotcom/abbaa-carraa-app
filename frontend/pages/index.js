// All components kept - with error handling
import dynamic from 'next/dynamic';

// Wrap each component with error boundary to prevent total crash
const withErrorBoundary = (importFn, fallback = null) => {
  return dynamic(() => importFn().catch(err => {
    console.error('Component failed to load:', err);
    return { default: () => fallback };
  }), { ssr: false });
};

const NewsletterSubscribe = withErrorBoundary(() => import('../components/NewsletterSubscribe'));
const MovingAd = withErrorBoundary(() => import('../components/MovingAd'));
const AdvertisingBanner = withErrorBoundary(() => import('../components/AdvertisingBanner'));
const SimpleFilters = withErrorBoundary(() => import('../components/SimpleFilters'));
const RoleBanners = withErrorBoundary(() => import('../components/RoleBanners'));
const CashEquivalentBanner = withErrorBoundary(() => import('../components/CashEquivalentBanner'));
const CharityBanner = withErrorBoundary(() => import('../components/CharityBanner'));
const Testimonials = withErrorBoundary(() => import('../components/Testimonials'));
export default function Home() {
  const { t, i18n } = useTranslation();
  const [pools, setPools] = useState([]);
  const [filteredPools, setFilteredPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({ category: 'all', city: 'all' });
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_agents: 0,
    total_raised: 0
  });
  const [error, setError] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Load data immediately on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        setLoading(true);
        
        // Add timeout protection
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Loading timeout after 8 seconds')), 8000)
        );
        
        await Promise.race([
          Promise.all([fetchStats(), fetchPools()]),
          timeoutPromise
        ]);
        
      } catch (err) {
        console.error('Loading error:', err);
        setError('Unable to load data. Please check your internet connection and refresh.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (pools.length > 0) {
      applyFilters(activeFilters);
    } else {
      setFilteredPools(pools);
    }
  }, [pools, activeFilters]);

  // Fetch stats with caching
  async function fetchStats() {
    try {
      const cacheKey = 'homepage_stats';
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 60000) {
          setStats(data);
          return;
        }
      }
      
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
      
      const statsData = { total_pools, total_winners, total_agents, total_raised };
      setStats(statsData);
      
      sessionStorage.setItem(cacheKey, JSON.stringify({ data: statsData, timestamp: Date.now() }));
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  // Fetch pools with pagination
  async function fetchPools(reset = true) {
    if (reset) {
      setPage(0);
      setPools([]);
      setHasMore(true);
    }
    
    const currentPage = reset ? 0 : page;
    
    try {
      const { data, error, count, hasMore: more } = await getPoolsPaginated(currentPage, 12, activeFilters);
      
      if (error) throw error;
      
      if (reset) {
        setPools(data || []);
        setFeaturedPools(data?.filter(pool => pool.is_featured === true) || []);
      } else {
        setPools(prev => [...prev, ...(data || [])]);
      }
      
      setHasMore(more);
      return data;
    } catch (error) {
      console.error('Error loading pools:', error);
      setError('Could not load prize pools. Please try again.');
      return [];
    }
  }

  // Load more pools for infinite scroll
  const loadMorePools = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    
    try {
      const { data, error, hasMore: more } = await getPoolsPaginated(nextPage, 12, activeFilters);
      if (error) throw error;
      setPools(prev => [...prev, ...(data || [])]);
      setHasMore(more);
    } catch (error) {
      console.error('Error loading more pools:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const applyFilters = async (filters) => {
    setActiveFilters(filters);
    setPage(0);
    setPools([]);
    setLoading(true);
    
    try {
      const { data, error, hasMore: more } = await getPoolsPaginated(0, 12, filters);
      if (error) throw error;
      setPools(data || []);
      setHasMore(more);
      setFilteredPools(data || []);
    } catch (error) {
      console.error('Error applying filters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Connection Issue</h2>
        <p className="text-gray-500 mb-4 text-center max-w-md">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner fullPage message="Loading amazing prizes..." />;
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

          {/* ============================================================ */}
          {/* HERO SECTION - IMAGE AND TEXT IN SEPARATE DIVS - OPTIMIZED */}
          {/* ============================================================ */}
          
          {/* DIV 1: IMAGE ONLY - Optimized loading, no preload */}
          <section className="w-full">
            <div className="w-full bg-gradient-to-br from-green-700 to-teal-700">
              <div className="max-w-7xl mx-auto">
                {!imageLoaded && (
                  <div className="w-full h-64 md:h-96 bg-gradient-to-r from-green-600 to-teal-600 animate-pulse flex items-center justify-center">
                    <span className="text-white text-4xl">🎁</span>
                  </div>
                )}
                <img 
                  src="/images/abbaa-carraa-bg.png"
                  alt="Abbaa Carraa - Win Amazing Prizes"
                  className={`w-full h-auto object-cover block transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0 h-0'}`}
                  loading="eager"
                  fetchPriority="high"
                  style={{ maxHeight: '500px', objectPosition: 'center' }}
                  onLoad={() => setImageLoaded(true)}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent) {
                      const skeleton = parent.querySelector('.animate-pulse');
                      if (skeleton) skeleton.style.display = 'flex';
                    }
                  }}
                />
              </div>
            </div>
          </section>

          {/* DIV 2: TEXT CONTENT ONLY - Completely separate below image */}
          <section className="w-full bg-gradient-to-b from-white to-gray-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
              <div className="text-center max-w-4xl mx-auto">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold mb-5 shadow-sm">
                  <span className="text-base">🔥</span> 
                  Ethiopia's #1 Prize Platform
                  <span className="text-base">🏆</span>
                </div>
                
                {/* Main Heading */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                  Welcome to{' '}
                  <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    Abbaa Carraa
                  </span>
                </h1>
                
                {/* Subtitle */}
                <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mt-4">
                  Win cars, houses, machinery, electronics, and more through community savings!
                </p>
                
                {/* Charity Message */}
                <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
                  <span className="text-green-600 text-lg">💚</span>
                  <span className="text-green-700 font-medium text-sm sm:text-base">
                    2% of every contribution supports kidney & heart disease patients
                  </span>
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                  <Link 
                    href="/register" 
                    className="group bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <span>🎁</span>
                    Start Winning Now
                    <span>→</span>
                  </Link>
                  <Link 
                    href="/become-agent" 
                    className="group bg-white hover:bg-gray-50 text-gray-700 px-8 py-3.5 rounded-full font-semibold text-lg transition-all duration-300 shadow-md border-2 border-gray-200 hover:border-green-500 flex items-center justify-center gap-2"
                  >
                    <span>👑</span>
                    Become an Agent
                    <span className="text-green-600 group-hover:translate-x-1 transition">→</span>
                  </Link>
                </div>
                
                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-10 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                    <span className="text-green-600 text-lg">✓</span> 
                    Cash Guarantee
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                    <span className="text-green-600 text-lg">✓</span> 
                    Blockchain Verified
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                    <span className="text-green-600 text-lg">💚</span> 
                    2% for Health
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                    <span className="text-green-600 text-lg">✓</span> 
                    24/7 Support
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Stats Counters */}
          <div className="bg-white border-t border-gray-200 py-6">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.total_pools || 0}+</div>
                  <div className="text-xs text-gray-500">Active Pools</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.total_winners || 0}+</div>
                  <div className="text-xs text-gray-500">Winners</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.total_agents || 0}+</div>
                  <div className="text-xs text-gray-500">Agents</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">ETB {Math.floor((stats.total_raised || 0) / 1000)}K+</div>
                  <div className="text-xs text-gray-500">Raised</div>
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
                Showing {filteredPools.length} of {pools.length} active pools
                {activeFilters.category !== 'all' && <span className="ml-1">• Category: {activeFilters.category}</span>}
                {activeFilters.city !== 'all' && <span className="ml-1">• City: {activeFilters.city}</span>}
              </p>
            </div>
          )}

          {/* Featured Pools */}
          {featuredPools.length > 0 && (
            <section className="container mx-auto px-4 py-8">
              <h2 className="text-2xl font-bold text-center mb-8">⭐ Featured Prize Pools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPools.slice(0, 3).map(pool => (
                  <PoolCard key={pool.id} pool={pool} featured={true} />
                ))}
              </div>
            </section>
          )}

          {/* All Active Pools with Infinite Scroll */}
          <section id="pools-grid" className="container mx-auto px-4 py-8">
            <h2 className="text-2xl font-bold text-center mb-8">
              {activeFilters.category !== 'all' || activeFilters.city !== 'all' ? 'Filtered Pools' : 'Active Prize Pools'}
            </h2>
            
            {filteredPools.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500 mb-4">No pools found</p>
                <button 
                  onClick={() => applyFilters({ category: 'all', city: 'all' })} 
                  className="text-green-600 hover:text-green-700"
                >
                  Clear Filters →
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPools.map(pool => (
                    <PoolCard key={pool.id} pool={pool} />
                  ))}
                </div>
                
                {/* Load More Button */}
                {hasMore && (
                  <div className="text-center mt-8">
                    <button
                      onClick={loadMorePools}
                      disabled={loadingMore}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-full font-semibold transition disabled:opacity-50"
                    >
                      {loadingMore ? 'Loading...' : 'Load More Pools ↓'}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          <RoleBanners />
          
          <section className="bg-gray-100 py-12">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">1</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">Find a Pool</h3>
                  <p className="text-gray-600">Browse available prize pools</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">Contribute</h3>
                  <p className="text-gray-600">Make your contribution securely</p>
                </div>
                <div>
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">3</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">Win</h3>
                  <p className="text-gray-600">Win amazing prizes!</p>
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
