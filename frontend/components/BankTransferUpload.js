import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function BankTransferUpload({ poolId, amount, seatNumbers, onSuccess, onClose }) {
  const [reference, setReference] = useState('');
  const [proofImage, setProofImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useState(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

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
    
    setProofImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!reference) {
      toast.error('Please enter transaction reference number');
      return;
    }
    
    if (!proofImage) {
      toast.error('Please upload payment proof screenshot');
      return;
    }

    setUploading(true);

    try {
      // Upload image to Supabase Storage
      const fileExt = proofImage.name.split('.').pop();
      const fileName = `proofs/${user.id}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, proofImage);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      // Create bank transfer record
      const { error: insertError } = await supabase
        .from('bank_transfers')
        .insert({
          user_id: user.id,
          pool_id: poolId,
          amount: amount,
          reference: reference,
          proof_image: publicUrl,
          status: 'pending',
          seat_numbers: seatNumbers,
          created_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      toast.success('Payment proof submitted! Admin will verify shortly.');
      
      setTimeout(() => {
        onSuccess();
        router.push('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit payment proof');
    } finally {
      setUploading(false);
    }
  };

  const bankDetails = {
    bank_name: 'Commercial Bank of Ethiopia (CBE)',
    account_name: 'Negassa Hundessa Duga',
    account_number: '1000601091686',
    telebirr: '0913277922'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="text-center mb-4">
            <div className="text-5xl mb-2">🏦</div>
            <h2 className="text-2xl font-bold">Bank Transfer / Telebirr</h2>
            <p className="text-gray-500 text-sm">Complete payment and upload proof</p>
          </div>

          {/* Payment Instructions */}
          <div className="bg-blue-50 rounded-xl p-4 mb-4">
            <p className="font-semibold text-blue-800 mb-2">📋 Send payment to:</p>
            <div className="space-y-2">
              <div className="bg-white rounded-lg p-2">
                <p className="text-xs text-gray-500">Telebirr</p>
                <p className="font-mono font-bold text-lg">{bankDetails.telebirr}</p>
              </div>
              <div className="bg-white rounded-lg p-2">
                <p className="text-xs text-gray-500">Bank (CBE)</p>
                <p className="font-semibold">{bankDetails.account_name}</p>
                <p className="font-mono text-sm">{bankDetails.account_number}</p>
              </div>
            </div>
          </div>

          {/* Amount Summary */}
          <div className="bg-green-50 rounded-xl p-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm">Amount to Pay:</span>
              <span className="font-bold text-green-600 text-xl">ETB {amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm">Seats:</span>
              <span className="font-semibold">{seatNumbers?.join(', ')}</span>
            </div>
          </div>

          {/* Reference Number */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Transaction Reference *</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., TB1234567890 or TRF-2024-001"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
            <p className="text-xs text-gray-400 mt-1">Enter the reference number from your payment</p>
          </div>

          {/* Screenshot Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Payment Screenshot *</label>
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
                <img src={preview} alt="Preview" className="w-full h-40 object-cover rounded-lg border" />
                <button
                  onClick={() => {
                    setPreview(null);
                    setProofImage(null);
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg mb-4">
            <p className="text-xs text-yellow-800">
              ⚠️ After payment, upload your proof. Admin will verify within 1 hour.
              Your seats are reserved for 2 hours.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={!reference || !proofImage || uploading}
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
        </div>
      </div>
    </div>
  );
}
