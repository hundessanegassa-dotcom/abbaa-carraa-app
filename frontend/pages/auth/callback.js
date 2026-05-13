import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import AgreementModal from '../../components/AgreementModal';

export default function AuthCallback() {
  const router = useRouter();
  const [showAgreement, setShowAgreement] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [tempUser, setTempUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        toast.error('Authentication failed');
        router.push('/login');
        return;
      }

      const user = session.user;
      const storedRole = sessionStorage.getItem('pendingRole') || 'individual';
      
      // Check if user already has a profile
      let { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      // If profile exists and agreement accepted, go to dashboard
      if (existingProfile && existingProfile.agreement_accepted === true) {
        sessionStorage.removeItem('pendingRole');
        redirectToDashboard(existingProfile.user_type || storedRole);
        return;
      }
      
      // If profile exists but no agreement, update it
      if (existingProfile && existingProfile.agreement_accepted !== true) {
        setPendingRole(existingProfile.user_type || storedRole);
        setTempUser(user);
        setShowAgreement(true);
        setLoading(false);
        return;
      }
      
      // New user - show agreement
      setPendingRole(storedRole);
      setTempUser(user);
      setShowAgreement(true);
      setLoading(false);
      
    } catch (err) {
      console.error('Callback error:', err);
      toast.error('Something went wrong');
      router.push('/login');
    }
  }

  async function handleAgreementAccept() {
    setLoading(true);
    
    try {
      // Create or update profile with agreement acceptance
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: tempUser.id,
          email: tempUser.email,
          full_name: tempUser.user_metadata?.full_name || tempUser.email?.split('@')[0],
          user_type: pendingRole,
          role: pendingRole === 'individual' ? 'user' : pendingRole,
          agreement_accepted: true,
          agreement_accepted_at: new Date().toISOString(),
          agreement_type: pendingRole,
          can_create_pool: pendingRole !== 'individual',
          created_at: new Date().toISOString(),
        });
      
      if (upsertError) throw upsertError;
      
      // Create role-specific record
      if (pendingRole === 'agent') {
        await supabase.from('agents').upsert({
          user_id: tempUser.id,
          business_name: tempUser.user_metadata?.full_name || tempUser.email?.split('@')[0],
          email: tempUser.email,
          verified: false,
          commission_rate: 10,
          created_at: new Date().toISOString()
        });
      } else if (pendingRole === 'vendor') {
        await supabase.from('vendors').upsert({
          user_id: tempUser.id,
          business_name: tempUser.user_metadata?.full_name || tempUser.email?.split('@')[0],
          email: tempUser.email,
          verified: false,
          created_at: new Date().toISOString()
        });
      } else if (pendingRole === 'organization') {
        await supabase.from('organizations').upsert({
          user_id: tempUser.id,
          business_name: tempUser.user_metadata?.full_name || tempUser.email?.split('@')[0],
          email: tempUser.email,
          verified: false,
          created_at: new Date().toISOString()
        });
      }
      
      toast.success(`Welcome! You registered as ${pendingRole}.`);
      sessionStorage.removeItem('pendingRole');
      redirectToDashboard(pendingRole);
      
    } catch (err) {
      console.error('Agreement accept error:', err);
      toast.error('Failed to save profile. Please try again.');
      router.push('/register');
    }
  }

  function redirectToDashboard(userType) {
    switch (userType) {
      case 'agent': router.replace('/agent/dashboard'); break;
      case 'vendor': router.replace('/vendor/dashboard'); break;
      case 'organization': router.replace('/organization/dashboard'); break;
      case 'admin': router.replace('/admin/dashboard'); break;
      default: router.replace('/dashboard');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (showAgreement) {
    return (
      <AgreementModal
        role={pendingRole}
        onAccept={handleAgreementAccept}
        onDecline={() => {
          toast.error('You must accept the agreement to continue');
          router.push('/register');
        }}
      />
    );
  }

  return null;
}
