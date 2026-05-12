// pages/auth/callback.js
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
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      toast.error('Authentication failed');
      router.push('/login');
      return;
    }

    const user = session.user;
    const storedRole = sessionStorage.getItem('pendingRole') || 'individual';
    
    // Check if user already has a profile and has accepted agreement
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, user_type, agreement_accepted')
      .eq('id', user.id)
      .maybeSingle();
    
    // If user exists and has accepted agreement, go to dashboard
    if (existingProfile && existingProfile.agreement_accepted === true) {
      sessionStorage.removeItem('pendingRole');
      const userType = existingProfile.user_type || storedRole;
      return redirectToDashboard(userType);
    }
    
    // If user exists but agreement is missing/false, force agreement
    if (existingProfile && existingProfile.agreement_accepted !== true) {
      setPendingRole(existingProfile.user_type || storedRole);
      setTempUser(user);
      return setShowAgreement(true);
    }
    
    // New user: show agreement
    setPendingRole(storedRole);
    setTempUser(user);
    setShowAgreement(true);
    setLoading(false);
  }

  async function handleAgreementAccept() {
    setLoading(true);
    
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
    
    if (upsertError) {
      console.error('Profile error:', upsertError);
      toast.error('Failed to save profile');
      return router.push('/register');
    }
    
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
  }

  function redirectToDashboard(userType) {
    const dashboards = {
      agent: '/agent/dashboard',
      vendor: '/vendor/dashboard',
      organization: '/organization/dashboard',
      admin: '/admin/dashboard',
      user: '/dashboard',
    };
    const path = dashboards[userType] || '/dashboard';
    router.replace(path);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
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
