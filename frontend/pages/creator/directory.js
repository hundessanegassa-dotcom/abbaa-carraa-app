// pages/creator/directory.js - Creator Directory Page
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import NoSSR from '../../components/NoSSR';

export default function CreatorDirectory() {
  const [language, setLanguage] = useState('am');
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all'); // all, top, new
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
    loadCreators();
    getUser();
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const getUser = async () => {
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
      console.error('Error getting user:', error);
    }
  };

  const loadCreators = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pool_creators')
        .select(`
          *,
          pools:pools(count)
        `)
        .eq('verification_status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add pool count
      const creatorsWithCount = await Promise.all((data || []).map(async (creator) => {
        const { count } = await supabase
          .from('pools')
          .select('*', { count: 'exact', head: true })
          .eq('creator_id', creator.id);
        
        return {
          ...creator,
          pool_count: count || 0
        };
      }));

      setCreators(creatorsWithCount || []);
    } catch (error) {
      console.error('Error loading creators:', error);
    } finally {
      setLoading(false);
    }
  };

  const t = (am, en) => language === 'am' ? am : en;

  const filteredCreators = creators.filter(creator => {
    const search = searchTerm.toLowerCase();
    return creator.business_name?.toLowerCase().includes(search) ||
           creator.full_name?.toLowerCase().includes(search) ||
           creator.city?.toLowerCase().includes(search) ||
           creator.location?.toLowerCase().includes(search);
  });

  const sortedCreators = [...filteredCreators];
  if (filter === 'top') {
    sortedCreators.sort((a, b) => (b.pool_count || 0) - (a.pool_count || 0));
  } else if (filter === 'new') {
    sortedCreators.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  if (loading) {
    return <LoadingSpinner fullPage message={t('በመጫን ላይ...', 'Loading...')} />;
  }

  return (
    <NoSSR>
      <>
        <Head>
          <title>{t('👥 የፑል ፈጣሪዎች', '👥 Pool Creators')} - Abbaa Carraa</title>
        </Head>

        <DashboardLayout
          title={t('👥 የፑል ፈጣሪዎች', '👥 Pool Creators')}
          subtitle={t('በአባ ካራ ላይ ያሉ ፈጣሪዎችን ይመልከቱ', 'View creators on Abbaa Carraa')}
          icon="👥"
          bgGradient="from-purple-600 to-pink-500"
          user={user}
          profile={profile}
          language={language}
          toggleLanguage={toggleLanguage}
        >
          <div className="max-w-6xl mx-auto">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex-1 min-w-[200px]">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('🔍 ፈጣሪ ፈልግ...', '🔍 Search creators...')}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {t('ሁሉም', 'All')}
                </button>
                <button
                  onClick={() => setFilter('top')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'top' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ⭐ {t('ከፍተኛ', 'Top')}
                </button>
                <button
                  onClick={() => setFilter('new')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filter === 'new' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🆕 {t('አዲስ', 'New')}
                </button>
              </div>
            </div>

            {/* Results Count */}
            <p className="text-sm text-gray-500 mb-4">
              {t(`${sortedCreators.length} ፈጣሪዎች ተገኙ`, `${sortedCreators.length} creators found`)}
            </p>

            {/* Creator Cards */}
            {sortedCreators.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-md">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-600">
                  {t('ምንም ፈጣሪዎች አልተገኙም', 'No creators found')}
                </h3>
                <p className="text-gray-400 mt-2">
                  {t('ከፈለጉት ጋር የሚዛመድ ፈጣሪ አልተገኘም', 'No creators match your search')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCreators.map((creator) => (
                  <div key={creator.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden border border-gray-100">
                    {/* Banner Image */}
                    <div className="h-32 bg-gradient-to-r from-green-400 to-teal-500 relative">
                      {creator.shop_banner_url ? (
                        <img 
                          src={creator.shop_banner_url} 
                          alt={creator.business_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-r from-green-500 to-teal-500">
                          🏪
                        </div>
                      )}
                      <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                        {creator.pool_count || 0} {t('ፑሎች', 'pools')}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{creator.business_name}</h3>
                          <p className="text-sm text-gray-500">{creator.city || creator.location}</p>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <span>⭐</span>
                          <span className="text-sm font-medium text-gray-700">{creator.rating || 0}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {creator.bio || t('እንኳን ወደ መደብሬ በደህና መጡ!', 'Welcome to my shop!')}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          ✅ {t('የተረጋገጠ', 'Verified')}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                          📦 {creator.pool_count || 0} {t('ፑሎች', 'pools')}
                        </span>
                      </div>

                      <Link
                        href={`/creator/${creator.id}`}
                        className="mt-4 w-full block text-center bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-2 rounded-lg font-semibold text-sm transition"
                      >
                        {t('👀 መደብር ይመልከቱ', '👀 View Shop')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DashboardLayout>
      </>
    </NoSSR>
  );
}
