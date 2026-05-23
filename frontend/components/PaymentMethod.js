import { useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function PaymentMethod({ amount, poolId, seatNumbers, userId, userEmail, userName, onClose }) {
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('bank_transfer');
  const [bankDetails, setBankDetails] = useState(null);
  const [showBankDetails, setShowBankDetails] = useState(false);
  const router = useRouter();

  const methods = [
    { 
      id: 'bank_transfer', 
      name: 'Bank Transfer', 
      icon: '🏦', 
      description: 'Direct bank transfer (instant verification)',
      color: 'from-green-600 to-teal-600',
      available: true
    },
    { 
      id: 'chapa', 
      name: 'Chapa (Coming Soon)', 
      icon: '💳', 
      description: 'Telebirr, CBE Birr, Card payments',
      color: 'from-gray-400 to-gray-500',
      available: false
    },
    { 
      id: 'telebirr', 
      name: 'Telebirr (Coming Soon)', 
      icon: '📱', 
      description: 'Direct Telebirr payment',
      color: 'from-gray-400 to-gray-500',
      available: false
    }
  ];

  const getBankInstructions = () => {
    return {
      bank_name: 'Commercial Bank of Ethiopia (CBE)',
      account_name: 'Negassa Hundessa Duga',
      account_number: '1000601091686',
      branch: 'Head Office',
      amount: amount,
      telebirr: '0913277922',
      reference: `ABBA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      note: 'Payment will be verified within 1 hour during business hours'
    };
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    const method = methods.find(m => m.id === selectedMethod);
    if (!method.available) {
      toast.info(`${method.name} is coming soon! Please use Bank Transfer for now.`);
      return;
    }

    setLoading(true);
    
    const firstName = userName?.split(' ')[0] || 'User';
    const lastName = userName?.split(' ')[1] || '';
    const tx_ref = getBankInstructions().reference;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        tx_ref,
        user_id: userId,
        pool_id: poolId,
        amount: amount,
        status: 'pending',
        payment_method: 'bank_transfer',
        seat_numbers: seatNumbers,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (txError) {
      console.error('Transaction creation error:', txError);
      toast.error('Failed to create transaction');
      setLoading(false);
      return;
    }

    // Reserve seats
    const { error: seatError } = await supabase
      .from('pool_seats')
      .update({
        status: 'reserved',
        user_id: userId,
        transaction_id: transaction.id,
        reserved_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours
      })
      .in('seat_number', seatNumbers)
      .eq('pool_id', poolId);

    if (seatError) {
      console.error('Seat reservation error:', seatError);
    }

    setBankDetails(getBankInstructions());
    setShowBankDetails(true);
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  if (showBankDetails && bankDetails) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-4">
          <div className="text-5xl mb-2">🏦</div>
          <h2 className="text-2xl font-bold">Bank Transfer Details</h2>
          <p className="text-gray-500 text-sm">Complete the transfer to confirm your seats</p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-yellow-800">⚠️ Important</p>
            <p className="text-xs text-yellow-700">Payment must be completed within 2 hours. Seats are reserved for you.</p>
          </div>

          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-500">Bank Name</p>
            <div className="flex justify-between items-center">
              <p className="font-semibold">{bankDetails.bank_name}</p>
              <button onClick={() => copyToClipboard(bankDetails.bank_name)} className="text-green-600 text-sm">📋 Copy</button>
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-500">Account Name</p>
            <div className="flex justify-between items-center">
              <p className="font-semibold">{bankDetails.account_name}</p>
              <button onClick={() => copyToClipboard(bankDetails.account_name)} className="text-green-600 text-sm">📋 Copy</button>
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-500">Account Number</p>
            <div className="flex justify-between items-center">
              <p className="font-mono font-bold text-lg">{bankDetails.account_number}</p>
              <button onClick={() => copyToClipboard(bankDetails.account_number)} className="text-green-600 text-sm">📋 Copy</button>
            </div>
          </div>

          <div className="border rounded-lg p-3 bg-green-50">
            <p className="text-xs text-gray-500">Amount to Transfer</p>
            <div className="flex justify-between items-center">
              <p className="font-bold text-green-600 text-2xl">ETB {bankDetails.amount.toLocaleString()}</p>
              <button onClick={() => copyToClipboard(bankDetails.amount.toString())} className="text-green-600 text-sm">📋 Copy</button>
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-500">Your Transaction Reference</p>
            <div className="flex justify-between items-center">
              <p className="font-mono text-sm">{bankDetails.reference}</p>
              <button onClick={() => copyToClipboard(bankDetails.reference)} className="text-green-600 text-sm">📋 Copy</button>
            </div>
          </div>

          <div className="border rounded-lg p-3">
            <p className="text-xs text-gray-500">Telebirr (Alternative)</p>
            <div className="flex justify-between items-center">
              <p className="font-semibold">{bankDetails.telebirr}</p>
              <button onClick={() => copyToClipboard(bankDetails.telebirr)} className="text-green-600 text-sm">📋 Copy</button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Send to this number and share screenshot via WhatsApp/Telegram</p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-semibold text-blue-800">📱 After Transfer</p>
            <p className="text-xs text-blue-700">Send your payment confirmation to:</p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => window.open('https://wa.me/251913277922', '_blank')}
                className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                📱 WhatsApp
              </button>
              <button
                onClick={() => window.open('https://t.me/abbaacarraa', '_blank')}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
              >
                💬 Telegram
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700"
          >
            Go to Dashboard
          </button>
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
      <div className="text-center mb-4">
        <div className="text-5xl mb-2">💳</div>
        <h2 className="text-2xl font-bold">Select Payment Method</h2>
        <p className="text-gray-500 text-sm">Amount to pay: ETB {amount.toLocaleString()}</p>
        <p className="text-xs text-green-600 mt-1">✨ Seats: {seatNumbers.join(', ')}</p>
      </div>

      <div className="space-y-3 mb-6">
        {methods.map(method => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            disabled={!method.available}
            className={`w-full p-4 rounded-xl border-2 transition-all text-left flex items-center gap-4 ${
              selectedMethod === method.id 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-200 hover:border-green-300'
            } ${!method.available ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className={`w-12 h-12 bg-gradient-to-r ${method.color} rounded-full flex items-center justify-center text-2xl`}>
              {method.icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{method.name}</p>
              <p className="text-xs text-gray-500">{method.description}</p>
            </div>
            {!method.available && (
              <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">Soon</span>
            )}
            {selectedMethod === method.id && method.available && (
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="bg-blue-50 p-3 rounded-lg mb-4">
        <p className="text-xs text-blue-700 text-center">
          💡 Bank Transfer is available now. Chapa & Telebirr coming soon!
        </p>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Confirm & Get Bank Details'}
        </button>
        <button
          onClick={onClose}
          className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
