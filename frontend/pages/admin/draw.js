import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminDraw() {
  const router = useRouter();
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedPool, setSelectedPool] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

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
          profiles!winner_id (email, full_name)
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
    toast.loading('Running draw...', { duration: 2000 });

    try {
      // Get all completed contributions for this pool
      const { data: contributions, error: contribError } = await supabase
        .from('contributions')
        .select('user_id, amount, profiles(full_name, email, phone)')
        .eq('pool_id', poolId)
        .eq('status', 'completed');

      if (contribError) throw contribError;

      if (!contributions || contributions.length === 0) {
        toast.error('No contributions found for this pool');
        setDrawing(false);
        setShowConfirm(false);
        return;
      }

      // Create weighted tickets (1 ticket per 100 ETB)
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

      // Random selection
      const randomIndex = Math.floor(Math.random() * tickets.length);
      const winner = tickets[randomIndex];
      const randomSeed = Math.random().toString(36).substring(2) + Date.now().toString();

      // Get pool details
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .select('*')
        .eq('id', poolId)
        .single();

      if (poolError) throw poolError;

      // Update pool with winner
      const { error: updateError } = await supabase
        .from('pools')
        .update({
          winner_id: winner.user_id,
          status: 'completed',
          completed_at: new Date().toISOString(),
          draw_date: new Date().toISOString()
        })
        .eq('id', poolId);

      if (updateError) throw updateError;

      // Record the draw
      const { error: drawError } = await supabase
        .from('draws')
        .insert({
          pool_id: poolId,
          winner_id: winner.user_id,
          ticket_count: tickets.length,
          random_seed: randomSeed,
          verified_at: new Date().toISOString(),
          is_verified: true
        });

      if (drawError) throw drawError;

      // Update winner's total wins
      await supabase
        .from('profiles')
        .update({ total_wins: supabase.rpc('increment', { row_id: winner.user_id }) })
        .eq('id', winner.user_id);

      // Create notification for winner
      await supabase
        .from('notifications')
        .insert({
          user_id: winner.user_id,
          type: 'win',
          title: '🎉 Congratulations! You Won! 🎉',
          message: `You have won the ${pool.prize_name} prize pool worth ETB ${pool.target_amount.toLocaleString()}!`,
          metadata: { pool_id: poolId, prize_name: pool.prize_name, amount: pool.target_amount }
        });

      toast.success(`Winner selected! ${winner.user?.full_name || 'User'} won ${pool.prize_name}!`);
      
      // Reload pools
      await loadPools();
      
    } catch (error) {
      console.error('Draw execution error:', error);
      toast.error('Draw failed: ' + error.message);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
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
        <h1 className="text-3xl font-bold mb-8">Draw Management</h1>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Active Pools</h3>
            <p className="text-3xl font-bold text-green-600">
              {pools.filter(p => p.status === 'active').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Completed Pools</h3>
            <p className="text-3xl font-bold text-blue-600">
              {pools.filter(p => p.status === 'completed').length}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-gray-500 text-sm">Ready for Draw</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {pools.filter(p => p.status === 'active' && p.current_amount >= p.target_amount).length}
            </p>
          </div>
        </div>

        {/* Pools Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prize</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Winner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pools.map(pool => {
                  const progress = (pool.current_amount / pool.target_amount) * 100;
                  const isReady = pool.current_amount >= pool.target_amount && pool.status === 'active';
                  const isCompleted = pool.status === 'completed';
                  
                  return (
                    <tr key={pool.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{pool.prize_name}</div>
                        <div className="text-sm text-gray-500">ETB {pool.target_amount.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="w-32">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{progress.toFixed(1)}%</span>
                          </div>
                          <div className="bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            ETB {pool.current_amount.toLocaleString()} / {pool.target_amount.toLocaleString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          pool.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {pool.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {pool.winner_id ? (
                          <div>
                            <div className="text-sm font-medium text-green-600">Winner Selected</div>
                            <div className="text-xs text-gray-500">{pool.draw_date ? new Date(pool.draw_date).toLocaleDateString() : ''}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not drawn</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {isReady && !isCompleted && (
                          <button
                            onClick={() => confirmDraw(pool)}
                            disabled={drawing}
                            className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 disabled:bg-gray-400"
                          >
                            Run Draw
                          </button>
                        )}
                        {isCompleted && (
                          <span className="text-green-600 text-sm">✓ Completed</span>
                        )}
                        {!isReady && !isCompleted && (
                          <span className="text-gray-400 text-sm">Waiting for target</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Confirm Draw</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to run the draw for <strong>{selectedPool.prize_name}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">
              This action cannot be undone. A winner will be randomly selected from all contributors.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => executeDraw(selectedPool.id)}
                disabled={drawing}
                className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
              >
                {drawing ? 'Running Draw...' : 'Yes, Run Draw'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
