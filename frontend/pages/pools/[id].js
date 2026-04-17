import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PoolDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [pool, setPool] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (id) {
      fetchPoolDetails();
      checkUser();
    }
  }, [id]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  }

  async function fetchPoolDetails() {
    try {
      // Fetch pool details
      const { data: poolData, error: poolError } = await supabase
        .from('pools')
        .select('*, profiles!winner_id(full_name, email)')
        .eq('id', id)
        .single();

      if (poolError) throw poolError;
      setPool(poolData);

      // Fetch recent contributions
      const { data: contribData, error: contribError } = await supabase
        .from('contributions')
        .select('*, profiles(full_name)')
        .eq('pool_id', id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!contribError) setContributions(contribData || []);
    } catch (error) {
      console.error('Error fetching pool:', error);
      toast.error('Pool not found');
    } finally {
      setLoading(false);
    }
  }

  const progress = pool ? (pool.current_amount / pool.target_amount) * 100 : 0;
  const daysRemaining = pool?.end_date ? Math.ceil((new Date(pool.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;

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
          <h1 className="text-2xl font-bold mb-4">Pool Not Found</h1>
          <Link href="/" className="text-green-600">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Back button */}
        <Link href="/" className="text-green-600 hover:text-green-700 mb-4 inline-block">
          ← Back to Pools
        </Link>

        {/* Pool Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{pool.prize_name}</h1>
          <p className="text-gray-600 mb-4">{pool.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">Target Amount</p>
              <p className="text-xl font-bold text-green-600">ETB {pool.target_amount?.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">Contribution</p>
              <p className="text-xl font-bold text-blue-600">ETB {pool.contribution_amount?.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">Days Left</p>
              <p className={`text-xl font-bold ${daysRemaining < 7 ? 'text-red-600' : 'text-gray-800'}`}>
                {daysRemaining > 0 ? `${daysRemaining} days` : 'Draw soon!'}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span className="font-semibold">{progress.toFixed(1)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-green-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm mt-2 text-gray-500">
              <span>Raised: ETB {pool.current_amount?.toLocaleString()}</span>
              <span>Remaining: ETB {(pool.target_amount - pool.current_amount)?.toLocaleString()}</span>
            </div>
          </div>

          {/* Join Button */}
          {pool.status === 'active' && (
            <button
              onClick={() => setShowPayment(true)}
              className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition"
            >
              Join This Pool - ETB {pool.contribution_amount?.toLocaleString()}
            </button>
          )}
        </div>

        {/* Recent Contributors */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Recent Contributors</h2>
          {contributions.length === 0 ? (
            <p className="text-gray-500">Be the first to contribute!</p>
          ) : (
            <div className="space-y-2">
              {contributions.map((contrib) => (
                <div key={contrib.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">
                      {contrib.profiles?.full_name || 'Anonymous User'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(contrib.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-green-600">ETB {contrib.amount?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Winner Section (if completed) */}
        {pool.status === 'completed' && pool.winner_id && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg shadow-md p-6 border-2 border-yellow-400">
            <h2 className="text-2xl font-bold text-center mb-2">🏆 Winner Announced! 🏆</h2>
            <p className="text-center text-lg">
              Congratulations to <span className="font-bold text-green-600">{pool.profiles?.full_name || 'Winner'}</span>!
            </p>
            <p className="text-center text-gray-600 mt-2">
              Draw took place on {new Date(pool.draw_date).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Payment Modal (will connect to Chapa later) */}
      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Payment Coming Soon</h2>
            <p className="text-gray-600 mb-4">
              Payment integration is being set up. You'll be able to pay via Telebirr and CBE Birr very soon!
            </p>
            <button
              onClick={() => setShowPayment(false)}
              className="w-full bg-green-600 text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
