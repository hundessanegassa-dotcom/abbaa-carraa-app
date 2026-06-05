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

  const getStoredVipData = () => {
    // Try localStorage first
    let vipData = null;
    try {
      const stored = localStorage.getItem('abbaa_vip_pending');
      if (stored) {
        vipData = JSON.parse(stored);
        console.log('✅ Found VIP data in localStorage:', vipData);
        return vipData;
      }
    } catch (e) {
      console.error('Error parsing localStorage VIP data:', e);
    }
    
    // Try sessionStorage backup
    try {
      const stored = sessionStorage.getItem('abbaa_vip_pending_backup');
      if (stored) {
        vipData = JSON.parse(stored);
        console.log('✅ Found VIP data in sessionStorage backup:', vipData);
        return vipData;
      }
    } catch (e) {
      console.error('Error parsing sessionStorage VIP data:', e);
    }
    
    return null;
  };

  const clearStoredVipData = () => {
    localStorage.removeItem('abbaa_vip_pending');
    sessionStorage.removeItem('abbaa_vip_pending_backup');
    sessionStorage.removeItem('pendingRole');
    sessionStorage.removeItem('pendingPoolType');
    sessionStorage.removeItem('pendingPoolSource');
    sessionStorage.removeItem('pendingCity');
    sessionStorage.removeItem('redirectAfterLogin');
  };

  const handleAcceptAgreement = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');
      
      // Get VIP data
      const vipData = getStoredVipData();
      const pendingRole = sessionStorage.getItem('pendingRole') || vipData?.role;
      const redirectUrl = vipData?.redirectTo || sessionStorage.getItem('redirectAfterLogin');
      
      console.log('🔴 Accepting agreement - Redirect URL:', redirectUrl);
      console.log('🔴 VIP Data:', vipData);
      
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
            role: pendingRole || userRole,
            user_type: pendingRole || userRole,
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
            role: pendingRole || userRole,
            user_type: pendingRole || userRole,
            agreement_accepted: true,
            agreement_accepted_at: new Date().toISOString(),
            agreement_version: '1.0',
            status: pendingRole === 'individual' ? 'active' : 'pending_approval',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      toast.success('Agreement accepted! Welcome to Abbaa Carraa!');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ========== CRITICAL: Redirect based on VIP data ==========
      clearStoredVipData();
      
      if (redirectUrl && (redirectUrl.includes('/merkato-seat') || redirectUrl.includes('/cities/seat'))) {
        console.log('🎯 Redirecting to VIP page:', redirectUrl);
        router.push(redirectUrl);
        return;
      }
      
      // Fallback to listings
      console.log('🎯 No VIP redirect, going to listings');
      router.push('/listings');
      
    } catch (err) {
      console.error('Accept agreement error:', err);
      toast.error('Failed to save agreement: ' + err.message);
    }
  }, [userRole, router]);

  const handleClose = useCallback(() => {
    clearStoredVipData();
    supabase.auth.signOut();
    router.push('/login');
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        // Get VIP data from storage
        const vipData = getStoredVipData();
        const redirectUrl = vipData?.redirectTo || sessionStorage.getItem('redirectAfterLogin');
        
        console.log('🟢 Callback - VIP Data:', vipData);
        console.log('🟢 Callback - Redirect URL:', redirectUrl);

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
          
          // ========== CRITICAL: Redirect based on VIP data ==========
          clearStoredVipData();
          
          if (vipData?.type === 'merkato' && vipData?.poolType) {
            console.log('🎯 Existing user - Redirecting to Merkato VIP');
            router.push(`/merkato-seat?type=${vipData.poolType}`);
            return;
          }
          
          if (vipData?.type === 'city' && vipData?.city && vipData?.poolType) {
            console.log('🎯 Existing user - Redirecting to City VIP');
            router.push(`/cities/seat?city=${vipData.city}&type=${vipData.poolType}`);
            return;
          }
          
          if (redirectUrl && redirectUrl.includes('/pools/')) {
            router.push(redirectUrl);
            return;
          }
          
          router.push('/listings');
          return;
        }

        // New user or agreement not accepted
        let roleToUse = profile?.role || vipData?.role || 'individual';
        
        if (vipData?.type === 'merkato' || vipData?.type === 'city') {
          roleToUse = 'individual';
        }
        
        if (isMounted) {
          setUserRole(roleToUse);
          setShowAgreement(true);
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

  if (showAgreement && userRole) {
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
