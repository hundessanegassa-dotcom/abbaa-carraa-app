// components/AdminGuard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import LoadingSpinner from './LoadingSpinner';

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/login');
          return;
        }
        
        // Check if user has admin role in profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        // Also check admins table
        const { data: adminRecord } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (profile?.role === 'admin' || adminRecord) {
          setIsAdmin(true);
        } else {
          // Not an admin, redirect to home
          router.push('/');
        }
      } catch (error) {
        console.error('Admin check error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    
    checkAdmin();
  }, [router]);
  
  if (loading) {
    return <LoadingSpinner fullPage message="Verifying admin access..." />;
  }
  
  return isAdmin ? children : null;
}
