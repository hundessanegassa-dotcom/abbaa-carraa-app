import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PoolDetails() {
  const router = useRouter();
  const { id } = router.query;
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contributing, setContributing] = useState(false);
  const [contributionAmount, setContributionAmount] = useState(100);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (id) {
      fetchPool();
      getCurrentUser();
    }
  }, [id]);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchPool() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pools')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching pool:', error);
      toast.error('Pool not found');
      router.push('/listings');
    } else {
      setPool(data);
    }
    setLoading(false);
  }

  async function handleContribute() {
    if (!user) {
      toast.error('Please login to contribute');
      router.push('/login');
      return;
    }

    setContributing(true);
    
    // Create contribution record
    const { error } = await supabase
      .from('contributions')
      .insert({
        user_id: user.id,
        pool_id: pool.id,
        amount: contributionAmount,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    
    if (error) {
      toast.error('Failed to process contribution');
    } else {
      toast.success('Contribution initiated! Please complete payment.');
      // Redirect to payment page or show payment modal
    }
    setContributing(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800">Pool not found</h1>
          <Link href="/listings" className="text-green-600 mt-4 inline-block">Back to listings</Link>
        </div>
      </div>
    );
  }

  const progress = (pool.current_amount / pool.target_amount) * 100;
  const totalCollection = pool.target_amount * 1.2;
  const daysLeft = pool.end_date ? Math.max(0, Math.ceil((new Date(pool.end_date) - new Date()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <>
      <Head><title>{pool.prize_name} - Abbaa Carraa Ethio</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link href="/listings" className="text-green-600 hover:underline mb-4 inline-block">← Back to listings</Link>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Image */}
            <div className="w-full h-64 md:h-96 bg-gray-200 relative">
              {pool.image_url ? (
                <img src={pool.image_url} alt={pool.prize_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                  <span className="text-6xl">🎁</span>
                </div>
              )}
              {pool.status === 'active' && (
                <span className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm">Active</span>
              )}
            </div>

            <div className="p-6">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">{pool.prize_name}</h1>
              <p className="text-gray-600 mb-4">{pool.description}</p>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Winner Gets</p>
                  <p className="text-2xl font-bold text-green-600">ETB {pool.target_amount?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Entry Fee</p>
                  <p className="text-2xl font-bold text-blue-600">ETB {pool.contribution_amount?.toLocaleString()}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Total Collection</p>
                  <p className="text-2xl font-bold text-purple-600">ETB {totalCollection.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Includes 20% commission</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-500 text-sm">Days Left</p>
                  <p className="text-2xl font-bold text-orange-600">{daysLeft || 'N/A'} days</p>
                </div>
              </div>

              {/* Contribution Section */}
              {pool.status === 'active' && (
                <div className="border-t pt-6">
                  <h3 className="text-lg font-bold mb-4">Make a Contribution</h3>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-600 mb-1">Amount (ETB)</label>
                      <input
                        type="number"
                        value={contributionAmount}
                        onChange={(e) => setContributionAmount(parseInt(e.target.value))}
                        min={pool.contribution_amount}
                        step={pool.contribution_amount}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      <p className="text-xs text-gray-400 mt-1">Minimum: ETB {pool.contribution_amount}</p>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleContribute}
                        disabled={contributing}
                        className="bg-green-600 text-white px-8 py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
                      >
                        {contributing ? 'Processing...' : 'Contribute Now'}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-3">💚 2% of your contribution supports kidney & heart disease treatment</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
