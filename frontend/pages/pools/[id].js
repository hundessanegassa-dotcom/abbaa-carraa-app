import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PoolDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPoolDetails();
    }
  }, [id]);

  async function fetchPoolDetails() {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPool(data);
    } catch (error) {
      console.error('Error fetching pool:', error);
      toast.error('Pool not found');
    } finally {
      setLoading(false);
    }
  }

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

  const progress = (pool.current_amount / pool.target_amount) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <Link href="/" className="text-green-600 hover:text-green-700 mb-4 inline-block">
          ← Back to Pools
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
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
              <p className="text-gray-500 text-sm">Progress</p>
              <p className="text-xl font-bold text-green-600">{progress.toFixed(1)}%</p>
            </div>
          </div>

          <div className="mt-6">
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div className="bg-green-600 h-4 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
            </div>
          </div>

          <Link href={`/pools/${id}/join`}>
            <button className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700">
              Join This Pool
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
