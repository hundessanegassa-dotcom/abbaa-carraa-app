import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import Head from 'next/head';
import { useTranslation } from 'react-i18next';
import PoolCard from '../components/PoolCard';

export async function getServerSideProps() {
  return { props: {} };
}

export default function Listings() {
  const { t } = useTranslation();
  const [pools, setPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, featured, lowToHigh, highToLow

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
      default:
        break;
    }
    
    return filtered;
  };

  const displayPools = getFilteredPools();

  return (
    <>
      <Head>
        <title>{t('common.browse_prizes')} - Abbaa Carraa</title>
        <meta name="description" content={t('common.tagline')} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-2">{t('common.browse_prizes')}</h1>
          <p className="text-center text-gray-600 mb-8">{t('common.join_prize_pools')}</p>
          
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
          
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : displayPools.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500 mb-4">{t('pools.no_pools')}</p>
              <Link href="/create-pool" className="text-green-600 hover:text-green-700">
                {t('common.create_first_pool')} →
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
      </div>
    </>
  );
}
