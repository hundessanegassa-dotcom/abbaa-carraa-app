import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function VoiceOTP({ phone, onVerified, onBack }) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [channel, setChannel] = useState('sms'); // 'sms' or 'call'

  const sendOTP = async (selectedChannel) => {
    setLoading(true);
    setChannel(selectedChannel);
    
    try {
      const response = await fetch('/api/auth/send-voice-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, channel: selectedChannel }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(data.error || 'Failed to send code');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length < 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/verify-voice-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code: otp }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Phone verified successfully!');
        if (onVerified) onVerified();
      } else {
        toast.error(data.error || 'Invalid code');
      }
    } catch (error) {
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = () => {
    if (countdown > 0) return;
    sendOTP(channel);
  };

  // Auto-send SMS OTP on mount
  useEffect(() => {
    sendOTP('sms');
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">📞</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Verify Your Phone</h2>
        <p className="text-gray-500 text-sm mt-1">
          Enter the 6-digit code sent to <strong>{phone}</strong>
        </p>
      </div>

      {/* Channel Selection */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => sendOTP('sms')}
          disabled={loading}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
            channel === 'sms'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📱 SMS
        </button>
        <button
          type="button"
          onClick={() => sendOTP('call')}
          disabled={loading}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
            channel === 'call'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          📞 Voice Call
        </button>
      </div>

      {/* OTP Input */}
      <div>
        <label className="block text-gray-700 mb-2">Verification Code</label>
        <input
          type="text"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl tracking-widest focus:ring-2 focus:ring-green-500"
          placeholder="000000"
          maxLength={6}
          autoFocus
        />
      </div>

      {/* Verify Button */}
      <button
        onClick={verifyOTP}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-green-700 transition disabled:bg-gray-400"
      >
        {loading ? 'Verifying...' : 'Verify & Continue →'}
      </button>

      {/* Resend */}
      <div className="text-center">
        <button
          type="button"
          onClick={resendOTP}
          disabled={countdown > 0}
          className="text-green-600 text-sm disabled:text-gray-400"
        >
          {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
        </button>
      </div>

      {/* Help Text */}
      <div className="text-center text-xs text-gray-400">
        <p>Voice call: Answer your phone to hear the verification code.</p>
        <p>SMS: Text message with 6-digit code.</p>
      </div>

      {/* Back Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-500 hover:text-gray-600 text-sm"
        >
          ← Use different number
        </button>
      </div>
    </div>
  );
}
