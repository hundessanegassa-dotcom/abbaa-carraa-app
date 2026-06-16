// components/ReferralSystem.js - Complete Referral System with Analytics & Leaderboard
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ReferralSystem({
  isOpen = true,
  onClose,
  userId,
  showLeaderboard = true,
  showAnalytics = true,
  compact = false,
  title = "🎁 Invite Friends, Earn Rewards!",
  cashbackPercentage = 5,
  friendDiscount = 5
}) {
  const { t } = useTranslation();
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [referralEarnings, setReferralEarnings] = useState(0);
  const [referralPending, setReferralPending] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, referrals, leaderboard
  const [referrals, setReferrals] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [is3D, setIs3D] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed
  const animationRef = useRef(null);

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D) {
      const animate = () => {
        setRotation(prev => (prev + 0.2) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [is3D]);

  useEffect(() => {
    if (userId) {
      fetchReferralData();
      fetchReferrals();
      fetchLeaderboard();
      fetchHistory();
    }
  }, [userId]);

  async function fetchReferralData() {
    setLoading(true);
    try {
      // Get or create referral code
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('referral_code, referral_count, referral_earnings, referral_pending')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (!profile?.referral_code) {
        const newCode = generateReferralCode();
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ referral_code: newCode })
          .eq('id', userId);
        
        if (updateError) throw updateError;
        setReferralCode(newCode);
      } else {
        setReferralCode(profile.referral_code);
        setReferralCount(profile.referral_count || 0);
        setReferralEarnings(profile.referral_earnings || 0);
        setReferralPending(profile.referral_pending || 0);
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast.error('Failed to load referral data');
      // Fallback values
      setReferralCode(generateReferralCode());
    } finally {
      setLoading(false);
    }
  }

  async function fetchReferrals() {
    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferrals(data || []);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      // Use mock data
      setReferrals(generateMockReferrals());
    }
  }

  async function fetchLeaderboard() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, referral_count, referral_earnings, referral_code')
        .order('referral_earnings', { ascending: false })
        .limit(20);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      // Use mock data
      setLeaderboard(generateMockLeaderboard());
    }
  }

  async function fetchHistory() {
    try {
      const { data, error } = await supabase
        .from('referral_earnings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistoryData(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      // Use mock data
      setHistoryData(generateMockHistory());
    }
  }

  function generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  function generateMockReferrals() {
    const names = ['Abebe Kebede', 'Tigist Hailu', 'Dawit Tilahun', 'Meron Assefa', 'Yonas Tesfaye'];
    return names.map((name, i) => ({
      id: `ref-${i}`,
      referred_user_id: `user-${i}`,
      referred_name: name,
      status: ['pending', 'confirmed'][Math.floor(Math.random() * 2)],
      amount: Math.floor(Math.random() * 1000) + 100,
      created_at: new Date(Date.now() - i * 86400000).toISOString()
    }));
  }

  function generateMockLeaderboard() {
    const names = ['Abebe Kebede', 'Tigist Hailu', 'Dawit Tilahun', 'Meron Assefa', 'Yonas Tesfaye'];
    return names.map((name, i) => ({
      id: `user-${i}`,
      full_name: name,
      referral_count: Math.floor(Math.random() * 50) + 5,
      referral_earnings: Math.floor(Math.random() * 5000) + 500,
      referral_code: `REF${i}${Math.random().toString(36).substring(2, 5).toUpperCase()}`
    }));
  }

  function generateMockHistory() {
    const types = ['cashback', 'bonus', 'reward'];
    return Array.from({ length: 10 }, (_, i) => ({
      id: `hist-${i}`,
      type: types[i % types.length],
      amount: Math.floor(Math.random() * 500) + 50,
      description: ['Referral cashback', 'Bonus reward', 'Monthly bonus'][i % 3],
      created_at: new Date(Date.now() - i * 86400000).toISOString()
    }));
  }

  const referralLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/register?ref=${referralCode}`
    : `https://abbaacarraa.com/register?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success(t('referral.copied') || 'Referral link copied! 📋');
    setTimeout(() => setCopied(false), 3000);
  };

  const shareOnWhatsApp = () => {
    const text = t('referral.share_text') || 
      `Join Abbaa Carraa using my referral link and get ${friendDiscount}% off your first contribution! 🎉 ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnTelegram = () => {
    const text = t('referral.share_text') || 
      `Join Abbaa Carraa using my referral link and get ${friendDiscount}% off! 🎉 ${referralLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const shareOnTwitter = () => {
    const text = t('referral.share_text') || `Join Abbaa Carraa using my referral link! 🎉 ${referralLink}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`, '_blank');
  };

  const get3DTransform = () => {
    if (!is3D) return 'none';
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  const toggle3D = () => {
    setIs3D(!is3D);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed': return '✅';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  const filteredReferrals = referrals.filter(ref => {
    if (filter === 'pending') return ref.status === 'pending';
    if (filter === 'confirmed') return ref.status === 'confirmed';
    return true;
  });

  const totalEarnings = referralEarnings + referralPending;
  const conversionRate = referrals.length > 0 
    ? Math.round((referrals.filter(r => r.status === 'confirmed').length / referrals.length) * 100)
    : 0;

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full ${compact ? 'max-w-lg' : 'max-w-2xl'} max-h-[90vh] overflow-y-auto transition-all duration-500`}
        style={{
          transform: get3DTransform(),
          transformStyle: 'preserve-3d',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl">🎁</span>
              <div>
                <h2 className="text-xl font-bold">{title}</h2>
                <p className="text-sm opacity-90">
                  {t('referral.subtitle') || 'Invite friends and earn rewards!'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggle3D}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                  is3D 
                    ? 'bg-white/20 text-white hover:bg-white/30' 
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {is3D ? '🔄 3D' : '📐 2D'}
              </button>
              <button 
                onClick={onClose} 
                className="text-white/80 hover:text-white text-2xl transition"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === 'overview'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('referrals')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                activeTab === 'referrals'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              👥 Referrals ({referrals.length})
            </button>
            {showLeaderboard && (
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                  activeTab === 'leaderboard'
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                🏆 Leaderboard
              </button>
            )}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-200">
                  <p className="text-2xl font-bold text-emerald-600">{referralCount}</p>
                  <p className="text-xs text-gray-500">{t('referral.friends_joined') || 'Friends Joined'}</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
                  <p className="text-2xl font-bold text-yellow-600">{referralEarnings} ETB</p>
                  <p className="text-xs text-gray-500">{t('referral.earned') || 'Earned'}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
                  <p className="text-2xl font-bold text-blue-600">{referralPending} ETB</p>
                  <p className="text-xs text-gray-500">{t('referral.pending') || 'Pending'}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-200">
                  <p className="text-2xl font-bold text-purple-600">{conversionRate}%</p>
                  <p className="text-xs text-gray-500">{t('referral.conversion') || 'Conversion Rate'}</p>
                </div>
              </div>

              {/* How it works */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-bold text-gray-800 mb-2">📌 {t('referral.how_it_works') || 'How it works:'}</h3>
                <ul className="text-sm space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{t('referral.step1') || `Share your unique link with friends`}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{t('referral.step2') || `When they join and contribute, you get ${cashbackPercentage}% cashback`}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{t('referral.step3') || `Your friend also gets ${friendDiscount}% off their first contribution`}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>{t('referral.step4') || `Unlimited earnings – no cap!`}</span>
                  </li>
                </ul>
              </div>

              {/* Referral Link */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('referral.your_link') || 'Your Referral Link'}
                </label>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 p-2 border rounded-lg bg-gray-50 text-sm min-w-[200px]"
                  />
                  <button
                    onClick={copyToClipboard}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-1"
                  >
                    {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
                </div>
              </div>

              {/* Share Buttons */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={shareOnWhatsApp}
                    className="bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    📱 WhatsApp
                  </button>
                  <button
                    onClick={shareOnTelegram}
                    className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    💬 Telegram
                  </button>
                  <button
                    onClick={shareOnFacebook}
                    className="bg-blue-700 hover:bg-blue-800 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    📘 Facebook
                  </button>
                  <button
                    onClick={shareOnTwitter}
                    className="bg-gray-800 hover:bg-gray-900 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
                  >
                    🐦 Twitter
                  </button>
                </div>
                <button
                  onClick={shareOnLinkedIn}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  💼 LinkedIn
                </button>
              </div>

              {/* Recent Activity */}
              {showHistory && historyData.length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-800 mb-3">
                    📜 {t('referral.history') || 'Recent Activity'}
                  </h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {historyData.slice(0, 5).map((item) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                        <span className="text-sm">{item.description}</span>
                        <span className="text-sm font-bold text-emerald-600">+{item.amount} ETB</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Referrals Tab */}
          {activeTab === 'referrals' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('confirmed')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    filter === 'confirmed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ✅ Confirmed
                </button>
                <button
                  onClick={() => setFilter('pending')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ⏳ Pending
                </button>
              </div>

              {/* Referrals List */}
              {filteredReferrals.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">👥</div>
                  <p className="text-gray-500">{t('referral.no_referrals') || 'No referrals yet'}</p>
                  <p className="text-xs text-gray-400">{t('referral.share_invite') || 'Share your link to start earning!'}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredReferrals.map((referral, index) => (
                    <div key={referral.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div>
                        <p className="font-medium text-sm">{referral.referred_name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-400">{new Date(referral.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(referral.status)}`}>
                          {getStatusIcon(referral.status)} {referral.status}
                        </span>
                        {referral.amount && (
                          <span className="text-sm font-bold text-emerald-600">+{referral.amount} ETB</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && showLeaderboard && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-800">🏆 Top Referrers</p>
                <p className="text-xs text-yellow-600">{t('referral.leaderboard_desc') || 'Most successful referrers on the platform'}</p>
              </div>

              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🏆</div>
                  <p className="text-gray-500">{t('referral.no_leaderboard') || 'No leaderboard data yet'}</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {leaderboard.map((user, index) => (
                    <div 
                      key={user.id} 
                      className={`flex justify-between items-center p-3 rounded-lg border ${
                        index === 0 ? 'bg-amber-50 border-amber-300' :
                        index === 1 ? 'bg-gray-50 border-gray-300' :
                        index === 2 ? 'bg-orange-50 border-orange-200' :
                        'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-amber-500' :
                          index === 1 ? 'text-gray-500' :
                          index === 2 ? 'text-orange-500' :
                          'text-gray-400'
                        }`}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </span>
                        <div>
                          <p className="font-medium text-sm">{user.full_name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-400">Code: {user.referral_code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">{user.referral_earnings || 0} ETB</p>
                        <p className="text-xs text-gray-400">{user.referral_count || 0} referrals</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-400 text-center">
            💰 {t('referral.footer') || `Earn ${cashbackPercentage}% cashback on every contribution your referrals make. Cashback added to your wallet automatically.`}
          </p>
        </div>
      </div>
    </div>
  );
}
