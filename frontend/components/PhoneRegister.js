import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PhoneRegister() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

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

  const sendOTP = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    
    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('OTP sent to your phone!');
      setStep('otp');
      setLoading(false);
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const verifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const formattedPhone = formatPhoneNumber(phone);
    
    // Verify OTP
    const { error: verifyError, data } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });
    
    if (verifyError) {
      toast.error(verifyError.message);
      setLoading(false);
      return;
    }
    
    // Update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', data.user?.id);
    
    if (profileError) {
      console.error('Profile update error:', profileError);
    }
    
    toast.success('Registration successful!');
    router.push('/dashboard');
  };

  const resendOTP = async () => {
    if (countdown > 0) return;
    
    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('OTP resent!');
      setCountdown(30);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    setLoading(false);
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-green-600">Abbaa Carraa</h1>
            <p className="text-gray-500 mt-2">Verify your phone number</p>
          </div>
          
          <form onSubmit={verifyAndRegister} className="space-y-6">
            <div>
              <label className="block text-gray-700 mb-2">Verification Code</label>
              <input
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
              <p className="text-sm text-gray-500 mt-1">
                Code sent to {formatPhoneNumber(phone)}
              </p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Verifying...' : 'Complete Registration'}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={resendOTP}
                disabled={countdown > 0}
                className="text-green-600 hover:text-green-700 text-sm disabled:text-gray-400"
              >
                {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-gray-500 hover:text-gray-600 text-sm"
              >
                ← Back to phone number
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-green-600">Abbaa Carraa</h1>
          <p className="text-gray-500 mt-2">Create your account</p>
        </div>
        
        {/* Google Sign Up Button */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2 mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign up with Google
        </button>
        
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or sign up with phone</span>
          </div>
        </div>
        
        {/* Phone Registration Form */}
        <form onSubmit={sendOTP} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="John Doe"
            />
          </div>
          
          <div>
            <label className="block text-gray-700 mb-2">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                +251
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 px-4 py-2 border rounded-r-lg focus:ring-2 focus:ring-green-500"
                placeholder="912345678"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">We'll send a verification code</p>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
