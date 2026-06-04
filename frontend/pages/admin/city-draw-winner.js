import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function CityDrawWinner() {
  const router = useRouter();
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedPoolType, setSelectedPoolType] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [cityStats, setCityStats] = useState({});

  // Pool types configuration
  const poolTypes = {
    daily: {
      name: 'Daily Millionaire',
      contribution: 500,
      prize: 1000000,
      icon: '⭐',
      color: 'from-yellow-500 to-orange-600'
    },
    weekly: {
      name: 'Weekly Mega Winner',
      contribution: 2500,
      prize: 10000000,
      icon: '🏆',
      color: 'from-purple-500 to-pink-600'
    },
    monthly: {
      name: 'Monthly Winner',
      contribution: 5000,
      prize: 40000000,
      icon: '👑',
      color: 'from-green-600 to-teal-700'
    }
  };

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
      fetchCitiesWithParticipants();
    };
    
    checkAdmin();
  }, [router]);

  const fetchCitiesWithParticipants = async () => {
    try {
      // Fetch all city VIP participants
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
      console.error('Error fetching cities:', error);
      toast.error('Failed to load city data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCityParticipants = async (city, poolType) => {
    const { data, error } = await supabase
      .from('city_vip_participants')
      .select('*')
      .eq('city', city)
      .eq('pool_type', poolType)
      .eq('payment_status', 'verified')
      .neq('is_winner', true);
    
    if (error) {
      toast.error('Failed to fetch participants');
      return [];
    }
    
    return data;
  };

  const drawWinner = async () => {
    if (!selectedCity) {
      toast.error('Please select a city');
      return;
    }
    
    setDrawing(true);
    
    try {
      // Get participants for selected city and pool type
      const participants = await fetchCityParticipants(selectedCity, selectedPoolType);
      
      if (participants.length === 0) {
        toast.error(`No verified participants in ${selectedCity} for ${poolTypes[selectedPoolType].name}`);
        setDrawing(false);
        return;
      }
      
      // Random selection
      const randomIndex = Math.floor(Math.random() * participants.length);
      const winner = participants[randomIndex];
      const poolConfig = poolTypes[selectedPoolType];
      
      // Generate ticket number
      const ticketNumber = `${selectedCity.toUpperCase().replace(/\s/g, '-')}-${selectedPoolType.toUpperCase()}-${Date.now()}-${randomIndex + 1}`;
      
      // Mark participant as winner
      const { error: updateError } = await supabase
        .from('city_vip_participants')
        .update({ 
          is_winner: true,
          winner_drawn_at: new Date().toISOString(),
          status: 'winner'
        })
        .eq('id', winner.id);
      
      if (updateError) throw updateError;
      
      // Record draw history in merkato_vip_draws (reuse table with city type)
      const { error: historyError } = await supabase
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
          drawn_by: (await supabase.auth.getUser()).data.user?.id
        });
      
      if (historyError) throw historyError;
      
      // Send notification to winner
      await supabase
        .from('notifications')
        .insert({
          user_id: winner.user_id,
          title: '🎉 Congratulations! You Won!',
          message: `You have won ${poolConfig.prize.toLocaleString()} ETB in the ${selectedCity} City VIP ${selectedPoolType} pool!`,
          type: 'winner',
          link_url: `/dashboard`,
          created_at: new Date().toISOString()
        });
      
      setWinner({
        ...winner,
        prize: poolConfig.prize,
        poolName: `${selectedCity} - ${poolConfig.name}`,
        ticketNumber: ticketNumber,
        poolType: selectedPoolType,
        poolIcon: poolConfig.icon
      });
      
      toast.success(`🎉 Winner drawn! ${winner.user_name || winner.user_email} wins ${poolConfig.prize.toLocaleString()} ETB!`);
      
      // Refresh cities list
      await fetchCitiesWithParticipants();
      
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

  if (checkingAdmin || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Draw City VIP Winner - Admin</title>
      </Head>
      
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-4">
            <button onClick={() => router.push('/admin/dashboard')} className="text-gray-600 hover:text-gray-800">
              ← Back to Dashboard
            </button>
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-700 to-gray-900 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">Draw City VIP Winner</h1>
              <p className="text-gray-300 text-sm">Select a city and pool type to draw the lucky winner</p>
            </div>
            
            <div className="p-6">
              {/* City Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select City
                </label>
                <select
                  value={selectedCity || ''}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setWinner(null);
                  }}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-gray-500"
                >
                  <option value="">-- Select a city --</option>
                  {cities.map(city => (
                    <option key={city.city} value={city.city}>
                      🏙️ {city.city} ({cityStats[city.city]?.total || 0} participants)
                    </option>
                  ))}
                </select>
                {cities.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">No cities with verified participants available.</p>
                )}
              </div>
              
              {/* Pool Type Selection */}
              {selectedCity && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Pool Type
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(poolTypes).map(([type, config]) => {
                      const participantCount = cityStats[selectedCity]?.[type] || 0;
                      return (
                        <button
                          key={type}
                          onClick={() => {
                            setSelectedPoolType(type);
                            setWinner(null);
                          }}
                          className={`p-4 rounded-xl text-center transition transform hover:scale-105 ${
                            selectedPoolType === type
                              ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <div className="text-3xl mb-1">{config.icon}</div>
                          <div className="font-bold text-sm">{config.name}</div>
                          <div className="text-xs mt-1">
                            {participantCount} participant{participantCount !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs font-semibold mt-1">
                            {formatNumber(config.prize)} ETB
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* City Stats */}
              {selectedCity && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="font-bold text-lg mb-3">📊 {selectedCity} Statistics</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-yellow-600">{cityStats[selectedCity]?.daily || 0}</p>
                      <p className="text-xs text-gray-500">Daily Participants</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-600">{cityStats[selectedCity]?.weekly || 0}</p>
                      <p className="text-xs text-gray-500">Weekly Participants</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{cityStats[selectedCity]?.monthly || 0}</p>
                      <p className="text-xs text-gray-500">Monthly Participants</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Selected Pool Details */}
              {selectedCity && selectedPoolType && (
                <div className={`bg-gradient-to-r ${poolTypes[selectedPoolType].color} rounded-xl p-6 mb-6 text-white`}>
                  <h3 className="font-bold text-lg mb-3">Pool Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm opacity-80">City</p>
                      <p className="font-semibold">🏙️ {selectedCity}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Pool Type</p>
                      <p className="font-semibold">{poolTypes[selectedPoolType].icon} {poolTypes[selectedPoolType].name}</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Prize Amount</p>
                      <p className="font-bold text-lg">{formatNumber(poolTypes[selectedPoolType].prize)} ETB</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Entry Fee</p>
                      <p>{formatNumber(poolTypes[selectedPoolType].contribution)} ETB</p>
                    </div>
                    <div>
                      <p className="text-sm opacity-80">Verified Participants</p>
                      <p className="font-bold">{cityStats[selectedCity]?.[selectedPoolType] || 0}</p>
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
                      <p className="text-gray-400 text-xs">Seats: {winner.seat_numbers?.join(', ')}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">{winner.poolName}</p>
                  </div>
                </div>
              )}
              
              {/* Draw Button */}
              {selectedCity && selectedPoolType && !winner && (
                <button
                  onClick={drawWinner}
                  disabled={drawing || (cityStats[selectedCity]?.[selectedPoolType] || 0) === 0}
                  className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {drawing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Drawing...
                    </span>
                  ) : (
                    `🎲 Draw ${selectedCity} ${poolTypes[selectedPoolType].name} Winner`
                  )}
                </button>
              )}
              
              {/* No Participants Message */}
              {selectedCity && selectedPoolType && (cityStats[selectedCity]?.[selectedPoolType] || 0) === 0 && !winner && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-yellow-800">⚠️ No verified participants in this pool yet.</p>
                  <p className="text-yellow-600 text-sm mt-1">Please verify payments before drawing winners.</p>
                </div>
              )}
              
              {/* Back Button */}
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="w-full mt-4 py-2 text-gray-600 hover:text-gray-800 transition"
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
