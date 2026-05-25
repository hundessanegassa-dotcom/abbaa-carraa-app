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
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes countdown
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('telebirr');
  const [uploadProgress, setUploadProgress] = useState(0);

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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Optimize image before upload
  const optimizeImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions (max 1200px)
          const maxWidth = 1200;
          const maxHeight = 1200;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Compress to JPEG with 0.8 quality
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Convert data URL to Blob
          const blob = dataURLToBlob(optimizedDataUrl);
          
          // Create a new File object
          const optimizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          resolve(optimizedFile);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  // Helper function to convert data URL to Blob
  const dataURLToBlob = (dataURL) => {
    const parts = dataURL.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    
    return new Blob([uInt8Array], { type: contentType });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Check file size (original - 10MB max before compression)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB before compression');
      return;
    }
    
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Please upload an image file (JPG, PNG, GIF, WEBP)');
      return;
    }
    
    toast.loading('Optimizing image...', { id: 'optimize' });
    
    try {
      // Optimize the image
      const optimizedFile = await optimizeImage(selectedFile);
      
      console.log(`Original size: ${(selectedFile.size / 1024).toFixed(2)} KB`);
      console.log(`Optimized size: ${(optimizedFile.size / 1024).toFixed(2)} KB`);
      
      setFile(optimizedFile);
      
      // Create preview
      const previewUrl = URL.createObjectURL(optimizedFile);
      setUploadedImageUrl(previewUrl);
      
      toast.success('Image optimized! Ready to upload', { id: 'optimize' });
    } catch (error) {
      console.error('Image optimization error:', error);
      toast.error('Failed to optimize image', { id: 'optimize' });
      // Fallback to original file
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setUploadedImageUrl(previewUrl);
    }
  };

  const uploadToSupabase = async (file, userId) => {
    return new Promise((resolve, reject) => {
      const fileName = `${userId}_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `payment-proofs/${fileName}`;
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
        .then(({ error, data }) => {
          clearInterval(progressInterval);
          setUploadProgress(100);
          
          if (error) {
            reject(error);
            return;
          }
          
          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('payment-proofs')
            .getPublicUrl(filePath);
          
          resolve(publicUrl);
        })
        .catch(reject);
    });
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
      toast.error('Please upload a payment screenshot');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let imageUrl = uploadedImageUrl;

      // Upload image if new file selected
      if (file && !uploadedImageUrl?.startsWith('http')) {
        toast.loading('Uploading screenshot...', { id: 'upload' });
        imageUrl = await uploadToSupabase(file, user.id);
        toast.success('Screenshot uploaded!', { id: 'upload' });
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: user.id,
          pool_id: poolId,
          amount: amount,
          seat_numbers: seatNumbers,
          payment_method: selectedPaymentMethod,
          payment_proof_url: imageUrl,
          status: 'pending_verification',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Mark seats as pending payment
      const { error: seatUpdateError } = await supabase
        .from('pool_seats')
        .update({
          status: 'payment_pending',
          payment_id: payment.id,
          updated_at: new Date().toISOString()
        })
        .in('seat_number', seatNumbers)
        .eq('pool_id', poolId);

      if (seatUpdateError) throw seatUpdateError;

      toast.success('Payment submitted! Verification within 24 hours.');
      
      // Wait a moment before redirecting
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
      
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to submit payment: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Complete Your Payment</h2>
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

        {/* Payment Method Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Select Payment Method</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedPaymentMethod('telebirr')}
              className={`p-3 rounded-lg border-2 transition ${
                selectedPaymentMethod === 'telebirr' 
                  ? 'border-green-600 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="text-center">
                <span className="text-2xl block mb-1">📱</span>
                <span className="font-semibold text-sm">TeleBirr</span>
              </div>
            </button>
            <button
              onClick={() => setSelectedPaymentMethod('cbe')}
              className={`p-3 rounded-lg border-2 transition ${
                selectedPaymentMethod === 'cbe' 
                  ? 'border-green-600 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300'
              }`}
            >
              <div className="text-center">
                <span className="text-2xl block mb-1">🏦</span>
                <span className="font-semibold text-sm">CBE Bank</span>
              </div>
            </button>
          </div>
        </div>

        {/* Payment Details based on selection */}
        {selectedPaymentMethod === 'telebirr' ? (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span>📱</span> TeleBirr Payment Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                <span className="text-gray-600">Account Name:</span>
                <span className="font-semibold">Negassa Hundessa</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">TeleBirr Number:</span>
                <span className="font-semibold text-lg text-blue-700">0913277922</span>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to Pay:</span>
                  <span className="font-bold text-xl text-green-600">ETB {amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
              <p className="font-semibold">📝 Instructions:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Open TeleBirr app</li>
                <li>Select "Send Money"</li>
                <li>Enter number: <span className="font-bold">0913277922</span></li>
                <li>Enter amount: <span className="font-bold">ETB {amount?.toLocaleString()}</span></li>
                <li>Take a screenshot of the confirmation</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <span>🏦</span> CBE Bank Payment Details
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                <span className="text-gray-600">Account Name:</span>
                <span className="font-semibold">Negassa Hundessa</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Account Number:</span>
                <span className="font-semibold text-lg text-blue-700">1000601091686</span>
              </div>
              <div className="mt-2 pt-2 border-t border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount to Pay:</span>
                  <span className="font-bold text-xl text-green-600">ETB {amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
              <p className="font-semibold">📝 Instructions:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Use CBE Birr app or visit any CBE branch</li>
                <li>Transfer to: <span className="font-bold">1000601091686</span></li>
                <li>Account name: <span className="font-bold">Negassa Hundessa</span></li>
                <li>Amount: <span className="font-bold">ETB {amount?.toLocaleString()}</span></li>
                <li>Take a screenshot/slip photo</li>
              </ol>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload Payment Screenshot/Photo *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-500 transition">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                className="hidden"
                id="payment-screenshot"
                disabled={uploading}
              />
              <label
                htmlFor="payment-screenshot"
                className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-600">
                  {file ? file.name : 'Click or drag to upload screenshot'}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  JPG, PNG, GIF (Max 10MB) - Auto-compressed
                </span>
              </label>
            </div>
          </div>

          {uploadedImageUrl && (
            <div className="mt-2">
              <p className="text-sm font-medium mb-1">Preview:</p>
              <img src={uploadedImageUrl} alt="Payment Screenshot" className="max-h-40 rounded border mx-auto" />
            </div>
          )}

          {/* Upload Progress */}
          {uploading && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Seat Summary */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium mb-1">Selected Seats:</p>
          <p className="text-lg font-semibold">{seatNumbers?.sort((a, b) => a - b).join(', ')}</p>
          <div className="border-t border-gray-200 mt-2 pt-2">
            <div className="flex justify-between">
              <span className="text-sm">Number of Seats:</span>
              <span className="text-sm font-semibold">{seatNumbers?.length}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-sm">Total Amount:</span>
              <span className="text-sm font-bold text-green-600">ETB {amount?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Important Instructions */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm font-semibold text-red-800 mb-1">⚠️ Important:</p>
          <ul className="text-xs text-red-700 space-y-1">
            <li>• Transfer the EXACT amount shown above</li>
            <li>• Use your registered phone number as reference</li>
            <li>• Upload a CLEAR screenshot showing transaction details</li>
            <li>• Seats will be confirmed after payment verification (24 hours)</li>
            <li>• Screenshot will be automatically optimized</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading || (!file && !uploadedImageUrl)}
            className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </span>
            ) : (
              'Submit Payment Proof'
            )}
          </button>
          <button
            onClick={onClose}
            disabled={uploading}
            className="flex-1 border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition"
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
