// pages/index.js
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import GlobalAnnouncement from '../components/GlobalAnnouncement';
import CitySelector from '../components/CitySelector';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

// Dynamic imports
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
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [regularPoolFilter, setRegularPoolFilter] = useState('featured');

  // City VIP Programs Data
  const cityVipPrograms = [
    { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', region: 'Central', population: '5M+', icon: '🏙️', color: 'from-blue-500 to-cyan-600', description: 'የኢትዮጵያ የንግድ ልብ' },
    { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', region: 'Dire Dawa', population: '535K+', icon: '🚂', color: 'from-green-500 to-teal-600', description: 'የንግድ እና የማኑፋክቸሪንግ ከተማ' },
    { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', region: 'Tigray', population: '500K+', icon: '🏭', color: 'from-purple-500 to-pink-600', description: 'ከፍተኛ የኢኮኖሚ ዕድገት' },
    { id: 'adama', name: 'አዳማ', nameEn: 'Adama', region: 'Oromia', population: '500K+', icon: '🏭', color: 'from-orange-500 to-red-600', description: 'የኢንዱስትሪ እና የንግድ ከተማ' },
    { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', region: 'Sidama', population: '387K+', icon: '🏞️', color: 'from-teal-500 to-green-600', description: 'የኢንዱስትሪ ፓርክ ከተማ' },
    { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', region: 'Amhara', population: '350K+', icon: '🏰', color: 'from-amber-500 to-yellow-600', description: 'የባህል እና የቱሪዝም ከተማ' },
    { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', region: 'Amhara', population: '350K+', icon: '🏞️', color: 'from-cyan-500 to-blue-600', description: 'የቱሪዝም እና የጨርቃጨርቅ ከተማ' },
    { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', region: 'Oromia', population: '250K+', icon: '☕', color: 'from-emerald-500 to-green-600', description: 'የቡና እና የንግድ ከተማ' },
    { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', region: 'Oromia', population: '150K+', icon: '✈️', color: 'from-sky-500 to-blue-600', description: 'የሀይቆች ከተማ' },
  ];

  // Merkato VIP Data
  const merkatoVip = {
    id: 'merkato',
    name: 'መርካቶ',
    nameEn: 'Merkato',
    icon: '🏪',
    color: 'from-yellow-500 to-orange-600',
    prize: '40M ETB',
    description: 'የአፍሪካ ትልቁ ገበያ',
    features: ['⭐ Daily 1,000,000 ETB', '🏆 Weekly 10,000,000 ETB', '👑 Monthly 40,000,000 ETB']
  };

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
      const newFeaturedPools = newPools.filter(pool => pool.is_featured === true);
      
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
    const element = document.getElementById('pools-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Filter regular pools
  const getFilteredPools = () => {
    let filtered = [...pools];
    
    switch (regularPoolFilter) {
      case 'featured':
        filtered = filtered.filter(p => p.is_featured === true);
        break;
      case 'lowToHigh':
        filtered.sort((a, b) => (a.entry_fee || 0) - (b.entry_fee || 0));
        break;
      case 'highToLow':
        filtered.sort((a, b) => (b.entry_fee || 0) - (a.entry_fee || 0));
        break;
      default:
        break;
    }
    
    return filtered;
  };

  const displayedPools = getFilteredPools();

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
        <title>Abbaa Carraa - Win Amazing Prizes | Merkato VIP | City VIP</title>
        <meta name="description" content="Win amazing prizes. Join Merkato VIP, City VIP, or Regular Pools. 2% supports kidney & heart disease patients." />
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
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-3 rounded-full font-semibold text-lg shadow-md hover:shadow-lg transition hover:scale-105 transform inline-flex items-center gap-2"
              >
                <span>🎯</span>
                Start Winning Now
                <span>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* Counter Section - SINGLE COUNTER */}
        <div ref={counterRef} className="relative bg-gradient-to-r from-green-900 via-teal-900 to-emerald-900 py-16 overflow-hidden">
          <div className="relative container mx-auto px-4 z-10">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-6 py-2 mb-4">
                <span className="text-yellow-400 text-xl">📊</span>
                <span className="text-white font-semibold">OUR IMPACT</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">እኛ አብረን እየሰራን ያለን ተጽእኖ</h2>
              <p className="text-green-200 text-lg max-w-2xl mx-auto">The impact we're creating together</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center border border-white/20 hover:scale-105 transition transform duration-300">
                <div className="text-5xl mb-3">💰</div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">
                  {counterInView ? <CountUp start={0} end={Math.floor(stats.total_raised / 1000)} duration={2.5} separator="," /> : '0'}K+
                </div>
                <p className="text-white/80 text-sm mt-2">Total Raised (ETB)</p>
                <p className="text-green-300 text-xs mt-1">አጠቃላይ የተሰበሰበ</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center border border-white/20 hover:scale-105 transition transform duration-300">
                <div className="text-5xl mb-3">🏆</div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">
                  {counterInView ? <CountUp start={0} end={stats.total_winners} duration={2.5} separator="," /> : '0'}+
                </div>
                <p className="text-white/80 text-sm mt-2">Happy Winners</p>
                <p className="text-green-300 text-xs mt-1">ደስተኛ አሸናፊዎች</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center border border-white/20 hover:scale-105 transition transform duration-300">
                <div className="text-5xl mb-3">🏊</div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">
                  {counterInView ? <CountUp start={0} end={stats.total_pools} duration={2.5} separator="," /> : '0'}+
                </div>
                <p className="text-white/80 text-sm mt-2">Active Pools</p>
                <p className="text-green-300 text-xs mt-1">ንቁ ፑሎች</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center border border-white/20 hover:scale-105 transition transform duration-300">
                <div className="text-5xl mb-3">🤝</div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">
                  {counterInView ? <CountUp start={0} end={stats.total_agents} duration={2.5} separator="," /> : '0'}+
                </div>
                <p className="text-white/80 text-sm mt-2">Trusted Agents</p>
                <p className="text-green-300 text-xs mt-1">እምነት የሚጣልባቸው ወኪሎች</p>
              </div>
            </div>
          </div>
        </div>

        {/* POOLS SECTION - Under Start Winning Now button */}
        <div id="pools-section" className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center mb-4">Available Opportunities</h2>
          <p className="text-center text-gray-500 mb-8">Choose from VIP programs or regular pools</p>

          {/* MERKATO VIP - Featured Card */}
          <div className="mb-12">
            <Link href="/merkato-vip">
              <div className="relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-2xl p-8 text-white cursor-pointer transform hover:scale-105 transition-all duration-500 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -top-10 -left-10 text-8xl animate-bounce">🏪</div>
                  <div className="absolute -bottom-10 -right-10 text-8xl animate-pulse">💰</div>
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-6xl animate-bounce">🏪</div>
                      <div>
                        <div className="font-bold text-3xl">መርካቶ VIP</div>
                        <div className="text-sm opacity-90">Merkato Special Program</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">⭐ 1M ETB</div>
                      <div className="bg-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">🏆 10M ETB</div>
                      <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">👑 40M ETB</div>
                    </div>
                    <div className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold hover:bg-gray-100 transition transform hover:scale-105 shadow-xl flex items-center gap-2">
                      <span>Join VIP →</span>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-lg font-bold animate-pulse">
                      "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው"
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* CITY VIP - Grid */}
          <div className="mb-12">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">🏙️ City VIP Programs</h3>
              <button 
                onClick={() => setShowCitySelector(true)}
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                View All Cities →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cityVipPrograms.map((city) => (
                <Link key={city.id} href={`/cities/${city.id}`}>
                  <div className={`bg-gradient-to-r ${city.color} rounded-xl p-4 text-white hover:shadow-xl transition transform hover:scale-105 cursor-pointer`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-3xl">{city.icon}</div>
                      <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">{city.population}</span>
                    </div>
                    <h4 className="font-bold text-lg">{city.name}</h4>
                    <p className="text-xs opacity-80">{city.nameEn}</p>
                    <p className="text-[10px] opacity-70 mt-1 line-clamp-1">{city.description}</p>
                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">Up to 40M ETB</span>
                      <span className="text-sm">Join →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* REGULAR POOLS - With Filters */}
          <div>
            <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
              <h3 className="text-2xl font-bold text-gray-800">🏊 Regular Pools</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setRegularPoolFilter('featured')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    regularPoolFilter === 'featured' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ⭐ Featured
                </button>
                <button
                  onClick={() => setRegularPoolFilter('lowToHigh')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    regularPoolFilter === 'lowToHigh' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Price: Low to High
                </button>
                <button
                  onClick={() => setRegularPoolFilter('highToLow')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    regularPoolFilter === 'highToLow' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Price: High to Low
                </button>
              </div>
            </div>

            {displayedPools.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No active pools at the moment.</p>
                <p className="text-sm text-gray-400 mt-2">Check back soon for new opportunities!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedPools.map(pool => (
                  <PoolCard key={pool.id} pool={pool} featured={pool.is_featured === true} />
                ))}
              </div>
            )}
          </div>
        </div>

        <MovingAd />
        <AdvertisingBanner />
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

        {/* Become Partner Section */}
        <div className={`bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 transition-all duration-700 transform ${showRoleButtons ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Want to Earn More?</h2>
            <p className="text-gray-300 text-sm md:text-base mb-6">Join our partner program and start earning commissions today!</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => handleRoleSelection('agent')} className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
                <span>🤝</span> Become an Agent
              </button>
              <button onClick={() => handleRoleSelection('vendor')} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
                <span>🏪</span> Become a Vendor
              </button>
              <button onClick={() => handleRoleSelection('organization')} className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
                <span>🏢</span> Become an Organization
              </button>
            </div>
          </div>
        </div>

        {/* City Selector Modal */}
        {showCitySelector && (
          <CitySelector onClose={() => setShowCitySelector(false)} />
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s ease-out; }
      `}</style>
    </>
  );
}
