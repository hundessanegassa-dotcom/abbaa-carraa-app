import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { initializePayment } from '../lib/chapa';
import toast from 'react-hot-toast';

export default function ChapaPayment({ amount, poolId, poolName, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('telebirr');

  const handlePayment = async () => {
    setLoading(true);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Please login to continue');
      window.location.href = '/login';
      return;
    }
    
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();
    
    const nameParts = profile?.full_name?.split(' ') || ['User'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'User';
    
    // Generate unique transaction reference
    const tx_ref = `DETA_${Date.now()}_${user.id.slice(0, 8)}`;
    
    // Store transaction reference in database
    await supabase.from('transactions').insert({
      user_id: user.id,
      pool_id: poolId,
      amount: amount,
      tx_ref: tx_ref,
      status: 'pending',
      payment_method: paymentMethod,
      created_at: new Date().toISOString()
    });
    
    // Initialize payment with Chapa
    const payment = await initializePayment({
      amount: amount,
      email: user.email,
      firstName: firstName,
      lastName: lastName,
      tx_ref: tx_ref,
      title: `Contribute to ${poolName}`,
      description: `Join ${poolName} pool for a chance to win amazing prizes!`
    });
    
    if (payment.success && payment.checkoutUrl) {
      // Redirect to Chapa checkout
      window.location.href = payment.checkoutUrl;
    } else {
      toast.error(payment.error || 'Payment initialization failed');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setPaymentMethod('telebirr')}
          className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
            paymentMethod === 'telebirr' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-green-200'
          }`}
        >
          <span className="text-xl">📱</span>
          <span className="font-medium">Telebirr</span>
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod('cbebirr')}
          className={`p-3 rounded-xl border-2 transition flex items-center justify-center gap-2 ${
            paymentMethod === 'cbebirr' 
              ? 'border-green-500 bg-green-50' 
              : 'border-gray-200 hover:border-green-200'
          }`}
        >
          <span className="text-xl">🏦</span>
          <span className="font-medium">CBE Birr</span>
        </button>
      </div>
      
      {/* Amount Display */}
      <div className="bg-gray-50 rounded-xl p-4 text-center">
        <p className="text-gray-500 text-sm">You are contributing</p>
        <p className="text-3xl font-bold text-green-600">ETB {amount.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-1">💚 2% goes to charity</p>
      </div>
      
      {/* Payment Button */}
      <button
        onClick={handlePayment}
        disabled={loading}
        className={`w-full py-3 rounded-xl font-semibold text-white transition flex items-center justify-center gap-2 ${
          loading 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-green-500 to-teal-500 hover:shadow-lg transform hover:scale-[1.02]'
        }`}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          <>
            <span>💳</span>
            Pay with {paymentMethod === 'telebirr' ? 'Telebirr' : 'CBE Birr'}
          </>
        )}
      </button>
      
      {/* Trust Badges */}
      <div className="flex justify-center gap-4 text-xs text-gray-400">
        <span>🔒 Secure Payment</span>
        <span>⚡ Instant Confirmation</span>
        <span>💚 2% for Charity</span>
      </div>
    </div>
  );
}
