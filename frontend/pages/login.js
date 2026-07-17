// pages/login.js - FIXED VERSION
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTelegram } from '../components/TelegramBotClient';
import TelegramLoginButton from '../components/TelegramLoginButton';

export default function Login() {
  const router = useRouter();
  const { redirect } = router.query;
  const [loading, setLoading] = useState(false);
  const [showPartnerLogin, setShowPartnerLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [partnerLoading, setPartnerLoading] = useState(false);
  
  const { isInTelegram, user: telegramUser } = useTelegram();

  // Check if already logged in via Telegram
  useEffect(() => {
    const sessionToken = sessionStorage.getItem('telegram_session_token');
    if (sessionToken) {
      const redirectPath = redirect || '/dashboard';
      router.push(redirectPath);
      return;
    }
    
    if (isInTelegram && telegramUser) {
      handleTelegramLogin(telegramUser);
    }
  }, [isInTelegram, telegramUser]);

  const handleTelegramLogin = async (telegramUser) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          init_data: sessionStorage.getItem('telegram_init_data')
        })
      });

      const result = await response.json();
      
      if (result.success) {
        sessionStorage.setItem('telegram_session_token', result.sessionToken);
        toast.success(`Welcome ${telegramUser.first_name}! 🎉`);
        
        const redirectPath = redirect || 
                           sessionStorage.getItem('redirectAfterLogin') || 
                           '/dashboard';
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Telegram login error:', error);
      toast.error('Failed to login with Telegram');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    try {
      if (redirect) {
        localStorage.setItem('abbaa_redirect_after_login', redirect);
        sessionStorage.setItem('redirectAfterLogin', redirect);
      }
      
      localStorage.setItem('pendingRole', 'individual');
      sessionStorage.setItem('pendingRole', 'individual');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to sign in: ' + error.message);
      setLoading(false);
    }
  };

  const handlePartnerLogin = async (e) => {
    e.preventDefault();
    setPartnerLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (!profile || !['agent', 'vendor', 'organization'].includes(profile.role)) {
        toast.error('This account is not registered as a partner. Please login as individual.');
        await supabase.auth.signOut();
        return;
      }

      toast.success('Welcome back partner! 🎉');
      const redirectPath = redirect || '/dashboard';
      router.push(redirectPath);

    } catch (error) {
      console.error('Partner login error:', error);
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setPartnerLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Abbaa Carraa</title>
        <meta name="description" content="Sign in to Abbaa Carraa" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">🎁</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {showPartnerLogin ? 'Partner Login' : 'Welcome to Abbaa Carraa'}
            </h1>
            <p className="text-gray-500">
              {showPartnerLogin 
                ? 'Sign in to your partner account' 
                : 'Sign in to continue to your pool'}
            </p>
          </div>

          {!showPartnerLogin ? (
            <>
              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-medium">
                  {loading ? 'Redirecting...' : 'Continue with Google'}
                </span>
              </button>

              {/* Telegram Login Button */}
              <div className="mt-3">
                <TelegramLoginButton />
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={() => setShowPartnerLogin(true)}
                className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium"
              >
                🔑 Login as Partner (Agent/Vendor/Organization)
              </button>

              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </>
          ) : (
            <>
              <form onSubmit={handlePartnerLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="partner@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={partnerLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {partnerLoading ? 'Signing in...' : 'Sign in as Partner'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowPartnerLogin(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to Individual Login
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  Don't have a partner account?{' '}
                  <Link href="/register" className="text-green-600 hover:underline font-medium">
                    Register as Partner
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
