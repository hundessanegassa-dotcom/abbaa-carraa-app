import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import GlobalAnnouncement from '../components/GlobalAnnouncement';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

// Dynamic imports with no loading state
const MovingAd = dynamic(() => import('../components/MovingAd'), { ssr: false, loading: () => null });
const SimpleFilters = dynamic(() => import('../components/SimpleFilters'), { ssr: false, loading: () => null });
const Testimonials = dynamic(() => import('../components/Testimonials'), { ssr: false, loading: () => null });
const NewsletterSubscribe = dynamic(() => import('../components/NewsletterSubscribe'), { ssr: false, loading: () => null });
const AdvertisingBanner = dynamic(() => import('../components/AdvertisingBanner'), { ssr: false, loading: () => null });
const CashEquivalentBanner = dynamic(() => import('../components/CashEquivalentBanner'), { ssr: false, loading: () => null });
const CharityBanner = dynamic(() => import('../components/CharityBanner'), { ssr: false, loading: () => null });
const PoolCard = dynamic(() => import('../components/PoolCard'), { ssr: false, loading: () => null });

export async function getServerSideProps() {
  return { props: {} };
}

export default function Home() {
  const router = useRouter();
  const [pools, setPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_agents: 0,
    total_raised: 0
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showRoleButtons, setShowRoleButtons] = useState(false);
  
  // Counter animation trigger
  const { ref: counterRef, inView: counterInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  useEffect(() => {
    const cachedData = sessionStorage.getItem('homepage_data');
    
    if (cachedData) {
      const { pools: cachedPools, featuredPools: cachedFeatured, stats: cachedStats } = JSON.parse(cachedData);
      setPools(cachedPools);
      setFeaturedPools(cachedFeatured);
      setStats(cachedStats);
      setDataLoaded(true);
      setIsInitialLoad(false);
    } else {
      loadData();
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      
      if (scrollPosition >= pageHeight - 200) {
        setShowRoleButtons(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadData = async () => {
    try {
      const [poolsResult, winnersResult, agentsResult, contributionsResult, poolsData] = await Promise.all([
        supabase.from('pools').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('pools').select('*', { count: 'exact', head: true }).not('winner_id', 'is', null),
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('contributions').select('amount').eq('status', 'completed'),
        supabase.from('pools')
          .select('*')
          .eq('status', 'active')
          .not('image_url', 'is', null)
          .not('image_url', 'eq', '')
          .limit(12)
      ]);
      
      const total_raised = (contributionsResult.data || []).reduce((sum, c) => sum + (c.amount || 0), 0);
      
      const newStats = {
        total_pools: poolsResult.count || 0,
        total_winners: winnersResult.count || 0,
        total_agents: agentsResult.count || 0,
        total_raised: total_raised
      };
      
      const newPools = poolsData.data || [];
      const newFeaturedPools = newPools.filter(pool => pool.is_featured === true && pool.image_url);
      
      setPools(newPools);
      setFeaturedPools(newFeaturedPools);
      setStats(newStats);
      
      sessionStorage.setItem('homepage_data', JSON.stringify({
        pools: newPools,
        featuredPools: newFeaturedPools,
        stats: newStats
      }));
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setDataLoaded(true);
      setIsInitialLoad(false);
    }
  };

  const handleRoleSelection = (role) => {
    sessionStorage.removeItem('pendingRole');
    sessionStorage.removeItem('pendingPoolId');
    sessionStorage.setItem('pendingRole', role);
    router.push('/login');
  };

  const handleStartWinning = () => {
    router.push('/listings');
  };

  if (!dataLoaded && isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading amazing prizes...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Abbaa Carraa - Win Amazing Prizes</title>
        <meta name="description" content="Win amazing prizes through community savings. 2% supports kidney & heart disease patients." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white w-full">
        <GlobalAnnouncement />
        
        <CashEquivalentBanner />
        <CharityBanner />

        {/* Hero Section */}
        <div className="w-full bg-gradient-to-br from-green-700 to-teal-700">
          <div className="max-w-7xl mx-auto">
            {!imageLoaded && (
              <div className="w-full h-64 md:h-80 bg-gradient-to-r from-green-600 to-teal-600 animate-pulse flex items-center justify-center">
                <span className="text-white text-4xl">🎁</span>
              </div>
            )}
            <img 
              src="/images/abbaa-carraa-bg.png"
              alt="Abbaa Carraa"
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

        {/* Text Content */}
        <div className="bg-white py-12 w-full">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold mb-5 animate-pulse">
              🔥 Ethiopia's #1 Prize Platform 🏆
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 animate-fade-in">
              Welcome to{' '}
              <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                Abbaa Carraa
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mt-4">
              Win cars, houses, machinery, electronics, and more through community savings!
            </p>
            <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
              <span className="text-green-600 text-lg">💚</span>
              <span className="text-green-700 font-medium">2% supports kidney & heart disease patients</span>
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={handleStartWinning}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-full font-semibold text-base shadow-md hover:shadow-lg transition hover:scale-105 transform touch-target inline-flex items-center gap-2"
              >
                <span>🎁</span>
                Start Winning Now
                <span>→</span>
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-10 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition">✓ Cash Guarantee</div>
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition">✓ Blockchain Verified</div>
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition">💚 2% for Health</div>
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full hover:bg-gray-200 transition">✓ 24/7 Support</div>
            </div>
          </div>
        </div>

        {/* DEEPLY ATTRACTIVE COUNTER SECTION - NEW */}
        <div ref={counterRef} className="relative bg-gradient-to-r from-green-900 via-teal-900 to-emerald-900 py-20 overflow-hidden">
          {/* Animated background particles */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-8xl animate-bounce">💰</div>
            <div className="absolute bottom-10 right-10 text-8xl animate-pulse">🏆</div>
            <div className="absolute top-1/3 left-1/4 text-7xl animate-spin-slow">⭐</div>
            <div className="absolute bottom-1/3 right-1/4 text-7xl animate-ping">🎯</div>
          </div>
          
          {/* Glowing overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          
          <div className="relative container mx-auto px-4 z-10">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-6 py-2 mb-6">
                <span className="text-yellow-400 text-xl">📊</span>
                <span className="text-white font-semibold">LIVE IMPACT METRICS</span>
                <span className="text-green-400 text-sm animate-pulse">● LIVE</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                እኛ አብረን እየሰራን ያለን ተጽእኖ
              </h2>
              <p className="text-green-200 text-lg max-w-2xl mx-auto">
                በአንድነት እየፈጠርን ያለን ለውጥ | The impact we're creating together
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Raised Counter */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center border border-white/20 hover:scale-105 transition transform duration-300 group">
                <div className="text-5xl mb-3 group-hover:animate-bounce">💰</div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">
                  {counterInView ? (
                    <CountUp start={0} end={Math.floor(stats.total_raised / 1000)} duration={2.5} separator="," />
                  ) : '0'}
                  <span className="text-xl">K+</span>
                </div>
                <p className="text-white/80 text-sm mt-2">Total Raised</p>
                <p className="text-green-300 text-xs mt-1">አጠቃላይ የተሰበሰበ</p>
                <div className="w-0 group-hover:w-full h-0.5 bg-yellow-400 mx-auto mt-3 transition-all duration-300"></div>
              </div>
              
              {/* Winners Counter */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center border border-white/20 hover:scale-105 transition transform duration-300 group">
                <div className="text-5xl mb-3 group-hover:animate-bounce">🏆</div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">
                  {counterInView ? (
                    <CountUp start={0} end={stats.total_winners} duration={2.5} separator="," />
                  ) : '0'}+
                </div>
                <p className="text-white/80 text-sm mt-2">Happy Winners</p>
                <p className="text-green-300 text-xs mt-1">ደስተኛ አሸናፊዎች</p>
                <div className="w-0 group-hover:w-full h-0.5 bg-yellow-400 mx-auto mt-3 transition-all duration-300"></div>
              </div>
              
              {/* Active Pools Counter */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center border border-white/20 hover:scale-105 transition transform duration-300 group">
                <div className="text-5xl mb-3 group-hover:animate-bounce">🏊</div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">
                  {counterInView ? (
                    <CountUp start={0} end={stats.total_pools} duration={2.5} separator="," />
                  ) : '0'}+
                </div>
                <p className="text-white/80 text-sm mt-2">Active Pools</p>
                <p className="text-green-300 text-xs mt-1">ንቁ ፑሎች</p>
                <div className="w-0 group-hover:w-full h-0.5 bg-yellow-400 mx-auto mt-3 transition-all duration-300"></div>
              </div>
              
              {/* Agents Counter */}
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center border border-white/20 hover:scale-105 transition transform duration-300 group">
                <div className="text-5xl mb-3 group-hover:animate-bounce">🤝</div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">
                  {counterInView ? (
                    <CountUp start={0} end={stats.total_agents} duration={2.5} separator="," />
                  ) : '0'}+
                </div>
                <p className="text-white/80 text-sm mt-2">Trusted Agents</p>
                <p className="text-green-300 text-xs mt-1">እምነት የሚጣልባቸው ወኪሎች</p>
                <div className="w-0 group-hover:w-full h-0.5 bg-yellow-400 mx-auto mt-3 transition-all duration-300"></div>
              </div>
            </div>
            
            {/* Charity Impact Bar */}
            <div className="mt-12 bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">💚</span>
                  <div>
                    <p className="text-white font-semibold">Kidney & Heart Disease Support</p>
                    <p className="text-green-300 text-sm">2% of every contribution</p>
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-teal-400 rounded-full animate-progress"
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-white/60 mt-1">
                    <span>0 ETB</span>
                    <span className="font-bold text-green-300">
                      {counterInView ? (
                        <CountUp start={0} end={Math.floor(stats.total_raised * 0.02)} duration={2} separator="," />
                      ) : '0'} ETB
                    </span>
                    <span>Goal: ∞</span>
                  </div>
                </div>
                <div className="bg-green-500/20 px-4 py-2 rounded-full">
                  <p className="text-green-300 text-sm font-semibold">Lives Impacted: {Math.floor(stats.total_raised * 0.02 / 100)}+</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section - Original (keep for consistency) */}
        <div className="bg-white border-t border-gray-200 py-8 w-full">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="hover:scale-105 transition">
                <div className="text-3xl font-bold text-green-600">{stats.total_pools}+</div>
                <div className="text-gray-500 text-sm">Active Pools</div>
              </div>
              <div className="hover:scale-105 transition">
                <div className="text-3xl font-bold text-green-600">{stats.total_winners}+</div>
                <div className="text-gray-500 text-sm">Happy Winners</div>
              </div>
              <div className="hover:scale-105 transition">
                <div className="text-3xl font-bold text-green-600">{stats.total_agents}+</div>
                <div className="text-gray-500 text-sm">Trusted Agents</div>
              </div>
              <div className="hover:scale-105 transition">
                <div className="text-3xl font-bold text-green-600">ETB {Math.floor(stats.total_raised / 1000)}K+</div>
                <div className="text-gray-500 text-sm">Total Raised</div>
              </div>
            </div>
          </div>
        </div>

        {/* MERKATO VIP SECTION */}
        <div className="container mx-auto px-4 py-8">
          <Link href="/merkato-vip">
            <div className="relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-2xl p-8 text-white cursor-pointer transform hover:scale-105 transition-all duration-500 shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-10 -left-10 text-8xl animate-bounce">🏪</div>
                <div className="absolute -bottom-10 -right-10 text-8xl animate-pulse">💰</div>
                <div className="absolute top-1/2 left-1/4 text-6xl animate-spin-slow">⭐</div>
                <div className="absolute top-1/4 right-1/4 text-5xl animate-ping">🎯</div>
              </div>
              <div className="absolute inset-0 border-2 border-yellow-300 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-6xl animate-bounce">🏪</div>
                    <div>
                      <div className="font-bold text-3xl">መርካቶ VIP</div>
                      <div className="text-sm opacity-90">Merkato Special Program</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-2xl">ዕለታዊ · ሳምንታዊ · ወርሃዊ</div>
                    <div className="text-sm">Daily · Weekly · Monthly</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-pulse">⭐ 1M ETB</div>
                    <div className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">🏆 10M ETB</div>
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">👑 40M ETB</div>
                  </div>
                  <div className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition transform hover:scale-105 shadow-xl flex items-center gap-2 group-hover:gap-3 transition-all">
                    <span>ይቀላቀሉ!</span>
                    <span className="text-xl group-hover:translate-x-1 transition">→</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-lg font-bold animate-pulse">
                    "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው"
                  </div>
                  <div className="text-sm opacity-90 mt-1">
                    Let's make one participant a millionaire today, this week and this month!
                  </div>
                </div>
                <div className="mt-4 w-full bg-white/30 rounded-full h-1 overflow-hidden">
                  <div className="bg-yellow-300 h-1 rounded-full animate-progress" style={{ width: '60%' }}></div>
                </div>
                <div className="flex justify-center gap-6 mt-4 text-center">
                  <div className="text-xs"><span className="block text-yellow-300 text-lg">⭐</span><span>Daily</span></div>
                  <div className="text-xs"><span className="block text-purple-300 text-lg">🏆</span><span>Weekly</span></div>
                  <div className="text-xs"><span className="block text-green-300 text-lg">👑</span><span>Monthly</span></div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        <MovingAd />
        <AdvertisingBanner />
        <SimpleFilters onFilterChange={() => {}} />

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

        {/* All Active Pools */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-center mb-8">Active Prize Pools</h2>
          {pools.length === 0 && !dataLoaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-100 rounded-xl h-80 animate-pulse"></div>
              ))}
            </div>
          ) : pools.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No pools with images available at the moment.</p>
              <Link href="/create-pool" className="text-green-600 mt-2 inline-block">Create a pool →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map(pool => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          )}
        </section>

        <Testimonials />
        <NewsletterSubscribe />

        {/* How It Works */}
        <div className="bg-gray-50 py-16 w-full">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">1</div>
                <h3 className="font-bold text-xl mb-2">Find a Pool</h3>
                <p className="text-gray-600">Browse available prize pools</p>
              </div>
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">2</div>
                <h3 className="font-bold text-xl mb-2">Contribute</h3>
                <p className="text-gray-600">Make your contribution securely</p>
              </div>
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">3</div>
                <h3 className="font-bold text-xl mb-2">Win!</h3>
                <p className="text-gray-600">Win amazing prizes!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Become Agent/Vendor/Org Section */}
        <div className={`bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 transition-all duration-700 transform ${showRoleButtons ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="container mx-auto px-4 text-center">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Want to Earn More?</h2>
              <p className="text-gray-300 text-sm md:text-base">Join our partner program and start earning commissions today!</p>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => handleRoleSelection('agent')} className="group bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold text-base hover:shadow-xl transition transform hover:scale-105 touch-target flex items-center gap-2">
                <span className="text-xl">🤝</span> Become an Agent <span className="text-sm opacity-80">(10% commission)</span>
              </button>
              <button onClick={() => handleRoleSelection('vendor')} className="group bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-full font-semibold text-base hover:shadow-xl transition transform hover:scale-105 touch-target flex items-center gap-2">
                <span className="text-xl">🏪</span> Become a Vendor <span className="text-sm opacity-80">(10% commission)</span>
              </button>
              <button onClick={() => handleRoleSelection('organization')} className="group bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-full font-semibold text-base hover:shadow-xl transition transform hover:scale-105 touch-target flex items-center gap-2">
                <span className="text-xl">🏢</span> Become an Organization <span className="text-sm opacity-80">(10% commission)</span>
              </button>
            </div>
            <div className="mt-6 text-xs text-gray-400">
              <p>✓ No upfront fees ✓ Earn 10% on every successful pool ✓ 24/7 support</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 60%; }
        }
        .animate-fade-in { animation: fade-in 1s ease-out; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-progress { animation: progress 1.5s ease-out; }
      `}</style>
    </>
  );
}
