import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Head from 'next/head';

export default function Register() {
  const router = useRouter();
  const { role: preselectedRole } = router.query;
  const [loading, setLoading] = useState(false);

  const roles = {
    individual: { 
      name: 'Individual Participant', 
      icon: '🎁',
      description: 'Join pools and win amazing prizes',
      color: 'from-green-600 to-teal-600'
    },
    agent: { 
      name: 'Agent', 
      icon: '🤝',
      description: 'Create pools and earn commission',
      color: 'from-yellow-600 to-orange-600'
    },
    vendor: { 
      name: 'Vendor', 
      icon: '🏪',
      description: 'List products and earn commission',
      color: 'from-purple-600 to-pink-600'
    },
    organization: { 
      name: 'Organization', 
      icon: '🏢',
      description: 'Create private pools for members',
      color: 'from-blue-600 to-cyan-600'
    }
  };

  // If a role is preselected, start Google login immediately
  useEffect(() => {
    if (preselectedRole && roles[preselectedRole] && !loading) {
      startGoogleLogin(preselectedRole);
    }
  }, [preselectedRole]);

  const startGoogleLogin = async (role) => {
    setLoading(true);
    
    try {
      // Clear any existing session first
      await supabase.auth.signOut();
      
      // Clear any old storage
      localStorage.removeItem('pendingRole');
      sessionStorage.removeItem('pendingRole');
      
      // Store selected role for callback
      sessionStorage.setItem('pendingRole', role);
      
      // Force Google account selector
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account', // Always show account selector
          },
        },
      });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Failed to sign in: ' + error.message);
      setLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    startGoogleLogin(role);
  };

  // Show loading screen when redirecting to Google
  if ((preselectedRole && roles[preselectedRole]) || loading) {
    const roleInfo = preselectedRole ? roles[preselectedRole] : null;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Redirecting to Google...</p>
          {roleInfo && (
            <div className="mt-4">
              <div className="text-4xl mb-2">{roleInfo.icon}</div>
              <p className="text-sm text-gray-500 font-medium">{roleInfo.name}</p>
              <p className="text-xs text-gray-400 mt-2">Please select your Google account</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Choose Role - Abbaa Carraa</title>
        <meta name="description" content="Choose how you want to participate in Abbaa Carraa" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
              <span className="text-4xl">🎯</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Join Abbaa Carraa</h1>
            <p className="text-gray-500 mt-2">Select your role to continue</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Object.entries(roles).map(([id, role]) => (
              <button
                key={id}
                onClick={() => handleRoleSelect(id)}
                className={`bg-gradient-to-r ${role.color} rounded-xl p-6 text-white text-left hover:shadow-xl transition-all hover:scale-105 active:scale-95`}
              >
                <div className="text-5xl mb-3">{role.icon}</div>
                <h3 className="text-lg font-bold mb-2">{role.name}</h3>
                <p className="text-xs opacity-90 leading-relaxed">{role.description}</p>
              </button>
            ))}
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-xs text-gray-400">
              By continuing, you agree to our Terms and Conditions
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
