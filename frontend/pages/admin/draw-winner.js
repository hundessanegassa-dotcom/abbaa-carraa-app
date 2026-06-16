// pages/admin/draw-winner.js - COMPLETE UNIFIED DRAW WINNER FOR ALL PROGRAMS
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import Link from 'next/link';
import AdminLayout from '../../components/admin/AdminLayout'; // ✅ ADDED

export default function DrawWinner() {
  const router = useRouter();
  
  // State
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState('merkato');
  const [selectedPool, setSelectedPool] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedPoolType, setSelectedPoolType] = useState('daily');
  const [winner, setWinner] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showWinnerDetails, setShowWinnerDetails] = useState(null);
  
  // Data states
  const [merkatoPools, setMerkatoPools] = useState([]);
  const [cityStats, setCityStats] = useState({});
  const [cities, setCities] = useState([]);
  const [regularPools, setRegularPools] = useState([]);
  
  // Pool types configuration
  const poolTypes = {
    daily: { name: 'Daily Millionaire', contribution: 500, prize: 1000000, icon: '⭐', color: 'from-yellow-500 to-orange-600' },
    weekly: { name: 'Weekly Mega Winner', contribution: 2500, prize: 10000000, icon: '🏆', color: 'from-purple-500 to-pink-600' },
    monthly: { name: 'Monthly Winner', contribution: 5000, prize: 40000000, icon: '👑', color: 'from-green-600 to-teal-700' }
  };

  // Check admin access
  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        setProfile(profile);
        
        const { data: adminRecord } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (profile?.role !== 'admin' && !adminRecord) {
          toast.error('Admin access required');
          router.push('/');
          return;
        }
        
        setIsAdmin(true);
        await loadAllData();
      } catch (error) {
        console.error('Admin check error:', error);
        router.push('/');
      } finally {
        setCheckingAdmin(false);
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [router]);

  // Load all data based on selected program
  useEffect(() => {
    if (isAdmin) {
      if (selectedProgram === 'merkato') loadMerkatoPools();
      else if (selectedProgram === 'city') loadCityData();
      else loadRegularPools();
    }
  }, [selectedProgram, isAdmin]);

  const loadAllData = async () => {
    await Promise.all([
      loadMerkatoPools(),
      loadCityData(),
      loadRegularPools()
    ]);
  };

  const loadMerkatoPools = async () => {
    try {
      const { data, error } = await supabase
        .from('merkato_vip_pools')
        .select('*')
        .eq('status', 'active')
        .order('draw_time', { ascending: true });
      
      if (!error && data) {
        setMerkatoPools(data);
      }
    } catch (error) {
      console.error('Error loading Merkato pools:', error);
    }
  };

  const loadCityData = async () => {
    try {
      const { data: participants, error } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('payment_status', 'verified')
        .neq('is_winner', true);
      
      if (error) throw error;
      
      // Group by city
      const cityMap = new Map();
      participants.forEach(p => {
        if (!cityMap.has(p.city)) {
          cityMap.set(p.city, {
            city: p.city,
            participants: [],
            daily: { count: 0, total: 0 },
            weekly: { count: 0, total: 0 },
            monthly: { count: 0, total: 0 }
          });
        }
        
        const cityData = cityMap.get(p.city);
        cityData.participants.push(p);
        
        if (p.pool_type === 'daily') {
          cityData.daily.count++;
          cityData.daily.total += p.contribution_amount;
        } else if (p.pool_type === 'weekly') {
          cityData.weekly.count++;
          cityData.weekly.total += p.contribution_amount;
        } else if (p.pool_type === 'monthly') {
          cityData.monthly.count++;
          cityData.monthly.total += p.contribution_amount;
        }
      });
      
      const cityList = Array.from(cityMap.values());
      setCities(cityList);
      
      // Calculate stats
      const stats = {};
      cityList.forEach(city => {
        stats[city.city] = {
          daily: city.daily.count,
          weekly: city.weekly.count,
          monthly: city.monthly.count,
          total: city.participants.length
        };
      });
      setCityStats(stats);
      
    } catch (error) {
      console.error('Error loading city data:', error);
      toast.error('Failed to load city data');
    }
  };

  const loadRegularPools = async () => {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .not('winner_id', 'is', null);
      
      if (!error && data) {
        setRegularPools(data);
      }
    } catch (error) {
      console.error('Error loading regular pools:', error);
    }
  };

  const drawMerkatoWinner = async () => {
    if (!selectedPool) {
      toast.error('Please select a pool');
      return;
    }
    
    setDrawing(true);
    const toastId = toast.loading('Drawing winner...');
    
    try {
      const { data: participants, error } = await supabase
        .from('merkato_vip_participants')
        .select('*')
        .eq('pool_type', selectedPool.tier)
        .eq('payment_status', 'verified');
      
      if (error) throw error;
      
      if (!participants || participants.length === 0) {
        toast.error('No verified participants in this pool', { id: toastId });
        setDrawing(false);
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex];
      const ticketNumber = `${selectedPool.tier.toUpperCase()}-${Date.now()}-${randomIndex + 1}`;
      
      // ✅ FIXED: Use correct column names
      const { error: updateError } = await supabase
        .from('merkato_vip_pools')
        .update({
          status: 'completed',
          winner_id: winner.user_id,
          winner_email: winner.user_email,
          winner_name: winner.user_name,
          drawn_at: new Date().toISOString()
          // ✅ REMOVED: total_participants, total_collected - these columns may not exist
        })
        .eq('id', selectedPool.id);
      
      if (updateError) throw updateError;
      
      await supabase
        .from('merkato_vip_participants')
        .update({ is_winner: true, winner_drawn_at: new Date().toISOString() })
        .eq('id', winner.id);
      
      await supabase
        .from('merkato_vip_draws')
        .insert({
          pool_id: selectedPool.id,
          pool_type: 'merkato',
          drawn_at: new Date().toISOString(),
          winner_id: winner.user_id,
          winner_email: winner.user_email,
          winner_name: winner.user_name,
          prize_amount: selectedPool.prize_amount,
          ticket_number: ticketNumber,
          random_seed: Math.random().toString(),
          verification_hash: btoa(`${selectedPool.id}-${winner.user_id}-${Date.now()}`),
          drawn_by: user?.id
        });
      
      await supabase
        .from('admin_notifications')
        .insert({
          title: `🏆 Winner Drawn! ${winner.user_name || winner.user_email}`,
          message: `${selectedPool.name} winner: ${winner.user_name || winner.user_email} - ${selectedPool.prize_amount.toLocaleString()} ETB`,
          type: 'winner'
        });
      
      setWinner({ ...winner, prize: selectedPool.prize_amount, poolName: selectedPool.name, ticketNumber });
      setShowWinnerDetails({ winner, prize: selectedPool.prize_amount, poolName: selectedPool.name, ticketNumber });
      
      toast.success(`Winner drawn! ${winner.user_name || winner.user_email} wins ${selectedPool.prize_amount.toLocaleString()} ETB!`, { id: toastId });
      await loadMerkatoPools();
      
    } catch (error) {
      console.error('Draw error:', error);
      toast.error('Failed to draw winner', { id: toastId });
    } finally {
      setDrawing(false);
      setShowConfirm(false);
    }
  };

  const drawCityWinner = async () => {
    if (!selectedCity) {
      toast.error('Please select a city');
      return;
    }
    
    setDrawing(true);
    const toastId = toast.loading('Drawing winner...');
    
    try {
      const { data: participants, error } = await supabase
        .from('city_vip_participants')
        .select('*')
        .eq('city', selectedCity)
        .eq('pool_type', selectedPoolType)
        .eq('payment_status', 'verified')
        .neq('is_winner', true);
      
      if (error) throw error;
      
      if (!participants || participants.length === 0) {
        toast.error(`No verified participants in ${selectedCity} for ${poolTypes[selectedPoolType].name}`, { id: toastId });
        setDrawing(false);
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex];
      const poolConfig = poolTypes[selectedPoolType];
      const ticketNumber = `${selectedCity.toUpperCase().replace(/\s/g, '-')}-${selectedPoolType.toUpperCase()}-${Date.now()}-${randomIndex + 1}`;
      
      const { error: updateError } = await supabase
        .from('city_vip_participants')
        .update({ 
          is_winner: true,
          winner_drawn_at: new Date().toISOString(),
          status: 'winner'
        })
        .eq('id', winner.id);
      
      if (updateError) throw updateError;
      
      await supabase
        .from('merkato_vip_draws')
        .insert({
          pool_id: `city-${selectedCity}-${selectedPoolType}`,
          pool_type: 'city',
          city: selectedCity,
          drawn_at: new Date().toISOString(),
          winner_id: winner.user_id,
          winner_email: winner.user_email,
          winner_name: winner.user_name,
          prize_amount: poolConfig.prize,
          ticket_number: ticketNumber,
          random_seed: Math.random().toString(),
          verification_hash: btoa(`${selectedCity}-${winner.user_id}-${Date.now()}`),
          drawn_by: user?.id
        });
      
      await supabase
        .from('admin_notifications')
        .insert({
          title: `🏆 City Winner Drawn! ${winner.user_name || winner.user_email}`,
          message: `${selectedCity} ${selectedPoolType} winner: ${winner.user_name || winner.user_email} - ${poolConfig.prize.toLocaleString()} ETB`,
          type: 'winner'
        });
      
      setWinner({ ...winner, prize: poolConfig.prize, poolName: `${selectedCity} - ${poolConfig.name}`, ticketNumber });
      setShowWinnerDetails({ winner, prize: poolConfig.prize, poolName: `${selectedCity} - ${poolConfig.name}`, ticketNumber });
      
      toast.success(`Winner drawn! ${winner.user_name || winner.user_email} wins ${poolConfig.prize.toLocaleString()} ETB!`, { id: toastId });
      await loadCityData();
      
    } catch (error) {
      console.error('Draw error:', error);
      toast.error('Failed to draw winner', { id: toastId });
    } finally {
      setDrawing(false);
      setShowConfirm(false);
    }
  };

  const drawRegularWinner = async () => {
    if (!selectedPool) {
      toast.error('Please select a pool');
      return;
    }
    
    setDrawing(true);
    const toastId = toast.loading('Drawing winner...');
    
    try {
      // ✅ FIXED: Use correct table name 'regular_pool_participants'
      const { data: participants, error } = await supabase
        .from('regular_pool_participants')
        .select('*')
        .eq('pool_id', selectedPool.id)
        .eq('payment_status', 'verified');
      
      if (error) throw error;
      
      if (!participants || participants.length === 0) {
        toast.error('No verified participants in this pool', { id: toastId });
        setDrawing(false);
        return;
      }
      
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex];
      const ticketNumber = `REG-${Date.now()}-${randomIndex + 1}`;
      
      const { error: updateError } = await supabase
        .from('pools')
        .update({
          status: 'completed',
          winner_id: winner.user_id,
          winner_name: winner.user_name,
          winner_email: winner.user_email,
          winner_seat: winner.seat_numbers?.[0],
          drawn_at: new Date().toISOString()
        })
        .eq('id', selectedPool.id);
      
      if (updateError) throw updateError;
      
      await supabase
        .from('admin_notifications')
        .insert({
          title: `🏆 Regular Pool Winner! ${winner.user_name || winner.user_email}`,
          message: `${selectedPool.prize_name} winner: ${winner.user_name || winner.user_email}`,
          type: 'winner'
        });
      
      setWinner({ ...winner, prize: selectedPool.target_amount, poolName: selectedPool.prize_name, ticketNumber });
      setShowWinnerDetails({ winner, prize: selectedPool.target_amount, poolName: selectedPool.prize_name, ticketNumber });
      
      toast.success(`Winner drawn! ${winner.user_name || winner.user_email} wins ${selectedPool.prize_name}!`, { id: toastId });
      await loadRegularPools();
      
    } catch (error) {
      console.error('Draw error:', error);
      toast.error('Failed to draw winner', { id: toastId });
    } finally {
      setDrawing(false);
      setShowConfirm(false);
    }
  };

  const executeDraw = () => {
    if (selectedProgram === 'merkato') drawMerkatoWinner();
    else if (selectedProgram === 'city') drawCityWinner();
    else drawRegularWinner();
  };

  const formatNumber = (num) => num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  const getProgramIcon = (program) => {
    if (program === 'merkato') return '🏪';
    if (program === 'city') return '🏙️';
    return '🏊';
  };

  const getTierIcon = (tier) => {
    if (tier === 'daily') return '⭐';
    if (tier === 'weekly') return '🏆';
    return '👑';
  };

  if (checkingAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <Head>
        <title>Draw Winner - Admin | Abbaa Carraa</title>
      </Head>
      
      <AdminLayout
        title="Draw Winner"
        subtitle="Select a program, choose a pool, and draw the lucky winner"
        icon="🎲"
        bgGradient="from-purple-600 to-pink-600"
        user={user}
        profile={profile}
        activeTab="draw"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6">
            {/* Program Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Program</label>
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => { setSelectedProgram('merkato'); setSelectedPool(null); setSelectedCity(null); setWinner(null); }} className={`p-3 rounded-xl text-center transition ${selectedProgram === 'merkato' ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <div className="text-2xl">🏪</div><div className="font-semibold text-sm">Merkato VIP</div>
                </button>
                <button onClick={() => { setSelectedProgram('city'); setSelectedPool(null); setSelectedCity(null); setWinner(null); }} className={`p-3 rounded-xl text-center transition ${selectedProgram === 'city' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <div className="text-2xl">🏙️</div><div className="font-semibold text-sm">City VIP</div>
                </button>
                <button onClick={() => { setSelectedProgram('regular'); setSelectedPool(null); setSelectedCity(null); setWinner(null); }} className={`p-3 rounded-xl text-center transition ${selectedProgram === 'regular' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <div className="text-2xl">🏊</div><div className="font-semibold text-sm">Regular Pools</div>
                </button>
              </div>
            </div>
            
            {/* Merkato VIP Selection */}
            {selectedProgram === 'merkato' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Merkato Pool</label>
                <select onChange={(e) => { const pool = merkatoPools.find(p => p.id === e.target.value); setSelectedPool(pool); setWinner(null); }} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500">
                  <option value="">-- Select a pool --</option>
                  {merkatoPools.map(pool => (
                    <option key={pool.id} value={pool.id}>{getTierIcon(pool.tier)} {pool.name} - {formatNumber(pool.prize_amount)} ETB</option>
                  ))}
                </select>
                {merkatoPools.length === 0 && <p className="text-sm text-gray-500 mt-2">No active Merkato pools available.</p>}
              </div>
            )}
            
            {/* City VIP Selection */}
            {selectedProgram === 'city' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select City</label>
                  <select onChange={(e) => setSelectedCity(e.target.value)} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500">
                    <option value="">-- Select a city --</option>
                    {cities.map(city => (<option key={city.city} value={city.city}>🏙️ {city.city} ({cityStats[city.city]?.total || 0} participants)</option>))}
                  </select>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Pool Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(poolTypes).map(([type, config]) => (
                      <button key={type} onClick={() => setSelectedPoolType(type)} className={`p-3 rounded-xl text-center transition ${selectedPoolType === type ? `bg-gradient-to-r ${config.color} text-white shadow-lg` : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                        <div className="text-2xl">{config.icon}</div><div className="font-bold text-sm">{config.name}</div>
                        <div className="text-xs mt-1">{cityStats[selectedCity]?.[type] || 0} participants</div>
                        <div className="text-xs font-semibold mt-1">{formatNumber(config.prize)} ETB</div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Regular Pools Selection */}
            {selectedProgram === 'regular' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Regular Pool</label>
                <select onChange={(e) => { const pool = regularPools.find(p => p.id === e.target.value); setSelectedPool(pool); setWinner(null); }} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500">
                  <option value="">-- Select a pool --</option>
                  {regularPools.map(pool => (<option key={pool.id} value={pool.id}>🎯 {pool.prize_name} - {formatNumber(pool.target_amount)} ETB</option>))}
                </select>
                {regularPools.length === 0 && <p className="text-sm text-gray-500 mt-2">No active regular pools available.</p>}
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
                    {winner.seat_numbers && <p className="text-gray-400 text-xs">Seats: {winner.seat_numbers.join(', ')}</p>}
                  </div>
                  <p className="text-sm text-gray-500 mt-4">{winner.poolName}</p>
                </div>
              </div>
            )}
            
            {/* Draw Button */}
            {(selectedPool || selectedCity) && !winner && (
              <button onClick={() => setShowConfirm(true)} disabled={drawing} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50">
                {drawing ? <span className="flex items-center justify-center gap-2"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> Drawing...</span> : '🎲 Draw Winner Now'}
              </button>
            )}
          </div>
        </div>
      </AdminLayout>
      
      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Draw</h2>
            <p className="text-gray-600 mb-4">Are you sure you want to run the draw for <strong>{selectedPool?.name || selectedCity || selectedPool?.prize_name}</strong>?</p>
            <p className="text-sm text-red-500 mb-6">⚠️ This action cannot be undone. A winner will be randomly selected.</p>
            <div className="flex gap-3">
              <button onClick={executeDraw} disabled={drawing} className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">Yes, Draw Winner</button>
              <button onClick={() => setShowConfirm(false)} className="flex-1 bg-gray-300 py-2 rounded-lg hover:bg-gray-400">Cancel</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Winner Details Modal */}
      {showWinnerDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="text-center mb-4"><div className="text-6xl mb-2">🏆</div><h2 className="text-2xl font-bold text-green-600">Winner Selected!</h2></div>
            <div className="space-y-3 mb-6">
              <div className="border-b pb-2"><p className="text-sm text-gray-500">Winner</p><p className="font-semibold text-lg">{showWinnerDetails.winner?.user_name || 'Anonymous User'}</p></div>
              <div className="border-b pb-2"><p className="text-sm text-gray-500">Prize Won</p><p className="font-semibold">{showWinnerDetails.poolName}</p><p className="text-sm text-green-600">{formatNumber(showWinnerDetails.prize)} ETB</p></div>
              <div className="border-b pb-2"><p className="text-sm text-gray-500">Ticket Number</p><p className="text-sm font-mono">{showWinnerDetails.ticketNumber}</p></div>
            </div>
            <button onClick={() => setShowWinnerDetails(null)} className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
