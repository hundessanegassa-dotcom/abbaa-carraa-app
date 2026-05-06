import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
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
    if (!phone || phone.length < 9) {
      toast.error('Please enter a valid phone number');
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
      toast.success('Verification code sent!');
      setStep('otp');
      setLoading(false);
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
    }
  };

  const verifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      toast.error('Please enter the 6-digit code');
      return;
    }
    
    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone);
    
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Welcome back!');
      router.push('/dashboard');
    }
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
      toast.success('New code sent!');
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
      <>
        <Head>
          <title>Verify Code - Abbaa Carraa</title>
          <meta name="description" content="Enter verification code to login" />
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </Head>
        
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Verify Your Phone</h1>
              <p className="text-gray-500 mt-2">Enter the 6-digit code sent to</p>
              <p className="font-semibold text-green-600 mt-1">+251{phone.replace(/\D/g, '')}</p>
            </div>
            
            <form onSubmit={verifyOTP} className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2">Verification Code</label>
                <input
                  type="text"
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold text-lg hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Verifying...' : 'Verify & Login →'}
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={countdown > 0}
                  className="text-green-600 hover:text-green-700 text-sm disabled:text-gray-400"
                >
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend Code'}
                </button>
              </div>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-gray-500 hover:text-gray-600 text-sm"
                >
                  ← Use different number
                </button>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Login - Abbaa Carraa</title>
        <meta name="description" content="Login to Abbaa Carraa with your phone number" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎁</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-500 mt-2">Login to your Abbaa Carraa account</p>
          </div>
          
          {/* Phone Login - Primary Method */}
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-600 text-lg">📱</span>
              <h3 className="font-bold text-green-800">Login with Phone</h3>
              <span className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full ml-auto">Recommended</span>
            </div>
            
            <form onSubmit={sendOTP} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 text-sm">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    +251
                  </span>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-4 py-3 border rounded-r-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="912345678"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Enter your Ethiopian phone number
                </p>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
              >
                {loading ? 'Sending code...' : 'Send Verification Code →'}
              </button>
            </form>
          </div>
          
          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">or</span>
            </div>
          </div>
          
          {/* Google Login - Secondary Option */}
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
          
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Don't have an account?{' '}
              <Link href="/register" className="text-green-600 font-semibold hover:text-green-700">
                Create Account
              </Link>
            </p>
          </div>
          
          <div className="mt-6 text-center text-xs text-gray-400">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy.</p>
          </div>
        </div>
      </div>
    </>
  );
}
