import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function VoiceOTP({ phone, onVerified, onBack, isLogin = false }) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isVoiceCall, setIsVoiceCall] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    startTimer();
    requestOtp();
    // Focus on OTP input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Auto-detect OTP from SMS (works on mobile devices)
  useEffect(() => {
    if ('OTPCredential' in window) {
      const abortController = new AbortController();
      
      const getOtp = async () => {
        try {
          const content = await navigator.credentials.get({
            otp: { transport: ['sms'] },
            signal: abortController.signal
          });
          if (content?.code) {
            setOtp(content.code);
            // Auto-submit if OTP detected
            toast.success('OTP detected! Verifying...');
            setTimeout(() => {
              handleVerify(content.code);
            }, 500);
          }
        } catch (err) {
          console.log('OTP detection not supported or failed:', err);
        }
      };
      
      getOtp();
      
      return () => abortController.abort();
    }
  }, []);

  const startTimer = () => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  };

  const requestOtp = async () => {
    setLoading(true);
    try {
      const method = isVoiceCall ? 'phone' : 'sms';
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+251${phone}`,
        options: {
          channel: method
        }
      });
      if (error) throw error;
      toast.success(`OTP sent via ${isVoiceCall ? 'voice call' : 'SMS'}!`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (code = otp) => {
    if (!code || code.length < 6) {
      toast.error('Please enter 6-digit OTP');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+251${phone}`,
        token: code,
        type: 'sms',
      });
      
      if (error) throw error;
      toast.success(isLogin ? 'Logged in successfully!' : 'Phone verified successfully!');
      onVerified();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    setCanResend(false);
    setTimeLeft(60);
    requestOtp();
    startTimer();
  };

  const toggleVoiceCall = () => {
    setIsVoiceCall(!isVoiceCall);
  };

  return (
    <div className="text-center">
      <div className="mb-4">
        <div className="text-5xl mb-3">📞</div>
        <h2 className="text-2xl font-bold text-gray-800">Verify Your Phone</h2>
        <p className="text-gray-500 text-sm mt-2">
          We sent a 6-digit code to <strong className="text-green-600">+251{phone}</strong>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {isVoiceCall ? '📞 Check your voicemail for the code' : '📱 The code will auto-fill from your SMS'}
        </p>
      </div>

      <div className="mb-6">
        <input
          ref={inputRef}
          type="text"
          maxLength="6"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
          className="w-full text-center text-2xl tracking-widest px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
          autoComplete="one-time-code"
        />
      </div>

      <button
        onClick={() => handleVerify()}
        disabled={loading || otp.length < 6}
        className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
      >
        {loading ? 'Verifying...' : 'Verify & Continue →'}
      </button>

      <div className="mt-4 flex justify-between items-center">
        <button onClick={onBack} className="text-gray-500 text-sm hover:text-gray-700">
          ← Back
        </button>
        <div className="flex gap-3">
          <button
            onClick={toggleVoiceCall}
            className="text-blue-500 text-sm hover:text-blue-600"
          >
            {isVoiceCall ? '📱 Use SMS' : '📞 Voice Call'}
          </button>
          <button
            onClick={handleResend}
            disabled={!canResend}
            className={`text-sm ${canResend ? 'text-green-600 hover:text-green-700' : 'text-gray-400'}`}
          >
            {canResend ? 'Resend Code' : `Resend in ${timeLeft}s`}
          </button>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p className="mb-1">💡 Tips:</p>
        <p>• The code auto-fills from SMS on Android/iPhone</p>
        <p>• Switch to "Voice Call" if you didn't receive SMS</p>
        <p>• Check your spam folder if using SMS</p>
      </div>
    </div>
  );
}
