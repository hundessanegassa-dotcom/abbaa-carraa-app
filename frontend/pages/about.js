import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function About() {
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_contributors: 0,
    total_agents: 0
  });

  useEffect(() => {
    fetchStats();
  }, []);

  async function fetchStats() {
    const [{ count: total_pools }, { count: total_winners }, { count: total_agents }] = await Promise.all([
      supabase.from('pools').select('*', { count: 'exact', head: true }),
      supabase.from('pools').select('*', { count: 'exact', head: true }).not('winner_id', 'is', null),
      supabase.from('agents').select('*', { count: 'exact', head: true })
    ]);
    
    setStats({ total_pools, total_winners, total_agents, total_contributors: 0 });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Abbaa Carraa</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Empowering communities through fair, transparent, and rewarding prize pools
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
<p className="text-gray-600 text-lg mb-8">
  Abbaa Carraa (<span className="font-semibold text-green-600 font-amharic">ባላ ኢዲል</span> - Opportunity Father) 
  was founded to democratize access to valuable prizes by allowing communities to pool 
  small contributions for a chance to win big.
</p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold text-green-600">{stats.total_pools}+</div>
              <div className="text-gray-600">Active Pools</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">{stats.total_winners}+</div>
              <div className="text-gray-600">Happy Winners</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">{stats.total_agents}+</div>
              <div className="text-gray-600">Trusted Agents</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600">100%</div>
              <div className="text-gray-600">Transparent</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">How Abbaa Carraa Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">1</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Join a Pool</h3>
            <p className="text-gray-600">Browse active prize pools in your city and choose your favorite</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Contribute</h3>
            <p className="text-gray-600">Make a small contribution via Telebirr or CBE Birr</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Win & Celebrate</h3>
            <p className="text-gray-600">Fair draw selects winner when pool reaches target</p>
          </div>
        </div>
      </section>

      {/* For Agents Section */}
      <section className="bg-gray-100 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Become an Agent</h2>
            <p className="text-gray-600 mb-6">
              Are you a business owner, real estate agent, car dealer, or community leader?
              Partner with Abbaa Carraa to list prizes and earn commissions.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <div className="bg-white rounded-lg p-4 flex-1">
                <h3 className="font-bold mb-2">💰 Earn 10% Commission</h3>
                <p className="text-sm text-gray-600">On every pool you create</p>
              </div>
              <div className="bg-white rounded-lg p-4 flex-1">
                <h3 className="font-bold mb-2">🎁 Offer Discounts</h3>
                <p className="text-sm text-gray-600">To your pool participants</p>
              </div>
              <div className="bg-white rounded-lg p-4 flex-1">
                <h3 className="font-bold mb-2">📈 Grow Your Business</h3>
                <p className="text-sm text-gray-600">Reach thousands of potential customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
