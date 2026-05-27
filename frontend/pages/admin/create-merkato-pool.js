import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function CreateMerkatoPool() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [poolData, setPoolData] = useState({
    tier: 'daily',
    contribution_amount: 500,
    prize_amount: 1000000,
    draw_time: '20:00',
    winner_count: 1
  });

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
    };
    
    checkAdmin();
  }, [router]);

  const tierConfig = {
    daily: {
      name: 'Daily Millionaire',
      contribution: 500,
      prize: 1000000,
      frequency: 'daily',
      winnerCount: 1,
      slogan: 'Make ONE participant a MILLIONAIRE Today!'
    },
    weekly: {
      name: 'Weekly Mega Winner',
      contribution: 2500,
      prize: 10000000,
      frequency: 'weekly',
      winnerCount: 1,
      slogan: 'Make ONE participant a MILLIONAIRE This Week!'
    },
    monthly: {
      name: 'Monthly Legend',
      contribution: 5000,
      prize: 40000000,
      frequency: 'monthly',
      winnerCount: 1,
      slogan: 'Make ONE participant a MILLIONAIRE This Month!'
    }
  };

  const handleTierChange = (tier) => {
    const config = tierConfig[tier];
    setPoolData({
      tier: tier,
      contribution_amount: config.contribution,
      prize_amount: config.prize,
      draw_time: poolData.draw_time,
      winner_count: config.winnerCount
    });
  };

  const handleCreatePool = async () => {
    setLoading(true);
    
    try {
      const config = tierConfig[poolData.tier];
      
      // Calculate next draw time
      let drawDate = new Date();
      if (poolData.tier === 'daily') {
        drawDate.setDate(drawDate.getDate() + 1);
      } else if (poolData.tier === 'weekly') {
        drawDate.setDate(drawDate.getDate() + (7 - drawDate.getDay()));
      } else {
        drawDate.setMonth(drawDate.getMonth() + 1);
        drawDate.setDate(1);
      }
      
      const [hours, minutes] = poolData.draw_time.split(':');
      drawDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const { data, error } = await supabase
        .from('merkato_vip_pools')
        .insert({
          tier: poolData.tier,
          name: config.name,
          contribution_amount: poolData.contribution_amount,
          prize_amount: poolData.prize_amount,
          winner_count: poolData.winner_count,
          draw_time: drawDate.toISOString(),
          draw_frequency: poolData.tier,
          status: 'active'
        })
        .select()
        .single();
      
      if (error) throw error;
      
      toast.success(`${config.name} pool created successfully!`);
      router.push('/admin/dashboard?tab=merkato');
      
    } catch (error) {
      console.error('Create pool error:', error);
      toast.error('Failed to create pool: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  if (checkingAdmin) {
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
        <title>Create Merkato VIP Pool - Admin</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-4">
            <button onClick={() => router.push('/admin/dashboard')} className="text-gray-600 hover:text-gray-800">
              ← Back to Dashboard
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Create Merkato VIP Pool</h1>
              <p className="text-yellow-100 text-sm">Create high-value prize pools for Merkato traders</p>
            </div>
            
            <div className="p-6">
              {/* Tier Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Pool Tier
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(tierConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleTierChange(key)}
                      className={`p-4 rounded-xl text-center transition transform hover:scale-105 ${
                        poolData.tier === key
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-2xl mb-1">
                        {key === 'daily' && '⭐'}
                        {key === 'weekly' && '🏆'}
                        {key === 'monthly' && '👑'}
                      </div>
                      <div className="font-bold text-sm">{config.name}</div>
                      <div className="text-xs opacity-80">{formatNumber(config.prize)} ETB</div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Pool Details Display */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-lg mb-3">Pool Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pool Name:</span>
                    <span className="font-semibold">{tierConfig[poolData.tier].name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entry Fee:</span>
                    <span className="font-bold text-green-600">{formatNumber(poolData.contribution_amount)} ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Guaranteed Prize:</span>
                    <span className="font-bold text-orange-600">{formatNumber(poolData.prize_amount)} ETB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Winners:</span>
                    <span className="font-semibold">{poolData.winner_count} Winner</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Slogan:</span>
                    <span className="font-semibold text-sm">{tierConfig[poolData.tier].slogan}</span>
                  </div>
                </div>
              </div>
              
              {/* Draw Time */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Draw Time (Ethiopia Time)
                </label>
                <input
                  type="time"
                  value={poolData.draw_time}
                  onChange={(e) => setPoolData({...poolData, draw_time: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {poolData.tier === 'daily' && 'Draw happens every day at this time'}
                  {poolData.tier === 'weekly' && 'Draw happens every Sunday at this time'}
                  {poolData.tier === 'monthly' && 'Draw happens on the last day of month at this time'}
                </p>
              </div>
              
              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCreatePool}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Creating...' : '✨ Create Merkato VIP Pool'}
                </button>
                <button
                  onClick={() => router.push('/admin/dashboard')}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
