import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;

      if (session?.user) {
        setStatus('Verifying account...');
        
        // Check if user profile exists
        let { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        // If no profile exists, create one
        if (!profile) {
          setStatus('Creating profile...');
          
          // Get pending role from session storage
          const pendingRole = sessionStorage.getItem('pendingRole') || 'individual';
          
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              user_type: pendingRole,
              role: pendingRole === 'individual' ? 'user' : pendingRole,
              agreement_accepted: true,
              agreement_accepted_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
            });
          
          if (insertError) throw insertError;
          
          // Create role-specific record
          if (pendingRole === 'agent') {
            await supabase.from('agents').insert({
              user_id: session.user.id,
              business_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              verified: false,
              commission_rate: 10,
            });
          } else if (pendingRole === 'vendor') {
            await supabase.from('vendors').insert({
              user_id: session.user.id,
              business_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              verified: false,
            });
          } else if (pendingRole === 'organization') {
            await supabase.from('organizations').insert({
              user_id: session.user.id,
              business_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
              verified: false,
            });
          }
          
          profile = { user_type: pendingRole, role: pendingRole };
        }
        
        // Get the user's role
        const userType = profile?.user_type || profile?.role || 'individual';
        
        // Clear pending data
        sessionStorage.removeItem('pendingRole');
        sessionStorage.removeItem('pendingUser');
        
        // Show success message
        toast.success(`Welcome${profile?.full_name ? ' ' + profile.full_name : ''}!`);
        
        // Redirect to role-based dashboard
        setStatus('Redirecting...');
        
        switch (userType) {
          case 'agent':
            router.replace('/agent/dashboard');
            break;
          case 'vendor':
            router.replace('/vendor/dashboard');
            break;
          case 'organization':
            router.replace('/organization/dashboard');
            break;
          case 'admin':
            router.replace('/admin/dashboard');
            break;
          default:
            router.replace('/dashboard');
        }
        
      } else {
        // No session - go to login
        router.replace('/login');
      }
      
    } catch (error) {
      console.error('Callback error:', error);
      toast.error('Authentication failed. Please try again.');
      router.replace('/login');
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
      <p className="text-gray-600">{status}</p>
      <p className="text-xs text-gray-400 mt-2">Please wait while we complete your login...</p>
    </div>
  );
}
