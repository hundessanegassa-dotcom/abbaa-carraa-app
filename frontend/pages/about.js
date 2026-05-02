import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function About() {
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
    const [{ count: total_pools }, { count: total_winners }, { count: total_agents }, contributionsResult] = await Promise.all([
      supabase.from('pools').select('*', { count: 'exact', head: true }),
      supabase.from('pools').select('*', { count: 'exact', head: true }).not('winner_id', 'is', null),
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('contributions').select('amount').eq('status', 'completed')
    ]);
    
    const total_raised = contributionsResult.data?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    
    setStats({ total_pools, total_winners, total_agents, total_raised });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-700 to-blue-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Abbaa Carraa</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Ethiopia's first community-driven prize platform – building dreams one contribution at a time
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-600 text-lg mb-6">
            Abbaa Carraa (<span className="font-semibold text-green-600">ባላ ኢዲል</span> - "Opportunity Father") 
            was founded to democratize access to valuable prizes by allowing communities to pool 
            small contributions for a chance to win big – whether a car, laptop, machinery, furniture, or cash prize.
          </p>
          <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500 text-left">
            <p className="text-sm font-semibold text-green-800">📌 Our Promise:</p>
            <p className="text-sm text-gray-700">Every draw is fair, verifiable, and transparent. Winners receive their prizes within 14 days. Creators earn commissions for building community.</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 shadow-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">Our Impact So Far</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-green-600">{stats.total_pools}+</div>
              <div className="text-gray-600">Active Pools</div>
              <p className="text-xs text-gray-400 mt-1">prize opportunities</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">{stats.total_winners}+</div>
              <div className="text-gray-600">Happy Winners</div>
              <p className="text-xs text-gray-400 mt-1">dreams fulfilled</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">{stats.total_agents}+</div>
              <div className="text-gray-600">Trusted Agents</div>
              <p className="text-xs text-gray-400 mt-1">business partners</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">{Math.floor(stats.total_raised / 1000)}K+</div>
              <div className="text-gray-600">ETB Raised</div>
              <p className="text-xs text-gray-400 mt-1">community contributions</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">How Abbaa Carraa Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-green-600">1</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Find a Pool</h3>
            <p className="text-gray-600">Browse active prize pools by city or category – cars, electronics, furniture, machinery, and more</p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-left">
              <p className="text-xs text-gray-500">📌 Example</p>
              <p className="text-sm">Filter by "Addis Ababa" and "Vehicles" to see all car pools near you</p>
            </div>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Contribute</h3>
            <p className="text-gray-600">Make a small contribution via Telebirr or CBE Birr – the more you contribute, the higher your chance to win</p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-left">
              <p className="text-xs text-gray-500">📌 Example</p>
              <p className="text-sm">Contribute 1,000 ETB for 2 tickets (500 ETB each) for double the winning chance</p>
            </div>
          </div>
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Win & Celebrate</h3>
            <p className="text-gray-600">Fair, cryptographically secure draw selects winner when pool reaches target. Get SMS/Email notification immediately</p>
            <div className="mt-3 p-3 bg-gray-50 rounded-lg text-left">
              <p className="text-xs text-gray-500">📌 Example</p>
              <p className="text-sm">Pool reaches 500,000 ETB → Draw runs automatically → Winner receives SMS within seconds</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Agents Section */}
      <section className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Become a Pool Creator</h2>
            <p className="text-gray-600 mb-6">
              Are you a business owner, real estate agent, car dealer, manufacturer, or community leader?
              Partner with Abbaa Carraa to list prizes and earn commissions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl mb-2">💰</div>
                <h3 className="font-bold mb-1">Earn 10% Commission</h3>
                <p className="text-sm text-gray-600">On every pool you create. Add 20% to your target, keep half!</p>
                <p className="text-xs text-gray-400 mt-2">Example: 500K target → 100K commission</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl mb-2">🎁</div>
                <h3 className="font-bold mb-1">Offer Discounts to Non-Winners</h3>
                <p className="text-sm text-gray-600">Turn participants into customers with 5-50% discounts</p>
                <p className="text-xs text-gray-400 mt-2">Example: 20% off for all participants</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-3xl mb-2">📈</div>
                <h3 className="font-bold mb-1">Grow Your Business</h3>
                <p className="text-sm text-gray-600">Reach thousands of potential customers across Ethiopia</p>
                <p className="text-xs text-gray-400 mt-2">Example: 500+ engaged participants per pool</p>
              </div>
            </div>
            <Link href="/register">
              <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition">
                Start Creating Pools →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Our Core Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🔍</div>
            <h3 className="font-bold mb-1">Transparency</h3>
            <p className="text-sm text-gray-600">Every draw is verifiable and publicly auditable</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🤝</div>
            <h3 className="font-bold mb-1">Community</h3>
            <p className="text-sm text-gray-600">Powered by collective contributions from people like you</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">💪</div>
            <h3 className="font-bold mb-1">Empowerment</h3>
            <p className="text-sm text-gray-600">Agents earn commissions, contributors win prizes</p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">📱</div>
            <h3 className="font-bold mb-1">Innovation</h3>
            <p className="text-sm text-gray-600">Seamless mobile payments with Telebirr & CBE Birr</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="mb-6">Join thousands of Ethiopians already participating in prize pools</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
                Create Free Account
              </button>
            </Link>
            <Link href="/listings">
              <button className="border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/10 transition">
                Browse Prize Pools
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
