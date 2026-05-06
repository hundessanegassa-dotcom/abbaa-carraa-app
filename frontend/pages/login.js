import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Head from 'next/head';
import VoiceOTP from '../components/VoiceOTP';

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (value) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '251' + cleaned.substring(1);
    if (!cleaned.startsWith('251')) cleaned = '251' + cleaned;
    return cleaned;
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setStep('otp');
  };

  const handleVerified = async () => {
    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone);
    
    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
    });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    
    toast.success('Logged in successfully!');
    router.push('/dashboard');
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <>
        <Head><title>Verify Phone - Abbaa Carraa</title></Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <VoiceOTP phone={phone} onVerified={handleVerified} onBack={() => setStep('phone')} isLogin={true} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Login - Abbaa Carraa</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎁</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
            <p className="text-gray-500 mt-2">Login to your Abbaa Carraa account</p>
          </div>
          
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-green-600 text-lg">📞</span>
              <h3 className="font-bold text-green-800">Login with Phone</h3>
              <span className="bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded-full ml-auto">Recommended</span>
            </div>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 text-sm">Phone Number</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">+251</span>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 px-4 py-3 border rounded-r-xl focus:ring-2 focus:ring-green-500" placeholder="912345678" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition">{loading ? 'Processing...' : 'Continue with Phone →'}</button>
            </form>
          </div>
          
          <div className="relative my-6"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div><div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-400">or</span></div></div>
          
          <button onClick={signInWithGoogle} disabled={loading} className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-3">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
          
          <div className="mt-8 text-center"><p className="text-gray-500 text-sm">Don't have an account? <Link href="/register" className="text-green-600 font-semibold">Create Account</Link></p></div>
          <div className="mt-6 text-center text-xs text-gray-400"><p>💚 2% of income supports kidney & heart disease patients</p></div>
        </div>
      </div>
    </>
  );
}
