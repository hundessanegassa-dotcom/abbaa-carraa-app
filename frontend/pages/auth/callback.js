import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const router = useRouter();
  const [showAgreement, setShowAgreement] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session after OAuth
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          toast.error('Sign in failed. Please try again.');
          router.push('/register');
          return;
        }

        // Get the stored role from localStorage (set in register.js)
        const pendingRole = localStorage.getItem('pendingRole');
        
        console.log('Pending role from storage:', pendingRole); // Debug log
        
        if (!pendingRole) {
          toast.error('Please select a role first');
          router.push('/register');
          return;
        }

        const user = session.user;
        
        // Check if user profile exists and has accepted agreement
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // If profile exists and agreement is already accepted
        if (existingProfile && existingProfile.agreement_accepted === true) {
          // Clear the pending role
          localStorage.removeItem('pendingRole');
          
          // Redirect to role-specific dashboard
          const dashboards = {
            agent: '/agent/dashboard',
            vendor: '/vendor/dashboard',
            organization: '/organization/dashboard',
            admin: '/admin/dashboard',
            individual: '/dashboard',
          };
          const dashboardPath = dashboards[pendingRole] || '/dashboard';
          router.push(dashboardPath);
          return;
        }

        // Store user data and show agreement modal
        setUserData({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          role: pendingRole,
        });
        
        setShowAgreement(true);
        setLoading(false);
        
      } catch (err) {
        console.error('Callback error:', err);
        toast.error('Something went wrong. Please try again.');
        router.push('/register');
      }
    };

    handleCallback();
  }, [router]);

  const handleAcceptAgreement = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No session found');
      }

      // Create or update profile with agreement accepted
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userData.id,
          email: userData.email,
          full_name: userData.name,
          role: userData.role,
          agreement_accepted: true,
          agreement_accepted_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (upsertError) throw upsertError;

      // Clear the pending role from storage
      localStorage.removeItem('pendingRole');
      
      // Redirect to role-specific dashboard
      const dashboards = {
        agent: '/agent/dashboard',
        vendor: '/vendor/dashboard',
        organization: '/organization/dashboard',
        admin: '/admin/dashboard',
        individual: '/dashboard',
      };
      const dashboardPath = dashboards[userData.role] || '/dashboard';
      
      toast.success('Welcome to Abbaa Carraa!');
      router.push(dashboardPath);
      
    } catch (err) {
      console.error('Accept agreement error:', err);
      toast.error('Failed to save agreement. Please try again.');
      setLoading(false);
    }
  };

  const handleClose = () => {
    localStorage.removeItem('pendingRole');
    router.push('/register');
  };

  if (loading && !showAgreement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Completing sign in...</p>
        </div>
      </div>
    );
  }

  if (showAgreement) {
    return (
      <AgreementModal 
        onAccept={handleAcceptAgreement}
        onClose={handleClose}
      />
    );
  }

  return null;
}

// Agreement Modal Component
function AgreementModal({ onAccept, onClose }) {
  const [agreed, setAgreed] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isAtBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
    }
  };

  const handleDownload = () => {
    const agreementText = `ABBA CARRAA USER AGREEMENT
Last Updated: ${new Date().toLocaleDateString()}

By using ABBA CARRAA, you agree to the following terms:

1. ELIGIBILITY
You must be at least 18 years old to use this platform.

2. USER CONDUCT
- Provide accurate information
- Do not manipulate pools or listings
- Do not create fake accounts
- Respect other users

3. FEES AND COMMISSIONS
- Platform fees apply to all transactions
- Agents earn 10% commission on referrals
- Vendors pay 5% commission on sales

4. POOL RULES
- All pool entries are final
- Winners are selected randomly
- Prizes are distributed within 48 hours

5. ACCOUNT SUSPENSION
We reserve the right to suspend accounts that violate these terms.

For full terms, visit: ${window.location.origin}/terms

By clicking "I Agree", you acknowledge that you have read and understood this agreement.`;

    const blob = new Blob([agreementText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'abba-carraa-agreement.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Terms & Agreement</h2>
          <p className="text-gray-500 mt-1">Please read carefully before continuing</p>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto p-6"
          onScroll={handleScroll}
        >
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold mt-4 first:mt-0">1. Eligibility</h3>
            <p>You must be at least 18 years old to use Abbaa Carraa. By registering, you confirm that you meet this requirement.</p>
            
            <h3 className="text-lg font-semibold mt-4">2. Account Responsibility</h3>
            <p>You are responsible for maintaining the security of your account and for all activities that occur under your account.</p>
            
            <h3 className="text-lg font-semibold mt-4">3. Prohibited Activities</h3>
            <p>You may not manipulate pools, create fake entries, exploit bugs, or engage in any fraudulent activity.</p>
            
            <h3 className="text-lg font-semibold mt-4">4. Fees and Payments</h3>
            <p>Platform fees apply to all transactions. Agents earn 10% commission on referred user activity. Vendors pay 5% commission on sales.</p>
            
            <h3 className="text-lg font-semibold mt-4">5. Pool Participation</h3>
            <p>All pool entries are final and non-refundable. Winners are selected randomly using a verifiable system. Prizes are distributed within 48 hours of pool completion.</p>
            
            <h3 className="text-lg font-semibold mt-4">6. Privacy</h3>
            <p>Your data is handled according to our Privacy Policy. We do not sell your personal information to third parties.</p>
            
            <h3 className="text-lg font-semibold mt-4">7. Termination</h3>
            <p>We reserve the right to suspend or terminate accounts that violate these terms, with or without notice.</p>
            
            <h3 className="text-lg font-semibold mt-4">8. Limitation of Liability</h3>
            <p>Abbaa Carraa is not liable for any indirect, incidental, or consequential damages arising from your use of the platform.</p>
          </div>
        </div>
        
        <div className="p-6 border-t">
          <button
            onClick={handleDownload}
            className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1 mb-4"
          >
            📄 Download Agreement (TXT)
          </button>
          
          <label className="flex items-start gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              disabled={!scrolledToBottom}
              className="w-5 h-5 mt-0.5 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className={!scrolledToBottom ? 'text-gray-400' : 'text-gray-700'}>
              I have read and agree to the Terms and Conditions
              {!scrolledToBottom && <span className="text-xs text-gray-400 block">(Please scroll to the bottom to enable)</span>}
            </span>
          </label>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={onAccept}
              disabled={!agreed}
              className={`flex-1 px-4 py-2 rounded-lg transition ${
                agreed 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              I Agree & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
