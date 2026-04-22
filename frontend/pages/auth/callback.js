import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
          // Check if profile exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', session.user.id)
            .single();
          
          if (!existingProfile) {
            // Create profile for new user
            const fullName = session.user.user_metadata?.full_name || 
                            session.user.user_metadata?.name || 
                            session.user.email?.split('@')[0] || 'User';
            
            await supabase
              .from('profiles')
              .insert([{
                id: session.user.id,
                email: session.user.email,
                full_name: fullName,
                phone: session.user.phone || '',
                user_type: 'individual',
                role: 'user'
              }]);
          }
          
          toast.success('Logged in successfully!');
          router.push('/dashboard');
        } else {
          router.push('/login?message=Authentication failed');
        }
      } catch (error) {
        console.error('Callback error:', error);
        toast.error('Login failed');
        router.push('/login');
      }
    };
    
    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing sign in...</p>
      </div>
    </div>
  );
}
