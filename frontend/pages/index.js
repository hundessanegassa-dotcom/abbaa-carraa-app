// pages/index.js - COMPLETE WITH FIXED REGULAR POOLS SECTION
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
import TopCitySelector from '../components/TopCitySelector';
import PoolCard from '../components/PoolCard';

// Dynamic imports
const MovingAd = dynamic(() => import('../components/MovingAd'), { ssr: false, loading: () => null });
const Testimonials = dynamic(() => import('../components/Testimonials'), { ssr: false, loading: () => null });
const NewsletterSubscribe = dynamic(() => import('../components/NewsletterSubscribe'), { ssr: false, loading: () => null });
const AdvertisingBanner = dynamic(() => import('../components/AdvertisingBanner'), { ssr: false, loading: () => null });
const CashEquivalentBanner = dynamic(() => import('../components/CashEquivalentBanner'), { ssr: false, loading: () => null });
const CharityBanner = dynamic(() => import('../components/CharityBanner'), { ssr: false, loading: () => null });

export async function getServerSideProps() {
  return { props: {} };
}

export default function Home() {
  const router = useRouter();
  const [pools, setPools] = useState([]);
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
  const [showRegularPools, setShowRegularPools] = useState(false);
  const [regularPoolFilter, setRegularPoolFilter] = useState('all');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');

  // ALL ETHIOPIAN CITIES - Complete list with proper Amharic/English descriptions
  const allCityVipPrograms = [
    // CENTRAL & MAJOR CITIES
    { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', region: 'Central', icon: '🏙️', descriptionAm: 'የኢትዮጵያ የንግድ እና ዲፕሎማሲ ልብ', descriptionEn: 'Heart of Ethiopian Commerce & Diplomacy' },
    { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', region: 'Oromia', icon: '🏗️', descriptionAm: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል', descriptionEn: 'Smart City & Investment Hub' },
    { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', region: 'Dire Dawa', icon: '🚂', descriptionAm: 'የንግድ እና የማኑፋክቸሪንግ ከተማ', descriptionEn: 'Trade & Manufacturing Hub' },
    { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', region: 'Tigray', icon: '🏭', descriptionAm: 'ከፍተኛ የኢኮኖሚ ዕድገት ካለው ከተማ', descriptionEn: 'City with Highest GDP per Capita' },
    { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', region: 'Sidama', icon: '🏞️', descriptionAm: 'የኢንዱስትሪ ፓርክ እና የሀይቅ ከተማ', descriptionEn: 'Industrial Park & Lake City' },
    { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', region: 'Amhara', icon: '🏰', descriptionAm: 'የባህል ቅርስ እና የቱሪዝም ከተማ', descriptionEn: 'Cultural Heritage & Tourism City' },
    { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', region: 'Amhara', icon: '🏞️', descriptionAm: 'የታና ሀይቅ እና የጨርቃጨርቅ ከተማ', descriptionEn: 'Lake Tana & Textile City' },
    
    // OROMIA REGION CITIES
    { id: 'adama', name: 'አዳማ', nameEn: 'Adama', region: 'Oromia', icon: '🏭', descriptionAm: 'የኢንዱስትሪ እና የንግድ ከተማ', descriptionEn: 'Industrial & Trade City' },
    { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', region: 'Oromia', icon: '☕', descriptionAm: 'የቡና እና የንግድ ከተማ', descriptionEn: 'Coffee & Trade City' },
    { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', region: 'Oromia', icon: '✈️', descriptionAm: 'የሀይቆች እና የአየር ሃይል ከተማ', descriptionEn: 'City of Lakes & Air Force Base' },
    { id: 'asella', name: 'አሰላ', nameEn: 'Asella', region: 'Oromia', icon: '🏔️', descriptionAm: 'የአርሲ ዋና ከተማ እና የእርሻ ማዕከል', descriptionEn: 'Capital of Arsi & Agricultural Hub' },
    { id: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene', region: 'Oromia', icon: '🛍️', descriptionAm: 'የንግድ እና የኢንዱስትሪ ከተማ', descriptionEn: 'Trade & Industrial City' },
    { id: 'robe', name: 'ሮቤ', nameEn: 'Robe', region: 'Oromia', icon: '🌄', descriptionAm: 'የባሌ ተራራ በር | የቱሪዝም ማዕከል', descriptionEn: 'Gateway to Bale Mountains | Tourism Hub' },
    { id: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte', region: 'Oromia', icon: '☕', descriptionAm: 'የቡና እና የንግድ ከተማ', descriptionEn: 'Coffee & Trade City' },
    { id: 'ambo', name: 'አምቦ', nameEn: 'Ambo', region: 'Oromia', icon: '💧', descriptionAm: 'የማዕድን ውሃ እና የግብርና ከተማ', descriptionEn: 'Mineral Water & Agriculture City' },
    { id: 'metu', name: 'መቱ', nameEn: 'Metu', region: 'Oromia', icon: '🌿', descriptionAm: 'የቡና እና የግብርና ከተማ', descriptionEn: 'Coffee & Agriculture City' },
    { id: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway', region: 'Oromia', icon: '🐟', descriptionAm: 'የአሳ ማጥመድ እና የቱሪዝም ከተማ', descriptionEn: 'Fishing & Tourism City' },
    
    // AMHARA REGION CITIES
    { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', region: 'Amhara', icon: '🏔️', descriptionAm: 'የንግድ እና የእርሻ ከተማ', descriptionEn: 'Trade & Agriculture City' },
    { id: 'debre-markos', name: 'ደብረ ማርቆስ', nameEn: 'Debre Markos', region: 'Amhara', icon: '⛪', descriptionAm: 'የምስራቅ ጎጃም ዋና ከተማ', descriptionEn: 'Capital of East Gojjam' },
    { id: 'finote-selam', name: 'ፍኖተ ሰላም', nameEn: 'Finote Selam', region: 'Amhara', icon: '🌅', descriptionAm: 'የምዕራብ ጎጃም ዋና ከተማ', descriptionEn: 'Capital of West Gojjam' },
    
    // TIGRAY REGION CITIES
    { id: 'axum', name: 'አክሱም', nameEn: 'Axum', region: 'Tigray', icon: '🏛️', descriptionAm: 'የታላቁ የአክሱም መንግስት ዋና ከተማ', descriptionEn: 'Capital of the Ancient Axumite Kingdom' },
    { id: 'adigrat', name: 'አዲግራት', nameEn: 'Adigrat', region: 'Tigray', icon: '🏔️', descriptionAm: 'የሰሜን ትግራይ የንግድ ማዕከል', descriptionEn: 'North Tigray Trade Center' },
    
    // SOMALI REGION CITIES
    { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', region: 'Somali', icon: '🐪', descriptionAm: 'የሶማሌ ክልል ዋና ከተማ', descriptionEn: 'Capital of Somali Region' },
    { id: 'harar', name: 'ሀረር', nameEn: 'Harar', region: 'Harari', icon: '🏛️', descriptionAm: 'የባህል ቅርስ እና የእስላም ቅድስት ከተማ', descriptionEn: 'Cultural Heritage & Islamic Holy City' },
    
    // BENISHANGUL-GUMUZ REGION
    { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', region: 'Benishangul', icon: '🌿', descriptionAm: 'የቤንሻንጉል ክልል ዋና ከተማ', descriptionEn: 'Capital of Benishangul Region' },
    
    // SOUTH ETHIOPIA REGION
    { id: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch', region: 'South', icon: '🏞️', descriptionAm: 'የአርባ ምንጭ ዩኒቨርሲቲ ከተማ', descriptionEn: 'Arba Minch University City' },
    { id: 'sodo', name: 'ሶዶ', nameEn: 'Sodo', region: 'South', icon: '🛍️', descriptionAm: 'የወላይታ ዞን ዋና ከተማ', descriptionEn: 'Capital of Wolayita Zone' },
    { id: 'dilla', name: 'ዲላ', nameEn: 'Dilla', region: 'South', icon: '☕', descriptionAm: 'የቡና እና የንግድ ከተማ', descriptionEn: 'Coffee & Trade City' },
    
    // AFAR REGION
    { id: 'semera', name: 'ሰሜራ', nameEn: 'Semera', region: 'Afar', icon: '🐪', descriptionAm: 'የአፋር ክልል ዋና ከተማ', descriptionEn: 'Capital of Afar Region' },
    
    // GAMBELLA REGION
    { id: 'gambella', name: 'ጋምቤላ', nameEn: 'Gambella', region: 'Gambella', icon: '🏞️', descriptionAm: 'የጋምቤላ ክልል ዋና ከተማ', descriptionEn: 'Capital of Gambella Region' },
  ];

  // Remove duplicates by id
  const uniqueCities = allCityVipPrograms.filter((city, index, self) => 
    index === self.findIndex((c) => c.id === city.id)
  );

  // Filter cities based on search
  const filteredCityList = uniqueCities.filter(city => 
    city.name.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
    city.nameEn.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
    city.region.toLowerCase().includes(citySearchTerm.toLowerCase())
  );

  // Single counter animation
  const { ref: counterRef, inView: counterInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  useEffect(() => {
    const cachedData = sessionStorage.getItem('homepage_data');
    
    if (cachedData) {
      const { pools: cachedPools, stats: cachedStats } = JSON.parse(cachedData);
      setPools(cachedPools);
      setStats(cachedStats);
      setDataLoaded(true);
      setIsInitialLoad(false);
    } else {
      loadData();
    }

    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const pageHeight = document.documentElement.scrollHeight;
      
      if (scrollPosition >= pageHeight - 300) {
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
          .limit(20)
      ]);
      
      const total_raised = (contributionsResult.data || []).reduce((sum, c) => sum + (c.amount || 0), 0);
      
      const newStats = {
        total_pools: poolsResult.count || 0,
        total_winners: winnersResult.count || 0,
        total_agents: agentsResult.count || 0,
        total_raised: total_raised
      };
      
      const newPools = poolsData.data || [];
      
      setPools(newPools);
      setStats(newStats);
      
      sessionStorage.setItem('homepage_data', JSON.stringify({
        pools: newPools,
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
      case 'all':
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
        {/* PERSISTENT TOP NAVBAR WITH CITY SELECTOR */}
        <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-2xl group-hover:scale-110 transition-transform">🎫</span>
                <div>
                  <span className="font-bold text-white text-lg">Merkato VIP</span>
                  <span className="text-xs text-gray-400 ml-2 hidden sm:inline">| Ethiopia's Premier Event Hub</span>
                </div>
              </Link>
              <TopCitySelector />
            </div>
          </div>
        </nav>

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
                ይሳተፉ | Start Winning
                <span>→</span>
              </button>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-10 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <span className="text-green-600">✓</span> Cash Guarantee
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <span className="text-green-600">✓</span> Blockchain Verified
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <span className="text-green-600">💚</span> 2% for Health
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                <span className="text-green-600">✓</span> 24/7 Support
              </div>
            </div>
          </div>
        </div>

        {/* SINGLE COUNTER - White background, above Moving Ad */}
        <div ref={counterRef} className="bg-white py-8 border-y border-gray-100">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-green-100 rounded-full px-4 py-1 mb-4">
                  <span className="text-green-600 text-lg">📊</span>
                  <span className="text-green-700 text-sm font-semibold">Total Impact</span>
                </div>
                <div className="text-5xl md:text-7xl font-bold text-green-600 mb-3">
                  {counterInView ? <CountUp start={0} end={Math.floor(stats.total_raised / 1000)} duration={2.5} separator="," /> : '0'}+
                  <span className="text-2xl md:text-3xl text-gray-500">K ETB</span>
                </div>
                <p className="text-gray-500 text-sm">Total Prize Money Distributed</p>
                <p className="text-green-600 text-xs mt-2">አጠቃላይ የተሰራጨ የሽልማት ገንዘብ</p>
                <div className="flex justify-center gap-8 mt-6">
                  <div>
                    <div className="text-2xl font-bold text-gray-700">{stats.total_winners}+</div>
                    <div className="text-xs text-gray-400">Happy Winners</div>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">{stats.total_pools}+</div>
                    <div className="text-xs text-gray-400">Active Pools</div>
                  </div>
                  <div className="w-px h-8 bg-gray-200"></div>
                  <div>
                    <div className="text-2xl font-bold text-gray-700">{stats.total_agents}+</div>
                    <div className="text-xs text-gray-400">Trusted Agents</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <MovingAd />
        <AdvertisingBanner />

        {/* POOLS SECTION */}
        <div id="pools-section" className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center mb-4">Available Opportunities</h2>
          <p className="text-center text-gray-500 mb-8">Choose from VIP programs or regular pools</p>

          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="text-green-600">✓</span> Cash Guarantee
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="text-green-600">✓</span> Blockchain Verified
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="text-green-600">💚</span> 2% for Health
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
              <span className="text-green-600">✓</span> 24/7 Support
            </div>
          </div>

          {/* MERKATO VIP */}
          <div className="mb-12">
            <a 
              href="/merkato-vip"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/merkato-vip';
              }}
              className="block cursor-pointer"
            >
              <div className="relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-2xl p-6 md:p-8 text-white transform hover:scale-105 transition-all duration-500 shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute -top-10 -left-10 text-8xl animate-bounce">🏪</div>
                  <div className="absolute -bottom-10 -right-10 text-8xl animate-pulse">💰</div>
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <div className="text-5xl md:text-6xl animate-bounce">🏪</div>
                      <div>
                        <div className="font-bold text-2xl md:text-3xl">መርካቶ VIP</div>
                        <div className="text-xs md:text-sm opacity-90">Merkato Special Program</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-lg">⭐ 1M ETB</div>
                      <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-lg">🏆 10M ETB</div>
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-lg">👑 40M ETB</div>
                    </div>
                    <div className="bg-white text-gray-900 px-5 py-2 rounded-full font-bold hover:bg-gray-100 transition transform hover:scale-105 shadow-xl flex items-center gap-2 text-sm md:text-base">
                      <span>🎯</span>
                      <span>ይቀላቀሉ | Join VIP</span>
                      <span>→</span>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-sm md:text-lg font-bold animate-pulse">
                      "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው"
                    </p>
                    <p className="text-xs md:text-sm opacity-80 mt-1">"Today, this week, and this month - let's make one participant a millionaire"</p>
                  </div>
                </div>
              </div>
            </a>
          </div>

          {/* CITY VIP PROGRAMS - COMPACT DROPDOWN */}
          <div className="mb-12">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🏙️</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">City VIP Programs</h3>
                    <p className="text-sm text-gray-300">Join your city's exclusive VIP program</p>
                  </div>
                </div>
                
                {/* DROPDOWN BUTTON */}
                <div className="relative">
                  <button
                    onClick={() => setShowCityDropdown(!showCityDropdown)}
                    className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition shadow-md"
                  >
                    <span>🎯</span>
                    <span>ከተማ ምረጡ | Select City</span>
                    <svg className={`w-4 h-4 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* DROPDOWN LIST */}
                  {showCityDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
                      <div className="absolute top-full left-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                        <div className="p-3 bg-gray-50 border-b">
                          <input
                            type="text"
                            placeholder="🔍 Search your city..."
                            value={citySearchTerm}
                            onChange={(e) => setCitySearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {filteredCityList.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">No cities found</div>
                          ) : (
                            filteredCityList.map(city => (
                              <a
                                key={city.id}
                                href={`/cities/${city.id}`}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setShowCityDropdown(false);
                                  setCitySearchTerm('');
                                  window.location.href = `/cities/${city.id}`;
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b last:border-0 flex items-center gap-3 cursor-pointer group"
                              >
                                <span className="text-2xl">{city.icon}</span>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-800 group-hover:text-green-600 transition">
                                    {city.name} <span className="text-gray-400 text-xs">| {city.nameEn}</span>
                                  </div>
                                  <div className="text-xs text-gray-500">{city.descriptionAm}</div>
                                </div>
                                <span className="text-green-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                                  ይቀላቀሉ <span>→</span>
                                </span>
                              </a>
                            ))
                          )}
                        </div>
                        <div className="p-2 text-center text-xs text-gray-400 bg-gray-50">
                          {uniqueCities.length}+ Ethiopian cities available • እስከ 40M ብር ለማሸነፍ ይቀላቀሉ
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-2xl">🏆</div>
                  <div className="text-white font-bold text-sm">1M ETB</div>
                  <div className="text-[10px] text-gray-400">ዕለታዊ | Daily</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">⭐</div>
                  <div className="text-white font-bold text-sm">10M ETB</div>
                  <div className="text-[10px] text-gray-400">ሳምንታዊ | Weekly</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">👑</div>
                  <div className="text-white font-bold text-sm">40M ETB</div>
                  <div className="text-[10px] text-gray-400">ወርሃዊ | Monthly</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl">📍</div>
                  <div className="text-white font-bold text-sm">{uniqueCities.length}+</div>
                  <div className="text-[10px] text-gray-400">ከተሞች | Cities</div>
                </div>
              </div>
            </div>
          </div>

          {/* REGULAR POOLS - ATTRACTIVE CLICKABLE SECTION */}
          <div className="mb-12">
            <button
              onClick={() => setShowRegularPools(!showRegularPools)}
              className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-2xl p-6 transition-all duration-300 shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl group-hover:scale-110 transition-transform">🏊</span>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold">መደበኛ የእጣ መደቦች</h3>
                    <p className="text-sm text-gray-300">Regular Pools</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{showRegularPools ? 'ሰርዝ' : 'ይመልከቱ'}</span>
                  <svg className={`w-5 h-5 transition-transform duration-300 ${showRegularPools ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </button>

            {/* Regular Pools Content - Shows when clicked */}
            {showRegularPools && (
              <div className="mt-6 animate-fade-in">
                {/* WINNER PRIZE BANNER - CALL TO ACTION */}
                <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-5 mb-6 text-white shadow-lg">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-4xl animate-pulse">🏆</span>
                      <div>
                        <p className="text-sm font-semibold opacity-90">✨ አሸናፊ የሚሸለምው | What Winners Win ✨</p>
                        <p className="text-lg md:text-xl font-bold">
                          🚗 መኪና | 🏭 ማሽኖች | 🏠 ቤት | 💻 ኤሌክትሮኒክስ | 🎁 ብዙ ተጨማሪ
                        </p>
                        <p className="text-xs opacity-90">
                          Cars | Machinery | House | Electronics | And Much More!
                        </p>
                      </div>
                    </div>
                    <div className="bg-white/20 backdrop-blur rounded-full px-4 py-2 text-center">
                      <p className="text-sm font-bold">🎯 ይሳተፉ እና ያሸንፉ!</p>
                      <p className="text-xs">Join and WIN!</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700">የሚገኙ የእጣ መደቦች | Available Prize Pools</h4>
                    <p className="text-sm text-gray-500">በበጀትህ እና በምርጫህ መሰረት ምረጥ | Choose based on your budget and preference</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRegularPoolFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        regularPoolFilter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ሁሉም | All
                    </button>
                    <button
                      onClick={() => setRegularPoolFilter('lowToHigh')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        regularPoolFilter === 'lowToHigh' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ውድነት መጨመር | Price: Low to High
                    </button>
                    <button
                      onClick={() => setRegularPoolFilter('highToLow')}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                        regularPoolFilter === 'highToLow' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      ውድነት መቀነስ | Price: High to Low
                    </button>
                  </div>
                </div>

                {displayedPools.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-5xl mb-3">🏊</div>
                    <p className="text-gray-500">ምንም ንቁ የእጣ መደቦች የሉም</p>
                    <p className="text-sm text-gray-400 mt-2">No active prize pools at the moment. Check back soon!</p>
                    <p className="text-xs text-gray-400 mt-1">በቅርቡ አዳዲስ ዕድሎች ይመጣሉ | New opportunities coming soon</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedPools.map(pool => (
                      <PoolCard key={pool.id} pool={pool} featured={pool.is_featured === true} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Testimonials />
        <NewsletterSubscribe />

        {/* How It Works */}
        <div className="bg-gray-50 py-16 w-full">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">እንዴት እንሳተፋለን? | How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">1</div>
                <h3 className="font-bold text-xl mb-2">ፑል ምረጡ | Find a Pool</h3>
                <p className="text-gray-600">ከሚገኙ ፑሎች መካከል ይምረጡ</p>
                <p className="text-green-600 text-sm mt-1">Browse available prize pools</p>
              </div>
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">2</div>
                <h3 className="font-bold text-xl mb-2">ክፍያ ይክፈሉ | Contribute</h3>
                <p className="text-gray-600">በአስተማማኝ ሁኔታ ክፍያዎን ያስገቡ</p>
                <p className="text-green-600 text-sm mt-1">Make your contribution securely</p>
              </div>
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">3</div>
                <h3 className="font-bold text-xl mb-2">ያሸንፉ | Win!</h3>
                <p className="text-gray-600">አሸናፊ በመሆን ሽልማት ያግኙ</p>
                <p className="text-green-600 text-sm mt-1">Win amazing prizes!</p>
              </div>
            </div>
          </div>
        </div>

        {/* PARTNER PROGRAM - With divider line */}
        <div className="border-t border-gray-200"></div>
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">ተባባሪ ፕሮግራም | Partner Program</h2>
            <p className="text-gray-300 text-sm md:text-base mb-6">Join our partner program and start earning commissions today!</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => handleRoleSelection('agent')} className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
                <span>🤝</span> ወኪል ይሁኑ | Become an Agent
              </button>
              <button onClick={() => handleRoleSelection('vendor')} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
                <span>🏪</span> ነጋዴ ይሁኑ | Become a Vendor
              </button>
              <button onClick={() => handleRoleSelection('organization')} className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
                <span>🏢</span> ድርጅት ይሁኑ | Become an Organization
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              <p>✓ ምንም የቅድሚያ ክፍያ የለም | No upfront fees ✓ በእያንዳንዱ ስኬታማ ፑል 10% ያግኙ | Earn 10% on every successful pool ✓ 24/7 ድጋፍ | 24/7 support</p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800"></div>

        {showCitySelector && (
          <CitySelector onClose={() => setShowCitySelector(false)} />
        )}
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
      `}</style>
    </>
  );
}
