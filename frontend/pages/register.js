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
      dashboard: '/dashboard', 
      bgColor: 'from-green-500 to-teal-500', 
      icon: '🎁',
      description: 'Join pools and win amazing prizes'
    },
    agent: { 
      name: 'Agent', 
      dashboard: '/agent/dashboard', 
      bgColor: 'from-yellow-500 to-orange-500', 
      icon: '🤝',
      description: 'Create pools and earn 10% commission'
    },
    vendor: { 
      name: 'Vendor', 
      dashboard: '/vendor/dashboard', 
      bgColor: 'from-purple-500 to-pink-500', 
      icon: '🏪',
      description: 'List products, earn 10% commission'
    },
    organization: { 
      name: 'Organization Organizer', 
      dashboard: '/organization/dashboard', 
      bgColor: 'from-blue-500 to-cyan-500', 
      icon: '🏢',
      description: 'Create private pools for members, earn 10% commission'
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
    
    // Store selected role for callback
    localStorage.setItem('pendingRole', role);
    sessionStorage.setItem('pendingRole', role);
    
    const roleConfig = roles[role];
    const redirectPath = roleConfig.dashboard;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=${redirectPath}`
      }
    });
    
    if (error) {
      toast.error(error.message);
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
            <p className="text-sm text-gray-400 mt-2">
              {roleInfo.icon} {roleInfo.name}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Register - Abbaa Carraa</title>
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4 w-full">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🎁</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Join Abbaa Carraa</h1>
            <p className="text-gray-500 mt-2">Choose your role to get started</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Object.entries(roles).map(([id, role]) => (
              <button
                key={id}
                onClick={() => handleRoleSelect(id)}
                className={`bg-gradient-to-r ${role.bgColor} rounded-xl p-6 text-white text-left hover:shadow-xl transition transform hover:-translate-y-1 touch-target`}
              >
                <div className="text-4xl mb-3">{role.icon}</div>
                <h3 className="text-xl font-bold mb-2">{role.name}</h3>
                <p className="text-sm opacity-90">{role.description}</p>
              </button>
            ))}
          </div>
          
          <p className="text-center text-gray-500 text-xs mt-6">
            By continuing, you agree to our Terms and Conditions and Privacy Policy
          </p>
        </div>
      </div>
    </>
  );
}
