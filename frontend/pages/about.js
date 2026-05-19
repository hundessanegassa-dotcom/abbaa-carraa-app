export const runtime = 'experimental-edge';
export const config = {
  runtime: 'experimental-edge',
};
import BackButton from '../components/BackButton';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();
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
            Ethiopia's first community-driven prize platform – building dreams one contribution at a time
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-600 text-lg">
            Abbaa Carraa was founded to democratize access to valuable prizes by allowing communities to pool 
            small contributions for a chance to win big – whether a car, laptop, machinery, furniture, or cash prize.
          </p>
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
              <div className="text-4xl font-bold text-green-600">100%</div>
              <div className="text-gray-600">Transparent</div>
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
              At Abbaa Carraa, we believe in <strong className="text-green-600">100% transparency and fairness</strong>. 
              Every prize listed on our platform is backed by a <strong className="text-green-600">Cash Equivalent Guarantee</strong>.
            </p>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-4 my-6">
              <p className="text-green-800 font-semibold mb-2">📌 What does this mean for you?</p>
              <p className="text-gray-700">If you win a prize pool and the physical product (car, electronics, machinery, etc.) is unavailable for any reason, 
              you will receive the <strong className="text-green-700">full cash equivalent</strong> of the listed target amount. No questions asked.</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="border rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🏆</div>
                <h3 className="font-bold text-lg mb-2">Winner Gets</h3>
                <p className="text-gray-600">Either the <strong>actual product</strong> or <strong>full cash value</strong></p>
              </div>
              <div className="border rounded-lg p-4 text-center">
                <div className="text-3xl mb-2">🔒</div>
                <h3 className="font-bold text-lg mb-2">Guaranteed Payout</h3>
                <p className="text-gray-600">Paid within <strong>14 days</strong> of draw completion</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">
                <strong>📋 Example:</strong> You win a car pool with a target amount of 500,000 ETB. 
                If the car is sold or unavailable, you receive 500,000 ETB cash directly to your Telebirr or bank account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Charity Section */}
      <section id="charity" className="container mx-auto px-4 py-12 scroll-mt-20 bg-gradient-to-r from-red-50 to-pink-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <span className="text-5xl mb-4 block animate-pulse">❤️</span>
            <h2 className="text-3xl font-bold text-red-700">Our Commitment to Health</h2>
            <div className="w-20 h-1 bg-red-500 mx-auto mt-4"></div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <div className="text-center mb-6">
              <div className="inline-block bg-red-100 rounded-full px-4 py-2 mb-4">
                <span className="text-red-600 font-bold">2% of ALL income</span>
              </div>
              <p className="text-xl font-semibold text-gray-800">
                Supporting Ethiopians fighting <span className="text-red-600">kidney & heart disease</span>
              </p>
            </div>
            
            <p className="text-gray-700 mb-4 leading-relaxed">
              At Abbaa Carraa, we believe that <strong className="text-red-600">every contribution creates impact</strong> – not just for winners, 
              but for our community's health and well-being.
            </p>
            
            <div className="bg-red-50 border-l-4 border-red-500 p-4 my-6">
              <p className="text-red-800 font-semibold mb-2">📌 How it works:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>2% of <strong>all platform income</strong> is set aside for health support</li>
                <li>Funds go to verified patients fighting kidney and heart disease</li>
                <li>Supports dialysis treatment, medications, and surgeries</li>
                <li>Full transparency – donation reports published quarterly</li>
              </ul>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl mb-1">🩺</div>
                <p className="font-semibold">Dialysis Support</p>
                <p className="text-xs text-gray-500">Life-saving treatment access</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl mb-1">❤️</div>
                <p className="font-semibold">Heart Care</p>
                <p className="text-xs text-gray-500">Medications & surgeries</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl mb-1">🤝</div>
                <p className="font-semibold">Community Impact</p>
                <p className="text-xs text-gray-500">Every pool gives hope</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-600">
                <strong>💚 Join the movement:</strong> Your participation doesn't just give you a chance to win – 
                it helps save lives. Every contribution, every pool, every winner brings us closer to a healthier Ethiopia.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">How Abbaa Carraa Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-green-600">1</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Find a Pool</h3>
            <p className="text-gray-600">Browse active prize pools by city or category</p>
          </div>
          <div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-green-600">2</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Contribute</h3>
            <p className="text-gray-600">Make a small contribution via Telebirr or CBE Birr</p>
          </div>
          <div>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-bold text-green-600">3</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Win & Celebrate</h3>
            <p className="text-gray-600">Fair draw selects winner when pool reaches target</p>
          </div>
        </div>
      </section>

      {/* Join CTA */}
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
