import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    handleCallback();
  }, []);

  async function handleCallback() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      toast.error('Authentication failed');
      router.push('/login');
      return;
    }

    const user = session.user;
    
    // Get stored registration data
    const pendingRole = sessionStorage.getItem('pendingRole') || 'individual';
    const agreementAccepted = sessionStorage.getItem('agreementAccepted') === 'true';
    const agreementType = sessionStorage.getItem('agreementType') || pendingRole;
    const agreementAcceptedAt = sessionStorage.getItem('agreementAcceptedAt') || new Date().toISOString();

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    let profile;
    
    if (!existingProfile) {
      // Create new profile with agreement acceptance
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          user_type: pendingRole,
          role: pendingRole === 'individual' ? 'user' : pendingRole,
          agreement_accepted: agreementAccepted,
          agreement_accepted_at: agreementAcceptedAt,
          agreement_type: agreementType,
          can_create_pool: pendingRole !== 'individual',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Profile creation error:', insertError);
        toast.error('Failed to create profile');
        router.push('/register');
        return;
      }
      
      profile = newProfile;
      
      // Create role-specific record
      if (pendingRole === 'agent') {
        await supabase.from('agents').insert({
          user_id: user.id,
          business_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          verified: false,
          commission_rate: 10,
        });
      } else if (pendingRole === 'vendor') {
        await supabase.from('vendors').insert({
          user_id: user.id,
          business_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          verified: false,
        });
      } else if (pendingRole === 'organization') {
        await supabase.from('organizations').insert({
          user_id: user.id,
          business_name: user.user_metadata?.full_name || user.email?.split('@')[0],
          verified: false,
        });
      }
      
      toast.success(`Welcome! You registered as ${pendingRole}.`);
      
    } else {
      // Existing user - just get profile
      const { data: existing } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      profile = existing;
    }
    
    // Clear session storage
    sessionStorage.removeItem('pendingRole');
    sessionStorage.removeItem('agreementAccepted');
    sessionStorage.removeItem('agreementType');
    sessionStorage.removeItem('agreementAcceptedAt');
    
    // Redirect based on role
    const userType = profile?.user_type || pendingRole;
    
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
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
      <p className="text-gray-600">Completing your registration...</p>
    </div>
  );
}
