import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function ReferralModal({ isOpen, onClose, userId }) {
  const { t } = useTranslation();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchReferralData();
    }
  }, [isOpen, userId]);

  async function fetchReferralData() {
    // Get or create referral code
    let { data: profile } = await supabase
      .from('profiles')
      .select('referral_code, referral_count, referral_earnings')
      .eq('id', userId)
      .single();

    if (!profile?.referral_code) {
      const newCode = generateReferralCode();
      await supabase
        .from('profiles')
        .update({ referral_code: newCode })
        .eq('id', userId);
      setReferralCode(newCode);
    } else {
      setReferralCode(profile.referral_code);
      setReferralCount(profile.referral_count || 0);
      setReferralEarnings(profile.referral_earnings || 0);
    }
  }

  function generateReferralCode() {
    return userId.slice(0, 8).toUpperCase();
  }

  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `Join Abbaa Carraa using my referral link and get 5% cashback on your first contribution! ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnTelegram = () => {
    const text = `Join Abbaa Carraa using my referral link and get 5% cashback! ${referralLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-600">🎁 Invite Friends, Earn Rewards!</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{referralCount}</p>
              <p className="text-xs text-gray-500">Friends Joined</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{referralEarnings} ETB</p>
              <p className="text-xs text-gray-500">Earned</p>
            </div>
          </div>

          {/* How it works */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-bold mb-2">📌 How it works:</h3>
            <ul className="text-sm space-y-1 text-gray-700">
              <li>✓ Share your unique link with friends</li>
              <li>✓ When they join and contribute, you get <strong className="text-green-600">5% cashback</strong></li>
              <li>✓ Your friend also gets <strong className="text-green-600">5% off</strong> their first contribution</li>
              <li>✓ Unlimited earnings – no cap!</li>
            </ul>
          </div>

          {/* Referral Link */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Your Referral Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 p-2 border rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Share Buttons */}
          <div className="space-y-2">
            <button
              onClick={shareOnWhatsApp}
              className="w-full bg-green-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600"
            >
              📱 Share on WhatsApp
            </button>
            <button
              onClick={shareOnTelegram}
              className="w-full bg-blue-500 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600"
            >
              💬 Share on Telegram
            </button>
            <button
              onClick={shareOnFacebook}
              className="w-full bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-800"
            >
              📘 Share on Facebook
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            Earn 5% cashback on every contribution your referrals make. Cashback added to your wallet automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
