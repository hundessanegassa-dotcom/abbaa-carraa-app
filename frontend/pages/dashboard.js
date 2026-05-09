import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import IndividualDashboard from '../components/dashboards/IndividualDashboard';

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    checkUserAndRedirect();
  }, []);

  async function checkUserAndRedirect() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    console.log('User ID:', user.id);

    // Get user profile to determine role
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    console.log('Profile data:', profile);
    console.log('Profile error:', error);

    if (!profile) {
      console.log('No profile found, creating one...');
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ 
          id: user.id, 
          user_type: 'individual', 
          role: 'user',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        }]);
      
      if (insertError) {
        console.error('Error creating profile:', insertError);
      }
      setLoading(false);
      return;
    }

    // Debug: Show what role we found
    setDebugInfo({
      user_type: profile.user_type,
      role: profile.role,
      full_name: profile.full_name
    });

    // Redirect to role-specific dashboard
    if (profile.user_type === 'agent' || profile.role === 'agent') {
      console.log('Redirecting to Agent Dashboard');
      router.push('/agent/dashboard');
      return;
    } else if (profile.user_type === 'vendor' || profile.role === 'vendor') {
      console.log('Redirecting to Vendor Dashboard');
      router.push('/vendor/dashboard');
      return;
    } else if (profile.user_type === 'organization' || profile.role === 'organization') {
      console.log('Redirecting to Organization Dashboard');
      router.push('/organization/dashboard');
      return;
    } else if (profile.role === 'admin') {
      console.log('Redirecting to Admin Dashboard');
      router.push('/admin/dashboard');
      return;
    } else {
      console.log('Showing Individual Dashboard');
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg text-left text-xs">
              <p><strong>Debug Info:</strong></p>
              <p>User Type: {debugInfo.user_type}</p>
              <p>Role: {debugInfo.role}</p>
              <p>Name: {debugInfo.full_name}</p>
              <p className="text-red-500 mt-2">If you registered as Agent/Vendor/Organization and see this, the role is not being saved correctly.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <IndividualDashboard />;
}
