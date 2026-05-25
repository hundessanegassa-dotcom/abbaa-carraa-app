import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function Login() {
  const router = useRouter();
  const { redirect } = router.query;
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Clear any existing session when login page loads
  useEffect(() => {
    const clearExistingSession = async () => {
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all auth-related storage
      localStorage.removeItem('sb-auth-token');
      localStorage.removeItem('abbaa-carraa-session');
      sessionStorage.clear();
      
      // Clear any pending roles
      localStorage.removeItem('pendingRole');
      sessionStorage.removeItem('pendingRole');
    };
    
    clearExistingSession();
  }, []);

  const handleGoogleLogin = async (role) => {
    setLoading(true);
    setSelectedRole(role);
    
    try {
      // Clear any existing session again before login
      await supabase.auth.signOut();
      
      // Store the intended role and redirect URL
      sessionStorage.setItem('pendingRole', role);
      if (redirect) {
        sessionStorage.setItem('redirectAfterLogin', redirect);
        localStorage.setItem('redirectAfterLogin', redirect);
      }
      
      // Force Google to show account selector EVERY TIME
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account', // THIS FORCES ACCOUNT SELECTOR
            access_type: 'offline',
          },
        },
      });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Failed to sign in: ' + error.message);
      setLoading(false);
      setSelectedRole(null);
    }
  };

  return (
    <>
      <Head>
        <title>Login - Abbaa Carraa</title>
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎁</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Abbaa Carraa</h1>
            <p className="text-gray-500">Choose how you want to participate</p>
          </div>
          
          {!loading ? (
            <div className="space-y-4">
              {/* Individual User Option */}
              <button
                onClick={() => handleGoogleLogin('individual')}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg py-3 px-4 flex items-center justify-between hover:from-green-700 hover:to-teal-700 transition shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <div className="text-left">
                    <div className="font-semibold">Join as Individual</div>
                    <div className="text-xs opacity-90">Participate in pools and win prizes</div>
                  </div>
                </div>
                <span>→</span>
              </button>
              
              {/* Vendor Option */}
              <button
                onClick={() => handleGoogleLogin('vendor')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg py-3 px-4 flex items-center justify-between hover:from-blue-700 hover:to-indigo-700 transition shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏪</span>
                  <div className="text-left">
                    <div className="font-semibold">Register as Vendor</div>
                    <div className="text-xs opacity-90">Sell tickets and manage your shop</div>
                  </div>
                </div>
                <span>→</span>
              </button>
              
              {/* Business Option */}
              <button
                onClick={() => handleGoogleLogin('business')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg py-3 px-4 flex items-center justify-between hover:from-purple-700 hover:to-pink-700 transition shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏢</span>
                  <div className="text-left">
                    <div className="font-semibold">Register as Business</div>
                    <div className="text-xs opacity-90">Create pools and manage operations</div>
                  </div>
                </div>
                <span>→</span>
              </button>

              {/* Admin Option (hidden unless you want to show it) */}
              <button
                onClick={() => handleGoogleLogin('admin')}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg py-3 px-4 flex items-center justify-between hover:from-gray-800 hover:to-gray-900 transition shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👨‍💼</span>
                  <div className="text-left">
                    <div className="font-semibold">Admin Access</div>
                    <div className="text-xs opacity-90">Platform management</div>
                  </div>
                </div>
                <span>→</span>
              </button>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span>Secure login with Google</span>
                </div>
                <p className="text-xs text-center text-gray-400 mt-2">
                  You'll be able to select which Google account to use<br/>
                  even if you're logged into multiple accounts
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Redirecting to Google...</p>
              <p className="text-sm text-gray-500 mt-2">
                {selectedRole === 'individual' && 'Signing in as Individual participant'}
                {selectedRole === 'vendor' && 'Registering as Vendor'}
                {selectedRole === 'business' && 'Registering as Business'}
                {selectedRole === 'admin' && 'Accessing Admin Portal'}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Please select your {selectedRole} Google account when prompted
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
