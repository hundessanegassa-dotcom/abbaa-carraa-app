// pages/auth/callback.js - COMPLETE WITH TELEGRAM LOGIN
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
    let redirectUrl = localStorage.getItem('abbaa_redirect_after_login');
    if (redirectUrl) {
      localStorage.removeItem('abbaa_redirect_after_login');
      return redirectUrl;
    }
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

  const handleFinalRedirect = useCallback(async (redirectUrl, isPoolVip) => {
    console.log('🔴 Final redirect - URL:', redirectUrl, 'IsPoolVip:', isPoolVip);
    
    clearStoredData();
    
    if (redirectUrl) {
      console.log('🎯 Redirecting to pool/VIP:', redirectUrl);
      window.location.href = redirectUrl;
      return;
    }
    
    router.push('/listings');
  }, [router]);

  const createOrUpdateProfile = useCallback(async (session, role) => {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, role, agreement_accepted')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (existingProfile) {
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
      const { data: newProfile, error } = await supabase
        .from('profiles')
        .insert({
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
          role: role,
          user_type: role,
          agreement_accepted: role === 'individual' ? true : false,
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

  // ✅ Handle Telegram Login
  const handleTelegramLogin = useCallback(async (token, telegramId) => {
    console.log('📱 Processing Telegram login...');
    console.log('📱 Token:', token?.substring(0, 30) + '...');
    console.log('📱 Telegram ID:', telegramId);
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/auth/telegram-login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          telegram_id: telegramId 
        })
      });

      console.log('📡 Response status:', response.status);
      
      const result = await response.json();
      console.log('📡 Response data:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Telegram login failed');
      }

      // ✅ Store session
      sessionStorage.setItem('telegram_session_token', result.sessionToken);
      sessionStorage.setItem('telegram_user', JSON.stringify({
        id: telegramId,
        ...result.user
      }));

      toast.success('Login successful! 🎉');
      
      // ✅ Check for redirect URL
      const redirectUrl = getStoredRedirectUrl();
      if (redirectUrl) {
        window.location.href = redirectUrl;
        return;
      }
      
      router.push('/dashboard');
      
    } catch (error) {
      console.error('❌ Telegram login error:', error);
      setError(error.message);
      toast.error(error.message || 'Telegram login failed');
      setTimeout(() => router.push('/login'), 2000);
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Process individual user
  const processIndividualUser = useCallback(async (session, redirectUrl, isPoolVip) => {
    console.log('👤 Processing INDIVIDUAL user');
    await createOrUpdateProfile(session, 'individual');
    toast.success('Welcome to Abbaa Carraa!');
    await new Promise(resolve => setTimeout(resolve, 500));
    await handleFinalRedirect(redirectUrl, isPoolVip);
  }, [createOrUpdateProfile, handleFinalRedirect]);

  // Process partner user
  const processPartnerUser = useCallback(async (session, role, redirectUrl) => {
    console.log('🤝 Processing PARTNER user - Role:', role);
    await createOrUpdateProfile(session, role);
    setShowAgreement(true);
    setLoading(false);
  }, [createOrUpdateProfile]);

  const handleAcceptAgreement = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');
      
      const pendingRole = localStorage.getItem('pendingRole') || sessionStorage.getItem('pendingRole') || 'individual';
      
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
        // ✅ Check for Telegram login token first
        const { token, telegram_id } = router.query;
        console.log('🔍 Router query:', { token: token?.substring(0, 20), telegram_id });
        
        if (token && telegram_id) {
          console.log('📱 Telegram login detected!');
          await handleTelegramLogin(token, telegram_id);
          return;
        }

        // Get redirect URL from storage
        const redirectUrl = getStoredRedirectUrl();
        const isPoolVip = isPoolOrVipRedirect(redirectUrl);
        
        console.log('🟢 Callback - Redirect URL:', redirectUrl);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error('Sign in failed');
          router.push('/login');
          return;
        }

        let pendingRole = localStorage.getItem('pendingRole') || sessionStorage.getItem('pendingRole') || 'individual';
        
        if (isPoolVip) {
          pendingRole = 'individual';
          console.log('🎯 Pool/VIP redirect - Forcing role to individual');
        }
        
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('role, agreement_accepted')
          .eq('id', session.user.id)
          .maybeSingle();

        if (existingProfile?.agreement_accepted === true) {
          console.log('✅ Existing user with agreement accepted');
          
          if (redirectUrl) {
            console.log('🎯 Existing user - Redirecting to pool/VIP:', redirectUrl);
            clearStoredData();
            window.location.href = redirectUrl;
            return;
          }
          
          clearStoredData();
          
          if (existingProfile.role !== 'individual') {
            router.push(`/${existingProfile.role}/dashboard`);
            return;
          }
          
          router.push('/listings');
          return;
        }

        if (isMounted) {
          if (pendingRole === 'individual') {
            await processIndividualUser(session, redirectUrl, isPoolVip);
          } else {
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

    if (router.isReady) {
      handleCallback();
    }

    return () => {
      isMounted = false;
    };
  }, [router, router.isReady, router.query, processIndividualUser, processPartnerUser, handleTelegramLogin, processingComplete]);

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
