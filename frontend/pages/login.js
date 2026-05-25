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
      await supabase.auth.signOut();
      localStorage.removeItem('pendingRole');
      sessionStorage.clear();
    };
    clearExistingSession();
  }, []);

  const handleGoogleLogin = async (role) => {
    setLoading(true);
    setSelectedRole(role);
    
    try {
      // Clear any existing session
      await supabase.auth.signOut();
      
      // Store the intended role
      sessionStorage.setItem('pendingRole', role);
      if (redirect) {
        sessionStorage.setItem('redirectAfterLogin', redirect);
      }
      
      // IMPORTANT: Force Google account selector
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account', // THIS IS THE KEY FIX
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
      <Head><title>Login - Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎁</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Abbaa Carraa</h1>
            <p className="text-gray-500">Choose your account type</p>
          </div>
          
          {!loading ? (
            <div className="space-y-3">
              <button
                onClick={() => handleGoogleLogin('individual')}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg py-3 px-4 flex items-center justify-between hover:from-green-700 hover:to-teal-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <div className="text-left">
                    <div className="font-semibold">Join as Individual</div>
                    <div className="text-xs opacity-90">Participate in pools</div>
                  </div>
                </div>
                <span>→</span>
              </button>
              
              <button
                onClick={() => handleGoogleLogin('vendor')}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg py-3 px-4 flex items-center justify-between hover:from-blue-700 hover:to-indigo-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏪</span>
                  <div className="text-left">
                    <div className="font-semibold">Register as Vendor</div>
                    <div className="text-xs opacity-90">Sell tickets</div>
                  </div>
                </div>
                <span>→</span>
              </button>
              
              <button
                onClick={() => handleGoogleLogin('organization')}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg py-3 px-4 flex items-center justify-between hover:from-purple-700 hover:to-pink-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🏢</span>
                  <div className="text-left">
                    <div className="font-semibold">Register as Organization</div>
                    <div className="text-xs opacity-90">Create private pools</div>
                  </div>
                </div>
                <span>→</span>
              </button>
              
              <button
                onClick={() => handleGoogleLogin('agent')}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-lg py-3 px-4 flex items-center justify-between hover:from-yellow-700 hover:to-orange-700 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤝</span>
                  <div className="text-left">
                    <div className="font-semibold">Register as Agent</div>
                    <div className="text-xs opacity-90">Create pools</div>
                  </div>
                </div>
                <span>→</span>
              </button>

              {/* Admin option - can be hidden or shown */}
              <button
                onClick={() => handleGoogleLogin('admin')}
                className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg py-3 px-4 flex items-center justify-between hover:from-gray-800 hover:to-gray-900 transition"
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
              
              <div className="mt-6 pt-4 border-t border-gray-200 text-center">
                <p className="text-xs text-gray-500">
                  You can use different Google accounts for different roles
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Redirecting to Google...</p>
              <p className="text-sm text-gray-500 mt-2">
                {selectedRole === 'individual' && 'Signing in as Individual'}
                {selectedRole === 'vendor' && 'Registering as Vendor'}
                {selectedRole === 'organization' && 'Registering as Organization'}
                {selectedRole === 'agent' && 'Registering as Agent'}
                {selectedRole === 'admin' && 'Admin access'}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                Select your {selectedRole} Google account when prompted
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
