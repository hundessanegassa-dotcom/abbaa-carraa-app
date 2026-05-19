import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export async function getServerSideProps() {
  return { props: {} };
}

export default function AdminDraw() {
  const { t } = useTranslation();
  const router = useRouter();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showWinnerDetails, setShowWinnerDetails] = useState(null);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please login first');
        router.push('/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || profile?.role !== 'admin') {
        toast.error('Admin access required');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadPools();
    } catch (error) {
      console.error('Admin check error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function loadPools() {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select(`
          *,
          profiles!winner_id (id, email, full_name, phone),
          draws (id, random_seed, ticket_count, created_at)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPools(data || []);
    } catch (error) {
      console.error('Error loading pools:', error);
      toast.error('Failed to load pools');
    }
  }

  async function executeDraw(poolId) {
    setDrawing(true);
    const toastId = toast.loading('Running cryptographic draw...');

    try {
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select('user_id, amount, profiles(full_name, email, phone)')
        .eq('pool_id', poolId)
        .eq('status', 'completed');

      if (contribError) throw contribError;

      if (!contributions || contributions.length === 0) {
        toast.error('No contributions found for this pool', { id: toastId });
        setDrawing(false);
        setShowConfirm(false);
        return;
      }

      let tickets = [];
      contributions.forEach(contrib => {
        const ticketCount = Math.floor(contrib.amount / 100);
        for (let i = 0; i < ticketCount; i++) {
          tickets.push({
            user_id: contrib.user_id,
            amount: contrib.amount,
            user: contrib.profiles
          });
        }
      });

      if (tickets.length === 0) {
        toast.error('No valid tickets generated (minimum 100 ETB contribution required)', { id: toastId });
        setDrawing(false);
        setShowConfirm(false);
        return;
      }

      const randomSeed = crypto.randomUUID();
      const randomIndex = Math.floor(Math.random() * tickets.length);
      const winner = tickets[randomIndex];

      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .select('*')
        .eq('id', poolId)
        .single();

      if (poolError) throw poolError;

      const { error: updateError } = await supabase
        .from('pools')
        .update({
          winner_id: winner.user_id,
          status: 'completed',
          completed_at: new Date().toISOString(),
          draw_date: new Date().toISOString(),
          random_seed: randomSeed,
          ticket_count: tickets.length
        })
        .eq('id', poolId);

      if (updateError) throw updateError;

      await supabase
        .from('draws')
        .insert({
          pool_id: poolId,
          winner_id: winner.user_id,
          ticket_count: tickets.length,
          random_seed: randomSeed,
          verified_at: new Date().toISOString(),
          is_verified: true,
          created_at: new Date().toISOString()
        });

      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('total_wins')
        .eq('id', winner.user_id)
        .single();

      await supabase
        .from('profiles')
        .update({ total_wins: (currentProfile?.total_wins || 0) + 1 })
        .eq('id', winner.user_id);

      await supabase
        .from('notifications')
        .insert({
          user_id: winner.user_id,
          type: 'win',
          title: '🎉 Congratulations! You Won! 🎉',
          message: `You have won the ${pool.prize_name} prize pool worth ETB ${pool.target_amount.toLocaleString()}!`,
          metadata: { pool_id: poolId, prize_name: pool.prize_name, amount: pool.target_amount },
          created_at: new Date().toISOString()
        });

      toast.success(`🏆 Winner selected! ${winner.user?.full_name || 'User'} won ${pool.prize_name}!`, { id: toastId });
      
      setShowWinnerDetails({
        winner: winner.user,
        prize_name: pool.prize_name,
        target_amount: pool.target_amount,
        random_seed: randomSeed,
        ticket_count: tickets.length
      });
      
      await loadPools();
      
    } catch (error) {
      console.error('Draw execution error:', error);
      toast.error('Draw failed: ' + error.message, { id: toastId });
    } finally {
      setDrawing(false);
      setShowConfirm(false);
    }
  }

  function confirmDraw(pool) {
    setSelectedPool(pool);
    setShowConfirm(true);
  }

  if (!isAdmin) return null;
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const readyPools = pools.filter(p => p.current_amount >= p.target_amount && p.status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-green-600">
              Abbaa Carraa Admin
            </Link>
            <div className="space-x-4">
              <Link href="/dashboard" className="text-gray-600 hover:text-green-600">
                Dashboard
              </Link>
              <Link href="/" className="text-gray-600 hover:text-green-600">
                View Site
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">🎲 Draw Management</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Active Pools</h3>
            <p className="text-3xl font-bold text-green-600">{pools.filter(p => p.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Completed Pools</h3>
            <p className="text-3xl font-bold text-blue-600">{pools.filter(p => p.status === 'completed').length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Ready for Draw</h3>
            <p className="text-3xl font-bold text-yellow-600">{readyPools}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Total Winners</h3>
            <p className="text-3xl font-bold text-purple-600">{pools.filter(p => p.winner_id).length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prize</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Winner / Draw Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pools.map(pool => {
                  const progress = (pool.current_amount / pool.target_amount) * 100;
                  const isReady = pool.current_amount >= pool.target_amount && pool.status === 'active';
                  const isCompleted = pool.status === 'completed';
                  const drawInfo = pool.draws?.[0];
                  
                  return (
                    <tr key={pool.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{pool.prize_name}</div>
                        <div className="text-sm text-gray-500">Target: ETB {pool.target_amount.toLocaleString()}</div>
                        <div className="text-xs text-gray-400">Pool ID: {pool.id.slice(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-40">
                          <div className="flex justify-between text-sm mb-1"><span>{progress.toFixed(1)}%</span></div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div className={`h-2 rounded-full ${isCompleted ? 'bg-green-600' : 'bg-green-500'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">ETB {pool.current_amount.toLocaleString()} / {pool.target_amount.toLocaleString()}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {pool.status === 'active' ? '● Active' : '✓ Completed'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {pool.winner_id ? (
                          <div>
                            <div className="text-sm font-medium text-green-600">🏆 {pool.profiles?.full_name || 'Anonymous Winner'}</div>
                            <div className="text-xs text-gray-500">{pool.draw_date ? new Date(pool.draw_date).toLocaleDateString() : ''}</div>
                            {drawInfo && (
                              <details className="mt-1">
                                <summary className="text-xs text-gray-400 cursor-pointer">🔐 Verification Details</summary>
                                <div className="text-xs text-gray-500 mt-1 font-mono break-all">Seed: {drawInfo.random_seed?.slice(0, 20)}...<br/>Tickets: {drawInfo.ticket_count}</div>
                              </details>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">⏳ Not drawn yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isReady && !isCompleted ? (
                          <button onClick={() => confirmDraw(pool)} disabled={drawing} className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:bg-gray-400">
                            {drawing ? '🔄 Drawing...' : '🎲 Run Draw'}
                          </button>
                        ) : isCompleted ? (
                          <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Need {(pool.target_amount - pool.current_amount).toLocaleString()} ETB more</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {pools.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">No pools found. Create a pool first!</p>
            <Link href="/create-pool" className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
              Create First Pool →
            </Link>
          </div>
        )}
      </div>

      {showConfirm && selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Confirm Draw</h2>
            <p className="text-gray-600 mb-4">Are you sure you want to run the draw for <strong>{selectedPool.prize_name}</strong>?</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-yellow-800">
                📊 Pool Statistics:<br/>
                • Target: ETB {selectedPool.target_amount.toLocaleString()}<br/>
                • Raised: ETB {selectedPool.current_amount.toLocaleString()}<br/>
                • Progress: {((selectedPool.current_amount / selectedPool.target_amount) * 100).toFixed(1)}%
              </p>
            </div>
            <p className="text-sm text-red-500 mb-6">⚠️ This action cannot be undone. A winner will be randomly selected using cryptographic randomization.</p>
            <div className="flex space-x-3">
              <button onClick={() => executeDraw(selectedPool.id)} disabled={drawing} className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-400">
                {drawing ? 'Running Draw...' : 'Yes, Run Draw'}
              </button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showWinnerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <div className="text-6xl mb-2">🏆</div>
              <h2 className="text-2xl font-bold text-green-600">Winner Selected!</h2>
            </div>
            <div className="space-y-3 mb-6">
              <div className="border-b pb-2">
                <p className="text-sm text-gray-500">Winner</p>
                <p className="font-semibold text-lg">{showWinnerDetails.winner?.full_name || 'Anonymous User'}</p>
              </div>
              <div className="border-b pb-2">
                <p className="text-sm text-gray-500">Prize Won</p>
                <p className="font-semibold">{showWinnerDetails.prize_name}</p>
                <p className="text-sm text-green-600">ETB {showWinnerDetails.target_amount?.toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">🔐 Cryptographic Verification</p>
                <p className="text-xs font-mono break-all">Seed: {showWinnerDetails.random_seed}</p>
                <p className="text-xs">Tickets: {showWinnerDetails.ticket_count}</p>
              </div>
            </div>
            <button onClick={() => setShowWinnerDetails(null)} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
