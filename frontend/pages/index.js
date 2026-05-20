import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Dynamic imports with no loading state
const MovingAd = dynamic(() => import('../components/MovingAd'), { ssr: false, loading: () => null });
const SimpleFilters = dynamic(() => import('../components/SimpleFilters'), { ssr: false, loading: () => null });
const RoleBanners = dynamic(() => import('../components/RoleBanners'), { ssr: false, loading: () => null });
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

  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all stats
        const [poolsResult, winnersResult, agentsResult, contributionsResult] = await Promise.all([
          supabase.from('pools').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabase.from('pools').select('*', { count: 'exact', head: true }).not('winner_id', 'is', null),
          supabase.from('agents').select('*', { count: 'exact', head: true }),
          supabase.from('contributions').select('amount').eq('status', 'completed')
        ]);
        
        const total_raised = (contributionsResult.data || []).reduce((sum, c) => sum + (c.amount || 0), 0);
        
        setStats({
          total_pools: poolsResult.count || 0,
          total_winners: winnersResult.count || 0,
          total_agents: agentsResult.count || 0,
          total_raised: total_raised
        });
        
        // Fetch ONLY pools with images
        const { data } = await supabase
          .from('pools')
          .select('*')
          .eq('status', 'active')
          .not('image_url', 'is', null)  // 🔥 ONLY pools with images
          .not('image_url', 'eq', '')     // 🔥 Exclude empty strings
          .limit(12);
        
        setPools(data || []);
        
        // Featured pools: pools with images AND is_featured = true
        setFeaturedPools(data?.filter(pool => pool.is_featured === true && pool.image_url) || []);
        
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setDataLoaded(true);
      }
    };
    
    loadData();
  }, []);

  return (
    <>
      <Head>
        <title>Abbaa Carraa - Win Amazing Prizes</title>
        <meta name="description" content="Win amazing prizes through community savings. 2% supports kidney & heart disease patients." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-white">
        <CashEquivalentBanner />
        <CharityBanner />

        {/* ========== HERO SECTION ========== */}
        {/* DIV 1: IMAGE ONLY - Full width */}
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

        {/* DIV 2: TEXT CONTENT ONLY */}
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
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">✓ 24/7 Support</div>
            </div>
          </div>
        </div>

        {/* ========== FULL STATS SECTION ========== */}
        <div className="bg-white border-t border-gray-200 py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.total_pools}+</div>
                <div className="text-gray-500 text-sm">Active Pools</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.total_winners}+</div>
                <div className="text-gray-500 text-sm">Happy Winners</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.total_agents}+</div>
                <div className="text-gray-500 text-sm">Trusted Agents</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">ETB {Math.floor(stats.total_raised / 1000)}K+</div>
                <div className="text-gray-500 text-sm">Total Raised</div>
              </div>
            </div>
          </div>
        </div>

        <MovingAd />
        <AdvertisingBanner />
        <SimpleFilters onFilterChange={() => {}} />

        {/* ========== FEATURED POOLS (ONLY WITH IMAGES) ========== */}
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

        {/* ========== ALL ACTIVE POOLS (ONLY WITH IMAGES) ========== */}
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

        <RoleBanners />
        <Testimonials />
        <NewsletterSubscribe />

        {/* ========== HOW IT WORKS ========== */}
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
