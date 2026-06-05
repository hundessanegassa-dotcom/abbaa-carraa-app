// pages/listings.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import PoolCard from '../components/PoolCard';
import NoSSR from '../components/NoSSR';

export async function getServerSideProps() {
  return { props: {} };
}

export default function Listings() {
  const { t } = useTranslation();
  const [pools, setPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, featured, lowToHigh, highToLow, vip

  // City VIP Programs Data
  const cityVipPrograms = [
    { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', icon: '🏙️', color: 'from-blue-500 to-cyan-600', prize: '40M ETB', available: true },
    { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', icon: '🚂', color: 'from-green-500 to-teal-600', prize: '40M ETB', available: true },
    { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', icon: '🏭', color: 'from-purple-500 to-pink-600', prize: '40M ETB', available: true },
    { id: 'adama', name: 'አዳማ', nameEn: 'Adama', icon: '🏭', color: 'from-orange-500 to-red-600', prize: '40M ETB', available: true },
    { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', icon: '🏞️', color: 'from-teal-500 to-green-600', prize: '40M ETB', available: true },
    { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', icon: '🏰', color: 'from-amber-500 to-yellow-600', prize: '40M ETB', available: true },
    { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', icon: '🏞️', color: 'from-cyan-500 to-blue-600', prize: '40M ETB', available: true },
    { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', icon: '☕', color: 'from-emerald-500 to-green-600', prize: '40M ETB', available: true },
    { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', icon: '✈️', color: 'from-indigo-500 to-purple-600', prize: '40M ETB', available: true },
    { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', icon: '🏔️', color: 'from-rose-500 to-pink-600', prize: '40M ETB', available: false },
    { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', icon: '🐪', color: 'from-amber-500 to-orange-600', prize: '40M ETB', available: false },
    { id: 'harar', name: 'ሐረር', nameEn: 'Harar', icon: '🏛️', color: 'from-red-500 to-rose-600', prize: '40M ETB', available: false },
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
    descriptionEn: "Africa's Largest Market",
    features: ['⭐ Daily 1,000,000 ETB', '🏆 Weekly 10,000,000 ETB', '👑 Monthly 40,000,000 ETB'],
    available: true
  };

  useEffect(() => {
    fetchPools();
  }, []);

  async function fetchPools() {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const allPools = data || [];
      setPools(allPools);
      setFeaturedPools(allPools.filter(pool => pool.is_featured === true));
      
    } catch (error) {
      console.error('Error loading pools:', error);
    } finally {
      setLoading(false);
    }
  }

  // Filter pools based on selection
  const getFilteredPools = () => {
    let filtered = [...pools];
    
    switch (filter) {
      case 'featured':
        filtered = filtered.filter(p => p.is_featured === true);
        break;
      case 'lowToHigh':
        filtered.sort((a, b) => (a.entry_fee || a.contribution_amount || 0) - (b.entry_fee || b.contribution_amount || 0));
        break;
      case 'highToLow':
        filtered.sort((a, b) => (b.entry_fee || b.contribution_amount || 0) - (a.entry_fee || a.contribution_amount || 0));
        break;
      case 'vip':
        // For VIP filter, we return empty array - VIPs are shown separately
        return [];
      default:
        break;
    }
    
    return filtered;
  };

  const displayPools = getFilteredPools();
  const showVipSection = filter === 'all' || filter === 'vip' || filter === 'featured';

  return (
    <NoSSR>
      <>
        <Head>
          <title>Browse Prizes & VIP Programs - Abbaa Carraa</title>
          <meta name="description" content="Join regular pools or VIP programs to win amazing prizes up to 40 Million ETB" />
        </Head>

        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-center mb-2">{t('common.browse_prizes') || 'Browse Opportunities'}</h1>
            <p className="text-center text-gray-600 mb-8">{t('common.join_prize_pools') || 'Join regular pools or VIP programs to win amazing prizes'}</p>
            
            {/* Filter Bar */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === 'all' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All Pools
              </button>
              <button
                onClick={() => setFilter('featured')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === 'featured' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                ⭐ Featured
              </button>
              <button
                onClick={() => setFilter('vip')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === 'vip' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                👑 VIP Programs
              </button>
              <button
                onClick={() => setFilter('lowToHigh')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === 'lowToHigh' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Price: Low to High
              </button>
              <button
                onClick={() => setFilter('highToLow')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  filter === 'highToLow' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Price: High to Low
              </button>
            </div>
            
            {/* VIP Programs Section - Merkato VIP */}
            {showVipSection && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl">👑</span>
                  <h2 className="text-2xl font-bold text-gray-800">VIP Programs</h2>
                  <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full">Win up to 40 Million ETB</span>
                </div>
                
                {/* Merkato VIP Card */}
                <Link href="/merkato-vip">
                  <div className={`bg-gradient-to-r ${merkatoVip.color} rounded-2xl p-6 text-white hover:shadow-xl transition transform hover:scale-105 cursor-pointer mb-6`}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="text-6xl">{merkatoVip.icon}</div>
                        <div>
                          <h3 className="text-2xl font-bold">{merkatoVip.name} VIP</h3>
                          <p className="text-sm opacity-90">{merkatoVip.nameEn} VIP</p>
                          <p className="text-xs opacity-75 mt-1">{merkatoVip.description} | {merkatoVip.descriptionEn}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold">{merkatoVip.prize}</div>
                        <p className="text-xs opacity-75">Max Prize</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {merkatoVip.features.map((feature, idx) => (
                        <span key={idx} className="text-xs bg-white/20 rounded-full px-3 py-1">{feature}</span>
                      ))}
                    </div>
                    <button className="mt-4 w-full md:w-auto bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg text-sm font-semibold transition">
                      Join Merkato VIP →
                    </button>
                  </div>
                </Link>

                {/* Available Cities Grid */}
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🏙️</span> Available Cities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                  {cityVipPrograms.filter(c => c.available).map((city) => (
                    <Link key={city.id} href={`/cities/${city.id}`}>
                      <div className={`bg-gradient-to-r ${city.color} rounded-xl p-4 text-white hover:shadow-lg transition transform hover:scale-105 cursor-pointer`}>
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{city.icon}</div>
                          <div>
                            <h4 className="font-bold">{city.name}</h4>
                            <p className="text-xs opacity-80">{city.nameEn}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between items-center">
                          <span className="text-xs bg-white/20 rounded-full px-2 py-0.5">Up to {city.prize}</span>
                          <span className="text-sm">Join →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Coming Soon Cities */}
                {cityVipPrograms.filter(c => !c.available).length > 0 && (
                  <>
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>🚀</span> Coming Soon
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {cityVipPrograms.filter(c => !c.available).map((city) => (
                        <div key={city.id} className="bg-gray-100 rounded-xl p-3 text-center opacity-60 cursor-not-allowed">
                          <div className="text-2xl mb-1">{city.icon}</div>
                          <p className="font-semibold text-gray-700 text-sm">{city.name}</p>
                          <p className="text-xs text-gray-500">{city.nameEn}</p>
                          <span className="inline-block mt-1 text-[10px] bg-gray-300 text-gray-600 px-2 py-0.5 rounded-full">Coming Soon</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Regular Pools Section */}
            {filter !== 'vip' && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl">🏊</span>
                  <h2 className="text-2xl font-bold text-gray-800">Regular Pools</h2>
                  <span className="bg-green-100 text-green-600 text-xs px-2 py-1 rounded-full">Active Now</span>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                  </div>
                ) : displayPools.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 mb-4">No active pools at the moment</p>
                    <Link href="/create-pool" className="text-green-600 hover:text-green-700">
                      Create First Pool →
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayPools.map((pool) => (
                      <PoolCard 
                        key={pool.id} 
                        pool={pool} 
                        featured={pool.is_featured === true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIP Only View */}
            {filter === 'vip' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">👑</div>
                <p className="text-gray-500">Browse our VIP programs above</p>
                <button 
                  onClick={() => setFilter('all')}
                  className="mt-4 text-green-600 hover:text-green-700 font-medium"
                >
                  View all pools →
                </button>
              </div>
            )}
          </div>
        </div>
      </>
    </NoSSR>
  );
}
