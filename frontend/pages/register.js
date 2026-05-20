import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Head from 'next/head';

export default function Register() {
  const router = useRouter();
  const { role: preselectedRole } = router.query;
  const [selectedRole, setSelectedRole] = useState(preselectedRole || '');
  const [loading, setLoading] = useState(false);

  const roles = [
    { 
      id: 'individual', 
      name: 'Individual Participant', 
      icon: '🎁', 
      description: 'Join pools and win amazing prizes',
      bgColor: 'from-green-500 to-teal-500',
      dashboard: '/dashboard'
    },
    { 
      id: 'agent', 
      name: 'Agent', 
      icon: '🤝', 
      description: 'Create pools and earn 10% commission',
      bgColor: 'from-yellow-500 to-orange-500',
      dashboard: '/agent/dashboard'
    },
    { 
      id: 'vendor', 
      name: 'Vendor', 
      icon: '🏪', 
      description: 'List products, create pools, earn 10% commission',
      bgColor: 'from-purple-500 to-pink-500',
      dashboard: '/vendor/dashboard'
    },
    { 
      id: 'organization', 
      name: 'Organization Organizer', 
      icon: '🏢', 
      description: 'Create private pools for members, earn 10% commission',
      bgColor: 'from-blue-500 to-cyan-500',
      dashboard: '/organization/dashboard'
    }
  ];

  useEffect(() => {
    if (preselectedRole) {
      setSelectedRole(preselectedRole);
    }
  }, [preselectedRole]);

  const startRegistration = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }
    
    setLoading(true);
    
    localStorage.setItem('pendingRole', selectedRole);
    sessionStorage.setItem('pendingRole', selectedRole);
    
    const roleConfig = roles.find(r => r.id === selectedRole);
    const redirectPath = roleConfig?.dashboard || '/dashboard';
    
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
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`bg-gradient-to-r ${role.bgColor} rounded-xl p-6 text-white text-left hover:shadow-xl transition transform hover:-translate-y-1 touch-target ${
                  selectedRole === role.id ? 'ring-4 ring-white ring-offset-2' : ''
                }`}
              >
                <div className="text-4xl mb-3">{role.icon}</div>
                <h3 className="text-xl font-bold mb-2">{role.name}</h3>
                <p className="text-sm opacity-90">{role.description}</p>
              </button>
            ))}
          </div>
          
          <button 
            onClick={startRegistration} 
            disabled={!selectedRole || loading} 
            className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold hover:bg-green-700 transition disabled:bg-gray-400 flex items-center justify-center gap-3 touch-target"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
            {selectedRole && <span className="text-sm">({roles.find(r => r.id === selectedRole)?.name})</span>}
          </button>
          
          <p className="text-center text-gray-500 text-xs mt-6">
            By continuing, you agree to our Terms and Conditions and Privacy Policy
          </p>
        </div>
      </div>
    </>
  );
}
