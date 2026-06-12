// pages/login.js - FIXED VERSION
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const { redirect } = router.query;
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    
    try {
      // Store the intended redirect URL if provided
      if (redirect) {
        localStorage.setItem('abbaa_redirect_after_login', redirect);
        sessionStorage.setItem('redirectAfterLogin', redirect);
        console.log('🔵 Stored redirect URL:', redirect);
      }
      
      // For individuals (pool participation), set role to individual
      // This ensures they don't get partner flow
      const isPoolRedirect = redirect && (
        redirect.includes('/merkato-seat') || 
        redirect.includes('/cities/seat') || 
        redirect.includes('/pools/')
      );
      
      if (isPoolRedirect) {
        localStorage.setItem('pendingRole', 'individual');
        sessionStorage.setItem('pendingRole', 'individual');
        console.log('🔵 Pool participation - Setting role to individual');
      } else {
        // For regular login, default to individual
        localStorage.setItem('pendingRole', 'individual');
        sessionStorage.setItem('pendingRole', 'individual');
      }
      
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

  return (
    <>
      <Head><title>Login - Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <span className="text-4xl">🎁</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Abbaa Carraa</h1>
            <p className="text-gray-500">Sign in to continue to your pool</p>
          </div>
          
          {!loading ? (
            <>
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-gray-300 rounded-lg py-3 px-4 flex items-center justify-center gap-3 hover:bg-gray-50 transition shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-medium">Continue with Google</span>
              </button>
              
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Redirecting to Google...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
