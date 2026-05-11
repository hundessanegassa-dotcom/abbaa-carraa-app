import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function WinnerModal({ poolId, isOpen, onClose }) {
  const { t } = useTranslation();
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawDetails, setDrawDetails] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && poolId) {
      fetchWinner();
    }
  }, [isOpen, poolId]);

  async function fetchWinner() {
    setLoading(true);
    try {
      // Fetch pool with winner info
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .select(`
          id,
          prize_name,
          target_amount,
          winner_id,
          profiles!winner_id (full_name, email, phone)
        `)
        .eq('id', poolId)
        .maybeSingle();

      if (poolError) throw poolError;

      // Fetch draw details
      const { data: draw, error: drawError } = await supabase
        .from('draws')
        .select('*')
        .eq('pool_id', poolId)
        .maybeSingle();

      if (drawError && drawError.code !== 'PGRST116') throw drawError;

      setWinner(pool);
      setDrawDetails(draw);
    } catch (error) {
      console.error('Error fetching winner:', error);
    } finally {
      setLoading(false);
    }
  }

  // Share Functions
  const shareOnWhatsApp = () => {
    const shareUrl = window.location.href;
    const winnerName = winner?.profiles?.full_name || 'Winner';
    const prizeName = winner?.prize_name || 'Prize';
    const prizeAmount = winner?.target_amount?.toLocaleString() || '0';
    
    const message = `🎉 *WINNER ANNOUNCEMENT!* 🎉\n\n` +
                    `🏆 *Congratulations to ${winnerName}!*\n\n` +
                    `They won the *${prizeName}* prize!\n` +
                    `💰 *Prize Value:* ETB ${prizeAmount}\n\n` +
                    `💚 *Abbaa Carraa Ethio* - Win amazing prizes while 2% supports kidney & heart disease treatment.\n\n` +
                    `👉 Join us: ${shareUrl}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setShowShareMenu(false);
    toast.success('Opening WhatsApp...');
  };

  const shareOnTelegram = () => {
    const shareUrl = window.location.href;
    const winnerName = winner?.profiles?.full_name || 'Winner';
    const prizeName = winner?.prize_name || 'Prize';
    const prizeAmount = winner?.target_amount?.toLocaleString() || '0';
    
    const message = `🎉 *WINNER ANNOUNCEMENT!* 🎉\n\n` +
                    `🏆 *Congratulations to ${winnerName}!*\n\n` +
                    `They won the *${prizeName}* prize!\n` +
                    `💰 *Prize Value:* ETB ${prizeAmount}\n\n` +
                    `💚 *Abbaa Carraa Ethio* - Win amazing prizes while 2% supports kidney & heart disease treatment.\n\n` +
                    `👉 Join us: ${shareUrl}`;
    
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`, '_blank');
    setShowShareMenu(false);
    toast.success('Opening Telegram...');
  };

  const shareOnFacebook = () => {
    const shareUrl = window.location.href;
    const winnerName = winner?.profiles?.full_name || 'Winner';
    const prizeName = winner?.prize_name || 'Prize';
    
    const message = `🎉 WINNER ANNOUNCEMENT! 🎉\n\n🏆 Congratulations to ${winnerName}!\nThey won the ${prizeName} prize!\n\nJoin Abbaa Carraa Ethio to win amazing prizes while 2% supports health.`;
    
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(message)}`, '_blank');
    setShowShareMenu(false);
  };

  const copyLink = () => {
    const shareUrl = window.location.href;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied! Share with friends.');
    setTimeout(() => setCopied(false), 2000);
    setShowShareMenu(false);
  };

  const shareNative = async () => {
    const shareUrl = window.location.href;
    const winnerName = winner?.profiles?.full_name || 'Winner';
    const prizeName = winner?.prize_name || 'Prize';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Winner Announcement!',
          text: `🎉 Congratulations to ${winnerName} for winning ${prizeName}! Join Abbaa Carraa Ethio to win amazing prizes.`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      setShowShareMenu(true);
    }
    setShowShareMenu(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-600">
              🏆 {t('draw.winner_announced') || 'Winner Announced!'}
            </h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              ✕
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">{t('common.loading')}</p>
            </div>
          ) : winner ? (
            <div className="space-y-4">
              {/* Winner Badge */}
              <div className="text-center py-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl">
                <div className="text-5xl mb-2 animate-bounce">🎉</div>
                <p className="text-sm text-gray-600">{t('draw.congratulations') || 'Congratulations!'}</p>
                <p className="text-xl font-bold text-green-700">
                  {winner.profiles?.full_name || 'Anonymous Winner'}
                </p>
                {winner.profiles?.phone && (
                  <p className="text-xs text-gray-500 mt-1">📞 {winner.profiles.phone}</p>
                )}
              </div>

              {/* Prize Info */}
              <div className="border rounded-xl p-4 bg-gray-50">
                <p className="text-sm text-gray-500">{t('pools.winner_gets') || '🏆 Winner Gets'}</p>
                <p className="font-bold text-lg">{winner.prize_name}</p>
                <p className="text-sm text-green-600 font-semibold">ETB {winner.target_amount?.toLocaleString()}</p>
              </div>

              {/* Cryptographic Proof */}
              {drawDetails && (
                <div className="border rounded-xl p-4 bg-gray-50">
                  <h3 className="font-bold mb-2 text-sm">🔐 {t('draw.verified_draw') || 'Verification Details'}</h3>
                  <div className="space-y-1 text-xs">
                    <p><span className="text-gray-500">{t('draw.random_seed') || 'Random Seed'}:</span> <code className="text-xs break-all">{drawDetails.random_seed?.slice(0, 20)}...</code></p>
                    <p><span className="text-gray-500">{t('draw.ticket_count') || 'Total Tickets'}:</span> {drawDetails.ticket_count}</p>
                    <p><span className="text-gray-500">{t('draw.draw_date') || 'Draw Date'}:</span> {new Date(drawDetails.created_at).toLocaleString()}</p>
                    <p className="text-green-600 text-xs mt-2">✓ {t('draw.verified_draw') || 'Blockchain Verified'}</p>
                  </div>
                </div>
              )}

              {/* Prize Claim Instruction */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-sm text-yellow-800 font-semibold mb-2">
                  📞 {t('draw.prize_claim_instruction') || 'Prize Claim Instructions:'}
                </p>
                <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                  <li>Check your email/SMS for prize confirmation</li>
                  <li>Contact the pool agent within 14 days</li>
                  <li>Provide your identification for prize delivery</li>
                  <li>Prize delivered within 21 business days</li>
                </ul>
              </div>

              {/* Share Section - NEW */}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-2 text-center">📢 Share this win with friends!</p>
                
                <div className="flex flex-wrap gap-2">
                  {/* Share Dropdown Button */}
                  <div className="relative flex-1">
                    <button
                      onClick={() => setShowShareMenu(!showShareMenu)}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
                    >
                      📤 Share This Win
                    </button>
                    
                    {showShareMenu && (
                      <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-xl border overflow-hidden z-30">
                        <button onClick={shareOnWhatsApp} className="w-full px-3 py-2 text-left hover:bg-green-50 flex items-center gap-2 text-sm">
                          <span className="text-green-600 text-lg">📱</span> WhatsApp
                        </button>
                        <button onClick={shareOnTelegram} className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm">
                          <span className="text-blue-600 text-lg">💬</span> Telegram
                        </button>
                        <button onClick={shareOnFacebook} className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm">
                          <span className="text-blue-700 text-lg">📘</span> Facebook
                        </button>
                        <button onClick={shareNative} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm">
                          <span className="text-gray-600 text-lg">📱</span> More Options
                        </button>
                        <button onClick={copyLink} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm border-t">
                          <span className="text-gray-600 text-lg">🔗</span> {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Share Buttons */}
                  <button onClick={shareOnWhatsApp} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition">
                    💬
                  </button>
                  <button onClick={shareOnTelegram} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition">
                    📨
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">⏳</div>
              <p className="text-gray-500">{t('draw.no_winner_yet') || 'Draw not completed yet.'}</p>
              <p className="text-sm text-gray-400 mt-2">Check back later for winner announcement!</p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full mt-6 bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 transition"
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
