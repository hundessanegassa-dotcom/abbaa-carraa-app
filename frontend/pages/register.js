import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Head from 'next/head';
import VoiceOTP from '../components/VoiceOTP';
import AgreementModal from '../components/AgreementModal';

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState('role');
  const [selectedRole, setSelectedRole] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  const roles = [
    { id: 'individual', name: 'Individual', icon: '👤', description: 'Join existing pools and win amazing prizes', color: 'from-green-500 to-teal-500', isCreator: false },
    { id: 'agent', name: 'Agent', icon: '🤝', description: 'Create prize pools and earn 10% commission', color: 'from-yellow-500 to-orange-500', isCreator: true },
    { id: 'vendor', name: 'Vendor', icon: '🏭', description: 'List your products as prizes and earn commission', color: 'from-purple-500 to-pink-500', isCreator: true },
    { id: 'organization', name: 'Organization', icon: '🏢', description: 'Create private pools for your members', color: 'from-blue-500 to-cyan-500', isCreator: true }
  ];

  const formatPhoneNumber = (value) => {
    let cleaned = value.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '251' + cleaned.substring(1);
    if (!cleaned.startsWith('251')) cleaned = '251' + cleaned;
    return cleaned;
  };

  const handlePhoneSubmit = (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!phone || phone.length < 9) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setStep('otp');
  };

  const handleVerified = () => {
    // Pool creators (agent, vendor, organization) need to sign agreement
    if (selectedRole === 'agent' || selectedRole === 'vendor' || selectedRole === 'organization') {
      setShowAgreement(true);
    } else {
      // Individual users don't need agreement
      completeRegistration();
    }
  };

  const completeRegistration = async () => {
    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone);
    
    const { data, error } = await supabase.auth.signUp({
      phone: formattedPhone,
      password: Math.random().toString(36).slice(-12),
      options: {
        data: {
          full_name: fullName,
          user_type: selectedRole,
        }
      }
    });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        phone: formattedPhone,
        user_type: selectedRole,
        role: selectedRole === 'individual' ? 'user' : selectedRole,
        created_at: new Date().toISOString(),
      });
      
      // Create role-specific record
      if (selectedRole === 'agent') {
        await supabase.from('agents').insert({
          user_id: data.user.id,
          business_name: fullName,
          verified: false,
          commission_rate: 10,
        });
      } else if (selectedRole === 'vendor') {
        await supabase.from('vendors').insert({
          user_id: data.user.id,
          business_name: fullName,
          verified: false,
        });
      } else if (selectedRole === 'organization') {
        await supabase.from('organizations').insert({
          user_id: data.user.id,
          business_name: fullName,
          verified: false,
        });
      }
    }
    
    toast.success(`Welcome! You registered as ${selectedRole}.`);
    router.push('/dashboard');
  };

  const handleAgreementAccept = async () => {
    setLoading(true);
    const formattedPhone = formatPhoneNumber(phone);
    
    const { data, error } = await supabase.auth.signUp({
      phone: formattedPhone,
      password: Math.random().toString(36).slice(-12),
      options: {
        data: {
          full_name: fullName,
          user_type: selectedRole,
        }
      }
    });
    
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        phone: formattedPhone,
        user_type: selectedRole,
        role: selectedRole,
        agreement_accepted: true,
        agreement_accepted_at: new Date().toISOString(),
        agreement_type: selectedRole,
        can_create_pool: true,
        created_at: new Date().toISOString(),
      });
      
      if (selectedRole === 'agent') {
        await supabase.from('agents').insert({
          user_id: data.user.id,
          business_name: fullName,
          verified: false,
          commission_rate: 10,
        });
      } else if (selectedRole === 'vendor') {
        await supabase.from('vendors').insert({
          user_id: data.user.id,
          business_name: fullName,
          verified: false,
        });
      } else if (selectedRole === 'organization') {
        await supabase.from('organizations').insert({
          user_id: data.user.id,
          business_name: fullName,
          verified: false,
        });
      }
    }
    
    toast.success(`Welcome! You registered as ${selectedRole}. You can now create pools.`);
    router.push('/dashboard');
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  if (showAgreement) {
    return (
      <AgreementModal
        role={selectedRole}
        onAccept={handleAgreementAccept}
        onDecline={() => setShowAgreement(false)}
      />
    );
  }

  if (step === 'role') {
    return (
      <>
        <Head><title>Join Abbaa Carraa</title></Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
          <div className="max-w-4xl w-full">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎁</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-800">Join Abbaa Carraa</h1>
              <p className="text-gray-500 mt-2">Choose how you want to participate</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => { setSelectedRole(role.id); setStep('phone'); }}
                  className={`bg-gradient-to-r ${role.color} rounded-xl p-6 text-white text-left hover:shadow-xl transition transform hover:-translate-y-1`}
                >
                  <div className="text-4xl mb-3">{role.icon}</div>
                  <h3 className="text-xl font-bold mb-2">{role.name}</h3>
                  <p className="text-sm opacity-90">{role.description}</p>
                  {role.isCreator && (
                    <div className="mt-2 text-xs bg-white/20 rounded-full px-2 py-0.5 inline-block">
                      💰 Earn 10% commission
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-400">or</span></div>
            </div>
            <button onClick={signInWithGoogle} disabled={loading} className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-3">
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>
            <div className="mt-8 text-center"><p className="text-gray-500 text-sm">Already have an account? <Link href="/login" className="text-green-600 font-semibold">Sign In</Link></p></div>
          </div>
        </div>
      </>
    );
  }

  if (step === 'phone') {
    return (
      <>
        <Head><title>Register - Abbaa Carraa</title></Head>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => setStep('role')} className="text-gray-400 hover:text-gray-600">← Back</button>
              <div className="flex-1 text-center"><h1 className="text-xl font-bold text-gray-800">Register as {roles.find(r => r.id === selectedRole)?.name}</h1></div>
              <div className="w-8"></div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-3"><span className="text-green-600 text-lg">📞</span><h3 className="font-bold text-green-800">Sign up with Phone</h3></div>
              <form onSubmit={handlePhoneSubmit} className="space-y-4">
                <div><label className="block text-gray-700 mb-2 text-sm">Full Name</label><input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500" placeholder="John Doe" /></div>
                <div><label className="block text-gray-700 mb-2 text-sm">Phone Number</label><div className="flex"><span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 text-gray-500">+251</span><input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 px-4 py-3 border rounded-r-xl focus:ring-2 focus:ring-green-500" placeholder="912345678" /></div></div>
                <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition">{loading ? 'Processing...' : 'Continue →'}</button>
              </form>
            </div>
            <div className="text-center"><button onClick={signInWithGoogle} className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-xl font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"><svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>Continue with Google</button></div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head><title>Verify Phone - Abbaa Carraa</title></Head>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <VoiceOTP phone={phone} onVerified={handleVerified} onBack={() => setStep('phone')} />
        </div>
      </div>
    </>
  );
}
