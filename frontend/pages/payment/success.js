import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';

export default function PaymentSuccess() {
  const router = useRouter();
  const { tx_ref } = router.query;
  const [status, setStatus] = useState('verifying');
  const [poolName, setPoolName] = useState('');

  useEffect(() => {
    if (tx_ref) {
      verifyTransaction();
    }
  }, [tx_ref]);

  async function verifyTransaction() {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*, pools(prize_name)')
      .eq('tx_ref', tx_ref)
      .single();
    
    if (transaction) {
      setPoolName(transaction.pools?.prize_name);
      setStatus('success');
    } else {
      setStatus('error');
    }
  }

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p>Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-20 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-4xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h1>
        <p className="text-gray-500 mb-6">
          Your contribution to <strong>{poolName}</strong> has been confirmed.
        </p>
        <div className="bg-green-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-green-800">
            💚 Thank you for participating! 2% of your contribution supports kidney and heart disease treatment.
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/dashboard" className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition">
            Go to Dashboard
          </Link>
          <Link href="/listings" className="flex-1 border border-green-600 text-green-600 py-2 rounded-lg font-semibold hover:bg-green-50 transition">
            Browse More
          </Link>
        </div>
      </div>
    </div>
  );
}
