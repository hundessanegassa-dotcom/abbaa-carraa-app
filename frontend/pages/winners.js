import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function Winners() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWinners();
  }, []);

  async function fetchWinners() {
    const { data, error } = await supabase
      .from('pools')
      .select('*, profiles!winner_id(full_name, email)')
      .not('winner_id', 'is', null)
      .order('draw_date', { ascending: false });

    if (!error) setWinners(data || []);
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold text-center mb-8">🏆 Past Winners 🏆</h1>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : winners.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No winners yet. Be the first!</p>
            <Link href="/" className="text-green-600 mt-4 inline-block">View Active Pools</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {winners.map((pool) => (
              <div key={pool.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-green-600">{pool.prize_name}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Draw Date: {new Date(pool.draw_date).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 mt-2">
                      Winner: <span className="font-semibold">{pool.profiles?.full_name || 'Anonymous'}</span>
                    </p>
                    <p className="text-gray-600">
                      Prize Value: ETB {pool.target_amount?.toLocaleString()}
                    </p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
                      🎉 Winner!
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
