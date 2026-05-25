import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get redirect URL from storage (set in login page)
        let redirect = localStorage.getItem('redirectAfterLogin');
        if (!redirect) redirect = sessionStorage.getItem('redirectAfterLogin');
        
        // Clear immediately to avoid reuse
        localStorage.removeItem('redirectAfterLogin');
        sessionStorage.removeItem('redirectAfterLogin');
        
        setRedirectUrl(redirect);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error('Sign in failed');
          router.push('/');
          return;
        }

        // Check if user has a role and agreement accepted
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, user_type, agreement_accepted, agreement_version')
          .eq('id', session.user.id)
          .maybeSingle();

        // If user already has a role and agreement accepted
        if (profile?.agreement_accepted === true && profile?.role) {
          // Redirect to stored URL or dashboard
          if (redirect && redirect.startsWith('/pools/')) {
            router.push(redirect);
          } else {
            const dashboards = {
              agent: '/agent/dashboard',
              vendor: '/vendor/dashboard',
              organization: '/organization/dashboard',
              admin: '/admin/dashboard',
              individual: '/dashboard'
            };
            router.push(dashboards[profile.role] || '/dashboard');
          }
          return;
        }

        // If user has no role, they need to select one
        // Check if there's a pending role from URL or storage
        let pendingRole = localStorage.getItem('pendingRole');
        if (!pendingRole) pendingRole = sessionStorage.getItem('pendingRole');
        
        // Also check URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = urlParams.get('role');
        
        const finalRole = pendingRole || urlRole;
        
        if (finalRole && ['agent', 'vendor', 'organization', 'individual', 'admin'].includes(finalRole)) {
          setUserRole(finalRole);
          localStorage.setItem('pendingRole', finalRole);
          sessionStorage.setItem('pendingRole', finalRole);
          setShowAgreement(true);
          setLoading(false);
          return;
        }
        
        // No role found - redirect to role selection
        router.push('/register');
        
      } catch (err) {
        console.error('Callback error:', err);
        setError(err.message);
        toast.error('Authentication failed');
        setTimeout(() => router.push('/'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  const handleAcceptAgreement = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');
      
      // Check if user already has a profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      let updateError;
      
      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
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
        updateError = error;
      } else {
        // Create new profile
        const { error } = await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email,
            role: userRole,
            user_type: userRole,
            agreement_accepted: true,
            agreement_accepted_at: new Date().toISOString(),
            agreement_version: '1.0',
            status: userRole === 'individual' ? 'active' : 'pending_approval',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        updateError = error;
      }
      
      if (updateError) throw updateError;
      
      // Clear pending role from storage
      localStorage.removeItem('pendingRole');
      sessionStorage.removeItem('pendingRole');
      
      toast.success('Agreement accepted!');
      
      // For individual users, redirect immediately
      if (userRole === 'individual') {
        if (redirectUrl && redirectUrl.startsWith('/pools/')) {
          router.push(redirectUrl);
        } else {
          router.push('/dashboard');
        }
        return;
      }
      
      // For agents/vendors/organizations, redirect to application form
      router.push(`/${userRole}/apply`);
      
    } catch (err) {
      console.error('Accept agreement error:', err);
      toast.error('Failed to save agreement. Please try again.');
    }
  };

  const handleClose = () => {
    localStorage.removeItem('pendingRole');
    sessionStorage.removeItem('pendingRole');
    router.push('/');
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg text-center max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')} 
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
          >
            Return to Home
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
