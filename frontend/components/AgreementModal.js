import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function AgreementModal({ isOpen, onAccept, onClose, userId, userEmail, userRole }) {
  const [hasScrolled, setHasScrolled] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e) => {
    const element = e.target;
    const isAtBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 10;
    if (isAtBottom && !hasScrolled) {
      setHasScrolled(true);
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

6. PRIVACY
Your data is handled according to our Privacy Policy. We do not sell your personal information.

7. LIMITATION OF LIABILITY
Abbaa Carraa is not liable for any indirect, incidental, or consequential damages.

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
    toast.success('Agreement downloaded');
  };

  const handleAccept = async () => {
    if (!agreed) {
      toast.error('Please scroll to the bottom and agree to the terms');
      return;
    }

    setSaving(true);
    
    try {
      // Get current session to ensure we have the user
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session) {
        toast.error('Please sign in again');
        window.location.href = '/register';
        return;
      }

      const currentUserId = session.user.id;
      
      // Update profile with agreement acceptance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          agreement_accepted: true,
          agreement_accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          role: userRole || 'individual'
        })
        .eq('id', currentUserId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw new Error(updateError.message);
      }

      // Also update user_type if needed
      const { error: typeError } = await supabase
        .from('profiles')
        .update({ user_type: userRole || 'individual' })
        .eq('id', currentUserId);

      if (typeError) {
        console.warn('User type update warning:', typeError);
      }

      toast.success('Agreement accepted! Redirecting...');
      
      // Clear stored role
      localStorage.removeItem('pendingRole');
      sessionStorage.removeItem('pendingRole');
      
      // Redirect to appropriate dashboard
      const dashboards = {
        agent: '/agent/dashboard',
        vendor: '/vendor/dashboard',
        organization: '/organization/dashboard',
        admin: '/admin/dashboard',
        individual: '/dashboard'
      };
      
      const dashboardPath = dashboards[userRole] || '/dashboard';
      setTimeout(() => {
        window.location.href = dashboardPath;
      }, 1000);
      
    } catch (err) {
      console.error('Save agreement error:', err);
      toast.error('Failed to save agreement: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Terms & Agreement</h2>
          <p className="text-gray-500 mt-1">Please read carefully before continuing</p>
          <p className="text-sm text-gray-400 mt-1">Role: <span className="font-semibold text-green-600 capitalize">{userRole || 'Individual'}</span></p>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-4"
          onScroll={handleScroll}
        >
          <div className="prose max-w-none">
            <h3 className="text-lg font-semibold mt-4 first:mt-0">1. Introduction</h3>
            <p>Welcome to Abbaa Carraa. By using our platform, you agree to these terms.</p>
            
            <h3 className="text-lg font-semibold mt-4">2. Eligibility</h3>
            <p>You must be at least 18 years old to use this platform.</p>
            
            <h3 className="text-lg font-semibold mt-4">3. Your Role</h3>
            <p>You are registering as a <strong className="capitalize">{userRole || 'Individual'}</strong>. Your responsibilities and benefits are defined based on this role.</p>
            
            <h3 className="text-lg font-semibold mt-4">4. Platform Fees</h3>
            <p>Platform fees apply to all transactions as displayed. Agents earn 10% commission. Vendors pay 5% commission.</p>
            
            <h3 className="text-lg font-semibold mt-4">5. Prohibited Activities</h3>
            <p>Fraud, manipulation, or abuse of the platform is strictly prohibited.</p>
            
            <h3 className="text-lg font-semibold mt-4">6. Privacy</h3>
            <p>Your data is handled according to our Privacy Policy.</p>
            
            <h3 className="text-lg font-semibold mt-4">7. Termination</h3>
            <p>We reserve the right to suspend accounts violating these terms.</p>
            
            <h3 className="text-lg font-semibold mt-4">8. Limitation of Liability</h3>
            <p>Abbaa Carraa is not liable for indirect or consequential damages.</p>
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
              disabled={!hasScrolled}
              className="w-5 h-5 mt-0.5 cursor-pointer disabled:cursor-not-allowed"
            />
            <span className={!hasScrolled ? 'text-gray-400' : 'text-gray-700'}>
              I have read and agree to the Terms and Conditions
              {!hasScrolled && <span className="text-xs text-gray-400 block">(Please scroll to the bottom to enable)</span>}
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
              onClick={handleAccept}
              disabled={!agreed || saving}
              className={`flex-1 px-4 py-2 rounded-lg transition ${
                agreed && !saving
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {saving ? 'Saving...' : 'I Agree & Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
