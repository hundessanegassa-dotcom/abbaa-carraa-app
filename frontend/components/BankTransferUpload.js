import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

export default function BankTransferUpload({ 
  poolId, 
  amount, 
  seatNumbers, 
  onSuccess, 
  onClose 
}) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown
  const [bankDetails, setBankDetails] = useState(null);

  // Get session safely on mount
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (!session?.user) {
          toast.error('Please login to continue');
          onClose();
          router.push('/login');
          return;
        }
        
        setUser(session.user);
        
        // Fetch bank details
        await fetchBankDetails();
      } catch (err) {
        console.error('Session error:', err);
        toast.error('Session error. Please refresh and try again');
        onClose();
      } finally {
        setSessionLoading(false);
      }
    };

    getSession();
  }, [router, onClose]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0 && !sessionLoading) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !sessionLoading) {
      toast.error('Reservation expired! Please reselect seats.');
      onClose();
    }
  }, [timeLeft, sessionLoading, onClose]);

  const fetchBankDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('bank_name, account_name, account_number')
        .eq('setting_key', 'bank_details')
        .single();

      if (!error && data) {
        setBankDetails(data);
      } else {
        // Default bank details
        setBankDetails({
          bank_name: 'Commercial Bank of Ethiopia',
          account_name: 'Abbaa Carraa PLC',
          account_number: '1000134567890'
        });
      }
    } catch (err) {
      console.error('Bank details error:', err);
      // Set default bank details
      setBankDetails({
        bank_name: 'Commercial Bank of Ethiopia',
        account_name: 'Abbaa Carraa PLC',
        account_number: '1000134567890'
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File too large. Max 5MB');
        return;
      }
      if (!selectedFile.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }
      setFile(selectedFile);
      
      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImageUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleUpload = async () => {
    // Check session before proceeding
    if (sessionLoading) {
      toast.loading('Checking session...', { duration: 1000 });
      return;
    }

    if (!user) {
      toast.error('Please login to continue');
      router.push('/login');
      return;
    }

    if (!file && !uploadedImageUrl) {
      toast.error('Please select a bank transfer receipt');
      return;
    }

    if (!transactionId) {
      toast.error('Please enter transaction ID/reference number');
      return;
    }

    setUploading(true);

    try {
      let imageUrl = uploadedImageUrl;

      // Upload image if new file selected
      if (file && !uploadedImageUrl?.startsWith('http')) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        const filePath = `payment-proofs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          pool_id: poolId,
          amount: amount,
          seat_numbers: seatNumbers,
          transaction_id: transactionId,
          payment_proof_url: imageUrl,
          status: 'pending_verification',
          created_at: new Date().toISOString(),
          payment_method: 'bank_transfer'
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Mark seats as pending payment (not taken yet)
      const { error: seatUpdateError } = await supabase
        .from('pool_seats')
        .update({
          status: 'payment_pending',
          payment_id: payment.id
        })
        .in('seat_number', seatNumbers)
        .eq('pool_id', poolId);

      if (seatUpdateError) throw seatUpdateError;

      toast.success('Payment proof submitted! Pending verification.');
      
      // Call onSuccess to refresh UI
      if (onSuccess) {
        await onSuccess();
      }
      
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to submit payment: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md w-full">
          <div className="text-center">
            <p className="text-red-600 mb-4">Session expired. Please login again.</p>
            <button
              onClick={() => router.push('/login')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Bank Transfer Payment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Countdown Timer */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-center">
          <p className="text-sm text-yellow-800">
            ⏰ Complete payment within: <span className="font-bold text-lg">{formatTime(timeLeft)}</span>
          </p>
          <p className="text-xs text-yellow-600 mt-1">Your seats are reserved until then</p>
        </div>

        {/* Bank Details */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold mb-2">🏦 Bank Account Details</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Bank:</span> {bankDetails?.bank_name}</p>
            <p><span className="font-medium">Account Name:</span> {bankDetails?.account_name}</p>
            <p><span className="font-medium">Account Number:</span> {bankDetails?.account_number}</p>
            <div className="border-t border-blue-200 mt-2 pt-2">
              <p><span className="font-medium">Amount to Transfer:</span></p>
              <p className="text-lg font-bold text-green-600">ETB {amount?.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Transaction ID/Reference Number *
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
              placeholder="e.g., CBE123456789"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the reference number from your bank transfer</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Upload Payment Receipt (Screenshot/Photo) *
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full border rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Max 5MB. JPG, PNG, or GIF format only
            </p>
          </div>

          {uploadedImageUrl && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Preview:</p>
              <img src={uploadedImageUrl} alt="Receipt" className="max-h-32 rounded border" />
            </div>
          )}
        </div>

        {/* Seat Summary */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium mb-1">Selected Seats:</p>
          <p className="text-lg font-semibold">{seatNumbers?.sort((a, b) => a - b).join(', ')}</p>
          <div className="border-t border-gray-200 mt-2 pt-2">
            <p className="text-sm">
              <span className="font-medium">Number of Seats:</span> {seatNumbers?.length}
            </p>
            <p className="text-sm">
              <span className="font-medium">Total Amount:</span> ETB {amount?.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Important Instructions */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Important:</p>
          <ul className="text-xs text-red-700 space-y-1">
            <li>• Transfer the EXACT amount shown above</li>
            <li>• Use your phone number as reference when transferring</li>
            <li>• Upload clear screenshot showing transaction details</li>
            <li>• Seats will be confirmed after payment verification</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading || (!file && !uploadedImageUrl) || !transactionId}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Submitting...
              </span>
            ) : (
              'Submit Payment Proof'
            )}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your seats will be released if payment is not completed within {formatTime(timeLeft)}
        </p>
      </div>
    </div>
  );
}
