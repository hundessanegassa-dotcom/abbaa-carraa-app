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
  const [filter, setFilter] = useState('all');
  const [showAllCities, setShowAllCities] = useState(false);

  // Complete City VIP Programs Data - ALL ACTIVE
  const cityVipPrograms = [
    // Major Cities
    { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', region: 'Central', population: '5M+', icon: '🏙️', color: 'from-blue-500 to-cyan-600', description: 'የኢትዮጵያ የንግድ ልብ | Heart of Ethiopian Commerce' },
    { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', region: 'Oromia', population: '3M+', icon: '🏗️', color: 'from-teal-500 to-green-600', description: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል | Smart City & Investment Hub' },
    { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', region: 'Dire Dawa', population: '535K+', icon: '🚂', color: 'from-green-500 to-teal-600', description: 'የንግድ እና የማኑፋክቸሪንግ ከተማ | Trade & Manufacturing Hub' },
    { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', region: 'Tigray', population: '500K+', icon: '🏭', color: 'from-purple-500 to-pink-600', description: 'ከፍተኛ የኢኮኖሚ ዕድገት | Highest GDP per Capita' },
    { id: 'adama', name: 'አዳማ', nameEn: 'Adama', region: 'Oromia', population: '500K+', icon: '🏭', color: 'from-orange-500 to-red-600', description: 'የኢንዱስትሪ እና የንግድ ከተማ | Industrial & Trade City' },
    { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', region: 'Sidama', population: '387K+', icon: '🏞️', color: 'from-teal-500 to-green-600', description: 'የኢንዱስትሪ ፓርክ ከተማ | Industrial Park City' },
    { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', region: 'Amhara', population: '350K+', icon: '🏰', color: 'from-amber-500 to-yellow-600', description: 'የባህል እና የቱሪዝም ከተማ | Culture & Tourism City' },
    { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', region: 'Amhara', population: '350K+', icon: '🏞️', color: 'from-cyan-500 to-blue-600', description: 'የቱሪዝም እና የጨርቃጨርቅ ከተማ | Tourism & Textile City' },
    { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', region: 'Oromia', population: '250K+', icon: '☕', color: 'from-emerald-500 to-green-600', description: 'የቡና እና የንግድ ከተማ | Coffee & Trade City' },
    { id: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte', region: 'Oromia', population: '150K+', icon: '☕', color: 'from-lime-500 to-green-600', description: 'የንግድ እና የቡና ከተማ | Trade & Coffee City' },
    { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', region: 'Amhara', population: '229K+', icon: '🛍️', color: 'from-rose-500 to-pink-600', description: 'የንግድ እና የእርሻ ከተማ | Trade & Agriculture City' },
    { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', region: 'Somali', population: '200K+', icon: '🐪', color: 'from-amber-500 to-orange-600', description: 'የንግድ እና የእንስሳት ከተማ | Trade & Livestock City' },
    { id: 'harar', name: 'ሀረር', nameEn: 'Harar', region: 'Harari', population: '150K+', icon: '🏛️', color: 'from-red-500 to-rose-600', description: 'የባህል እና የቱሪዝም ከተማ | Culture & Tourism City' },
    { id: 'kombolcha', name: 'ኮምቦልቻ', nameEn: 'Kombolcha', region: 'Amhara', population: '120K+', icon: '🏭', color: 'from-indigo-500 to-purple-600', description: 'የኢንዱስትሪ ዞን እና ደረቅ ወደብ | Industrial Zone & Dry Port' },
    { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', region: 'Oromia', population: '150K+', icon: '✈️', color: 'from-sky-500 to-blue-600', description: 'የሀይቆች ከተማ እና የአየር ሃይል ቤዝ | City of Lakes & Air Force Base' },
    { id: 'gelan', name: 'ገላን', nameEn: 'Gelan', region: 'Oromia', population: '200K+', icon: '🏘️', color: 'from-gray-500 to-gray-700', description: 'ፈጣን የከተማ ልማት | Rapid Urban Expansion' },
    { id: 'modjo', name: 'ሞጆ', nameEn: 'Modjo', region: 'Oromia', population: '120K+', icon: '🚛', color: 'from-stone-500 to-stone-700', description: 'የሎጂስቲክስ እና የደረቅ ወደብ ከተማ | Logistics & Dry Port City' },
    { id: 'metu', name: 'መቱ', nameEn: 'Metu', region: 'Oromia', population: '60K+', icon: '🌿', color: 'from-green-600 to-emerald-700', description: 'የቡና እና የግብርና ከተማ | Coffee & Agriculture City' },
    { id: 'meki', name: 'መቂ', nameEn: 'Meki', region: 'Oromia', population: '50K+', icon: '🌾', color: 'from-yellow-600 to-amber-700', description: 'የእህል እርሻ እና የንግድ ማዕከል | Grain Farming & Trade Center' },
    { id: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway', region: 'Oromia', population: '80K+', icon: '🐟', color: 'from-cyan-600 to-blue-700', description: 'የአሳ ማጥመድ እና የቱሪዝም ከተማ | Fishing & Tourism City' },
    { id: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene', region: 'Oromia', population: '150K+', icon: '🛍️', color: 'from-purple-600 to-indigo-700', description: 'የንግድ እና የኢንዱስትሪ ከተማ | Trade & Industrial City' },
    { id: 'robe', name: 'ሮቤ', nameEn: 'Robe', region: 'Oromia', population: '80K+', icon: '🌄', color: 'from-orange-600 to-red-700', description: 'የከፍተኛ ሀይላንድ ቱሪዝም | Highland Tourism Gateway' },
    { id: 'ambo', name: 'አምቦ', nameEn: 'Ambo', region: 'Oromia', population: '100K+', icon: '💧', color: 'from-blue-600 to-cyan-700', description: 'የማዕድን ውሃ እና የግብርና ከተማ | Mineral Water & Agriculture City' },
    { id: 'holeta', name: 'ሆሌታ', nameEn: 'Holeta', region: 'Oromia', population: '80K+', icon: '🌾', color: 'from-green-600 to-teal-700', description: 'የግብርና እና የሰልጠኛ ከተማ | Agriculture & Training Center' },
    { id: 'weliso', name: 'ወሊሶ', nameEn: 'Weliso', region: 'Oromia', population: '50K+', icon: '🏞️', color: 'from-amber-600 to-orange-700', description: 'የሙቀት ምንጭ እና የቱሪዝም ከተማ | Hot Springs & Tourism City' },
    { id: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch', region: 'South Ethiopia', population: '150K+', icon: '🏞️', color: 'from-teal-600 to-green-700', description: 'የቱሪዝም እና የግብርና ከተማ | Tourism & Agriculture City' },
    { id: 'sodo', name: 'ሶዶ', nameEn: 'Sodo', region: 'South Ethiopia', population: '150K+', icon: '🛍️', color: 'from-slate-600 to-gray-700', description: 'የንግድ እና የግብርና ከተማ | Trade & Agriculture City' },
    { id: 'butajira', name: 'ቡታጅራ', nameEn: 'Butajira', region: 'South Ethiopia', population: '80K+', icon: '🌽', color: 'from-lime-600 to-green-700', description: 'የግብርና እና የንግድ ከተማ | Agriculture & Trade City' },
    { id: 'welkite', name: 'ወልቂጤ', nameEn: 'Welkite', region: 'South Ethiopia', population: '70K+', icon: '🌾', color: 'from-yellow-600 to-amber-700', description: 'የግብርና እና የእርሻ ከተማ | Agriculture & Farming City' },
    { id: 'hosana', name: 'ሆሳና', nameEn: 'Hosana', region: 'South Ethiopia', population: '90K+', icon: '🌻', color: 'from-orange-600 to-red-700', description: 'የግብርና እና የንግድ ከተማ | Agriculture & Trade City' },
    { id: 'shindi', name: 'ሺንዲ', nameEn: 'Shindi', region: 'Benishangul', population: '100K+', icon: '🌾', color: 'from-green-600 to-emerald-700', description: 'የንግድ እና የግብርና ከተማ | Trade & Agriculture City' },
    { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', region: 'Benishangul', population: '100K+', icon: '🌿', color: 'from-emerald-600 to-green-700', description: 'የንግድ እና የግብርና ከተማ | Trade & Agriculture City' },
    { id: 'semera', name: 'ሰሜና ሸዋ', nameEn: 'Semera', region: 'Afar', population: '50K+', icon: '🐪', color: 'from-amber-600 to-yellow-700', description: 'የንግድ እና የእንስሳት ከተማ | Trade & Livestock City' },
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
    features: ['⭐ Daily 1,000,000 ETB', '🏆 Weekly 10,000,000 ETB', '👑 Monthly 40,000,000 ETB']
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
        return [];
      default:
        break;
    }
    
    return filtered;
  };

  const displayPools = getFilteredPools();
  const showVipSection = filter === 'all' || filter === 'vip' || filter === 'featured';
  const visibleCities = showAllCities ? cityVipPrograms : cityVipPrograms.slice(0, 12);

  return (
    <NoSSR>
      <>
        <Head>
          <title>Browse Prizes & VIP Programs - Abbaa Carraa</title>
          <meta name="description" content="Join regular pools or VIP programs in over 35 Ethiopian cities to win up to 40 Million ETB" />
        </Head>

        <div className="min-h-screen bg-gray-50 py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold text-center mb-2">Browse Opportunities</h1>
            <p className="text-center text-gray-600 mb-8">Join regular pools or VIP programs to win amazing prizes</p>
            
            {/* Filter Bar */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>All Pools</button>
              <button onClick={() => setFilter('featured')} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === 'featured' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>⭐ Featured</button>
              <button onClick={() => setFilter('vip')} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === 'vip' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>👑 VIP Programs</button>
              <button onClick={() => setFilter('lowToHigh')} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === 'lowToHigh' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Price: Low to High</button>
              <button onClick={() => setFilter('highToLow')} className={`px-4 py-2 rounded-full text-sm font-medium transition ${filter === 'highToLow' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Price: High to Low</button>
            </div>
            
            {/* VIP Programs Section */}
            {showVipSection && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl">👑</span>
                  <h2 className="text-2xl font-bold text-gray-800">VIP Programs</h2>
                  <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-2 py-1 rounded-full">Win up to 40 Million ETB</span>
                </div>
                
                {/* Merkato VIP Card */}
                <Link href="/merkato-vip">
                  <div className={`bg-gradient-to-r ${merkatoVip.color} rounded-2xl p-6 text-white hover:shadow-xl transition transform hover:scale-105 cursor-pointer mb-8`}>
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
                    <button className="mt-4 w-full md:w-auto bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg text-sm font-semibold transition">Join Merkato VIP →</button>
                  </div>
                </Link>

                {/* Ethiopian Cities VIP Grid */}
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🏙️</span> Ethiopian Cities VIP Programs
                  <span className="text-sm font-normal text-gray-500">({cityVipPrograms.length} Cities Active)</span>
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {visibleCities.map((city) => (
                    <Link key={city.id} href={`/cities/${city.id}`}>
                      <div className={`bg-gradient-to-r ${city.color} rounded-xl p-4 text-white hover:shadow-lg transition transform hover:scale-105 cursor-pointer h-full`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-3xl">{city.icon}</div>
                          <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">{city.population}</span>
                        </div>
                        <h4 className="font-bold text-lg">{city.name}</h4>
                        <p className="text-xs opacity-80">{city.nameEn}</p>
                        <p className="text-[11px] opacity-70 mt-1">{city.region}</p>
                        <p className="text-[10px] opacity-60 mt-1 line-clamp-2">{city.description}</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">Up to 40M ETB</span>
                          <span className="text-sm">Join →</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Show More / Show Less Button */}
                {cityVipPrograms.length > 12 && (
                  <div className="text-center mt-6">
                    <button
                      onClick={() => setShowAllCities(!showAllCities)}
                      className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1 mx-auto"
                    >
                      {showAllCities ? 'Show Less ↑' : `Show All ${cityVipPrograms.length} Cities ↓`}
                    </button>
                  </div>
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
                  <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>
                ) : displayPools.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-500 mb-4">No active pools at the moment</p>
                    <Link href="/create-pool" className="text-green-600 hover:text-green-700">Create First Pool →</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayPools.map((pool) => (
                      <PoolCard key={pool.id} pool={pool} featured={pool.is_featured === true} />
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
                <button onClick={() => setFilter('all')} className="mt-4 text-green-600 hover:text-green-700 font-medium">View all pools →</button>
              </div>
            )}
          </div>
        </div>
      </>
    </NoSSR>
  );
}
