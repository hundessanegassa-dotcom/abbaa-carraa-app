import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';
import LiveChat from '../../components/LiveChat';

export default function PoolDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [pool, setPool] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [seats, setSeats] = useState(1);
  const [paymentLoading, setPaymentLoading] = useState(false);

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
      const { data: poolData, error: poolError } = await supabase
        .from('pools')
        .select('*, profiles!winner_id(full_name, email), agents(business_name, city)')
        .eq('id', id)
        .single();

      if (poolError) throw poolError;
      setPool(poolData);

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

  async function handlePayment() {
    if (!user) {
      toast.error('Please login first');
      router.push(`/login?redirect=/pools/${id}`);
      return;
    }

    setPaymentLoading(true);

    try {
      const totalAmount = seats * pool.contribution_amount;
      const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { error: contribError } = await supabase
        .from('contributions')
        .insert([{
          user_id: user.id,
          pool_id: pool.id,
          amount: totalAmount,
          transaction_id: transactionId,
          payment_method: 'chapa',
          status: 'pending',
          metadata: { seats: seats }
        }]);

      if (contribError) throw contribError;

      const response = await fetch('/api/chapa/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: totalAmount,
          email: user.email,
          first_name: user.user_metadata?.full_name || '',
          last_name: '',
          phone_number: '',
          poolId: pool.id,
          poolName: pool.prize_name,
          metadata: { seats: seats, transactionId: transactionId }
        })
      });

      const result = await response.json();

      if (result.success && result.checkout_url) {
        window.location.href = result.checkout_url;
      } else {
        toast.error(result.error || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Something went wrong');
    } finally {
      setPaymentLoading(false);
    }
  }

  const progress = pool ? (pool.current_amount / pool.target_amount) * 100 : 0;
  const daysRemaining = pool?.end_date ? Math.ceil((new Date(pool.end_date) - new Date()) / (1000 * 60 * 60 * 24)) : null;
  const totalAmount = pool ? seats * pool.contribution_amount : 0;
  const totalTickets = pool ? Math.floor(totalAmount / 100) : 0;

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
        <Link href="/" className="text-green-600 hover:text-green-700 mb-4 inline-block">
          ← Back to Pools
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold mb-2">{pool.prize_name}</h1>
          <p className="text-gray-600 mb-4">{pool.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">Target Amount</p>
              <p className="text-xl font-bold text-green-600">ETB {pool.target_amount?.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">Contribution per Seat</p>
              <p className="text-xl font-bold text-blue-600">ETB {pool.contribution_amount?.toLocaleString()}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">Days Left</p>
              <p className={`text-xl font-bold ${daysRemaining < 7 ? 'text-red-600' : 'text-gray-800'}`}>
                {daysRemaining > 0 ? `${daysRemaining} days` : 'Draw soon!'}
              </p>
            </div>
          </div>

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

          {pool.status === 'active' && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-bold mb-4">Join This Pool</h3>
              
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-gray-600">Number of Seats:</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <button
                      onClick={() => setSeats(Math.max(1, seats - 1))}
                      className="w-8 h-8 bg-gray-200 rounded-full text-lg font-bold hover:bg-gray-300"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold w-12 text-center">{seats}</span>
                    <button
                      onClick={() => setSeats(seats + 1)}
                      className="w-8 h-8 bg-gray-200 rounded-full text-lg font-bold hover:bg-gray-300"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-gray-600">Total Amount:</p>
                  <p className="text-2xl font-bold text-green-600">ETB {totalAmount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">{totalTickets} tickets</p>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={paymentLoading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:bg-gray-400 transition"
              >
                {paymentLoading ? 'Processing...' : `Pay ETB ${totalAmount.toLocaleString()} via Chapa`}
              </button>
            </div>
          )}

          {pool.status === 'completed' && pool.winner_id && (
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-400">
              <h2 className="text-xl font-bold text-center mb-2">🏆 Winner Announced! 🏆</h2>
              <p className="text-center">
                Congratulations to <span className="font-bold text-green-600">{pool.profiles?.full_name || 'Winner'}</span>!
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Recent Contributors</h2>
          {contributions.length === 0 ? (
            <p className="text-gray-500">Be the first to contribute!</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {contributions.map((contrib) => (
                <div key={contrib.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{contrib.profiles?.full_name || 'Anonymous'}</p>
                    <p className="text-sm text-gray-500">{new Date(contrib.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold text-green-600">ETB {contrib.amount?.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {pool.agents && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">About the Agent</h2>
            <p className="font-semibold">{pool.agents.business_name}</p>
            <p className="text-gray-600 text-sm">📍 {pool.agents.city || pool.city || 'Addis Ababa'}</p>
            {pool.discount_for_participants > 0 && (
              <p className="text-blue-600 text-sm mt-2">🎁 {pool.discount_for_participants}% discount for participants!</p>
            )}
          </div>
        )}
      </div>

      {/* Live Chat Component */}
      <LiveChat poolId={id} poolName={pool?.prize_name} />
    </div>
  );
}
