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
  const [stats, setStats] = useState({ total_pools: 0 });
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Load data in background - no loading spinner
    const loadData = async () => {
      try {
        const { count } = await supabase
          .from('pools')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');
        
        const { data } = await supabase
          .from('pools')
          .select('*')
          .eq('status', 'active')
          .limit(12);
        
        setPools(data || []);
        setStats({ total_pools: count || 0 });
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
      </Head>

      <div className="min-h-screen bg-white">
        <CashEquivalentBanner />
        <CharityBanner />

       {/* Hero Section with Image - No Blink */}
<div className="relative">
  <div className="bg-gradient-to-r from-green-600 to-teal-600">
    <img 
      src="/images/abbaa-carraa-bg.png"
      alt="Abbaa Carraa"
      className="w-full h-auto object-cover block opacity-90"
      loading="eager"
      style={{ maxHeight: '400px' }}
      onError={(e) => {
        e.target.style.display = 'none';
      }}
    />
  </div>
  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
    <div className="text-center text-white px-4">
      <h1 className="text-4xl md:text-6xl font-bold">Abbaa Carraa</h1>
      <p className="text-xl mt-2">Ethiopia's #1 Prize Platform</p>
      <div className="mt-4 flex gap-4 justify-center">
        <Link href="/register" className="bg-white text-green-600 px-6 py-2 rounded-full font-semibold">
          Start Winning →
        </Link>
        <Link href="/become-agent" className="border border-white text-white px-6 py-2 rounded-full font-semibold">
          Become Agent →
        </Link>
      </div>
    </div>
  </div>
</div>
        <MovingAd />
        <AdvertisingBanner />
        <SimpleFilters onFilterChange={() => {}} />

        {/* Pools Grid - Shows immediately with placeholder if no data yet */}
        <div className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-center mb-8">Active Prize Pools</h2>
          {pools.length === 0 && !dataLoaded ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="bg-gray-100 rounded-xl h-64 animate-pulse"></div>
              ))}
            </div>
          ) : pools.length === 0 ? (
            <p className="text-center text-gray-500">No pools available</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pools.map(pool => (
                <PoolCard key={pool.id} pool={pool} />
              ))}
            </div>
          )}
        </div>

        <RoleBanners />
        <Testimonials />
        <NewsletterSubscribe />

        {/* How It Works */}
        <div className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">1</div><h3 className="font-bold text-xl mb-2">Find a Pool</h3><p className="text-gray-600">Browse available prize pools</p></div>
              <div><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">2</div><h3 className="font-bold text-xl mb-2">Contribute</h3><p className="text-gray-600">Make your contribution securely</p></div>
              <div><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">3</div><h3 className="font-bold text-xl mb-2">Win!</h3><p className="text-gray-600">Win amazing prizes!</p></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
