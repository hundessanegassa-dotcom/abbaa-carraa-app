import { useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

export default function ChapaPayment({ amount, poolId, poolName, userId, userEmail, userPhone, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('chapa'); // 'chapa' or 'bank'
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const router = useRouter();

  // Bank Account Details
  const bankDetails = {
    bankName: 'Commercial Bank of Ethiopia (CBE)',
    accountName: 'Abbaa Carraa PLC',
    accountNumber: '1000XXXXXXX',
    branch: 'Addis Ababa Main Branch',
    swiftCode: 'CBETETAA',
    reference: `POOL-${poolId}-${userId?.slice(0, 8)}`,
  };

  const handleChapaPayment = async () => {
    if (!userEmail) {
      toast.error('Please login to continue');
      router.push('/login');
      return;
    }

    setLoading(true);
    toast.loading('Initializing payment...', { id: 'payment' });

    try {
      const response = await fetch('/api/chapa/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          email: userEmail,
          phone: userPhone,
          poolId: poolId,
          poolName: poolName,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (data.success && data.checkout_url) {
        toast.success('Redirecting to payment...', { id: 'payment' });
        localStorage.setItem('pending_tx_ref', data.tx_ref);
        localStorage.setItem('pending_pool_id', poolId);
        window.location.href = data.checkout_url;
      } else {
        toast.error(data.error || 'Payment initialization failed', { id: 'payment' });
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Something went wrong. Please try again.', { id: 'payment' });
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransfer = () => {
    setShowBankDetails(true);
  };

  const handleProofUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingProof(true);
    toast.loading('Uploading proof...', { id: 'upload' });

    try {
      // Convert file to base64 for storage (or upload to Supabase Storage)
      const reader = new FileReader();
      reader.onloadend = async () => {
        const proofData = reader.result;

        // Save bank transfer request
        const { error } = await supabase
          .from('bank_transfers')
          .insert({
            user_id: userId,
            pool_id: poolId,
            amount: amount,
            reference: bankDetails.reference,
            proof_image: proofData,
            status: 'pending',
            created_at: new Date().toISOString(),
          });

        if (error) {
          toast.error('Failed to submit bank transfer request', { id: 'upload' });
        } else {
          toast.success('Bank transfer request submitted! Admin will verify within 24 hours.', { id: 'upload' });
          if (onSuccess) onSuccess();
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload proof', { id: 'upload' });
    } finally {
      setUploadingProof(false);
      setShowBankDetails(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Payment Method Selection */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-3">Select Payment Method</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="chapa"
              checked={paymentMethod === 'chapa'}
              onChange={() => setPaymentMethod('chapa')}
              className="w-4 h-4 text-green-600"
            />
            <div className="flex-1">
              <span className="font-medium">📱 Telebirr / CBE Birr</span>
              <p className="text-xs text-gray-500">Instant payment via mobile money</p>
            </div>
            <img src="/images/telebirr-logo.png" alt="Telebirr" className="h-6" />
          </label>

          <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="paymentMethod"
              value="bank"
              checked={paymentMethod === 'bank'}
              onChange={() => setPaymentMethod('bank')}
              className="w-4 h-4 text-green-600"
            />
            <div className="flex-1">
              <span className="font-medium">🏦 Bank Transfer</span>
              <p className="text-xs text-gray-500">Manual transfer, verification within 24 hours</p>
            </div>
          </label>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">Payment Summary</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Pool:</span>
            <span className="font-medium">{poolName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-bold text-green-600">ETB {amount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Bank Transfer Details */}
      {paymentMethod === 'bank' && !showBankDetails && (
        <button
          onClick={handleBankTransfer}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition"
        >
          Proceed with Bank Transfer
        </button>
      )}

      {/* Bank Account Information */}
      {showBankDetails && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-800 mb-3">🏦 Bank Transfer Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Bank:</span>
              <span className="font-medium">{bankDetails.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account Name:</span>
              <span className="font-medium">{bankDetails.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account Number:</span>
              <span className="font-mono font-bold">{bankDetails.accountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Branch:</span>
              <span>{bankDetails.branch}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">SWIFT Code:</span>
              <span className="font-mono">{bankDetails.swiftCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reference:</span>
              <span className="font-mono font-bold text-blue-700">{bankDetails.reference}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-blue-200">
            <p className="text-xs text-blue-700 mb-3">
              ⚠️ After transferring, upload your payment receipt/proof below.
            </p>
            <label className="block">
              <span className="text-sm font-medium">Upload Payment Proof</span>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleProofUpload}
                disabled={uploadingProof}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              <p className="text-xs text-gray-400 mt-1">Upload screenshot or PDF of bank transfer receipt</p>
            </label>
          </div>
        </div>
      )}

      {/* Chapa Payment Button */}
      {paymentMethod === 'chapa' && (
        <button
          onClick={handleChapaPayment}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              💳 Pay with Telebirr / CBE Birr
            </>
          )}
        </button>
      )}

      {(paymentMethod === 'bank' && showBankDetails) && (
        <p className="text-xs text-gray-400 text-center">
          Your entry will be activated after admin verifies your payment (usually within 24 hours).
        </p>
      )}

      <p className="text-xs text-gray-400 text-center">
        🔒 Secure payment. All transactions are encrypted.
      </p>
    </div>
  );
}
