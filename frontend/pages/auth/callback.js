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
      
      // Get stored redirect URL and pending pool ID BEFORE creating profile
      const storedRedirectUrl = sessionStorage.getItem('redirectAfterLogin');
      const storedPoolId = sessionStorage.getItem('pendingPoolId');
      
      console.log('Stored redirect URL:', storedRedirectUrl);
      console.log('Stored pool ID:', storedPoolId);
      console.log('User role:', userRole);
      
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            agreement_accepted: true,
            agreement_accepted_at: new Date().toISOString(),
            agreement_version: '1.0',
            role: userRole,
            user_type: userRole,
            status: userRole === 'individual' ? 'active' : 'pending_approval',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
        
        if (updateError) throw updateError;
      } else {
        // Create new profile
        console.log('Creating new profile');
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            role: userRole,
            user_type: userRole,
            agreement_accepted: true,
            agreement_accepted_at: new Date().toISOString(),
            agreement_version: '1.0',
            status: userRole === 'individual' ? 'active' : 'pending_approval',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) throw insertError;
      }
      
      // Clear pending role from storage
      localStorage.removeItem('pendingRole');
      sessionStorage.removeItem('pendingRole');
      
      toast.success('Agreement accepted! Welcome to Abbaa Carraa!');
      
      // Small delay to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // IMPORTANT: Redirect based on role AND stored redirect URL
      if (userRole === 'individual') {
        // Priority 1: Redirect back to the pool they were trying to join
        if (storedRedirectUrl && storedRedirectUrl.startsWith('/pools/')) {
          console.log('Redirecting to stored pool URL:', storedRedirectUrl);
          sessionStorage.removeItem('redirectAfterLogin');
          sessionStorage.removeItem('pendingPoolId');
          router.push(storedRedirectUrl);
          return;
        }
        // Priority 2: Redirect using stored pool ID
        if (storedPoolId) {
          console.log('Redirecting to pool ID:', storedPoolId);
          sessionStorage.removeItem('pendingPoolId');
          router.push(`/pools/${storedPoolId}`);
          return;
        }
        // Priority 3: Go to dashboard
        console.log('No stored pool, redirecting to dashboard');
        router.push('/dashboard');
        return;
      }
      
      if (userRole === 'admin') {
        router.push('/admin/dashboard');
        return;
      }
      
      // For agents/vendors/organizations, redirect to application form
      router.push(`/${userRole}/apply`);
      
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
        
        console.log('Callback - redirect from storage:', redirect);
        console.log('Callback - pending pool ID:', pendingPoolId);
        
        // Clear immediately to avoid reuse (but we'll keep pendingPoolId for now)
        localStorage.removeItem('redirectAfterLogin');
        
        if (isMounted) setRedirectUrl(redirect || (pendingPoolId ? `/pools/${pendingPoolId}` : null));

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error('Sign in failed');
          router.push('/login');
          return;
        }

        // Get pending role from sessionStorage (set in login page or pool page)
        let pendingRole = sessionStorage.getItem('pendingRole');
        if (!pendingRole) pendingRole = localStorage.getItem('pendingRole');
        
        console.log('Pending role:', pendingRole);
        console.log('User email:', session.user.email);

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
          
          // Redirect based on role and stored pool
          if (profile.role === 'individual') {
            // Check if we have a pending pool to redirect to
            if (pendingPoolId) {
              sessionStorage.removeItem('pendingPoolId');
              router.push(`/pools/${pendingPoolId}`);
              return;
            }
            if (redirect && redirect.startsWith('/pools/')) {
              router.push(redirect);
              return;
            }
            router.push('/dashboard');
          } else if (profile.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (profile.status === 'approved') {
            router.push(`/${profile.role}/dashboard`);
          } else {
            router.push(`/${profile.role}/apply`);
          }
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
        
        // No role found - redirect to login
        toast.error('Please select a role to continue');
        router.push('/login');
        
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
