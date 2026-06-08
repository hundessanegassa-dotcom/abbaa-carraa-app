// pages/about.js - UPDATED WITH ALL THREE PROGRAMS
import BackButton from '../components/BackButton';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export async function getServerSideProps() {
  return { props: {} };
}

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
          <div className="mb-4"><BackButton /></div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Abbaa Carraa</h1>
          <p className="text-xl max-w-2xl mx-auto">
            Ethiopia's premier platform for Merkato VIP, City VIP & Regular Prize Pools
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-600 text-lg">
            Abbaa Carraa brings together Merkato's 7,100+ businesses, 94+ Ethiopian cities, and regular contributors 
            to win amazing prizes through community savings. Everyone has a chance to win big!
          </p>
        </div>
      </section>

      {/* Three Programs Overview */}
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold text-center mb-8">Our Three Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Merkato VIP */}
          <div className="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-5xl mb-3">🏪</div>
            <h3 className="text-2xl font-bold mb-2">Merkato VIP</h3>
            <p className="text-sm opacity-90 mb-3">Special program for Merkato traders</p>
            <div className="space-y-2 text-sm">
              <p>⭐ Daily: 1,000,000 ETB</p>
              <p>🏆 Weekly: 10,000,000 ETB</p>
              <p>👑 Monthly: 40,000,000 ETB</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/20">
              <p className="text-xs">7,100+ Businesses | 13,000+ Workers</p>
            </div>
          </div>

          {/* City VIP */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl p-6 text-white shadow-lg">
            <div className="text-5xl mb-3">🏙️</div>
            <h3 className="text-2xl font-bold mb-2">City VIP</h3>
            <p className="text-sm opacity-90 mb-3">Exclusive city-based programs</p>
            <div className="space-y-2 text-sm">
              <p>⭐ Daily: 1,000,000 ETB</p>
              <p>🏆 Weekly: 10,000,000 ETB</p>
              <p>👑 Monthly: 40,000,000 ETB</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/20">
              <p className="text-xs">94+ Ethiopian Cities | Nationwide</p>
            </div>
          </div>

          {/* Regular Pools */}
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
            <div className="text-5xl mb-3">🏊</div>
            <h3 className="text-2xl font-bold mb-2">Regular Pools</h3>
            <p className="text-sm opacity-90 mb-3">Community prize pools</p>
            <div className="space-y-2 text-sm">
              <p>🚗 Cars & Vehicles</p>
              <p>🏠 Houses & Property</p>
              <p>💻 Electronics & More</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/20">
              <p className="text-xs">Multiple prizes | Flexible contributions</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-12 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
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
              <div className="text-4xl font-bold text-green-600">94+</div>
              <div className="text-gray-600">Cities Nationwide</div>
            </div>
          </div>
        </div>
      </section>

      {/* Cash Equivalent Guarantee Section */}
      <section id="guarantee" className="container mx-auto px-4 py-12 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-5xl mb-4 block">💰</span>
            <h2 className="text-3xl font-bold text-gray-800">100% Cash Equivalent Guarantee</h2>
            <div className="w-20 h-1 bg-green-500 mx-auto mt-4"></div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <p className="text-gray-700 mb-4 leading-relaxed">
              Every prize across <strong>Merkato VIP, City VIP, and Regular Pools</strong> is backed by a 
              <strong className="text-green-600"> Cash Equivalent Guarantee</strong>.
            </p>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-4 my-6">
              <p className="text-green-800 font-semibold mb-2">📌 What this means for you:</p>
              <p className="text-gray-700">If you win any pool and the physical product is unavailable, you receive the 
              <strong className="text-green-700"> full cash equivalent</strong> of the listed prize amount. Guaranteed.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="border rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🏪</div>
                <p className="font-semibold text-sm">Merkato VIP</p>
                <p className="text-xs text-gray-500">Cash or prize guaranteed</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🏙️</div>
                <p className="font-semibold text-sm">City VIP</p>
                <p className="text-xs text-gray-500">Cash or prize guaranteed</p>
              </div>
              <div className="border rounded-lg p-3 text-center">
                <div className="text-2xl mb-1">🏊</div>
                <p className="font-semibold text-sm">Regular Pools</p>
                <p className="text-xs text-gray-500">Cash or prize guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Charity Section */}
      <section id="charity" className="container mx-auto px-4 py-12 bg-gradient-to-r from-red-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-5xl mb-4 block animate-pulse">❤️</span>
            <h2 className="text-3xl font-bold text-red-700">Our Commitment to Health</h2>
            <div className="w-20 h-1 bg-red-500 mx-auto mt-4"></div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="inline-block bg-red-100 rounded-full px-4 py-2 mb-4">
                <span className="text-red-600 font-bold">2% of ALL platform income</span>
              </div>
              <p className="text-xl font-semibold text-gray-800">
                Supporting Ethiopians fighting <span className="text-red-600">kidney & heart disease</span>
              </p>
            </div>
            
            <p className="text-gray-700 mb-4 leading-relaxed">
              Every contribution to <strong>Merkato VIP, City VIP, or Regular Pools</strong> helps save lives. 
              2% of all platform income goes directly to patients fighting kidney and heart disease in Ethiopia.
            </p>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4 my-6">
              <p className="text-red-800 font-semibold mb-2">📌 How your contribution helps:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Dialysis treatment for kidney patients</li>
                <li>Life-saving medications</li>
                <li>Heart surgeries and care</li>
                <li>Full transparency with quarterly reports</li>
              </ul>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">
                <strong>💚 Every pool creates impact:</strong> Whether you win or not, your participation helps 
                Ethiopians in critical need of medical care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-green-600">1</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Choose Your Program</h3>
            <p className="text-gray-600">Merkato VIP, City VIP, or Regular Pools</p>
          </div>
          <div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Select & Pay</h3>
            <p className="text-gray-600">Choose seats, pay via TeleBirr or Bank Transfer</p>
          </div>
          <div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Win & Celebrate</h3>
            <p className="text-gray-600">Fair draw selects winner when pool completes</p>
          </div>
        </div>
      </section>

      {/* Contact Section - Using ONLY your contact info */}
      <section className="container mx-auto px-4 py-12 bg-gray-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
          <p className="text-gray-600 mb-6">Our support team is here to assist you</p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="mailto:hundessanegassa@gmail.com" 
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition inline-flex items-center gap-2"
            >
              📧 hundessanegassa@gmail.com
            </a>
            <a 
              href="tel:0930330323" 
              className="border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition inline-flex items-center gap-2"
            >
              📞 0930330323
            </a>
            <a 
              href="tel:0913277922" 
              className="border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg hover:bg-green-50 transition inline-flex items-center gap-2"
            >
              📞 0913277922
            </a>
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
          <p className="mb-6">Join thousands of Ethiopians already winning amazing prizes</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="bg-white text-green-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition">
                Create Free Account
              </button>
            </Link>
            <Link href="/">
              <button className="border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white/10 transition">
                Browse All Programs
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
