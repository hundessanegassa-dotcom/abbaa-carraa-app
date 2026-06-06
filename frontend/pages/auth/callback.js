// pages/auth/callback.js - FIXED VERSION
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

  // Get stored redirect URL - CRITICAL for pool/VIP joining
  const getStoredRedirectUrl = () => {
    // Try localStorage first (more reliable)
    let redirectUrl = localStorage.getItem('abbaa_redirect_after_login');
    if (redirectUrl) {
      localStorage.removeItem('abbaa_redirect_after_login');
      return redirectUrl;
    }
    // Fallback to sessionStorage
    redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      sessionStorage.removeItem('redirectAfterLogin');
      return redirectUrl;
    }
    return null;
  };

  const isPoolOrVipRedirect = (url) => {
    return url && (
      url.includes('/merkato-seat') || 
      url.includes('/cities/seat') || 
      url.includes('/pools/') ||
      url.includes('/cities/') && url.includes('?type=') ||
      url.includes('/merkato-vip')
    );
  };

  const clearStoredData = () => {
    localStorage.removeItem('abbaa_redirect_after_login');
    localStorage.removeItem('abbaa_vip_pending');
    sessionStorage.removeItem('redirectAfterLogin');
    sessionStorage.removeItem('pendingRole');
    sessionStorage.removeItem('isPartner');
    sessionStorage.removeItem('pendingPoolId');
    sessionStorage.removeItem('pendingPoolType');
    sessionStorage.removeItem('pendingCity');
  };

  const handleAcceptAgreement = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');
      
      const pendingRole = localStorage.getItem('pendingRole') || sessionStorage.getItem('pendingRole') || 'individual';
      const redirectUrl = getStoredRedirectUrl();
      const isPoolVipRedirect = isPoolOrVipRedirect(redirectUrl);
      
      // For pool/VIP joining, force role to individual
      const finalRole = isPoolVipRedirect ? 'individual' : pendingRole;
      
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
            role: finalRole,
            user_type: finalRole,
            status: finalRole === 'individual' ? 'active' : 'pending_approval',
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
            role: finalRole,
            user_type: finalRole,
            agreement_accepted: true,
            agreement_accepted_at: new Date().toISOString(),
            agreement_version: '1.0',
            status: finalRole === 'individual' ? 'active' : 'pending_approval',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      toast.success('Welcome to Abbaa Carraa!');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // CRITICAL: Pool/VIP redirect takes HIGHEST priority
      if (redirectUrl) {
        console.log('🎯 Redirecting to pool/VIP:', redirectUrl);
        clearStoredData();
        window.location.href = redirectUrl;
        return;
      }
      
      clearStoredData();
      
      // Redirect partners to their application form
      if (finalRole !== 'individual') {
        router.push(`/become-${finalRole}`);
        return;
      }
      
      // Default to listings
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
        // Get redirect URL from storage
        const redirectUrl = getStoredRedirectUrl();
        const isPoolVip = isPoolOrVipRedirect(redirectUrl);
        
        console.log('🟢 Callback - Redirect URL:', redirectUrl);
        console.log('🟢 Callback - Is Pool/VIP redirect:', isPoolVip);

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
        if (profile?.agreement_accepted === true) {
          // CRITICAL: Check for redirect URL FIRST - even for existing users
          if (redirectUrl) {
            console.log('🎯 Existing user - Redirecting to pool/VIP:', redirectUrl);
            clearStoredData();
            window.location.href = redirectUrl;
            return;
          }
          
          clearStoredData();
          
          // Partners go to their dashboard
          if (profile.role !== 'individual') {
            router.push(`/${profile.role}/dashboard`);
            return;
          }
          
          // Individuals go to listings
          router.push('/listings');
          return;
        }

        // New user - determine role
        let pendingRole = localStorage.getItem('pendingRole') || sessionStorage.getItem('pendingRole') || 'individual';
        
        // If this is a pool/VIP redirect, force role to individual
        if (isPoolVip) {
          pendingRole = 'individual';
          localStorage.setItem('pendingRole', 'individual');
          sessionStorage.setItem('pendingRole', 'individual');
        }
        
        if (isMounted) {
          setUserRole(pendingRole);
          // Only show agreement for partners (agents/vendors/orgs)
          // Individuals (including pool/VIP joiners) skip agreement
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

  // For individuals (including pool/VIP joiners), skip agreement and proceed directly
  if (userRole === 'individual') {
    handleAcceptAgreement();
    return <LoadingSpinner fullPage message="Redirecting to your pool..." />;
  }

  // Only show agreement for partners (agents/vendors/organizations)
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

  return null;
}
