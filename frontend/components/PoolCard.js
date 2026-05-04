import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import WinnerModal from './WinnerModal';

export default function PoolCard({ pool, featured = false }) {
  const { t } = useTranslation();
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const progress = useMemo(() => {
    return (pool.current_amount / pool.target_amount) * 100;
  }, [pool.current_amount, pool.target_amount]);

  const totalCollection = useMemo(() => {
    return pool.target_amount * 1.2;
  }, [pool.target_amount]);

  const isCompleted = pool.status === 'completed' && pool.winner_id;
  const isActive = pool.status === 'active';

  const formatPrice = (price) => {
    return price?.toLocaleString() || '0';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      vehicle: '🚗',
      machinery: '🏭',
      electronics: '💻',
      property: '🏠',
      furniture: '🛋️',
      other: '🎁'
    };
    return icons[category] || '🎁';
  };

  const getDaysLeft = () => {
    if (!pool.end_date || isCompleted) return null;
    return Math.max(0, Math.ceil((new Date(pool.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();

  // Share Functions
  const shareOnWhatsApp = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    const text = `🎁 Join me to win ${pool.prize_name} on Abbaa Carraa! Only ETB ${formatPrice(pool.contribution_amount)} to enter. Let's win together!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + poolUrl)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareOnTelegram = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    const text = `🎁 Join me to win ${pool.prize_name} on Abbaa Carraa! Only ETB ${formatPrice(pool.contribution_amount)} to enter.`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(poolUrl)}&text=${encodeURIComponent(text)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareOnFacebook = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(poolUrl)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareOnTwitter = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    const text = `🎁 Join me to win ${pool.prize_name} on Abbaa Carraa!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(poolUrl)}`, '_blank');
    setShowShareMenu(false);
  };

  const copyLink = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    navigator.clipboard.writeText(poolUrl);
    alert('Link copied to clipboard!');
    setShowShareMenu(false);
  };

  return (
    <>
      <div 
        className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 ${
          featured ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
        }`}
      >
        <div className="relative h-48 overflow-hidden bg-gray-100">
          {pool.image_url && !imageError ? (
            <img 
              src={pool.image_url}
              alt={pool.prize_name}
              loading="lazy"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
              <span className="text-6xl">{getCategoryIcon(pool.category)}</span>
            </div>
          )}
          
          {featured && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              ⭐ {t('pools.featured') || 'Featured'}
            </div>
          )}
          
          {isCompleted ? (
            <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              ✅ {t('common.completed')}
            </div>
          ) : isActive ? (
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              🔴 {t('common.active')}
            </div>
          ) : (
            <div className="absolute top-2 left-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              ⏸️ {t('common.pending')}
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">
            {pool.prize_name}
          </h3>
          
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">
            {pool.description || t('pools.join_now')}
          </p>

          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{t('pools.progress')}</span>
              <span>{Math.min(Math.round(progress), 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-green-600' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
                role="progressbar"
              />
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">🏆 {t('pools.winner_gets')}:</span>
              <span className="font-bold text-green-600">ETB {formatPrice(pool.target_amount)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">💰 Total Collection:</span>
              <div className="text-right">
                <span className="font-semibold">ETB {formatPrice(totalCollection)}</span>
                <span className="text-xs text-gray-400 ml-1">(incl. 20% commission)</span>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">🎫 {t('pools.entry_fee')}:</span>
              <span className="font-semibold">ETB {formatPrice(pool.contribution_amount)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">👥 {t('pools.participants')}:</span>
              <span className="font-semibold">{pool.participants_count || 0}</span>
            </div>

            {daysLeft !== null && daysLeft > 0 && !isCompleted && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">⏰ {t('pools.days_left')}:</span>
                <span className={`font-semibold ${daysLeft < 7 ? 'text-red-600' : 'text-orange-600'}`}>
                  {daysLeft} {t('pools.days_left')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {isCompleted ? (
              <button
                onClick={() => setShowWinnerModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
              >
                🏆 {t('common.view_winners')}
              </button>
            ) : isActive ? (
              <Link href={`/pools/${pool.id}`} prefetch={false}>
                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                  🎯 {t('pools.join_now')}
                </button>
              </Link>
            ) : (
              <button
                disabled
                className="w-full bg-gray-400 text-white py-2 rounded-lg font-semibold cursor-not-allowed"
              >
                ⏳ {t('common.coming_soon')}
              </button>
            )}

            {/* Full Share Button with Menu */}
            {isActive && (
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded-lg text-sm transition flex items-center justify-center gap-2"
                >
                  📤 Share this pool
                </button>
                
                {showShareMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-lg border overflow-hidden z-20">
                    <button
                      onClick={shareOnWhatsApp}
                      className="w-full px-4 py-2 text-left hover:bg-green-50 flex items-center gap-2 text-sm"
                    >
                      <span className="text-green-600">📱</span> Share on WhatsApp
                    </button>
                    <button
                      onClick={shareOnTelegram}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm"
                    >
                      <span className="text-blue-600">💬</span> Share on Telegram
                    </button>
                    <button
                      onClick={shareOnFacebook}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm"
                    >
                      <span className="text-blue-700">📘</span> Share on Facebook
                    </button>
                    <button
                      onClick={shareOnTwitter}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-sm"
                    >
                      <span className="text-blue-400">🐦</span> Share on Twitter
                    </button>
                    <button
                      onClick={copyLink}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm border-t"
                    >
                      <span className="text-gray-600">🔗</span> Copy Link
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {isActive && (
            <div className="mt-3 text-center">
              <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <span>💰</span> {t('pools.cash_equivalent')}
              </span>
            </div>
          )}
        </div>
      </div>

      <WinnerModal
        poolId={pool.id}
        isOpen={showWinnerModal}
        onClose={() => setShowWinnerModal(false)}
      />
    </>
  );
}
