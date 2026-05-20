import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import PoolCard from '../components/PoolCard';
import LoadingSpinner from '../components/LoadingSpinner';
import CashEquivalentBanner from '../components/CashEquivalentBanner';
import CharityBanner from '../components/CharityBanner';

// Dynamic imports for non-critical components
const MovingAd = dynamic(() => import('../components/MovingAd'), { ssr: false });
const SimpleFilters = dynamic(() => import('../components/SimpleFilters'), { ssr: false });
const RoleBanners = dynamic(() => import('../components/RoleBanners'), { ssr: false });
const Testimonials = dynamic(() => import('../components/Testimonials'), { ssr: false });
const NewsletterSubscribe = dynamic(() => import('../components/NewsletterSubscribe'), { ssr: false });

export async function getServerSideProps() {
  return { props: {} };
}

export default function Home() {
  const { t } = useTranslation();
  const [pools, setPools] = useState([]);
  const [filteredPools, setFilteredPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({ category: 'all', city: 'all' });
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_agents: 0,
    total_raised: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (pools.length > 0) {
      applyFilters(activeFilters);
    }
  }, [pools, activeFilters]);

  async function loadData() {
    try {
      setLoading(true);
      
      // 🔥 CRITICAL: Add timeout protection (5 seconds max)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Loading timeout')), 5000)
      );
      
      await Promise.race([
        Promise.all([fetchStats(), fetchPools()]),
        timeoutPromise
      ]);
      
    } catch (error) {
      console.error('Loading error:', error);
      // Don't show error to user, just show empty state
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      // 🔥 SIMPLIFIED: Only fetch one stat to avoid multiple slow queries
      const { count } = await supabase
        .from('pools')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      setStats({
        total_pools: count || 0,
        total_winners: 0,
        total_agents: 0,
        total_raised: 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function fetchPools() {
    try {
      // 🔥 SIMPLIFIED: Fetch fewer pools, no complex ordering
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .limit(12);  // Only 12 pools initially
      
      if (error) throw error;
      setPools(data || []);
      setFeaturedPools(data?.filter(pool => pool.is_featured === true) || []);
      setFilteredPools(data || []);
    } catch (error) {
      console.error('Error loading pools:', error);
    }
  }

  const applyFilters = async (filters) => {
    setActiveFilters(filters);
    let filtered = [...pools];
    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }
    if (filters.city !== 'all') {
      filtered = filtered.filter(p => p.city === filters.city);
    }
    setFilteredPools(filtered);
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading amazing prizes..." />;
  }

  return (
    <>
      <Head>
        <title>Abbaa Carraa - Win Amazing Prizes</title>
        <meta name="description" content="Win amazing prizes through community savings. 2% supports kidney & heart disease patients." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <CashEquivalentBanner />
        <CharityBanner />

        {/* Hero Section */}
        <div className="w-full bg-gradient-to-br from-green-700 to-teal-700">
          <img 
            src="/images/abbaa-carraa-bg.png"
            alt="Abbaa Carraa"
            className="w-full h-auto object-cover block"
            loading="eager"
            fetchPriority="high"
            style={{ maxHeight: '500px', objectPosition: 'center' }}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* Text Content */}
        <div className="bg-white py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold mb-5">
              🔥 Ethiopia's #1 Prize Platform 🏆
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900">
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Link href="/register" className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-3.5 rounded-full font-semibold text-lg shadow-lg">
                🎁 Start Winning Now →
              </Link>
              <Link href="/become-agent" className="bg-white border-2 border-gray-200 text-gray-700 px-8 py-3.5 rounded-full font-semibold text-lg shadow-md hover:border-green-500">
                👑 Become an Agent →
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-10 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">✓ Cash Guarantee</div>
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">✓ Blockchain Verified</div>
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">💚 2% for Health</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white py-12 border-t border-gray-200">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div><div className="text-3xl font-bold text-green-600">{stats.total_pools}+</div><div className="text-gray-500">Active Pools</div></div>
              <div><div className="text-3xl font-bold text-green-600">{stats.total_winners}+</div><div className="text-gray-500">Winners</div></div>
              <div><div className="text-3xl font-bold text-green-600">{stats.total_agents}+</div><div className="text-gray-500">Agents</div></div>
              <div><div className="text-3xl font-bold text-green-600">ETB {Math.floor(stats.total_raised / 1000)}K+</div><div className="text-gray-500">Raised</div></div>
            </div>
          </div>
        </div>

        <MovingAd />
        <AdvertisingBanner />
        <SimpleFilters onFilterChange={applyFilters} />

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

        {/* All Pools */}
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-center mb-8">Active Prize Pools</h2>
          {filteredPools.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No pools found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPools.map(pool => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          )}
        </section>

        <RoleBanners />
        <Testimonials />
        <NewsletterSubscribe />

        {/* How It Works */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">1</div>
                <h3 className="font-bold text-xl mb-2">Find a Pool</h3>
                <p className="text-gray-600">Browse available prize pools</p>
              </div>
              <div>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">2</div>
                <h3 className="font-bold text-xl mb-2">Contribute</h3>
                <p className="text-gray-600">Make your contribution securely</p>
              </div>
              <div>
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">3</div>
                <h3 className="font-bold text-xl mb-2">Win!</h3>
                <p className="text-gray-600">Win amazing prizes!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
