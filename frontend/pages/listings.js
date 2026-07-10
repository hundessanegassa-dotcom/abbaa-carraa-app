// pages/listings.js - REGULAR POOLS ONLY (No Merkato or City VIP)
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import Head from 'next/head';
import toast from 'react-hot-toast';
import NoSSR from '../components/NoSSR';
import PoolCard from '../components/PoolCard';
import DashboardLayout from '../components/DashboardLayout';

export default function Listings() {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('am');
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [is3D, setIs3D] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    sort: 'newest'
  });
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
    checkUser();
    loadPools();
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const toggle3D = () => {
    setIs3D(!is3D);
  };

  const toggleView = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const get3DTransform = () => {
    if (!is3D) return 'none';
    if (isHovered) {
      return `perspective(800px) rotateY(${rotation}deg) scale(1.01)`;
    }
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        setProfile(profile);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  }

  async function loadPools() {
    setLoading(true);
    try {
      console.log('🔄 Loading pools...');
      
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Pools query error:', error);
        toast.error(language === 'am' ? 'ፑሎችን መጫን አልተቻለም' : 'Failed to load pools');
        setPools([]);
        setLoading(false);
        return;
      }

      console.log(`✅ Loaded ${data?.length || 0} pools`);
      setPools(data || []);
      
      if (data?.length === 0) {
        toast.info(language === 'am' ? 'ምንም ንቁ ፑሎች የሉም' : 'No active pools available');
      }
    } catch (error) {
      console.error('❌ Error loading pools:', error);
      toast.error(language === 'am' ? 'ፑሎችን መጫን አልተቻለም' : 'Failed to load pools');
      setPools([]);
    } finally {
      setLoading(false);
    }
  }

  const getFilteredPools = () => {
    let filtered = [...pools];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pool =>
        pool.prize_name?.toLowerCase().includes(term) ||
        pool.description?.toLowerCase().includes(term)
      );
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(pool =>
        pool.category === filters.category
      );
    }

    switch (filters.sort) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'prize_high':
        filtered.sort((a, b) => (b.target_amount || 0) - (a.target_amount || 0));
        break;
      case 'prize_low':
        filtered.sort((a, b) => (a.target_amount || 0) - (b.target_amount || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.current_amount || 0) - (a.current_amount || 0));
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredPools = getFilteredPools();
  const categories = ['all', ...new Set(pools.map(p => p.category).filter(Boolean))];

  return (
    <NoSSR>
      <>
        <Head>
          <title>{language === 'am' ? 'መደበኛ የእጣ መደቦች' : 'Regular Prize Pools'} - Abbaa Carraa</title>
          <meta name="description" content="Win cars, houses, machinery, electronics and more through community savings pools" />
        </Head>

        <DashboardLayout
          title={language === 'am' ? '🏊 መደበኛ የእጣ መደቦች' : '🏊 Regular Prize Pools'}
          subtitle={language === 'am' 
            ? 'መኪና፣ ቤት፣ ማሽነሪ እና ኤሌክትሮኒክስ ለማሸነፍ ይቀላቀሉ' 
            : 'Win Cars, Houses, Machinery & Electronics'}
          icon="🏊"
          bgGradient="from-green-600 to-teal-500"
          user={user}
          profile={profile}
          language={language}
          toggleLanguage={toggleLanguage}
          show3D={is3D}
        >
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={toggle3D}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  is3D 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {is3D ? '🔄 3D ON' : '🔄 3D OFF'}
              </button>
              <button
                onClick={toggleView}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 transition"
              >
                {viewMode === 'grid' ? '📋 List View' : '📱 Grid View'}
              </button>
              <button
                onClick={loadPools}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-700 text-white transition"
              >
                🔄 Refresh
              </button>
            </div>

            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder={language === 'am' ? '🔍 ፑሎችን ፈልግ...' : '🔍 Search pools...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className="text-sm font-medium text-gray-600">
              {language === 'am' ? 'ምድብ:' : 'Category:'}
            </span>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="all">{language === 'am' ? 'ሁሉም' : 'All'}</option>
              {categories.filter(c => c !== 'all').map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <span className="text-sm font-medium text-gray-600 ml-4">
              {language === 'am' ? 'ደርድር:' : 'Sort:'}
            </span>
            <select
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
              className="border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500"
            >
              <option value="newest">{language === 'am' ? 'አዲስ' : 'Newest'}</option>
              <option value="oldest">{language === 'am' ? 'አሮጌ' : 'Oldest'}</option>
              <option value="prize_high">{language === 'am' ? 'ሽልማት ከፍተኛ' : 'Prize: High'}</option>
              <option value="prize_low">{language === 'am' ? 'ሽልማት ዝቅተኛ' : 'Prize: Low'}</option>
              <option value="popular">{language === 'am' ? 'ታዋቂ' : 'Popular'}</option>
            </select>

            <span className="text-sm text-gray-500 ml-auto">
              {filteredPools.length} {language === 'am' ? 'ፑሎች' : 'pools'}
              {searchTerm && ` (${language === 'am' ? 'ተገኘ' : 'found'})`}
            </span>
          </div>

          <div 
            className="transition-all duration-500"
            style={{
              transform: get3DTransform(),
              transformStyle: 'preserve-3d',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : filteredPools.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-md">
                <div className="text-6xl mb-4">🏊</div>
                <h3 className="text-xl font-semibold text-gray-600">
                  {language === 'am' ? 'ምንም ፑሎች የሉም' : 'No pools available'}
                </h3>
                <p className="text-gray-400 mt-2">
                  {language === 'am' 
                    ? searchTerm ? 'ከፈለጉት ጋር የሚዛመድ ምንም ፑል አልተገኘም' : 'በቅርቡ አዳዲስ ፑሎች ይመጣሉ'
                    : searchTerm ? 'No pools match your search' : 'New pools coming soon'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-4 text-green-600 hover:text-green-700 font-medium"
                  >
                    {language === 'am' ? 'ፍለጋን አጽዳ' : 'Clear search'}
                  </button>
                )}
                <button
                  onClick={loadPools}
                  className="mt-4 ml-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  🔄 {language === 'am' ? 'እንደገና ይሞክሩ' : 'Try Again'}
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPools.map((pool) => (
                  <PoolCard 
                    key={pool.id} 
                    pool={pool} 
                    featured={pool.is_featured === true} 
                    language={language}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPools.map((pool) => (
                  <div key={pool.id} className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-48 h-48 bg-gray-200 relative">
                        {pool.image_url ? (
                          <img src={pool.image_url} alt={pool.prize_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-100 to-gray-200">
                            🎁
                          </div>
                        )}
                        {pool.is_featured && (
                          <span className="absolute top-2 left-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            ⭐ Featured
                          </span>
                        )}
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-gray-800">{pool.prize_name}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2">{pool.description}</p>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm">
                            <span>💰 <span className="font-bold text-green-600">ETB {pool.target_amount?.toLocaleString()}</span></span>
                            <span>🎫 <span className="font-bold">ETB {pool.entry_fee?.toLocaleString()}</span></span>
                            <span>📊 <span className="font-bold">{Math.min(Math.round((pool.current_amount / pool.target_amount) * 100), 100)}%</span></span>
                          </div>
                        </div>
                        <Link href={`/pools/${pool.id}`} className="mt-3 bg-green-600 hover:bg-green-700 text-white text-center py-2 rounded-lg font-semibold text-sm transition">
                          {language === 'am' ? 'ይቀላቀሉ →' : 'Join Pool →'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 bg-white rounded-2xl shadow-md p-4 text-center">
            <p className="text-sm text-gray-500">
              {language === 'am' 
                ? `📊 በአጠቃላይ ${pools.length} ንቁ ፑሎች • ${filteredPools.length} ከፍለጋዎ ጋር ይዛመዳሉ`
                : `📊 ${pools.length} active pools • ${filteredPools.length} match your filters`}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {language === 'am' 
                ? '💚 2% የኩላሊት እና የልብ ህሙማንን ይደግፋል'
                : '💚 2% supports kidney & heart disease patients'}
            </p>
          </div>
        </DashboardLayout>
      </>
    </NoSSR>
  );
}
