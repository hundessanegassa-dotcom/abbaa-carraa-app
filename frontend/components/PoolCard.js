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
    
    const message = `*🏆 ABBAA CARRAA | ባለ እድል 🏆*\n\n` +
                    `*🎁 GRAND PRIZE:* ${pool.prize_name}\n\n` +
                    `${pool.description || 'Join this amazing prize pool for a chance to win big!'}\n\n` +
                    `*💰 Entry Fee:* ETB ${formatPrice(pool.contribution_amount)}\n` +
                    `*🏆 Winner Gets:* ETB ${formatPrice(pool.target_amount)} (Cash Equivalent Guaranteed)\n\n` +
                    `👉 *Join Here:* ${poolUrl}\n\n` +
                    `💚 *2% of income supports kidney & heart disease patients.*`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareOnTelegram = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    
    const message = `🏆 *ABBAA CARRAA | ባለ እድል* 🏆\n\n` +
                    `🎁 *GRAND PRIZE:* ${pool.prize_name}\n\n` +
                    `${pool.description || 'Join this amazing prize pool for a chance to win big!'}\n\n` +
                    `💰 *Entry Fee:* ETB ${formatPrice(pool.contribution_amount)}\n` +
                    `🏆 *Winner Gets:* ETB ${formatPrice(pool.target_amount)} (Cash Equivalent Guaranteed)\n\n` +
                    `💚 *2% of income supports kidney & heart disease patients.*`;
    
    window.open(`https://t.me/share/url?url=${encodeURIComponent(poolUrl)}&text=${encodeURIComponent(message)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareOnFacebook = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    const message = `🏆 ABBAA CARRAA | ባለ እድል 🏆\n\n` +
                    `🎁 GRAND PRIZE: ${pool.prize_name}\n` +
                    `💰 Entry Fee: ETB ${formatPrice(pool.contribution_amount)}\n` +
                    `🏆 Winner Gets: ETB ${formatPrice(pool.target_amount)}\n\n` +
                    `Join me for a chance to win!`;
    
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(poolUrl)}&quote=${encodeURIComponent(message)}`, '_blank');
    setShowShareMenu(false);
  };

  const copyLink = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    navigator.clipboard.writeText(poolUrl);
    alert(t('common.link_copied') || 'Link copied!');
    setShowShareMenu(false);
  };

  return (
    <>
      <div 
        className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
      >
        {/* Image Section - Clickable to pool details */}
        <Link href={`/pools/${pool.id}`} className="block">
          <div className="relative h-36 sm:h-44 md:h-48 overflow-hidden bg-gray-100 cursor-pointer">
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
                <span className="text-4xl sm:text-5xl">{getCategoryIcon(pool.category)}</span>
              </div>
            )}
            
            {featured && (
              <div className="absolute top-2 right-2 bg-yellow-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-md z-10">
                ⭐ {t('pools.featured') || 'Featured'}
              </div>
            )}
            
            {isCompleted ? (
              <div className="absolute top-2 left-2 bg-green-600 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-md z-10">
                ✅ {t('common.completed') || 'Completed'}
              </div>
            ) : isActive ? (
              <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-md z-10">
                🔴 {t('common.active') || 'Active'}
              </div>
            ) : (
              <div className="absolute top-2 left-2 bg-gray-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-md z-10">
                ⏸️ {t('common.pending') || 'Pending'}
              </div>
            )}
          </div>
        </Link>

        {/* Content Section */}
        <div className="p-3 sm:p-4">
          {/* Prize Name - Clickable */}
          <Link href={`/pools/${pool.id}`} className="block">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-1 line-clamp-1 hover:text-green-600 transition cursor-pointer">
              {pool.prize_name}
            </h3>
          </Link>
          
          {/* Description */}
          <p className="text-gray-500 text-xs sm:text-sm mb-2 line-clamp-2">
            {pool.description || t('pools.join_now') || 'Join this pool for a chance to win!'}
          </p>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mb-0.5">
              <span>{t('pools.progress') || 'Progress'}</span>
              <span>{Math.min(Math.round(progress), 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div 
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-green-600' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3 text-[11px] sm:text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{t('pools.winner_gets') || '🏆 Winner Gets'}:</span>
              <span className="font-bold text-green-600 text-xs sm:text-sm">ETB {formatPrice(pool.target_amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{t('pools.total_collection') || '💰 Total'}:</span>
              <div className="text-right">
                <span className="font-semibold text-xs sm:text-sm">ETB {formatPrice(totalCollection)}</span>
                <span className="text-[9px] text-gray-400 ml-0.5">({t('pools.incl_commission') || 'incl.20%'})</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{t('pools.entry_fee') || '🎫 Entry Fee'}:</span>
              <span className="font-semibold text-xs sm:text-sm">ETB {formatPrice(pool.contribution_amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">{t('pools.participants') || '👥 Participants'}:</span>
              <span className="font-semibold">{pool.participants_count || 0}</span>
            </div>
            {daysLeft !== null && daysLeft > 0 && !isCompleted && (
              <div className="flex justify-between items-center col-span-2">
                <span className="text-gray-500">{t('pools.days_left') || '⏰ Days left'}:</span>
                <span className={`font-semibold ${daysLeft < 7 ? 'text-red-600' : 'text-orange-600'}`}>
                  {daysLeft} {t('pools.days_left') || 'days'}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons - No conflict, properly isolated */}
          <div className="space-y-2">
            {isCompleted ? (
              <button
                onClick={() => setShowWinnerModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1 cursor-pointer"
              >
                🏆 {t('common.view_winners') || 'View Winner'}
              </button>
            ) : isActive ? (
              <Link href={`/pools/${pool.id}`} prefetch={false}>
                <button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  🎯 {t('pools.join_now') || 'Join Now'}
                </button>
              </Link>
            ) : (
              <button
                disabled
                className="w-full bg-gray-400 text-white py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm cursor-not-allowed"
              >
                ⏳ {t('common.coming_soon') || 'Coming Soon'}
              </button>
            )}

            {/* Share Button */}
            {isActive && (
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded-lg text-xs sm:text-sm transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  📤 {t('common.share') || 'Share'}
                </button>
                
                {showShareMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-lg border overflow-hidden z-20">
                    <button onClick={shareOnWhatsApp} className="w-full px-3 py-2 text-left hover:bg-green-50 flex items-center gap-2 text-xs cursor-pointer">
                      <span className="text-green-600">📱</span> WhatsApp
                    </button>
                    <button onClick={shareOnTelegram} className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-xs cursor-pointer">
                      <span className="text-blue-600">💬</span> Telegram
                    </button>
                    <button onClick={shareOnFacebook} className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-xs cursor-pointer">
                      <span className="text-blue-700">📘</span> Facebook
                    </button>
                    <button onClick={copyLink} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-xs border-t cursor-pointer">
                      <span className="text-gray-600">🔗</span> Copy Link
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cash Equivalent Badge */}
          {isActive && (
            <div className="mt-2 text-center">
              <span className="text-[10px] sm:text-xs text-gray-400 flex items-center justify-center gap-0.5">
                <span>💰</span> {t('pools.cash_equivalent') || 'Cash Equivalent Guaranteed'}
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
