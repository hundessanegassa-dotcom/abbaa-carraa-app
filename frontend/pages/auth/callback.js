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
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error('Sign in failed');
          router.push('/register');
          return;
        }

        const user = session.user;
        
        // Get pending role from storage
        let pendingRole = localStorage.getItem('pendingRole');
        if (!pendingRole) pendingRole = sessionStorage.getItem('pendingRole');
        
        console.log('Pending role:', pendingRole);
        
        if (!pendingRole) {
          toast.error('Please select a role first');
          router.push('/register');
          return;
        }

        // First, ensure profile exists
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('id, agreement_accepted, role, user_type')
          .eq('id', user.id)
          .maybeSingle();

        // If profile doesn't exist, create it
        if (!existingProfile) {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email,
              role: pendingRole,
              user_type: pendingRole,
              agreement_accepted: false,
              created_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error('Profile creation error:', insertError);
          }
        }

        // Check if agreement is already accepted
        const { data: profile } = await supabase
          .from('profiles')
          .select('agreement_accepted')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.agreement_accepted === true) {
          // Already accepted, redirect to dashboard
          localStorage.removeItem('pendingRole');
          sessionStorage.removeItem('pendingRole');
          
          const dashboards = {
            agent: '/agent/dashboard',
            vendor: '/vendor/dashboard',
            organization: '/organization/dashboard',
            admin: '/admin/dashboard',
            individual: '/dashboard'
          };
          router.push(dashboards[pendingRole] || '/dashboard');
          return;
        }

        // Show agreement modal
        setUserData({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          role: pendingRole
        });
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
  }, [router]);

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

  if (showAgreement && userData) {
    return (
      <AgreementModal
        isOpen={true}
        onClose={handleClose}
        userId={userData.id}
        userEmail={userData.email}
        userRole={userData.role}
      />
    );
  }

  return null;
}
