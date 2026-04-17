import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function PoolRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    getUserAndRecommendations();
  }, []);

  async function getUserAndRecommendations() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      await getPersonalizedRecommendations(user.id);
    } else {
      await getPopularPools();
    }
    setLoading(false);
  }

  async function getPersonalizedRecommendations(userId) {
    // Get user's past contributions
    const { data: userContributions } = await supabase
      .from('contributions')
      .select('pools(category, city)')
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Extract preferred categories
    const categories = [...new Set(userContributions?.map(c => c.pools?.category).filter(Boolean) || [])];
    const cities = [...new Set(userContributions?.map(c => c.pools?.city).filter(Boolean) || [])];

    if (categories.length === 0 && cities.length === 0) {
      await getPopularPools();
      return;
    }

    // Find similar pools
    let query = supabase.from('pools').select('*').eq('status', 'active');

    if (categories.length > 0) {
      query = query.in('category', categories);
    }
    if (cities.length > 0) {
      query = query.in('city', cities);
    }

    const { data: similarPools } = await query.limit(6);

    if (similarPools && similarPools.length > 0) {
      setRecommendations(similarPools);
    } else {
      await getPopularPools();
    }
  }

  async function getPopularPools() {
    const { data: popular } = await supabase
      .from('pools')
      .select('*')
      .eq('status', 'active')
      .order('current_participants', { ascending: false })
      .limit(6);

    setRecommendations(popular || []);
  }

  if (loading || recommendations.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">🤖</span>
        <h2 className="text-xl font-bold text-gray-800">Recommended for You</h2>
        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">AI Powered</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendations.map(pool => (
          <Link key={pool.id} href={`/pools/${pool.id}`}>
            <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer border-l-4 border-green-500">
              <h3 className="font-bold text-green-600">{pool.prize_name}</h3>
              <p className="text-sm text-gray-500 mt-1">{pool.city || 'Addis Ababa'}</p>
              <div className="mt-2 flex justify-between text-sm">
                <span>ETB {pool.contribution_amount?.toLocaleString()}</span>
                <span className="text-green-600">{pool.current_participants || 0} joined</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
