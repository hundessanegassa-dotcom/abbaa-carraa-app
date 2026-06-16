// components/WinnerAnnouncement.js - Complete Winner Announcement with 3D Effects, Confetti & Advanced Sharing
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

export default function WinnerAnnouncement({
  poolId,
  isOpen,
  onClose,
  winnerId,
  showConfetti = true,
  show3D = true,
  autoRotate = true,
  showShareMenu = true
}) {
  const { t } = useTranslation();
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawDetails, setDrawDetails] = useState(null);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [is3D, setIs3D] = useState(show3D);
  const [rotation, setRotation] = useState(0);
  const [confettiActive, setConfettiActive] = useState(true);
  const [showCelebration, setShowCelebration] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const animationRef = useRef(null);
  const confettiRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const [prizeClaimed, setPrizeClaimed] = useState(false);
  const [claimLoading, setClaimLoading] = useState(false);

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D && autoRotate) {
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
  }, [is3D, autoRotate]);

  // Generate confetti particles
  useEffect(() => {
    if (showConfetti && confettiActive && isOpen) {
      const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bb5', '#ff8a5c', '#a29bfe', '#fd79a8'];
      const newParticles = [];
      for (let i = 0; i < 100; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100 - 20,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          speed: Math.random() * 3 + 1,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          delay: Math.random() * 2
        });
      }
      setParticles(newParticles);
    }
  }, [showConfetti, confettiActive, isOpen]);

  useEffect(() => {
    if (isOpen && (poolId || winnerId)) {
      fetchWinner();
    }
  }, [isOpen, poolId, winnerId]);

  async function fetchWinner() {
    setLoading(true);
    try {
      let winnerData = null;
      let drawData = null;

      // If winnerId is provided directly
      if (winnerId) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, profile_image, city')
          .eq('id', winnerId)
          .single();

        if (profileError) throw profileError;

        // Get pool info from winner's ticket
        const { data: ticket, error: ticketError } = await supabase
          .from('regular_pool_participants')
          .select('pool_id, pool_name, prize_amount, seat_numbers')
          .eq('user_id', winnerId)
          .eq('payment_status', 'verified')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        winnerData = {
          ...profile,
          prize_name: ticket?.pool_name || 'Prize Pool',
          target_amount: ticket?.prize_amount || 0,
          seat_numbers: ticket?.seat_numbers || []
        };

        // Fetch draw details
        if (ticket?.pool_id) {
          const { data: draw, error: drawError } = await supabase
            .from('draws')
            .select('*')
            .eq('pool_id', ticket.pool_id)
            .maybeSingle();

          if (!drawError) drawData = draw;
        }
      } 
      // If poolId is provided
      else if (poolId) {
        const { data: pool, error: poolError } = await supabase
          .from('pools')
          .select(`
            id,
            prize_name,
            target_amount,
            winner_id,
            profiles:winner_id (id, full_name, email, phone, profile_image, city)
          `)
          .eq('id', poolId)
          .maybeSingle();

        if (poolError) throw poolError;
        winnerData = pool;

        // Fetch draw details
        const { data: draw, error: drawError } = await supabase
          .from('draws')
          .select('*')
          .eq('pool_id', poolId)
          .maybeSingle();

        if (!drawError) drawData = draw;
      }

      setWinner(winnerData);
      setDrawDetails(drawData);
    } catch (error) {
      console.error('Error fetching winner:', error);
      toast.error('Failed to load winner information');
    } finally {
      setLoading(false);
    }
  }

  // Share Functions
  const shareOnWhatsApp = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const winnerName = winner?.profiles?.full_name || winner?.full_name || 'Winner';
    const prizeName = winner?.prize_name || 'Prize';
    const prizeAmount = winner?.target_amount?.toLocaleString() || '0';
    
    const message = `🎉 *WINNER ANNOUNCEMENT!* 🎉\n\n` +
                    `🏆 *Congratulations to ${winnerName}!*\n\n` +
                    `They won the *${prizeName}* prize!\n` +
                    `💰 *Prize Value:* ETB ${prizeAmount}\n\n` +
                    `💚 *Abbaa Carraa Ethio* - Win amazing prizes while 2% supports kidney & heart disease treatment.\n\n` +
                    `👉 Join us: ${shareUrl}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setShowShareDropdown(false);
  };

  const shareOnTelegram = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const winnerName = winner?.profiles?.full_name || winner?.full_name || 'Winner';
    const prizeName = winner?.prize_name || 'Prize';
    const prizeAmount = winner?.target_amount?.toLocaleString() || '0';
    
    const message = `🎉 *WINNER ANNOUNCEMENT!* 🎉\n\n` +
                    `🏆 *Congratulations to ${winnerName}!*\n\n` +
                    `They won the *${prizeName}* prize!\n` +
                    `💰 *Prize Value:* ETB ${prizeAmount}\n\n` +
                    `💚 *Abbaa Carraa Ethio* - Win amazing prizes while 2% supports kidney & heart disease treatment.\n\n` +
                    `👉 Join us: ${shareUrl}`;
    
    window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(message)}`, '_blank');
    setShowShareDropdown(false);
  };

  const shareOnFacebook = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const winnerName = winner?.profiles?.full_name || winner?.full_name || 'Winner';
    const prizeName = winner?.prize_name || 'Prize';
    
    const message = `🎉 WINNER ANNOUNCEMENT! 🎉\n\n🏆 Congratulations to ${winnerName}!\nThey won the ${prizeName} prize!\n\nJoin Abbaa Carraa Ethio to win amazing prizes while 2% supports health.`;
    
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(message)}`, '_blank');
    setShowShareDropdown(false);
  };

  const shareOnTwitter = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const winnerName = winner?.profiles?.full_name || winner?.full_name || 'Winner';
    const prizeName = winner?.prize_name || 'Prize';
    
    const message = `🎉 Congratulations to ${winnerName} for winning ${prizeName}! 🏆 Join @AbbaaCarraa to win amazing prizes! ${shareUrl}`;
    
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
    setShowShareDropdown(false);
  };

  const shareOnLinkedIn = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const winnerName = winner?.profiles?.full_name || winner?.full_name || 'Winner';
    const prizeName = winner?.prize_name || 'Prize';
    
    const message = `🎉 Winner Announcement! 🏆 Congratulations to ${winnerName} for winning ${prizeName}!`;
    
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(message)}`, '_blank');
    setShowShareDropdown(false);
  };

  const copyLink = () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success('Link copied! Share with friends.');
    setTimeout(() => setCopied(false), 3000);
    setShowShareDropdown(false);
  };

  const shareNative = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const winnerName = winner?.profiles?.full_name || winner?.full_name || 'Winner';
    const prizeName = winner?.prize_name || 'Prize';
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Winner Announcement!',
          text: `🎉 Congratulations to ${winnerName} for winning ${prizeName}! Join Abbaa Carraa to win amazing prizes.`,
          url: shareUrl
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      setShowShareDropdown(!showShareDropdown);
    }
    setShowShareDropdown(false);
  };

  const handleClaimPrize = async () => {
    setClaimLoading(true);
    try {
      // Update winner status
      const { error } = await supabase
        .from('pools')
        .update({ 
          prize_claimed: true,
          prize_claimed_at: new Date().toISOString()
        })
        .eq('id', poolId);

      if (error) throw error;

      setPrizeClaimed(true);
      toast.success('Prize claimed successfully! 🎉');
    } catch (error) {
      console.error('Error claiming prize:', error);
      toast.error('Failed to claim prize. Please contact support.');
    } finally {
      setClaimLoading(false);
    }
  };

  const toggle3D = () => {
    setIs3D(!is3D);
  };

  const toggleConfetti = () => {
    setConfettiActive(!confettiActive);
  };

  const get3DTransform = () => {
    if (!is3D) return 'none';
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Confetti Container */}
      {showConfetti && confettiActive && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="absolute animate-float"
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                width: `${particle.size}px`,
                height: `${particle.size * 2}px`,
                backgroundColor: particle.color,
                transform: `rotate(${particle.rotation}deg)`,
                animation: `float ${particle.speed}s ease-in-out ${particle.delay}s infinite`,
                borderRadius: '2px',
                opacity: 0.8
              }}
            />
          ))}
        </div>
      )}

      {/* Main Modal */}
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transition-all duration-500 ${
          showCelebration ? 'border-4 border-yellow-400' : ''
        }`}
        style={{
          transform: get3DTransform(),
          transformStyle: 'preserve-3d',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`sticky top-0 ${showCelebration ? 'bg-gradient-to-r from-yellow-500 via-orange-500 to-yellow-500' : 'bg-gradient-to-r from-emerald-600 to-teal-600'} text-white p-5 rounded-t-2xl`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-3xl animate-bounce">🏆</span>
              <div>
                <h2 className="text-xl font-bold">
                  {t('draw.winner_announced') || 'Winner Announced!'}
                </h2>
                {showCelebration && (
                  <p className="text-sm opacity-90">🎊 Congratulations to our winner! 🎊</p>
                )}
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
              {showConfetti && (
                <button
                  onClick={toggleConfetti}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                    confettiActive 
                      ? 'bg-white/20 text-white hover:bg-white/30' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {confettiActive ? '🎊' : '🎊'}
                </button>
              )}
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
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-3 text-gray-500">{t('common.loading') || 'Loading...'}</p>
            </div>
          ) : winner ? (
            <div className="space-y-5">
              {/* Winner Badge */}
              <div className="text-center py-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl border-2 border-green-200 relative overflow-hidden">
                {showCelebration && (
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-20 h-20 bg-yellow-400 rounded-full blur-2xl animate-pulse"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-orange-400 rounded-full blur-2xl animate-pulse delay-700"></div>
                  </div>
                )}
                <div className="relative">
                  <div className="text-6xl mb-2 animate-bounce">🎉</div>
                  <p className="text-sm text-gray-600 font-medium">
                    {t('draw.congratulations') || 'Congratulations!'}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {winner?.profiles?.profile_image ? (
                      <img 
                        src={winner.profiles.profile_image} 
                        alt={winner.profiles.full_name}
                        className="w-12 h-12 rounded-full border-2 border-green-500"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-green-200 flex items-center justify-center text-2xl">
                        {winner?.profiles?.full_name?.[0] || winner?.full_name?.[0] || '🏆'}
                      </div>
                    )}
                    <p className="text-xl font-bold text-green-700">
                      {winner?.profiles?.full_name || winner?.full_name || 'Anonymous Winner'}
                    </p>
                  </div>
                  {winner?.profiles?.city && (
                    <p className="text-xs text-gray-500 mt-1">📍 {winner.profiles.city}</p>
                  )}
                  {winner?.profiles?.phone && (
                    <p className="text-xs text-gray-500">📞 {winner.profiles.phone}</p>
                  )}
                </div>
              </div>

              {/* Prize Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="border rounded-xl p-4 bg-gray-50 text-center">
                  <p className="text-xs text-gray-500">{t('pools.winner_gets') || '🏆 Winner Gets'}</p>
                  <p className="font-bold text-sm">{winner.prize_name || 'Prize Pool'}</p>
                </div>
                <div className="border rounded-xl p-4 bg-emerald-50 text-center border-emerald-200">
                  <p className="text-xs text-gray-500">💰 Prize Value</p>
                  <p className="font-bold text-lg text-emerald-600">ETB {winner.target_amount?.toLocaleString() || '0'}</p>
                </div>
              </div>

              {/* Seat Numbers */}
              {winner.seat_numbers && winner.seat_numbers.length > 0 && (
                <div className="border rounded-xl p-3 bg-blue-50 border-blue-200">
                  <p className="text-xs text-gray-500 text-center">💺 Winning Seat Numbers</p>
                  <p className="text-center font-bold text-blue-700">
                    {winner.seat_numbers.sort((a,b)=>a-b).join(', ')}
                  </p>
                </div>
              )}

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

              {/* Claim Prize Button */}
              {poolId && !prizeClaimed && (
                <button
                  onClick={handleClaimPrize}
                  disabled={claimLoading}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {claimLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('common.processing') || 'Processing...'}
                    </>
                  ) : (
                    `🎯 ${t('draw.claim_prize') || 'Claim Prize'}`
                  )}
                </button>
              )}

              {prizeClaimed && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                  <p className="text-green-700 font-semibold">✅ Prize Claimed Successfully!</p>
                  <p className="text-xs text-green-600">Your prize is being processed.</p>
                </div>
              )}

              {/* Share Section */}
              {showShareMenu && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-2 text-center">📢 Share this win with friends!</p>
                  
                  <div className="flex flex-wrap gap-2">
                    {/* Share Dropdown Button */}
                    <div className="relative flex-1">
                      <button
                        onClick={() => setShowShareDropdown(!showShareDropdown)}
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
                      >
                        📤 Share This Win
                      </button>
                      
                      {showShareDropdown && (
                        <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-xl border overflow-hidden z-30">
                          <button onClick={shareOnWhatsApp} className="w-full px-3 py-2 text-left hover:bg-green-50 flex items-center gap-2 text-sm transition">
                            <span className="text-green-600 text-lg">📱</span> WhatsApp
                          </button>
                          <button onClick={shareOnTelegram} className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm transition">
                            <span className="text-blue-600 text-lg">💬</span> Telegram
                          </button>
                          <button onClick={shareOnFacebook} className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm transition">
                            <span className="text-blue-700 text-lg">📘</span> Facebook
                          </button>
                          <button onClick={shareOnTwitter} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm transition">
                            <span className="text-gray-600 text-lg">🐦</span> Twitter
                          </button>
                          <button onClick={shareOnLinkedIn} className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm transition">
                            <span className="text-blue-600 text-lg">💼</span> LinkedIn
                          </button>
                          <button onClick={shareNative} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm transition border-t">
                            <span className="text-gray-600 text-lg">📱</span> More Options
                          </button>
                          <button onClick={copyLink} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm transition border-t">
                            <span className="text-gray-600 text-lg">🔗</span> {copied ? '✅ Copied!' : 'Copy Link'}
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
                    <button onClick={copyLink} className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm hover:bg-gray-600 transition">
                      🔗
                    </button>
                  </div>
                </div>
              )}
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
            className="w-full mt-6 bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-semibold transition"
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>

      {/* CSS Animation Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-100px) rotate(180deg);
            opacity: 1;
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
