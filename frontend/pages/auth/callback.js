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
      
      // Get stored redirect URL BEFORE creating profile
      const storedRedirectUrl = sessionStorage.getItem('redirectAfterLogin');
      const storedPoolId = sessionStorage.getItem('pendingPoolId');
      const pendingRole = sessionStorage.getItem('pendingRole');
      
      console.log('Accepting agreement - Redirect URL:', storedRedirectUrl);
      console.log('Accepting agreement - Pool ID:', storedPoolId);
      console.log('Accepting agreement - Role:', pendingRole);
      
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
      
      // Clear pending role
      localStorage.removeItem('pendingRole');
      
      toast.success('Agreement accepted! Welcome to Abbaa Carraa!');
      
      // Small delay to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // CRITICAL FIX: Redirect back to the original pool or the intended page
      // Priority 1: Redirect to stored pool URL
      if (storedRedirectUrl && storedRedirectUrl.startsWith('/pools/')) {
        console.log('Redirecting to stored pool URL:', storedRedirectUrl);
        sessionStorage.removeItem('redirectAfterLogin');
        sessionStorage.removeItem('pendingPoolId');
        sessionStorage.removeItem('pendingRole');
        router.push(storedRedirectUrl);
        return;
      }
      
      // Priority 2: Redirect using stored pool ID
      if (storedPoolId) {
        console.log('Redirecting to pool ID:', storedPoolId);
        sessionStorage.removeItem('pendingPoolId');
        sessionStorage.removeItem('pendingRole');
        router.push(`/pools/${storedPoolId}`);
        return;
      }
      
      // Priority 3: For role-based flows (agent/vendor/org)
      if (pendingRole && pendingRole !== 'individual') {
        sessionStorage.removeItem('pendingRole');
        router.push(`/${pendingRole}/apply`);
        return;
      }
      
      // Priority 4: Default to listings (not dashboard!)
      console.log('No stored redirect, going to listings');
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
    supabase.auth.signOut();
    router.push('/login');
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        // Get redirect URL from storage (set in login page or pool page)
        let redirect = localStorage.getItem('redirectAfterLogin');
        if (!redirect) redirect = sessionStorage.getItem('redirectAfterLogin');
        
        // Also get pending pool ID
        const pendingPoolId = sessionStorage.getItem('pendingPoolId');
        const pendingRole = sessionStorage.getItem('pendingRole');
        
        console.log('Callback - redirect from storage:', redirect);
        console.log('Callback - pending pool ID:', pendingPoolId);
        console.log('Callback - pending role:', pendingRole);
        
        // Clear immediately to avoid reuse
        localStorage.removeItem('redirectAfterLogin');
        
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
          // Clear pending role
          sessionStorage.removeItem('pendingRole');
          localStorage.removeItem('pendingRole');
          
          toast.success(`Welcome back, ${session.user.email}!`);
          
          // CRITICAL: Redirect back to the pool they were trying to join
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
          // Default to listings (not dashboard!)
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
