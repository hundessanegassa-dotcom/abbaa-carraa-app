// pages/auth/callback.js
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import AgreementModal from '../../components/AgreementModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();
  const [showAgreement, setShowAgreement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);
  const [isPartner, setIsPartner] = useState(false);

  const getStoredRedirectUrl = () => {
    // Check for redirect from pool/VIP pages
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectAfterLogin');
      return redirectUrl;
    }
    return null;
  };

  const clearStoredData = () => {
    sessionStorage.removeItem('pendingRole');
    sessionStorage.removeItem('isPartner');
    sessionStorage.removeItem('redirectAfterLogin');
    sessionStorage.removeItem('pendingPoolId');
    sessionStorage.removeItem('pendingPoolType');
    sessionStorage.removeItem('pendingCity');
  };

  const handleAcceptAgreement = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');
      
      const pendingRole = sessionStorage.getItem('pendingRole') || 'individual';
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({
            agreement_accepted: true,
            agreement_accepted_at: new Date().toISOString(),
            agreement_version: '1.0',
            role: pendingRole,
            user_type: pendingRole,
            status: pendingRole === 'individual' ? 'active' : 'pending_approval',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
      } else {
        await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            role: pendingRole,
            user_type: pendingRole,
            agreement_accepted: true,
            agreement_accepted_at: new Date().toISOString(),
            agreement_version: '1.0',
            status: pendingRole === 'individual' ? 'active' : 'pending_approval',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      toast.success('Welcome to Abbaa Carraa!');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      clearStoredData();
      
      // Redirect partners to their application form
      if (pendingRole !== 'individual') {
        router.push(`/become-${pendingRole}`);
        return;
      }
      
      // Redirect individuals to their intended pool/VIP page or listings
      const redirectUrl = getStoredRedirectUrl();
      if (redirectUrl && (redirectUrl.includes('/pools/') || redirectUrl.includes('/merkato-seat') || redirectUrl.includes('/cities/seat'))) {
        router.push(redirectUrl);
        return;
      }
      
      router.push('/listings');
      
    } catch (err) {
      console.error('Accept agreement error:', err);
      toast.error('Failed to save agreement: ' + err.message);
    }
  }, [router]);

  const handleClose = useCallback(() => {
    clearStoredData();
    supabase.auth.signOut();
    router.push('/login');
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        const isPartnerFlag = sessionStorage.getItem('isPartner') === 'true';
        setIsPartner(isPartnerFlag);
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error('Sign in failed');
          router.push('/login');
          return;
        }

        // Check if user already has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, user_type, agreement_accepted, agreement_version, id, status')
          .eq('id', session.user.id)
          .maybeSingle();

        // If user has a profile with agreement accepted
        if (profile?.agreement_accepted === true && profile?.role) {
          toast.success(`Welcome back, ${session.user.email}!`);
          
          const redirectUrl = getStoredRedirectUrl();
          clearStoredData();
          
          // Partners go to their dashboard
          if (profile.role !== 'individual') {
            router.push(`/${profile.role}/dashboard`);
            return;
          }
          
          // Individuals go to their intended page
          if (redirectUrl && (redirectUrl.includes('/pools/') || redirectUrl.includes('/merkato-seat') || redirectUrl.includes('/cities/seat'))) {
            router.push(redirectUrl);
            return;
          }
          
          router.push('/listings');
          return;
        }

        // New user - determine if partner or individual
        const pendingRole = sessionStorage.getItem('pendingRole') || 'individual';
        
        if (isMounted) {
          setUserRole(pendingRole);
          // Only show agreement for partners
          setShowAgreement(pendingRole !== 'individual');
          setLoading(false);
        }
        
      } catch (err) {
        console.error('Callback error:', err);
        if (isMounted) {
          setError(err.message);
          toast.error('Authentication failed');
        }
        setTimeout(() => router.push('/login'), 3000);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/login')} 
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner fullPage message="Completing sign in..." />;
  }

  // Only show agreement for partners
  if (showAgreement && userRole && userRole !== 'individual') {
    return (
      <AgreementModal
        isOpen={true}
        onClose={handleClose}
        onAccept={handleAcceptAgreement}
        userRole={userRole}
      />
    );
  }

  // For individuals, skip agreement and proceed directly
  if (userRole === 'individual') {
    handleAcceptAgreement();
    return <LoadingSpinner fullPage message="Redirecting..." />;
  }

  return null;
}
