import { useState, useEffect } from 'react';
import Link from 'next/link';
import WinnerModal from './WinnerModal';

export default function PoolCard({ pool, featured = false }) {
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fixed bilingual translations (always visible)
  const winnerPrize = pool.target_amount || 0;
  const entryFee = pool.contribution_amount || pool.entry_fee || 10;
  const totalCollection = winnerPrize * 1.2;
  const totalSeats = Math.floor(totalCollection / entryFee);
  const progress = ((pool.current_amount || 0) / totalCollection) * 100;
  const currentSeatsFilled = Math.floor((pool.current_amount || 0) / entryFee);
  const availableSeats = totalSeats - currentSeatsFilled;

  const isCompleted = pool.status === 'completed' && pool.winner_id;
  const isActive = pool.status === 'active';

  const formatPrice = (price) => price?.toLocaleString() || '0';

  const getCategoryIcon = (category) => {
    const icons = { vehicle: '🚗', machinery: '🏭', electronics: '💻', property: '🏠', furniture: '🛋️', other: '🎁' };
    return icons[category] || '🎁';
  };

  const getDaysLeft = () => {
    if (!pool.end_date || isCompleted) return null;
    return Math.max(0, Math.ceil((new Date(pool.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();

  const shareOnWhatsApp = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    const message = `*🏆 ABBAA CARRAA* 🏆\n\n*🎁 ${pool.prize_name}*\n💰 Entry: ETB ${formatPrice(entryFee)}\n🏆 Prize: ETB ${formatPrice(winnerPrize)}\n\n👉 ${poolUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareOnTelegram = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    const message = `🏆 *ABBAA CARRAA* 🏆\n\n🎁 ${pool.prize_name}\n💰 Entry: ETB ${formatPrice(entryFee)}\n🏆 Prize: ETB ${formatPrice(winnerPrize)}\n\n👉 ${poolUrl}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(poolUrl)}&text=${encodeURIComponent(message)}`, '_blank');
    setShowShareMenu(false);
  };

  const shareOnFacebook = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(poolUrl)}`, '_blank');
    setShowShareMenu(false);
  };

  const copyLink = () => {
    const poolUrl = `${window.location.origin}/pools/${pool.id}`;
    navigator.clipboard.writeText(poolUrl);
    alert('Link copied!');
    setShowShareMenu(false);
  };

  if (!mounted) {
    return (
      <div className="bg-white rounded-xl overflow-hidden shadow-md">
        <div className="h-36 sm:h-44 md:h-48 bg-gray-200 animate-pulse"></div>
        <div className="p-3 sm:p-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 h-full flex flex-col">
        {/* Image Section */}
        <Link href={`/pools/${pool.id}`} className="block shrink-0" onClick={() => setIsJoining(false)}>
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
                ⭐ Featured
              </div>
            )}
            
            <div className="absolute top-2 left-2 bg-opacity-90 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-md z-10 text-[10px] sm:text-xs font-bold text-white">
              {isCompleted ? '✅ Completed' : isActive ? '🔴 Active' : '⏸️ Pending'}
            </div>
          </div>
        </Link>

        {/* Content Section - flex-grow to push button down */}
        <div className="p-3 sm:p-4 flex flex-col flex-grow">
          {/* Prize Name */}
          <Link href={`/pools/${pool.id}`} className="block">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-800 mb-1 line-clamp-1 hover:text-green-600 transition cursor-pointer">
              {pool.prize_name}
            </h3>
          </Link>
          
          {/* Description */}
          <p className="text-gray-500 text-xs sm:text-sm mb-2 line-clamp-2">
            {pool.description || 'Join this pool for a chance to win!'}
          </p>

          {/* Stats Grid - Bilingual with small font */}
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mb-3 text-[9px] sm:text-[10px]">
            {/* Winner Gets - Bilingual */}
            <div className="flex justify-between items-center flex-wrap">
              <span className="text-gray-500">🏆 Winner:</span>
              <span className="font-bold text-green-600 text-xs sm:text-sm">ETB {formatPrice(winnerPrize)}</span>
            </div>
            <div className="text-right text-[8px] text-gray-400 -mt-1 col-span-2">
              <span className="mr-2">አሸናፊ የሚያገኘው</span>
              <span>mo'aataan kan argatu</span>
            </div>
            
            {/* Entry Fee - Bilingual */}
            <div className="flex justify-between items-center flex-wrap">
              <span className="text-gray-500">🎫 Entry:</span>
              <span className="font-semibold text-xs sm:text-sm">ETB {formatPrice(entryFee)}</span>
            </div>
            <div className="text-right text-[8px] text-gray-400 -mt-1 col-span-2">
              <span className="mr-2">የመግቢያ ክፍያ</span>
              <span>Kaffaltii Seensaa</span>
            </div>
            
            {/* Total Seats - Bilingual */}
            <div className="flex justify-between items-center flex-wrap">
              <span className="text-gray-500">💺 Total Seats:</span>
              <span className="font-semibold">{totalSeats.toLocaleString()}</span>
            </div>
            <div className="text-right text-[8px] text-gray-400 -mt-1 col-span-2">
              <span className="mr-2">አጠቃላይ መቀመጫዎች</span>
              <span>Iddoowwan Waliigalaa</span>
            </div>
            
            {/* Available Seats - Bilingual */}
            <div className="flex justify-between items-center flex-wrap">
              <span className="text-gray-500">📊 Available:</span>
              <span className="font-semibold text-orange-600">{Math.max(0, availableSeats).toLocaleString()}</span>
            </div>
            <div className="text-right text-[8px] text-gray-400 -mt-1 col-span-2">
              <span className="mr-2">የሚገኙ</span>
              <span>Jiran</span>
            </div>
            
            {/* Days Left - Bilingual (if applicable) */}
            {daysLeft !== null && daysLeft > 0 && !isCompleted && (
              <>
                <div className="flex justify-between items-center flex-wrap col-span-2">
                  <span className="text-gray-500">⏰ Days left:</span>
                  <span className={`font-semibold ${daysLeft < 7 ? 'text-red-600' : 'text-orange-600'}`}>
                    {daysLeft}
                  </span>
                </div>
                <div className="text-right text-[8px] text-gray-400 -mt-1 col-span-2">
                  <span className="mr-2">የቀሩ ቀናት</span>
                  <span>guyyaa hafe</span>
                </div>
              </>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-[8px] sm:text-[9px] text-gray-500 mb-0.5">
              <span>Progress</span>
              <span>{Math.min(Math.round(progress), 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
              <div 
                className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${isCompleted ? 'bg-green-600' : 'bg-green-500'}`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[7px] sm:text-[8px] text-gray-400 mt-0.5">
              <span>ETB {formatPrice(pool.current_amount || 0)} raised</span>
              <span>Target: ETB {formatPrice(totalCollection)}</span>
            </div>
          </div>

          {/* Action Buttons - mt-auto pushes to bottom */}
          <div className="space-y-2 mt-auto">
            {isCompleted ? (
              <button
                onClick={() => setShowWinnerModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1 cursor-pointer"
              >
                🏆 View Winner
              </button>
            ) : isActive ? (
              <Link 
                href={`/login?redirect=/pools/${pool.id}`}
                className="block w-full"
                onClick={() => setIsJoining(true)}
              >
                <button 
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-70"
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ...
                    </span>
                  ) : (
                    <>🎯 Join Now (ETB {formatPrice(entryFee)})</>
                  )}
                </button>
              </Link>
            ) : (
              <button disabled className="w-full bg-gray-400 text-white py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm cursor-not-allowed">
                ⏳ Coming Soon
              </button>
            )}

            {/* Share Button */}
            {isActive && (
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded-lg text-xs sm:text-sm transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  📤 Share
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
              <span className="text-[8px] sm:text-[9px] text-gray-400 flex flex-wrap items-center justify-center gap-1">
                <span>💰</span> Cash Equivalent Guaranteed
                <span className="text-[7px] mx-1">|</span>
                <span>የገንዘብ ዋስትና</span>
                <span className="text-[7px] mx-1">|</span>
                <span>wabiin qarshiidhan</span>
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
