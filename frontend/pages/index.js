import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_agents: 0,
    total_raised: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    try {
      const results = await Promise.allSettled([
        supabase.from('pools').select('*', { count: 'exact', head: true }),
        supabase.from('pools').select('*', { count: 'exact', head: true }).not('winner_id', 'is', null),
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('contributions').select('amount').eq('status', 'completed')
      ]);
      
      setStats({
        total_pools: results[0]?.value?.count || 0,
        total_winners: results[1]?.value?.count || 0,
        total_agents: results[2]?.value?.count || 0,
        total_raised: (results[3]?.value?.data || []).reduce((sum, c) => sum + (c.amount || 0), 0)
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Loading..." />;
  }

  return (
    <>
      <Head>
        <title>Abbaa Carraa - Win Amazing Prizes</title>
        <meta name="description" content="Win amazing prizes through community savings. 2% supports kidney & heart disease patients." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen flex flex-col">
        {/* Hero Section - Simple, No External Image */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="text-6xl md:text-7xl mb-4">🎁🏆🎉</div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">Abbaa Carraa</h1>
            <p className="text-xl md:text-2xl mb-6">Ethiopia's #1 Prize Platform</p>
            <p className="text-green-100 mb-8">Win cars, houses, electronics, and more!</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition">
                🎁 Start Winning
              </Link>
              <Link href="/login" className="bg-white/20 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/30 transition border border-white/30">
                👑 Login
              </Link>
            </div>
            <p className="mt-8 text-green-100">💚 2% supports kidney & heart disease patients</p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.total_pools}+</div>
                <div className="text-gray-500">Active Pools</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.total_winners}+</div>
                <div className="text-gray-500">Winners</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">{stats.total_agents}+</div>
                <div className="text-gray-500">Agents</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">ETB {Math.floor(stats.total_raised / 1000)}K+</div>
                <div className="text-gray-500">Raised</div>
              </div>
            </div>
          </div>
        </div>

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

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Win?</h2>
            <Link href="/register" className="bg-white text-green-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition inline-block">
              Join Now →
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
