// pages/register.js - For partners (Agent/Vendor/Organization)
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Head from 'next/head';

export default function Register() {
  const router = useRouter();
  const { role } = router.query;
  const [loading, setLoading] = useState(false);

  const roles = {
    agent: { name: 'Become an Agent', icon: '🤝', description: 'Create pools and earn commission', redirectTo: '/become-agent' },
    vendor: { name: 'Become a Vendor', icon: '🏪', description: 'List products and earn commission', redirectTo: '/become-vendor' },
    organization: { name: 'Become an Organization', icon: '🏢', description: 'Create private pools for members', redirectTo: '/become-organization' }
  };

  // If a role is preselected, start Google login immediately
  useEffect(() => {
    if (role && roles[role] && !loading) {
      startGoogleLogin(role);
    }
  }, [role]);

  const startGoogleLogin = async (selectedRole) => {
    setLoading(true);
    
    try {
      // Store the role for callback
      sessionStorage.setItem('pendingRole', selectedRole);
      sessionStorage.setItem('isPartner', 'true');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
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

  const handleRoleSelect = (selectedRole) => {
    startGoogleLogin(selectedRole);
  };

  // Show loading screen when redirecting to Google
  if ((role && roles[role]) || loading) {
    const roleInfo = role ? roles[role] : null;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Redirecting to Google...</p>
          {roleInfo && (
            <div className="mt-4">
              <div className="text-4xl mb-2">{roleInfo.icon}</div>
              <p className="text-sm text-gray-500 font-medium">{roleInfo.name}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Partner Registration - Abbaa Carraa</title>
        <meta name="description" content="Join Abbaa Carraa as an Agent, Vendor, or Organization" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
              <span className="text-4xl">🤝</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Partner with Abbaa Carraa</h1>
            <p className="text-gray-500 mt-2">Select your role to become a partner</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {Object.entries(roles).map(([id, roleData]) => (
              <button
                key={id}
                onClick={() => handleRoleSelect(id)}
                className={`bg-gradient-to-r ${
                  id === 'agent' ? 'from-yellow-500 to-orange-500' :
                  id === 'vendor' ? 'from-purple-500 to-pink-500' :
                  'from-blue-500 to-cyan-500'
                } rounded-xl p-6 text-white text-left hover:shadow-xl transition-all hover:scale-105 active:scale-95`}
              >
                <div className="text-5xl mb-3">{roleData.icon}</div>
                <h3 className="text-lg font-bold mb-2">{roleData.name}</h3>
                <p className="text-xs opacity-90 leading-relaxed">{roleData.description}</p>
              </button>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-xs text-gray-500">
              Already have an account? <button onClick={() => router.push('/login')} className="text-green-600 hover:underline">Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
