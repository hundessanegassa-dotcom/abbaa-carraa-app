// pages/register.js - Unified partner registration
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Head from 'next/head';
import UnifiedAgentApplication from '../components/UnifiedAgentApplication';

export default function Register() {
  const router = useRouter();
  const { role, ref, program, city } = router.query;
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showAgentApplication, setShowAgentApplication] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [referralInfo, setReferralInfo] = useState({ refCode: null, program: null, city: null });

  // Capture referral info from URL
  useEffect(() => {
    if (ref) {
      setReferralInfo({
        refCode: ref,
        program: program || null,
        city: city || null
      });
      // Store in session for after login
      sessionStorage.setItem('referral_code', ref);
      if (program) sessionStorage.setItem('referral_program', program);
      if (city) sessionStorage.setItem('referral_city', city);
    }
  }, [ref, program, city]);

  const roles = {
    agent: { 
      name: 'Become an Agent', 
      nameAm: 'ወኪል ይሁኑ',
      icon: '🤝', 
      description: 'Earn 10% commission on every successful contribution',
      descriptionAm: 'በእያንዳንዱ ስኬታማ ተሳትፎ 10% ኮሚሽን ያግኙ',
      color: 'from-yellow-500 to-orange-500',
      programType: 'all' // Can manage all program types
    },
    vendor: { 
      name: 'Become a Vendor', 
      nameAm: 'ነጋዴ ይሁኑ',
      icon: '🏪', 
      description: 'List products and earn commission on sales',
      descriptionAm: 'ምርቶችዎን ይዘርዝሩ እና በሽያጭ ኮሚሽን ያግኙ',
      color: 'from-purple-500 to-pink-500',
      programType: 'vendor'
    },
    organization: { 
      name: 'Become an Organization', 
      nameAm: 'ድርጅት ይሁኑ',
      icon: '🏢', 
      description: 'Create private pools for your members',
      descriptionAm: 'ለአባላትዎ የግል ፑሎች ይፍጠሩ',
      color: 'from-blue-500 to-cyan-500',
      programType: 'organization'
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      // If user is logged in and role is selected, show application
      if (selectedRole) {
        setShowAgentApplication(true);
      }
    }
  };

  const startGoogleLogin = async (roleId) => {
    setLoading(true);
    setSelectedRole(roleId);
    
    try {
      // Store the role and referral info for callback
      sessionStorage.setItem('pendingRole', roleId);
      sessionStorage.setItem('isPartner', 'true');
      sessionStorage.setItem('partnerProgramType', roles[roleId].programType);
      
      // Preserve referral info
      if (referralInfo.refCode) {
        sessionStorage.setItem('referral_code', referralInfo.refCode);
        sessionStorage.setItem('referral_program', referralInfo.program);
        sessionStorage.setItem('referral_city', referralInfo.city);
      }
      
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

  const handleRoleSelect = (roleId) => {
    startGoogleLogin(roleId);
  };

  // Show loading screen when redirecting to Google
  if ((router.query.role && roles[router.query.role]) || loading) {
    const roleInfo = router.query.role ? roles[router.query.role] : null;
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

  // If user is logged in and agent role selected, show application modal
  if (user && selectedRole === 'agent' && showAgentApplication) {
    // Determine pre-selected program based on referral or default
    let preSelectedProgram = 'all';
    let preSelectedCity = null;
    
    if (referralInfo.program === 'city_vip' && referralInfo.city) {
      preSelectedProgram = 'city_vip';
      preSelectedCity = referralInfo.city;
    } else if (referralInfo.program === 'merkato_vip') {
      preSelectedProgram = 'merkato_vip';
    } else if (referralInfo.program === 'regular') {
      preSelectedProgram = 'regular';
    }
    
    return (
      <UnifiedAgentApplication 
        onClose={() => {
          setShowAgentApplication(false);
          router.push('/dashboard');
        }}
        preSelectedProgram={preSelectedProgram}
        preSelectedCity={preSelectedCity}
      />
    );
  }

  // If user is logged in and vendor/organization selected, show coming soon
  if (user && (selectedRole === 'vendor' || selectedRole === 'organization')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center shadow-xl">
          <div className="text-6xl mb-4">{roles[selectedRole]?.icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{roles[selectedRole]?.name}</h2>
          <p className="text-gray-600 mb-4">{roles[selectedRole]?.descriptionAm}</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-700 text-sm">
              ⚡ Coming Soon! This feature is currently under development.
            </p>
            <p className="text-yellow-600 text-xs mt-1">
              We'll notify you when vendor/organization registration opens.
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Partner Registration - Abbaa Carraa</title>
        <meta name="description" content="Join Abbaa Carraa as an Agent, Vendor, or Organization - Earn commissions and grow your business" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
              <span className="text-4xl">🤝</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Partner with Abbaa Carraa</h1>
            <p className="text-gray-500 mt-2">Select your role to become a partner</p>
            
            {/* Referral Info Banner */}
            {referralInfo.refCode && (
              <div className="mt-4 inline-flex items-center gap-2 bg-green-100 border border-green-300 rounded-full px-4 py-2 text-sm">
                <span>🔗</span>
                <span className="text-green-700">Referred by Agent</span>
                <span className="text-green-600 font-mono text-xs">{referralInfo.refCode}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Agent Card */}
            <button
              onClick={() => handleRoleSelect('agent')}
              className={`bg-gradient-to-r ${roles.agent.color} rounded-xl p-6 text-white text-left hover:shadow-xl transition-all hover:scale-105 active:scale-95 group`}
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{roles.agent.icon}</div>
              <h3 className="text-lg font-bold mb-1">{roles.agent.name}</h3>
              <p className="text-xs opacity-90 mb-1">{roles.agent.nameAm}</p>
              <p className="text-xs opacity-80 leading-relaxed">{roles.agent.description}</p>
              <p className="text-[10px] opacity-70 mt-2 leading-relaxed">{roles.agent.descriptionAm}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="text-[8px] bg-white/20 rounded-full px-2 py-0.5">Regular Pools</span>
                <span className="text-[8px] bg-white/20 rounded-full px-2 py-0.5">City VIP</span>
                <span className="text-[8px] bg-white/20 rounded-full px-2 py-0.5">Merkato VIP</span>
              </div>
            </button>
            
            {/* Vendor Card */}
            <button
              onClick={() => handleRoleSelect('vendor')}
              className={`bg-gradient-to-r ${roles.vendor.color} rounded-xl p-6 text-white text-left hover:shadow-xl transition-all hover:scale-105 active:scale-95 group`}
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{roles.vendor.icon}</div>
              <h3 className="text-lg font-bold mb-1">{roles.vendor.name}</h3>
              <p className="text-xs opacity-90 mb-1">{roles.vendor.nameAm}</p>
              <p className="text-xs opacity-80 leading-relaxed">{roles.vendor.description}</p>
              <p className="text-[10px] opacity-70 mt-2 leading-relaxed">{roles.vendor.descriptionAm}</p>
              <div className="mt-3">
                <span className="text-[8px] bg-white/20 rounded-full px-2 py-0.5">Coming Soon</span>
              </div>
            </button>
            
            {/* Organization Card */}
            <button
              onClick={() => handleRoleSelect('organization')}
              className={`bg-gradient-to-r ${roles.organization.color} rounded-xl p-6 text-white text-left hover:shadow-xl transition-all hover:scale-105 active:scale-95 group`}
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{roles.organization.icon}</div>
              <h3 className="text-lg font-bold mb-1">{roles.organization.name}</h3>
              <p className="text-xs opacity-90 mb-1">{roles.organization.nameAm}</p>
              <p className="text-xs opacity-80 leading-relaxed">{roles.organization.description}</p>
              <p className="text-[10px] opacity-70 mt-2 leading-relaxed">{roles.organization.descriptionAm}</p>
              <div className="mt-3">
                <span className="text-[8px] bg-white/20 rounded-full px-2 py-0.5">Coming Soon</span>
              </div>
            </button>
          </div>
          
          {/* Commission Info Banner */}
          <div className="mt-8 bg-white rounded-xl p-4 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💰</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">Commission Structure for Agents</p>
                <p className="text-xs text-gray-600">Earn 10% commission on every successful contribution from customers you bring to the platform!</p>
                <p className="text-[10px] text-gray-500 mt-1">Example: Customer contributes 10,000 ETB → You earn 1,000 ETB</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Already have an account? <button onClick={() => router.push('/login')} className="text-green-600 hover:underline">Sign in</button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
