// pages/login.js - COMPLETE WITH TELEGRAM & PARTNER LOGIN
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useTelegram } from '../hooks/useTelegram';

export default function Login() {
  const router = useRouter();
  const { redirect, partner } = router.query;
  const [loading, setLoading] = useState(false);
  const [showPartnerLogin, setShowPartnerLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [partnerLoading, setPartnerLoading] = useState(false);
  
  // Telegram integration
  const { isInTelegram, user: telegramUser } = useTelegram();

  // Auto-login with Telegram if in Telegram WebApp
  useEffect(() => {
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
        toast.success(`Welcome ${telegramUser.first_name}! 🎉`);
        
        // Check for redirect
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
      // Store the intended redirect URL if provided
      if (redirect) {
        localStorage.setItem('abbaa_redirect_after_login', redirect);
        sessionStorage.setItem('redirectAfterLogin', redirect);
      }
      
      // Set role to individual for login
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

      // Check if user is a partner
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
          {/* Logo & Title */}
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
            // ==================== INDIVIDUAL LOGIN ====================
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

              {/* Telegram Login */}
              {!isInTelegram && (
                <button
                  onClick={() => {
                    // Open Telegram login widget or redirect to bot
                    window.open('https://t.me/abbaacarraa_bot', '_blank');
                    toast.info('Please open the Telegram bot to login');
                  }}
                  disabled={loading}
                  className="w-full mt-3 bg-[#0088cc] hover:bg-[#0077b3] text-white rounded-lg py-3 px-4 flex items-center justify-center gap-3 transition shadow-sm disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span className="font-medium">Continue with Telegram</span>
                </button>
              )}

              {isInTelegram && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <p className="text-green-700 text-sm">
                    📱 You're in Telegram! Logging in automatically...
                  </p>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mx-auto mt-2"></div>
                </div>
              )}

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">or</span>
                </div>
              </div>

              {/* Partner Login Link */}
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
            // ==================== PARTNER LOGIN ====================
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
