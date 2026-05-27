import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function DrawWinner() {
  const router = useRouter();
  const [pools, setPools] = useState([]);
  const [selectedPool, setSelectedPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      const { data: adminRecord } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (profile?.role !== 'admin' && !adminRecord) {
        router.push('/');
        return;
      }
      
      setIsAdmin(true);
      setCheckingAdmin(false);
      fetchActivePools();
    };
    
    checkAdmin();
  }, [router]);

  const fetchActivePools = async () => {
    const { data, error } = await supabase
      .from('merkato_vip_pools')
      .select('*')
      .eq('status', 'active')
      .order('draw_time', { ascending: true });
    
    if (!error && data) {
      setPools(data);
    }
    setLoading(false);
  };

  const fetchParticipants = async (poolId) => {
    const { data, error } = await supabase
      .from('merkato_vip_participants')
      .select('*')
      .eq('pool_id', poolId)
      .eq('payment_status', 'confirmed');
    
    if (error) {
      toast.error('Failed to fetch participants');
      return [];
    }
    
    return data;
  };

  const drawWinner = async () => {
    if (!selectedPool) {
      toast.error('Please select a pool');
      return;
    }
    
    setDrawing(true);
    
    try {
      // Get participants
      const participants = await fetchParticipants(selectedPool.id);
      
      if (participants.length === 0) {
        toast.error('No confirmed participants in this pool');
        setDrawing(false);
        return;
      }
      
      // Random selection
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex];
      
      // Generate ticket number
      const ticketNumber = `${selectedPool.tier.toUpperCase()}-${Date.now()}-${randomIndex + 1}`;
      
      // Update pool with winner
      const { error: poolError } = await supabase
        .from('merkato_vip_pools')
        .update({
          status: 'completed',
          winner_id: winner.user_id,
          winner_email: winner.user_email,
          winner_name: winner.user_name,
          drawn_at: new Date().toISOString(),
          total_participants: participants.length,
          total_collected: participants.length * selectedPool.contribution_amount
        })
        .eq('id', selectedPool.id);
      
      if (poolError) throw poolError;
      
      // Mark participant as winner
      await supabase
        .from('merkato_vip_participants')
        .update({ is_winner: true })
        .eq('id', winner.id);
      
      // Record draw history
      await supabase
        .from('merkato_vip_draws')
        .insert({
          pool_id: selectedPool.id,
          drawn_at: new Date().toISOString(),
          winner_id: winner.user_id,
          winner_email: winner.user_email,
          winner_name: winner.user_name,
          prize_amount: selectedPool.prize_amount,
          ticket_number: ticketNumber,
          random_seed: Math.random().toString(),
          verification_hash: btoa(`${selectedPool.id}-${winner.user_id}-${Date.now()}`)
        });
      
      setWinner({
        ...winner,
        prize: selectedPool.prize_amount,
        poolName: selectedPool.name,
        ticketNumber: ticketNumber
      });
      
      toast.success(`Winner drawn! ${winner.user_name || winner.user_email} wins ${selectedPool.prize_amount.toLocaleString()} ETB!`);
      
      // Refresh pools list
      await fetchActivePools();
      
    } catch (error) {
      console.error('Draw error:', error);
      toast.error('Failed to draw winner');
    } finally {
      setDrawing(false);
    }
  };

  const formatNumber = (num) => {
    return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getTierIcon = (tier) => {
    if (tier === 'daily') return '⭐';
    if (tier === 'weekly') return '🏆';
    return '👑';
  };

  if (checkingAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Draw Merkato Winner - Admin</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-4">
            <button onClick={() => router.push('/admin/dashboard')} className="text-gray-600 hover:text-gray-800">
              ← Back to Dashboard
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Draw Merkato VIP Winner</h1>
              <p className="text-purple-100 text-sm">Select a pool and draw the lucky winner</p>
            </div>
            
            <div className="p-6">
              {/* Pool Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Pool to Draw
                </label>
                <select
                  value={selectedPool?.id || ''}
                  onChange={(e) => {
                    const pool = pools.find(p => p.id === e.target.value);
                    setSelectedPool(pool);
                    setWinner(null);
                  }}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">-- Select a pool --</option>
                  {pools.map(pool => (
                    <option key={pool.id} value={pool.id}>
                      {getTierIcon(pool.tier)} {pool.name} - {formatNumber(pool.prize_amount)} ETB
                    </option>
                  ))}
                </select>
                {pools.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No active pools available. Create one first.</p>
                )}
              </div>
              
              {/* Pool Details */}
              {selectedPool && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-lg mb-3">Pool Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Pool Name</p>
                      <p className="font-semibold">{getTierIcon(selectedPool.tier)} {selectedPool.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Prize Amount</p>
                      <p className="font-bold text-green-600">{formatNumber(selectedPool.prize_amount)} ETB</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Entry Fee</p>
                      <p>{formatNumber(selectedPool.contribution_amount)} ETB</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Draw Time</p>
                      <p>{new Date(selectedPool.draw_time).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Winner Display */}
              {winner && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6 border-2 border-yellow-400">
                  <div className="text-center">
                    <div className="text-6xl mb-3">🏆</div>
                    <h3 className="text-2xl font-bold text-gray-800">WINNER!</h3>
                    <p className="text-4xl font-bold text-green-600 my-3">{formatNumber(winner.prize)} ETB</p>
                    <div className="bg-white rounded-lg p-4 mt-4">
                      <p className="font-semibold">{winner.user_name || 'Anonymous Winner'}</p>
                      <p className="text-gray-500 text-sm">{winner.user_email}</p>
                      <p className="text-gray-400 text-xs mt-2">Ticket: {winner.ticketNumber}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">from {winner.poolName}</p>
                  </div>
                </div>
              )}
              
              {/* Draw Button */}
              {selectedPool && !winner && (
                <button
                  onClick={drawWinner}
                  disabled={drawing}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {drawing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Drawing...
                    </span>
                  ) : (
                    'Draw Winner Now'
                  )}
                </button>
              )}
              
              {/* Back Button */}
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="w-full mt-3 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
