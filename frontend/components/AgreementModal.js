import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function AgreementModal({ role, onAccept, onDecline }) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = (e) => {
    const element = e.target;
    const isBottom = Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
    if (isBottom) {
      setScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!accepted || !scrolledToBottom) {
      toast.error('Please read the entire agreement and check "I Agree"');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('User not found');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          agreement_accepted: true,
          agreement_accepted_at: new Date().toISOString(),
          agreement_type: role,
          can_create_pool: true
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      const { error: legalError } = await supabase
        .from('legal_acceptances')
        .insert({
          user_id: user.id,
          agreement_type: role,
          version: '1.0',
          ip_address: '',
          user_agent: navigator.userAgent,
          signature_type: 'checkbox'
        });

      if (legalError) console.error('Legal acceptance error:', legalError);

      toast.success('Agreement accepted! You can now create pools.');
      if (onAccept) onAccept();
    } catch (error) {
      console.error('Acceptance error:', error);
      toast.error('Failed to accept agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    toast.error('You must accept the agreement to create pools');
    if (onDecline) onDecline();
  };

  const roleTitles = {
    agent: 'Agent Agreement',
    vendor: 'Vendor Agreement',
    organization: 'Organization Pool Creator Agreement',
    admin: 'Admin Agreement'
  };

  const roleColors = {
    agent: 'from-yellow-500 to-orange-500',
    vendor: 'from-purple-500 to-pink-500',
    organization: 'from-blue-500 to-cyan-500',
    admin: 'from-red-500 to-rose-500'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        <div className={`bg-gradient-to-r ${roleColors[role]} p-6 rounded-t-2xl text-white`}>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{roleTitles[role]}</h2>
            <button onClick={handleDecline} className="text-white/80 hover:text-white">✕</button>
          </div>
          <p className="text-sm opacity-90 mt-1">Last Updated: May 2026</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6" onScroll={handleScroll}>
          <div className="space-y-4 text-gray-700">
            <h3 className="text-lg font-bold text-gray-900">1. COMMISSION STRUCTURE</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="font-semibold">Example Calculation:</p>
              <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                <li>Winner Gets (Target): 500,000 ETB</li>
                <li>Commission (20% of target): 100,000 ETB</li>
                <li>Total Collection: 600,000 ETB</li>
                <li className="text-green-600 font-semibold">Your Commission (10% of target): 50,000 ETB</li>
                <li>Platform Commission (10% of target): 50,000 ETB</li>
              </ul>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mt-4">2. PAYMENT FLOW</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>All contributions deposited to Abbaa Carraa's CBE trust account</li>
              <li>Commission paid AFTER winner receives prize</li>
              <li>Payout within 14 days of winner confirmation</li>
              <li>Minimum payout: 1,000 ETB</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 mt-4">3. TAX OBLIGATIONS</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>5% withholding tax deducted at source as per Ethiopian tax law</li>
              <li>TIN required for payouts above 10,000 ETB</li>
              <li>Annual tax certificate provided</li>
            </ul>

            <h3 className="text-lg font-bold text-gray-900 mt-4">4. LEGAL COMPLIANCE</h3>
            <ul className="list-disc list-inside text-sm space-y-1">
              <li>Platform complies with Ethiopian Financial Intelligence Center regulations</li>
              <li>Anti-money laundering checks on all transactions above 50,000 ETB</li>
              <li>Identity verification required for first-time pool creators</li>
            </ul>

            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                ⚖️ <strong>Legal Notice:</strong> This agreement is governed by the laws of the Federal Democratic Republic of Ethiopia. 
                By accepting, you agree to binding arbitration in Addis Ababa.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t p-6 bg-gray-50 rounded-b-2xl">
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-gray-700">I have read and agree to the {roleTitles[role]}</span>
          </label>

          <div className="flex gap-3">
            <button
              onClick={handleAccept}
              disabled={!accepted || !scrolledToBottom || loading}
              className="flex-1 bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Processing...' : '✓ I Agree & Continue'}
            </button>
            <button
              onClick={handleDecline}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
            >
              Decline
            </button>
          </div>

          {!scrolledToBottom && (
            <p className="text-xs text-gray-400 text-center mt-3">
              📜 Please scroll to the bottom to read the full agreement
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
