import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function LoginCallback() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleGoogleCallback();
  }, []);

  const handleGoogleCallback = async () => {
    try {
      // Get the current user after Google redirect
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) throw error;
      
      if (user) {
        // Get user profile to determine role
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type, role')
          .eq('id', user.id)
          .maybeSingle();

        const userType = profile?.user_type || profile?.role || 'individual';

        toast.success('Logged in successfully!');

        // Redirect to role-specific dashboard
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
        router.replace('/login');
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Login failed. Please try again.');
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Completing login...</p>
        </div>
      </div>
    );
  }

  return null;
}
