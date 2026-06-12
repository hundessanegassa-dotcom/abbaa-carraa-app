// pages/auth/callback.js - COMPLETE FIXED VERSION
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
  const [error, setError] = useState(null);
  const [processingComplete, setProcessingComplete] = useState(false);

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

  // Handle the final redirect
  const handleFinalRedirect = useCallback(async (redirectUrl, isPoolVip) => {
    console.log('🔴 Final redirect - URL:', redirectUrl, 'IsPoolVip:', isPoolVip);
    
    clearStoredData();
    
    // CRITICAL: Pool/VIP redirect has HIGHEST priority
    if (redirectUrl) {
      console.log('🎯 Redirecting to pool/VIP:', redirectUrl);
      window.location.href = redirectUrl;
      return;
    }
    
    // Default for individuals - go to listings
    router.push('/listings');
  }, [router]);

  // Create or update user profile
  const createOrUpdateProfile = useCallback(async (session, role) => {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role, agreement_accepted')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (existingProfile) {
      // Update existing profile if needed
      if (!existingProfile.agreement_accepted) {
        await supabase
          .from('profiles')
          .update({
            agreement_accepted: true,
            agreement_accepted_at: new Date().toISOString(),
            agreement_version: '1.0',
            role: role,
            user_type: role,
            status: role === 'individual' ? 'active' : 'pending_approval',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
      }
      return existingProfile;
    } else {
      // Create new profile
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          role: role,
          user_type: role,
          agreement_accepted: role === 'individual' ? true : false, // Individuals auto-accept
          agreement_accepted_at: role === 'individual' ? new Date().toISOString() : null,
          agreement_version: role === 'individual' ? '1.0' : null,
          status: role === 'individual' ? 'active' : 'pending_approval',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return newProfile;
    }
  }, []);

  // Process individual user (no agreement needed)
  const processIndividualUser = useCallback(async (session, redirectUrl, isPoolVip) => {
    console.log('👤 Processing INDIVIDUAL user - No agreement needed');
    
    // Create/update profile with individual role
    await createOrUpdateProfile(session, 'individual');
    
    toast.success('Welcome to Abbaa Carraa!');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await handleFinalRedirect(redirectUrl, isPoolVip);
  }, [createOrUpdateProfile, handleFinalRedirect]);

  // Process partner user (needs agreement)
  const processPartnerUser = useCallback(async (session, role, redirectUrl) => {
    console.log('🤝 Processing PARTNER user - Role:', role);
    
    // Create profile first (without agreement accepted)
    await createOrUpdateProfile(session, role);
    
    // Show agreement modal
    setShowAgreement(true);
    setLoading(false);
  }, [createOrUpdateProfile]);

  // Handle agreement acceptance for partners
  const handleAcceptAgreement = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');
      
      const pendingRole = localStorage.getItem('pendingRole') || sessionStorage.getItem('pendingRole') || 'individual';
      const redirectUrl = getStoredRedirectUrl();
      
      // Update profile with agreement accepted
      await supabase
        .from('profiles')
        .update({
          agreement_accepted: true,
          agreement_accepted_at: new Date().toISOString(),
          agreement_version: '1.0',
          status: 'pending_approval',
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
      
      toast.success('Welcome to Abbaa Carraa!');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      clearStoredData();
      
      // Redirect to partner application form
      router.push(`/become-${pendingRole}`);
      
    } catch (err) {
      console.error('Accept agreement error:', err);
      toast.error('Failed to save agreement: ' + err.message);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleCloseAgreement = useCallback(() => {
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

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error('Sign in failed');
          router.push('/login');
          return;
        }

        // Get pending role (default to individual)
        let pendingRole = localStorage.getItem('pendingRole') || sessionStorage.getItem('pendingRole') || 'individual';
        
        // If this is a pool/VIP redirect, force role to INDIVIDUAL
        if (isPoolVip) {
          pendingRole = 'individual';
          console.log('🎯 Pool/VIP redirect - Forcing role to individual');
        }
        
        // Check if user already has a profile
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('role, agreement_accepted')
          .eq('id', session.user.id)
          .maybeSingle();

        // If user already exists and has agreement accepted
        if (existingProfile?.agreement_accepted === true) {
          console.log('✅ Existing user with agreement accepted');
          
          // Check for redirect URL FIRST
          if (redirectUrl) {
            console.log('🎯 Existing user - Redirecting to pool/VIP:', redirectUrl);
            clearStoredData();
            window.location.href = redirectUrl;
            return;
          }
          
          clearStoredData();
          
          // Partners go to their dashboard
          if (existingProfile.role !== 'individual') {
            router.push(`/${existingProfile.role}/dashboard`);
            return;
          }
          
          // Individuals go to listings
          router.push('/listings');
          return;
        }

        // NEW USER or USER WITHOUT AGREEMENT
        if (isMounted) {
          if (pendingRole === 'individual') {
            // INDIVIDUAL - No agreement needed, process immediately
            await processIndividualUser(session, redirectUrl, isPoolVip);
          } else {
            // PARTNER - Needs agreement
            await processPartnerUser(session, pendingRole, redirectUrl);
          }
        }
        
        if (isMounted) {
          setProcessingComplete(true);
        }
        
      } catch (err) {
        console.error('Callback error:', err);
        if (isMounted) {
          setError(err.message);
          toast.error('Authentication failed');
        }
        setTimeout(() => router.push('/login'), 3000);
      } finally {
        if (isMounted && !processingComplete) {
          setLoading(false);
        }
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [router, processIndividualUser, processPartnerUser, processingComplete]);

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
  if (showAgreement) {
    const pendingRole = localStorage.getItem('pendingRole') || sessionStorage.getItem('pendingRole') || 'individual';
    return (
      <AgreementModal
        isOpen={true}
        onClose={handleCloseAgreement}
        onAccept={handleAcceptAgreement}
        userRole={pendingRole}
      />
    );
  }

  return null;
}
