// pages/register.js - COMPLETE WITH INDIVIDUAL & PARTNER REGISTRATION
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Head from 'next/head';
import Link from 'next/link';
import UnifiedAgentApplication from '../components/UnifiedAgentApplication';
import UnifiedVendorApplication from '../components/UnifiedVendorApplication';
import UnifiedOrganizationApplication from '../components/UnifiedOrganizationApplication';

export default function Register() {
  const router = useRouter();
  const { role, ref, program, city } = router.query;
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [showApplication, setShowApplication] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showIndividualRegister, setShowIndividualRegister] = useState(false);
  const [referralInfo, setReferralInfo] = useState({ refCode: null, program: null, city: null });
  
  // Individual registration form
  const [individualForm, setIndividualForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    agreeTerms: false
  });
  const [individualLoading, setIndividualLoading] = useState(false);

  // Capture referral info from URL
  useEffect(() => {
    if (ref) {
      setReferralInfo({
        refCode: ref,
        program: program || null,
        city: city || null
      });
      sessionStorage.setItem('referral_code', ref);
      if (program) sessionStorage.setItem('referral_program', program);
      if (city) sessionStorage.setItem('referral_city', city);
    }
  }, [ref, program, city]);

  // Check if user is already logged in
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      if (selectedRole) {
        setShowApplication(true);
      }
    }
  };

  const roles = {
    agent: { 
      name: 'Become an Agent', 
      nameAm: 'ወኪል ይሁኑ',
      icon: '🤝', 
      description: 'Earn 10% commission on every successful contribution',
      descriptionAm: 'በእያንዳንዱ ስኬታማ ተሳትፎ 10% ኮሚሽን ያግኙ',
      color: 'from-yellow-500 to-orange-500',
      programType: 'all',
      component: 'agent'
    },
    vendor: { 
      name: 'Become a Vendor', 
      nameAm: 'ነጋዴ ይሁኑ',
      icon: '🏪', 
      description: 'Create pools with your assets and earn 10% commission',
      descriptionAm: 'በንብረቶችዎ ፑሎች ይፍጠሩ እና 10% ኮሚሽን ያግኙ',
      color: 'from-purple-500 to-pink-500',
      programType: 'vendor',
      component: 'vendor'
    },
    organization: { 
      name: 'Become an Organization', 
      nameAm: 'ድርጅት ይሁኑ',
      icon: '🏢', 
      description: 'Create private pools for your members and earn 10% commission',
      descriptionAm: 'ለአባላትዎ የግል ፑሎች ይፍጠሩ እና 10% ኮሚሽን ያግኙ',
      color: 'from-blue-500 to-cyan-500',
      programType: 'organization',
      component: 'organization'
    }
  };

  const startGoogleLogin = async (roleId) => {
    setLoading(true);
    setSelectedRole(roleId);
    
    try {
      sessionStorage.setItem('pendingRole', roleId);
      sessionStorage.setItem('isPartner', 'true');
      sessionStorage.setItem('partnerProgramType', roles[roleId].programType);
      
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

  // Individual Registration
  const handleIndividualRegister = async (e) => {
    e.preventDefault();
    if (!individualForm.agreeTerms) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }
    
    setIndividualLoading(true);
    
    try {
      // Create user with email/password
      const { data, error } = await supabase.auth.signUp({
        email: individualForm.email,
        password: individualForm.password || 'temporary_' + Math.random().toString(36).substring(2, 10),
        options: {
          data: {
            full_name: individualForm.fullName,
            phone: individualForm.phone,
            role: 'individual'
          }
        }
      });
      
      if (error) throw error;
      
      toast.success('Account created! Please check your email to verify.');
      
      // Save profile
      if (data.user) {
        await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: individualForm.fullName,
            email: individualForm.email,
            phone: individualForm.phone,
            role: 'individual',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      // Redirect to login
      setTimeout(() => router.push('/login'), 2000);
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setIndividualLoading(false);
    }
  };

  const handleRoleSelect = (roleId) => {
    if (roleId === 'individual') {
      setShowIndividualRegister(true);
      return;
    }
    startGoogleLogin(roleId);
  };

  // Show loading screen
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

  // Show partner application
  if (user && selectedRole && showApplication) {
    const roleInfo = roles[selectedRole];
    
    if (selectedRole === 'agent') {
      return (
        <UnifiedAgentApplication 
          onClose={() => {
            setShowApplication(false);
            router.push('/dashboard');
          }}
          preSelectedProgram={referralInfo.program || 'all'}
          preSelectedCity={referralInfo.city || ''}
        />
      );
    } else if (selectedRole === 'vendor') {
      return (
        <UnifiedVendorApplication 
          onClose={() => {
            setShowApplication(false);
            router.push('/dashboard');
          }}
        />
      );
    } else if (selectedRole === 'organization') {
      return (
        <UnifiedOrganizationApplication 
          onClose={() => {
            setShowApplication(false);
            router.push('/dashboard');
          }}
        />
      );
    }
  }

  return (
    <>
      <Head>
        <title>Register - Abbaa Carraa</title>
        <meta name="description" content="Join Abbaa Carraa as an Individual, Agent, Vendor, or Organization" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-4">
              <span className="text-4xl">🎫</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-800">Join Abbaa Carraa</h1>
            <p className="text-gray-500 mt-2">Choose how you want to participate</p>
            
            {/* Referral Info Banner */}
            {referralInfo.refCode && (
              <div className="mt-4 inline-flex items-center gap-2 bg-green-100 border border-green-300 rounded-full px-4 py-2 text-sm">
                <span>🔗</span>
                <span className="text-green-700">Referred by</span>
                <span className="text-green-600 font-mono text-xs">{referralInfo.refCode}</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Individual Card */}
            <button
              onClick={() => handleRoleSelect('individual')}
              className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-6 text-white text-left hover:shadow-xl transition-all hover:scale-105 active:scale-95 group"
            >
              <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">👤</div>
              <h3 className="text-lg font-bold mb-1">Individual</h3>
              <p className="text-xs opacity-80">Join programs & win prizes</p>
              <p className="text-[10px] opacity-70 mt-2">Google/Telegram login</p>
              <div className="mt-3">
                <span className="text-[8px] bg-white/20 rounded-full px-2 py-0.5">Google</span>
                <span className="text-[8px] bg-white/20 rounded-full px-2 py-0.5 ml-1">Telegram</span>
              </div>
            </button>
            
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
                <span className="text-[8px] bg-white/20 rounded-full px-2 py-0.5">Business License Required</span>
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
                <span className="text-[8px] bg-white/20 rounded-full px-2 py-0.5">Organization ID Required</span>
              </div>
            </button>
          </div>

          {/* Individual Registration Form */}
          {showIndividualRegister && (
            <div className="mt-8 bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Create Individual Account</h2>
              <p className="text-sm text-gray-500 text-center mb-6">Join and start winning prizes today!</p>
              
              <form onSubmit={handleIndividualRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={individualForm.fullName}
                    onChange={(e) => setIndividualForm({...individualForm, fullName: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="Enter your full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={individualForm.email}
                    onChange={(e) => setIndividualForm({...individualForm, email: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="you@example.com"
                  />
                  <p className="text-xs text-gray-400 mt-1">We'll send a verification email</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={individualForm.phone}
                    onChange={(e) => setIndividualForm({...individualForm, phone: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    placeholder="09xxxxxxxx"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="agreeTermsIndividual"
                    checked={individualForm.agreeTerms}
                    onChange={(e) => setIndividualForm({...individualForm, agreeTerms: e.target.checked})}
                    className="w-4 h-4 text-green-600"
                  />
                  <label htmlFor="agreeTermsIndividual" className="text-sm text-gray-600">
                    I agree to the <Link href="/terms" className="text-green-600 hover:underline">Terms and Conditions</Link>
                  </label>
                </div>
                
                <button
                  type="submit"
                  disabled={individualLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {individualLoading ? 'Creating Account...' : 'Create Account →'}
                </button>
              </form>
              
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowIndividualRegister(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to options
                </button>
              </div>
            </div>
          )}

          {/* Commission Info Banner */}
          {!showIndividualRegister && (
            <div className="mt-8 bg-white rounded-xl p-4 shadow-md">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">Partner Commission Structure</p>
                  <p className="text-xs text-gray-600">Earn 10% commission on every successful contribution from customers you bring or pools you create!</p>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-green-50 rounded p-2 text-center">
                      <p className="text-xs font-bold text-green-700">Agents</p>
                      <p className="text-[10px] text-green-600">10% on referrals</p>
                    </div>
                    <div className="bg-purple-50 rounded p-2 text-center">
                      <p className="text-xs font-bold text-purple-700">Vendors</p>
                      <p className="text-[10px] text-purple-600">10% on pools</p>
                    </div>
                    <div className="bg-blue-50 rounded p-2 text-center">
                      <p className="text-xs font-bold text-blue-700">Organizations</p>
                      <p className="text-[10px] text-blue-600">10% on pools</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Already have an account? <Link href="/login" className="text-green-600 hover:underline">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
