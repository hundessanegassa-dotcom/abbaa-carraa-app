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
          router.push('/login'); // Changed from '/' to '/login'
          return;
        }

        // IMPORTANT: Get pending role from sessionStorage (set in login page)
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
          
          // Redirect based on role and status
          if (profile.role === 'individual') {
            if (redirect && redirect.startsWith('/pools/')) {
              router.push(redirect);
            } else {
              router.push('/dashboard');
            }
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
          setUserRole(profile.role);
          sessionStorage.setItem('pendingRole', profile.role);
          setShowAgreement(true);
          setLoading(false);
          return;
        }

        // For new users, use the pending role from login
        if (pendingRole && ['agent', 'vendor', 'organization', 'individual', 'admin'].includes(pendingRole)) {
          setUserRole(pendingRole);
          setShowAgreement(true);
          setLoading(false);
          return;
        }
        
        // No role found - redirect to role selection (login page)
        toast.error('Please select a role to continue');
        router.push('/login');
        
      } catch (err) {
        console.error('Callback error:', err);
        setError(err.message);
        toast.error('Authentication failed');
        setTimeout(() => router.push('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [router]);

  const handleAcceptAgreement = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');
      
      console.log('Saving agreement for user:', session.user.id, 'Role:', userRole);
      
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
      
      let result;
      
      if (existingProfile) {
        // Update existing profile
        console.log('Updating existing profile');
        result = await supabase
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
      } else {
        // Create new profile
        console.log('Creating new profile');
        result = await supabase
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
      }
      
      if (result.error) {
        console.error('Database error:', result.error);
        throw new Error(result.error.message);
      }
      
      console.log('Agreement saved successfully');
      
      // Clear pending role from storage
      localStorage.removeItem('pendingRole');
      sessionStorage.removeItem('pendingRole');
      
      toast.success('Agreement accepted! Welcome to Abbaa Carraa!');
      
      // Small delay to ensure database commit
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect based on role
      if (userRole === 'individual') {
        if (redirectUrl && redirectUrl.startsWith('/pools/')) {
          router.push(redirectUrl);
        } else {
          router.push('/dashboard');
        }
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
  };

  const handleClose = () => {
    // Clear all storage and sign out
    localStorage.removeItem('pendingRole');
    sessionStorage.removeItem('pendingRole');
    supabase.auth.signOut();
    router.push('/login');
  };

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
