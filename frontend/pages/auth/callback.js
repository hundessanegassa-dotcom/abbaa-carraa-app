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
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, user_type, agreement_accepted')
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
        // Check if there's a pending role from URL
        const urlParams = new URLSearchParams(window.location.search);
        const pendingRole = urlParams.get('role');
        
        if (pendingRole && ['agent', 'vendor', 'organization', 'individual'].includes(pendingRole)) {
          setUserRole(pendingRole);
          localStorage.setItem('pendingRole', pendingRole);
          sessionStorage.setItem('pendingRole', pendingRole);
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
      }
    };

    handleCallback();
  }, [router]);

  const handleAcceptAgreement = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Update profile with agreement accepted
      const { error } = await supabase
        .from('profiles')
        .update({
          agreement_accepted: true,
          agreement_accepted_at: new Date().toISOString(),
          role: userRole,
          user_type: userRole,
          status: userRole === 'individual' ? 'active' : 'pending_approval'
        })
        .eq('id', session.user.id);
      
      if (error) throw error;
      
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
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <p className="text-red-600">Error: {error}</p>
          <button onClick={() => router.push('/')} className="mt-4 text-green-600">
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
