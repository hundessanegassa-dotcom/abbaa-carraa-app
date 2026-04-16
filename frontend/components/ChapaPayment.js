import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function ChapaPayment({ pool, amount, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const formContainerRef = useRef(null);

  // Load Chapa inline script dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.chapa.co/v1/inline.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login first');
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, email')
        .eq('id', user.id)
        .single();

      // Initialize payment with our API
      const response = await fetch('/api/chapa/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          email: profile?.email || user.email,
          first_name: profile?.full_name?.split(' ')[0] || 'User',
          last_name: profile?.full_name?.split(' ')[1] || '',
          phone_number: profile?.phone || '',
          poolId: pool.id,
          poolName: pool.prize_name
        })
      });

      const result = await response.json();

      if (result.success && result.checkout_url) {
        // Redirect to Chapa checkout
        window.location.href = result.checkout_url;
      } else {
        toast.error(result.error || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Pay with Chapa</h2>
        <p className="text-gray-600 mb-2">Pool: {pool.prize_name}</p>
        <p className="text-xl font-bold text-green-600 mb-4">Amount: ETB {amount.toLocaleString()}</p>
        
        <p className="text-sm text-gray-500 mb-4">
          You will be redirected to Chapa's secure payment page. 
          Supported methods: Telebirr, CBE Birr, and more.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={handlePayment}
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
