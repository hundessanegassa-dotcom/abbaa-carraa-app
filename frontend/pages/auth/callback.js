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
  const [redirectUrl, setRedirectUrl] = useState(null);

  const handleAcceptAgreement = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');
      
      // Get stored redirect URL and other data
      const storedRedirectUrl = sessionStorage.getItem('redirectAfterLogin');
      const storedPoolId = sessionStorage.getItem('pendingPoolId');
      const pendingRole = sessionStorage.getItem('pendingRole');
      const pendingPoolType = sessionStorage.getItem('pendingPoolType');
      const pendingPoolSource = sessionStorage.getItem('pendingPoolSource');
      const pendingCity = sessionStorage.getItem('pendingCity');
      
      console.log('Accepting agreement - Redirect URL:', storedRedirectUrl);
      console.log('Accepting agreement - Pool Source:', pendingPoolSource);
      console.log('Accepting agreement - Pool Type:', pendingPoolType);
      console.log('Accepting agreement - City:', pendingCity);
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (existingProfile) {
        // Update existing profile
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
        // Create new profile
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
      
      // Clear pending role from localStorage
      localStorage.removeItem('pendingRole');
      
      toast.success('Agreement accepted! Welcome to Abbaa Carraa!');
      
      // Small delay to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ========== CRITICAL FIX: Handle ALL redirect types ==========
      
      // Priority 1: Merkato VIP redirect
      if (pendingPoolSource === 'merkato-vip' && pendingPoolType) {
        const merkatoRedirectUrl = `/merkato-seat?type=${pendingPoolType}`;
        console.log('Redirecting to Merkato VIP:', merkatoRedirectUrl);
        sessionStorage.removeItem('redirectAfterLogin');
        sessionStorage.removeItem('pendingPoolId');
        sessionStorage.removeItem('pendingRole');
        sessionStorage.removeItem('pendingPoolType');
        sessionStorage.removeItem('pendingPoolSource');
        router.push(merkatoRedirectUrl);
        return;
      }
      
      // Priority 2: City VIP redirect
      if (pendingPoolSource === 'city-vip' && pendingCity && pendingPoolType) {
        const cityRedirectUrl = `/cities/seat?city=${pendingCity}&type=${pendingPoolType}`;
        console.log('Redirecting to City VIP:', cityRedirectUrl);
        sessionStorage.removeItem('redirectAfterLogin');
        sessionStorage.removeItem('pendingPoolId');
        sessionStorage.removeItem('pendingRole');
        sessionStorage.removeItem('pendingPoolType');
        sessionStorage.removeItem('pendingPoolSource');
        sessionStorage.removeItem('pendingCity');
        router.push(cityRedirectUrl);
        return;
      }
      
      // Priority 3: Regular pool redirect (stored URL)
      if (storedRedirectUrl && storedRedirectUrl.startsWith('/pools/')) {
        console.log('Redirecting to stored pool URL:', storedRedirectUrl);
        sessionStorage.removeItem('redirectAfterLogin');
        sessionStorage.removeItem('pendingPoolId');
        sessionStorage.removeItem('pendingRole');
        router.push(storedRedirectUrl);
        return;
      }
      
      // Priority 4: Regular pool redirect (by pool ID)
      if (storedPoolId) {
        console.log('Redirecting to pool ID:', storedPoolId);
        sessionStorage.removeItem('pendingPoolId');
        sessionStorage.removeItem('pendingRole');
        router.push(`/pools/${storedPoolId}`);
        return;
      }
      
      // Priority 5: For role-based flows (agent/vendor/org)
      if (pendingRole && pendingRole !== 'individual') {
        sessionStorage.removeItem('pendingRole');
        router.push(`/${pendingRole}/apply`);
        return;
      }
      
      // Priority 6: Default to listings (not dashboard!)
      console.log('No stored redirect, going to listings');
      sessionStorage.removeItem('redirectAfterLogin');
      sessionStorage.removeItem('pendingPoolId');
      sessionStorage.removeItem('pendingRole');
      sessionStorage.removeItem('pendingPoolType');
      sessionStorage.removeItem('pendingPoolSource');
      sessionStorage.removeItem('pendingCity');
      router.push('/listings');
      
    } catch (err) {
      console.error('Accept agreement error:', err);
      toast.error('Failed to save agreement: ' + err.message);
    }
  }, [userRole, router]);

  const handleClose = useCallback(() => {
    // Clear all storage and sign out
    localStorage.removeItem('pendingRole');
    sessionStorage.removeItem('pendingRole');
    sessionStorage.removeItem('redirectAfterLogin');
    sessionStorage.removeItem('pendingPoolId');
    sessionStorage.removeItem('pendingPoolType');
    sessionStorage.removeItem('pendingPoolSource');
    sessionStorage.removeItem('pendingCity');
    supabase.auth.signOut();
    router.push('/login');
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        // Get all stored data
        let redirect = sessionStorage.getItem('redirectAfterLogin');
        const pendingPoolId = sessionStorage.getItem('pendingPoolId');
        const pendingRole = sessionStorage.getItem('pendingRole');
        const pendingPoolType = sessionStorage.getItem('pendingPoolType');
        const pendingPoolSource = sessionStorage.getItem('pendingPoolSource');
        const pendingCity = sessionStorage.getItem('pendingCity');
        
        console.log('Callback - redirect from storage:', redirect);
        console.log('Callback - pending pool ID:', pendingPoolId);
        console.log('Callback - pending role:', pendingRole);
        console.log('Callback - pending pool source:', pendingPoolSource);
        console.log('Callback - pending pool type:', pendingPoolType);
        console.log('Callback - pending city:', pendingCity);
        
        // Build redirect URL for VIP flows
        if (pendingPoolSource === 'merkato-vip' && pendingPoolType) {
          redirect = `/merkato-seat?type=${pendingPoolType}`;
          console.log('Callback - Built Merkato VIP redirect:', redirect);
        }
        
        if (pendingPoolSource === 'city-vip' && pendingCity && pendingPoolType) {
          redirect = `/cities/seat?city=${pendingCity}&type=${pendingPoolType}`;
          console.log('Callback - Built City VIP redirect:', redirect);
        }
        
        if (isMounted) setRedirectUrl(redirect || (pendingPoolId ? `/pools/${pendingPoolId}` : null));

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
          // Clear pending data
          sessionStorage.removeItem('pendingRole');
          sessionStorage.removeItem('pendingPoolId');
          sessionStorage.removeItem('pendingPoolType');
          sessionStorage.removeItem('pendingPoolSource');
          sessionStorage.removeItem('pendingCity');
          localStorage.removeItem('pendingRole');
          
          toast.success(`Welcome back, ${session.user.email}!`);
          
          // ========== CRITICAL: Redirect based on pending source ==========
          
          // Merkato VIP redirect for existing user
          if (pendingPoolSource === 'merkato-vip' && pendingPoolType) {
            console.log('Existing user - redirecting to Merkato VIP');
            router.push(`/merkato-seat?type=${pendingPoolType}`);
            return;
          }
          
          // City VIP redirect for existing user
          if (pendingPoolSource === 'city-vip' && pendingCity && pendingPoolType) {
            console.log('Existing user - redirecting to City VIP');
            router.push(`/cities/seat?city=${pendingCity}&type=${pendingPoolType}`);
            return;
          }
          
          // Regular pool redirect
          if (pendingPoolId) {
            console.log('Existing user - redirecting to pool:', pendingPoolId);
            sessionStorage.removeItem('pendingPoolId');
            router.push(`/pools/${pendingPoolId}`);
            return;
          }
          if (redirect && redirect.startsWith('/pools/')) {
            console.log('Existing user - redirecting to stored URL:', redirect);
            router.push(redirect);
            return;
          }
          
          // Default to listings
          console.log('Existing user - no pool, going to listings');
          router.push('/listings');
          return;
        }

        // If user has a profile but agreement not accepted, use their existing role
        if (profile && !profile.agreement_accepted && profile.role) {
          if (isMounted) {
            setUserRole(profile.role);
            sessionStorage.setItem('pendingRole', profile.role);
            setShowAgreement(true);
            setLoading(false);
          }
          return;
        }

        // For new users, use the pending role from login
        if (pendingRole && ['agent', 'vendor', 'organization', 'individual', 'admin'].includes(pendingRole)) {
          if (isMounted) {
            setUserRole(pendingRole);
            setShowAgreement(true);
            setLoading(false);
          }
          return;
        }
        
        // No role found - default to individual (listings flow)
        if (isMounted) {
          setUserRole('individual');
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
