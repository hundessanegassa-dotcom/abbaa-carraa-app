import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function PaymentVerify() {
  const router = useRouter();
  const { tx_ref, status } = router.query;
  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (tx_ref) {
      verifyPayment();
    }
  }, [tx_ref]);

  async function verifyPayment() {
    try {
      const response = await fetch('/api/chapa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tx_ref })
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        toast.success('Payment successful! You are now entered in the pool.');
        
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);
      } else {
        setError(result.message || 'Payment verification failed');
        toast.error('Payment verification failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('Could not verify payment. Please contact support.');
    } finally {
      setVerifying(false);
    }
  }

  if (verifying) {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
        {success ? (
          <>
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your contribution has been recorded. You are now entered in the prize pool.
            </p>
            <Link href="/dashboard">
              <button className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                Go to Dashboard
              </button>
            </Link>
          </>
        ) : (
          <>
            <div className="text-red-600 text-6xl mb-4">✗</div>
            <h1 className="text-2xl font-bold mb-2">Payment Issue</h1>
            <p className="text-gray-600 mb-6">{error || 'Payment could not be verified.'}</p>
            <Link href="/">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Return Home
              </button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
