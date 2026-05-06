import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function VoiceOTP({ phone, onVerified, onBack, isLogin = false }) {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [channel, setChannel] = useState('sms'); // 'sms' or 'call'
  const [calling, setCalling] = useState(false);

  const formatPhoneNumber = (value) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '251' + cleaned.substring(1);
    }
    if (!cleaned.startsWith('251')) {
      cleaned = '251' + cleaned;
    }
    return cleaned;
  };

  const sendOTP = async (selectedChannel) => {
    setLoading(true);
    setChannel(selectedChannel);
    
    const formattedPhone = formatPhoneNumber(phone);
    
    if (selectedChannel === 'call') {
      setCalling(true);
      toast.loading('Initiating voice call...', { id: 'voice-call' });
    }
    
    try {
      // For testing without Twilio (development mode)
      if (process.env.NODE_ENV === 'development' || !process.env.NEXT_PUBLIC_TWILIO_ENABLED) {
        // Generate a random test OTP
        const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
        console.log(`📱 Test ${selectedChannel === 'call' ? 'Voice' : 'SMS'} OTP for ${formattedPhone}: ${testOTP}`);
        sessionStorage.setItem('test_otp', testOTP);
        sessionStorage.setItem('test_phone', formattedPhone);
        
        if (selectedChannel === 'call') {
          toast.success(`Test Voice OTP: ${testOTP} (Check console)`, { id: 'voice-call' });
        } else {
          toast.success(`Test SMS OTP: ${testOTP} (Check console)`);
        }
        
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
        setLoading(false);
        setCalling(false);
        return;
      }
      
      // Production: Call your API endpoint
      const response = await fetch('/api/auth/send-voice-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone: formattedPhone, 
          channel: selectedChannel 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (selectedChannel === 'call') {
          toast.success('Voice call initiated! Answer to hear your code.', { id: 'voice-call' });
        } else {
          toast.success('SMS sent with your verification code!');
        }
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
        if (selectedChannel === 'call') {
          toast.error(data.error || 'Failed to initiate voice call', { id: 'voice-call' });
        } else {
          toast.error(data.error || 'Failed to send SMS');
        }
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      if (selectedChannel === 'call') {
        toast.error('Network error. Please try again.', { id: 'voice-call' });
      } else {
        toast.error('Network error. Please try again.');
      }
    } finally {
      setLoading(false);
      setCalling(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length < 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    
    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone);
    
    try {
      // Check if using test mode
      const storedOTP = sessionStorage.getItem('test_otp');
      const storedPhone = sessionStorage.getItem('test_phone');
      
      if (storedOTP && storedPhone === formattedPhone) {
        if (otp === storedOTP) {
          toast.success('Phone verified successfully!');
          sessionStorage.removeItem('test_otp');
          sessionStorage.removeItem('test_phone');
          if (onVerified) onVerified();
          setLoading(false);
          return;
        } else {
          toast.error('Invalid verification code');
          setLoading(false);
          return;
        }
      }
      
      // Production verification
      const response = await fetch('/api/auth/verify-voice-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone, code: otp }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Phone verified successfully!');
        if (onVerified) onVerified();
      } else {
        toast.error(data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = () => {
    if (countdown > 0) return;
    sendOTP(channel);
  };

  // Auto-send SMS OTP on component mount
  useEffect(() => {
    sendOTP('sms');
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <span className="text-3xl">{channel === 'call' ? '📞' : '📱'}</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">
          {channel === 'call' ? 'Answer Your Phone' : 'Verify Your Phone'}
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          {channel === 'call' 
            ? 'We are calling you with your verification code'
            : `Enter the 6-digit code sent to +251${phone.replace(/\D/g, '')}`}
        </p>
        {calling && (
          <p className="text-green-600 text-xs mt-2 animate-pulse">
            📞 Calling... Answer your phone!
          </p>
        )}
      </div>

      {/* Channel Selection Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => sendOTP('sms')}
          disabled={loading || countdown > 0}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
            channel === 'sms'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="text-lg">📱</span>
          SMS
        </button>
        <button
          type="button"
          onClick={() => sendOTP('call')}
          disabled={loading || countdown > 0}
          className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 ${
            channel === 'call'
              ? 'bg-green-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span className="text-lg">📞</span>
          Voice Call
        </button>
      </div>

      {/* OTP Input */}
      <div>
        <label className="block text-gray-700 mb-2 text-sm">
          {channel === 'call' ? 'Enter the code you heard' : 'Enter Verification Code'}
        </label>
        <input
          type="text"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl text-center text-2xl tracking-widest focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="000000"
          maxLength={6}
          autoFocus
        />
      </div>

      {/* Verify Button */}
      <button
        onClick={verifyOTP}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Verifying...
          </>
        ) : (
          'Verify & Continue →'
        )}
      </button>

      {/* Resend Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={resendOTP}
          disabled={countdown > 0}
          className={`text-green-600 text-sm transition ${countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'hover:text-green-700'}`}
        >
          {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 rounded-xl p-3">
        <p className="text-xs text-blue-700 text-center">
          {channel === 'call' ? (
            <>
              📞 <strong>Voice Call Instructions:</strong> Answer the call, listen to the automated voice,
              and enter the 6-digit number you hear.
            </>
          ) : (
            <>
              📱 <strong>SMS Instructions:</strong> Check your phone for a text message with the 6-digit code.
              Make sure you have network coverage.
            </>
          )}
        </p>
      </div>

      {/* Back Button */}
      <div className="text-center">
        <button
          type="button"
          onClick={onBack}
          className="text-gray-500 hover:text-gray-600 text-sm transition"
        >
          ← Use different number
        </button>
      </div>

      {/* Footer Note */}
      <div className="text-center text-xs text-gray-400">
        <p>💚 2% of income supports kidney & heart disease patients in Ethiopia</p>
      </div>
    </div>
  );
}
