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

      // Update profile with agreement acceptance
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          agreement_accepted: true,
          agreement_accepted_at: new Date().toISOString(),
          agreement_type: role,
          can_create_pool: role !== 'individual', // Only non-individual can create pools
          role: role === 'individual' ? 'user' : role
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Record acceptance in legal_acceptances table
      const { error: legalError } = await supabase
        .from('legal_acceptances')
        .insert({
          user_id: user.id,
          agreement_type: role,
          version: '1.0.0',
          ip_address: '',
          user_agent: navigator.userAgent,
          signature_type: 'checkbox'
        });

      if (legalError) console.error('Legal acceptance error:', legalError);

      toast.success(`Agreement accepted! Welcome as ${role}.`);
      if (onAccept) onAccept();
    } catch (error) {
      console.error('Acceptance error:', error);
      toast.error('Failed to accept agreement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = () => {
    toast.error('You must accept the agreement to continue');
    if (onDecline) onDecline();
  };

  const roleTitles = {
    individual: 'Individual Participant Agreement',
    agent: 'Agent Agreement',
    vendor: 'Vendor Agreement',
    organization: 'Organization Pool Creator Agreement',
    admin: 'Admin Agreement'
  };

  const roleColors = {
    individual: 'from-green-500 to-teal-500',
    agent: 'from-yellow-500 to-orange-500',
    vendor: 'from-purple-500 to-pink-500',
    organization: 'from-blue-500 to-cyan-500',
    admin: 'from-red-500 to-rose-500'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className={`bg-gradient-to-r ${roleColors[role]} p-6 rounded-t-2xl text-white`}>
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">{roleTitles[role]}</h2>
            <button onClick={handleDecline} className="text-white/80 hover:text-white">✕</button>
          </div>
          <p className="text-sm opacity-90 mt-1">Last Updated: May 2026 | Version 1.0.0</p>
        </div>

        {/* Agreement Content */}
        <div className="flex-1 overflow-y-auto p-6" onScroll={handleScroll}>
          
          {/* INDIVIDUAL AGREEMENT */}
          {role === 'individual' && (
            <div className="space-y-4 text-gray-700">
              <h3 className="text-lg font-bold text-gray-900">1. PARTICIPATION TERMS</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="font-semibold">How It Works:</p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Choose a prize pool you want to join</li>
                  <li>Make a contribution (minimum varies by pool)</li>
                  <li>Get your ticket number(s)</li>
                  <li>Wait for the live draw</li>
                  <li>Winner announced - you could win amazing prizes!</li>
                </ul>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mt-4">2. CONTRIBUTION & CHARITY</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>💰 <strong>2% of every contribution</strong> supports Ethiopians fighting kidney & heart disease</li>
                <li>Contributions are final and non-refundable</li>
                <li>Minimum contribution amount set by pool creator</li>
                <li>Maximum contribution per pool: 100,000 ETB</li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mt-4">3. WINNER SELECTION</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Draws are conducted live and transparently</li>
                <li>Winners selected using blockchain-verified random algorithm</li>
                <li>Winner announced on platform and notified via SMS/Email</li>
                <li>Prizes delivered within 14 days of draw</li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mt-4">4. YOUR RIGHTS</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>14-day cooling-off period for first-time contributors</li>
                <li>Right to dispute resolution through platform mediation</li>
                <li>View all your contributions and tickets in dashboard</li>
                <li>Earn badges for participation and wins</li>
              </ul>

              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  💚 <strong>Every Contribution Saves a Life:</strong> 2% of all contributions go directly to support 
                  Ethiopians fighting kidney disease and heart disease. Together, we make a difference!
                </p>
              </div>
            </div>
          )}

          {/* AGENT AGREEMENT */}
          {role === 'agent' && (
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
                <li>TIN (Tax Identification Number) required for payouts above 10,000 ETB</li>
                <li>Annual tax certificate provided for your records</li>
                <li>You are responsible for declaring commission income to Ethiopian tax authorities</li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mt-4">4. LEGAL COMPLIANCE</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Platform complies with Ethiopian Financial Intelligence Center regulations</li>
                <li>Anti-money laundering checks on all transactions above 50,000 ETB</li>
                <li>Identity verification required for first-time pool creators</li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mt-4">5. PRIZE DELIVERY</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Deliver physical prize to winner within 14 days of draw</li>
                <li>If prize unavailable, provide cash equivalent of target amount</li>
                <li>Failure to deliver = commission forfeited + account suspension</li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mt-4">6. DISPUTE RESOLUTION</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>First: Platform mediation (contact support@abbaacarraa.com)</li>
                <li>Second: Arbitration in Addis Ababa</li>
                <li>Third: Federal Court of Ethiopia</li>
                <li>Governing Law: Federal Democratic Republic of Ethiopia</li>
              </ul>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  💚 <strong>Charity Contribution:</strong> 2% of all platform income (including your commission) 
                  supports kidney and heart disease treatment in Ethiopia.
                </p>
              </div>
            </div>
          )}

          {/* VENDOR AGREEMENT */}
          {role === 'vendor' && (
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

              <h3 className="text-lg font-bold text-gray-900 mt-4">2. PRODUCT REQUIREMENTS</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Products must be accurately described (no misleading information)</li>
                <li>Products must be legal and in good condition</li>
                <li>You may offer discounts (5-50%) to non-winners</li>
                <li>Real product images required for listing</li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mt-4">3. DELIVERY OBLIGATION</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Deliver product to winner within 14 days of draw</li>
                <li>If product unavailable, provide cash equivalent of target amount</li>
                <li>Provide delivery tracking information</li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mt-4">4. QUALITY GUARANTEE</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Products must match description</li>
                <li>Winner can reject damaged/incorrect items within 7 days</li>
                <li>You must replace or refund within 14 days</li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mt-4">5. TAX & LEGAL</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>5% withholding tax deducted from commission</li>
                <li>TIN required for payouts above 10,000 ETB</li>
                <li>Must provide business license for large payouts</li>
                <li>Compliance with Ethiopian Consumer Protection Law</li>
              </ul>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  💚 <strong>Charity Contribution:</strong> 2% of all platform income supports kidney and heart disease treatment.
                </p>
              </div>
            </div>
          )}

          {/* ORGANIZATION AGREEMENT */}
          {role === 'organization' && (
            <div className="space-y-4 text-gray-700">
              <h3 className="text-lg font-bold text-gray-900">1. COMMISSION STRUCTURE</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">Example Calculation:</p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Winner Gets (Target): 500,000 ETB</li>
                  <li>Commission (20% of target): 100,000 ETB</li>
                  <li>Total Collection: 600,000 ETB</li>
                  <li>Commission paid to individual creator (you), NOT to organization</li>
                  <li className="text-green-600 font-semibold">Your Commission (10% of target): 50,000 ETB</li>
                </ul>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mt-4">2. PRIVATE POOLS</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Create private pools visible only to organization members</li>
                <li>Members must be verified by organization</li>
                <li>Pools cannot be shared publicly</li>
                <li>Member list managed by you</li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mt-4">3. YOUR RESPONSIBILITIES</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Verify member eligibility</li>
                <li>Ensure members are aware of pool terms</li>
                <li>Handle prize delivery or cash equivalent</li>
                <li>Maintain member privacy</li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mt-4">4. MEMBER PRIVACY</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Member data protected per Privacy Policy</li>
                <li>Cannot share member information with third parties</li>
                <li>Data breaches must be reported within 24 hours</li>
              </ul>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  💚 <strong>Charity Contribution:</strong> 2% of all platform income supports kidney and heart disease treatment.
                </p>
              </div>
            </div>
          )}

          {/* ADMIN AGREEMENT */}
          {role === 'admin' && (
            <div className="space-y-4 text-gray-700">
              <h3 className="text-lg font-bold text-gray-900">1. COMMISSION STRUCTURE</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold">Example Calculation:</p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Winner Gets (Target): 500,000 ETB</li>
                  <li>Commission (20% of target): 100,000 ETB</li>
                  <li>Total Collection: 600,000 ETB</li>
                  <li className="text-green-600 font-semibold">Your Commission (20% of target): 100,000 ETB</li>
                  <li>Platform Commission: 0 ETB (Admin keeps full commission)</li>
                </ul>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mt-4">2. SPECIAL PRIVILEGES</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Priority support and featured listing</li>
                <li>Create system-wide announcements</li>
                <li>Access to all platform analytics</li>
                <li>Ability to verify agents/vendors</li>
                <li>Create featured pools that appear on homepage</li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mt-4">3. OVERSIGHT RESPONSIBILITIES</h3>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Ensure fair and transparent draws</li>
                <li>Verify agent/vendor applications</li>
                <li>Maintain platform integrity</li>
                <li>Respond to user disputes</li>
                <li>Manage charity funds (2% for health)</li>
              </ul>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  💚 <strong>Charity Oversight:</strong> Admin is responsible for ensuring 2% of all income 
                  goes to the kidney and heart disease treatment fund.
                </p>
              </div>
            </div>
          )}

          {/* Common Legal Notice */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚖️ <strong>Legal Notice:</strong> This agreement is governed by the laws of the Federal Democratic Republic of Ethiopia. 
              By accepting, you agree to binding arbitration in Addis Ababa. All funds are held in trust at Commercial Bank of Ethiopia.
            </p>
          </div>
        </div>

        {/* Footer with Accept Button */}
        <div className="border-t p-6 bg-gray-50 rounded-b-2xl">
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-gray-700">
              I have read and agree to the <span className="font-semibold">{roleTitles[role]}</span>
            </span>
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
