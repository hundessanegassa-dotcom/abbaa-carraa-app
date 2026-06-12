// pages/auth/callback.js - COMPLETELY FIXED VERSION
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
  const [pendingRedirect, setPendingRedirect] = useState(null);
  const [isPoolVipRedirect, setIsPoolVipRedirect] = useState(false);

  // Get stored redirect URL
  const getStoredRedirectUrl = () => {
    // Check localStorage first (set by pool pages)
    let redirectUrl = localStorage.getItem('abbaa_redirect_after_login');
    if (redirectUrl) {
      localStorage.removeItem('abbaa_redirect_after_login');
      return redirectUrl;
    }
    // Check sessionStorage
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
      (url.includes('/cities/') && url.includes('?type=')) ||
      url.includes('/merkato-vip')
    );
  };

  const clearStoredData = () => {
    localStorage.removeItem('abbaa_redirect_after_login');
    localStorage.removeItem('abbaa_vip_pending');
    localStorage.removeItem('pendingRole');
    sessionStorage.removeItem('redirectAfterLogin');
    sessionStorage.removeItem('pendingRole');
    sessionStorage.removeItem('isPartner');
    sessionStorage.removeItem('pendingPoolId');
    sessionStorage.removeItem('pendingPoolType');
    sessionStorage.removeItem('pendingCity');
  };

  // Handle the final redirect after everything is done
  const handleFinalRedirect = useCallback(async (finalRole, redirectUrl, isPoolVip) => {
    console.log('🔴 Final redirect - Role:', finalRole, 'URL:', redirectUrl, 'IsPoolVip:', isPoolVip);
    
    clearStoredData();
    
    // CRITICAL: Pool/VIP redirect has HIGHEST priority
    if (redirectUrl) {
      console.log('🎯 Redirecting to pool/VIP:', redirectUrl);
      window.location.href = redirectUrl;
      return;
    }
    
    // For partners (agents/vendors/orgs), go to their application form
    if (finalRole !== 'individual') {
      router.push(`/become-${finalRole}`);
      return;
    }
    
    // Default for individuals
    router.push('/listings');
  }, [router]);

  // Handle agreement acceptance (ONLY for partners)
  const handleAcceptAgreement = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');
      
      const pendingRole = localStorage.getItem('pendingRole') || sessionStorage.getItem('pendingRole') || 'individual';
      const redirectUrl = getStoredRedirectUrl();
      const isPoolVip = isPoolOrVipRedirect(redirectUrl);
      
      // Final role determination
      const finalRole = isPoolVip ? 'individual' : pendingRole;
      
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
      handleFinalRedirect(finalRole, redirectUrl, isPoolVip);
      
    } catch (err) {
      console.error('Accept agreement error:', err);
      toast.error('Failed to save agreement: ' + err.message);
      router.push('/login');
    }
  }, [handleFinalRedirect, router]);

  const handleClose = useCallback(() => {
    clearStoredData();
    supabase.auth.signOut();
    router.push('/login');
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        // Get redirect URL from storage FIRST
        const redirectUrl = getStoredRedirectUrl();
        const isPoolVip = isPoolOrVipRedirect(redirectUrl);
        
        console.log('🟢 Callback - Redirect URL:', redirectUrl);
        console.log('🟢 Callback - Is Pool/VIP redirect:', isPoolVip);
        
        setPendingRedirect(redirectUrl);
        setIsPoolVipRedirect(isPoolVip);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error('Sign in failed');
          router.push('/login');
          return;
        }

        // Check if user already has a profile with agreement accepted
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, user_type, agreement_accepted, agreement_version, id, status')
          .eq('id', session.user.id)
          .maybeSingle();

        // If user has a profile with agreement accepted
        if (profile?.agreement_accepted === true) {
          console.log('✅ User already has agreement accepted');
          
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

        // NEW USER - Determine role
        let pendingRole = localStorage.getItem('pendingRole') || sessionStorage.getItem('pendingRole') || 'individual';
        
        // If this is a pool/VIP redirect, force role to INDIVIDUAL (NO AGREEMENT NEEDED)
        if (isPoolVip) {
          pendingRole = 'individual';
          // Clear any partner role storage
          localStorage.removeItem('pendingRole');
          sessionStorage.removeItem('pendingRole');
          console.log('🎯 Pool/VIP redirect - Forcing role to individual, NO agreement');
        }
        
        if (isMounted) {
          setUserRole(pendingRole);
          
          // ONLY show agreement for partners (agents/vendors/orgs)
          // Individuals (including pool/VIP joiners) should NEVER see agreement
          const needsAgreement = pendingRole !== 'individual';
          setShowAgreement(needsAgreement);
          setLoading(false);
          
          // If individual (no agreement needed), immediately process
          if (!needsAgreement) {
            console.log('👤 Individual user - No agreement needed, proceeding directly');
            await handleAcceptAgreement();
          }
        }
        
      } catch (err) {
        console.error('Callback error:', err);
        if (isMounted) {
          setError(err.message);
          toast.error('Authentication failed');
        }
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [router, handleAcceptAgreement]);

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

  // Show agreement ONLY for partners (agents/vendors/organizations)
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
