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
      setTimeout(() => {
        router.push('/');
      }, 2000);
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
          {pool.image_url && (
            <div className="mb-6 rounded-lg overflow-hidden">
              <img src={pool.image_url} alt={pool.prize_name} className="w-full h-64 object-cover" />
            </div>
          )}
          
          <h1 className="text-3xl font-bold mb-2">{pool.prize_name}</h1>
          <p className="text-gray-600 mb-6">{pool.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

          <div className="mb-6">
            <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
              <div className="bg-green-600 h-4 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
            </div>
            <div className="flex justify-between text-sm mt-2 text-gray-500">
              <span>Raised: ETB {pool.current_amount?.toLocaleString()}</span>
              <span>Remaining: ETB {(pool.target_amount - pool.current_amount)?.toLocaleString()}</span>
            </div>
          </div>

          {pool.discount_for_non_winners > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-blue-800 text-sm">
                🎉 Special Offer: If you don't win, you get {pool.discount_for_non_winners}% discount from the vendor!
              </p>
            </div>
          )}

          <button className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition">
            Join This Pool - ETB {pool.contribution_amount?.toLocaleString()}
          </button>
          <p className="text-xs text-gray-400 text-center mt-2">
            Payment via Telebirr or CBE Birr (Coming Soon)
          </p>
        </div>
      </div>
    </div>
  );
}
