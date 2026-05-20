
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import AgreementModal from '../../components/AgreementModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();
  const { redirect } = router.query;
  const [showAgreement, setShowAgreement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error('Sign in failed');
          router.push('/register');
          return;
        }

        // Get role from storage
        let pendingRole = localStorage.getItem('pendingRole');
        if (!pendingRole) pendingRole = sessionStorage.getItem('pendingRole');
        
        if (!pendingRole) {
          toast.error('Please select a role first');
          router.push('/register');
          return;
        }

        setUserRole(pendingRole);

        // Check if profile exists and agreement accepted
        const { data: profile } = await supabase
          .from('profiles')
          .select('agreement_accepted')
          .eq('id', session.user.id)
          .maybeSingle();

        // Create profile if it doesn't exist
        if (!profile) {
          await supabase.from('profiles').insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email,
            role: pendingRole,
            user_type: pendingRole,
            agreement_accepted: false,
            created_at: new Date().toISOString()
          });
        }

        if (profile?.agreement_accepted === true) {
          // Already accepted, redirect to role dashboard
          localStorage.removeItem('pendingRole');
          sessionStorage.removeItem('pendingRole');
          
          const dashboards = {
            agent: '/agent/dashboard',
            vendor: '/vendor/dashboard',
            organization: '/organization/dashboard',
            admin: '/admin/dashboard',
            individual: '/dashboard'
          };
          router.push(dashboards[pendingRole] || redirect || '/dashboard');
          return;
        }

        // Show agreement modal
        setShowAgreement(true);
        setLoading(false);
        
      } catch (err) {
        console.error('Callback error:', err);
        setError(err.message);
        toast.error('Authentication failed');
        setTimeout(() => router.push('/register'), 3000);
      }
    };

    handleCallback();
  }, [router, redirect]);

  const handleClose = () => {
    localStorage.removeItem('pendingRole');
    sessionStorage.removeItem('pendingRole');
    router.push('/register');
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 p-6 rounded-lg text-center">
          <p className="text-red-600">Error: {error}</p>
          <button onClick={() => router.push('/register')} className="mt-4 text-green-600">
            Return to Register
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
        userRole={userRole}
      />
    );
  }

  return null;
}
