import { useEffect, useState, useCallback } from 'react';
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

  const handleAcceptAgreement = useCallback(async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No session found');
      
      // Get VIP data from localStorage
      let vipData = null;
      try {
        const vipDataRaw = localStorage.getItem('abbaa_vip_pending');
        if (vipDataRaw) {
          vipData = JSON.parse(vipDataRaw);
          console.log('Found VIP data in localStorage:', vipData);
        }
      } catch (e) {
        console.error('Error parsing VIP data:', e);
      }
      
      const pendingRole = vipData?.role || sessionStorage.getItem('pendingRole') || localStorage.getItem('pendingRole');
      const pendingPoolSource = vipData?.poolSource;
      const pendingPoolType = vipData?.poolType;
      const pendingCity = vipData?.city;
      
      console.log('Accepting agreement - Pool Source:', pendingPoolSource);
      console.log('Accepting agreement - Pool Type:', pendingPoolType);
      console.log('Accepting agreement - City:', pendingCity);
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (existingProfile) {
        await supabase
          .from('profiles')
          .update({
            agreement_accepted: true,
            agreement_accepted_at: new Date().toISOString(),
            agreement_version: '1.0',
            role: pendingRole || userRole,
            user_type: pendingRole || userRole,
            status: pendingRole === 'individual' ? 'active' : 'pending_approval',
            updated_at: new Date().toISOString()
          })
          .eq('id', session.user.id);
      } else {
        await supabase
          .from('profiles')
          .insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
            role: pendingRole || userRole,
            user_type: pendingRole || userRole,
            agreement_accepted: true,
            agreement_accepted_at: new Date().toISOString(),
            agreement_version: '1.0',
            status: pendingRole === 'individual' ? 'active' : 'pending_approval',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
      
      toast.success('Agreement accepted! Welcome to Abbaa Carraa!');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // ========== CRITICAL: Handle VIP redirects from localStorage ==========
      
      // Priority 1: Merkato VIP redirect
      if (pendingPoolSource === 'merkato-vip' && pendingPoolType) {
        const merkatoRedirectUrl = `/merkato-seat?type=${pendingPoolType}`;
        console.log('Redirecting to Merkato VIP:', merkatoRedirectUrl);
        localStorage.removeItem('abbaa_vip_pending');
        sessionStorage.clear();
        router.push(merkatoRedirectUrl);
        return;
      }
      
      // Priority 2: City VIP redirect
      if (pendingPoolSource === 'city-vip' && pendingCity && pendingPoolType) {
        const cityRedirectUrl = `/cities/seat?city=${pendingCity}&type=${pendingPoolType}`;
        console.log('Redirecting to City VIP:', cityRedirectUrl);
        localStorage.removeItem('abbaa_vip_pending');
        sessionStorage.clear();
        router.push(cityRedirectUrl);
        return;
      }
      
      // Priority 3: Regular pool redirect
      const storedRedirect = sessionStorage.getItem('redirectAfterLogin');
      if (storedRedirect && storedRedirect.startsWith('/pools/')) {
        console.log('Redirecting to stored pool URL:', storedRedirect);
        sessionStorage.clear();
        router.push(storedRedirect);
        return;
      }
      
      // Priority 4: Default to listings
      console.log('No stored redirect, going to listings');
      localStorage.removeItem('abbaa_vip_pending');
      sessionStorage.clear();
      router.push('/listings');
      
    } catch (err) {
      console.error('Accept agreement error:', err);
      toast.error('Failed to save agreement: ' + err.message);
    }
  }, [userRole, router]);

  const handleClose = useCallback(() => {
    localStorage.removeItem('abbaa_vip_pending');
    sessionStorage.clear();
    localStorage.clear();
    supabase.auth.signOut();
    router.push('/login');
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    const handleCallback = async () => {
      try {
        // Get VIP data from localStorage FIRST
        let vipData = null;
        try {
          const vipDataRaw = localStorage.getItem('abbaa_vip_pending');
          if (vipDataRaw) {
            vipData = JSON.parse(vipDataRaw);
            console.log('Callback - Found VIP data:', vipData);
          }
        } catch (e) {
          console.error('Error parsing VIP data:', e);
        }
        
        const pendingPoolSource = vipData?.poolSource;
        const pendingPoolType = vipData?.poolType;
        const pendingCity = vipData?.city;
        const pendingRole = vipData?.role || sessionStorage.getItem('pendingRole');
        
        console.log('Callback - pending pool source:', pendingPoolSource);
        console.log('Callback - pending pool type:', pendingPoolType);
        console.log('Callback - pending city:', pendingCity);

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error('Sign in failed');
          router.push('/login');
          return;
        }

        // Check if user already has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, user_type, agreement_accepted, agreement_version, id, status')
          .eq('id', session.user.id)
          .maybeSingle();

        // If user has a profile with agreement accepted
        if (profile?.agreement_accepted === true && profile?.role) {
          toast.success(`Welcome back, ${session.user.email}!`);
          
          // ========== CRITICAL: Redirect based on VIP data ==========
          
          if (pendingPoolSource === 'merkato-vip' && pendingPoolType) {
            console.log('Existing user - redirecting to Merkato VIP');
            localStorage.removeItem('abbaa_vip_pending');
            router.push(`/merkato-seat?type=${pendingPoolType}`);
            return;
          }
          
          if (pendingPoolSource === 'city-vip' && pendingCity && pendingPoolType) {
            console.log('Existing user - redirecting to City VIP');
            localStorage.removeItem('abbaa_vip_pending');
            router.push(`/cities/seat?city=${pendingCity}&type=${pendingPoolType}`);
            return;
          }
          
          const storedRedirect = sessionStorage.getItem('redirectAfterLogin');
          if (storedRedirect && storedRedirect.startsWith('/pools/')) {
            router.push(storedRedirect);
            return;
          }
          
          router.push('/listings');
          return;
        }

        // New user or agreement not accepted
        if (profile && !profile.agreement_accepted && profile.role) {
          if (isMounted) {
            setUserRole(profile.role);
            setShowAgreement(true);
            setLoading(false);
          }
          return;
        }
        
        // Use role from VIP data or default to individual
        if (isMounted) {
          setUserRole(pendingRole || 'individual');
          setShowAgreement(true);
          setLoading(false);
        }
        
      } catch (err) {
        console.error('Callback error:', err);
        if (isMounted) {
          setError(err.message);
          toast.error('Authentication failed');
        }
        setTimeout(() => router.push('/login'), 3000);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    handleCallback();

    return () => {
      isMounted = false;
    };
  }, [router]);

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
