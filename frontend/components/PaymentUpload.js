import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function PaymentUpload({ transaction, onSuccess, onClose }) {
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('telebirr');
  const [referenceNumber, setReferenceNumber] = useState('');
  const fileInputRef = useRef(null);
  const router = useRouter();

  const paymentMethods = [
    { id: 'telebirr', name: 'Telebirr', icon: '📱', number: '0913277922' },
    { id: 'cbe', name: 'CBE Bank Transfer', icon: '🏦', account: '1000601091686', name: 'Negassa Hundessa Duga' }
  ];

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const uploadScreenshot = async () => {
    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    if (!referenceNumber) {
      toast.error('Please enter transaction reference number');
      return;
    }

    setUploading(true);

    try {
      // Upload screenshot to Supabase Storage
      const fileExt = screenshot.name.split('.').pop();
      const fileName = `payments/${transaction.tx_ref}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, screenshot);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      // Update transaction with proof
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          payment_proof_url: publicUrl,
          reference_number: referenceNumber,
          payment_method: paymentMethod,
          status: 'pending_verification',
          submitted_at: new Date().toISOString()
        })
        .eq('tx_ref', transaction.tx_ref);

      if (updateError) throw updateError;

      // Create notification for admin
      await supabase
        .from('notifications')
        .insert({
          user_id: transaction.user_id,
          type: 'payment_submitted',
          title: 'New Payment Verification Required',
          message: `Payment of ETB ${transaction.amount.toLocaleString()} needs verification`,
          metadata: { tx_ref: transaction.tx_ref }
        });

      toast.success('Payment proof submitted! Admin will verify shortly.');
      
      setTimeout(() => {
        onSuccess();
        router.push('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to submit payment proof');
    } finally {
      setUploading(false);
    }
  };

  const currentMethod = paymentMethods.find(m => m.id === paymentMethod);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">📸</div>
            <h2 className="text-2xl font-bold">Upload Payment Proof</h2>
            <p className="text-gray-500 text-sm">Confirm your payment to secure your seats</p>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Payment Method</label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-3 rounded-xl border-2 transition ${
                    paymentMethod === method.id 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="text-2xl mb-1">{method.icon}</div>
                  <p className="text-sm font-semibold">{method.name}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <p className="font-semibold text-blue-800 mb-2">📋 Payment Instructions</p>
            {paymentMethod === 'telebirr' ? (
              <>
                <p className="text-sm">Send payment to:</p>
                <div className="bg-white rounded-lg p-2 mt-1 text-center">
                  <p className="font-mono font-bold text-lg">{currentMethod.number}</p>
                  <p className="text-xs text-gray-500">Telebirr Number</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">After sending, take a screenshot of the confirmation</p>
              </>
            ) : (
              <>
                <p className="text-sm">Transfer to:</p>
                <div className="bg-white rounded-lg p-2 mt-1">
                  <p className="text-sm"><strong>Bank:</strong> CBE</p>
                  <p className="text-sm"><strong>Account Name:</strong> {currentMethod.name}</p>
                  <p className="text-sm"><strong>Account Number:</strong> {currentMethod.account}</p>
                </div>
                <p className="text-xs text-blue-600 mt-2">Use your transaction ID as reference</p>
              </>
            )}
          </div>

          {/* Reference Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              {paymentMethod === 'telebirr' ? 'Telebirr Transaction ID' : 'Bank Reference Number'}
            </label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder={paymentMethod === 'telebirr' ? 'e.g., TB2312345678' : 'e.g., TRF-2024-001234'}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Screenshot Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Payment Screenshot</label>
            {!preview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-500 transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">📸</span>
                  <p className="text-sm text-gray-500">Click to upload screenshot</p>
                  <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img src={preview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <button
                  onClick={() => {
                    setPreview(null);
                    setScreenshot(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* Amount Summary */}
          <div className="bg-green-50 rounded-xl p-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Amount to Pay:</span>
              <span className="font-bold text-green-600 text-xl">ETB {transaction.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm">Seats:</span>
              <span className="font-semibold">{transaction.seat_numbers?.join(', ')}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={uploadScreenshot}
              disabled={!screenshot || !referenceNumber || uploading}
              className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {uploading ? 'Submitting...' : 'Submit for Verification'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-3">
            ⏰ Verification within 1 hour during business hours
          </p>
        </div>
      </div>
    </div>
  );
}
