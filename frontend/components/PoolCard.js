// components/PoolCard.js - Enhanced Pool Card with 3D Effects, Improved UI & Full Integration
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import WinnerAnnouncement from './WinnerAnnouncement';
import toast from 'react-hot-toast';

export default function PoolCard({ 
  pool, 
  featured = false,
  show3D = true,
  autoRotate = true,
  compact = false,
  showShare = true,
  showProgress = true,
  onJoinClick,
  onShareClick
}) {
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [is3D, setIs3D] = useState(show3D);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const cardRef = useRef(null);
  const animationRef = useRef(null);

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D && autoRotate && !isHovered) {
      const animate = () => {
        setRotation(prev => (prev + 0.15) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [is3D, autoRotate, isHovered]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fixed bilingual translations (always visible)
  const winnerPrize = pool.target_amount || 0;
  const entryFee = pool.contribution_amount || pool.entry_fee || pool.ticket_price || 10;
  const totalCollection = winnerPrize * 1.2;
  const totalSeats = Math.floor(totalCollection / entryFee);
  const progress = ((pool.current_amount || 0) / totalCollection) * 100;
  const currentSeatsFilled = Math.floor((pool.current_amount || 0) / entryFee);
  const availableSeats = totalSeats - currentSeatsFilled;

  const isCompleted = pool.status === 'completed' && pool.winner_id;
  const isActive = pool.status === 'active';

  const formatPrice = (price) => price?.toLocaleString() || '0';

  // Get 3D transform
  const get3DTransform = () => {
    if (!is3D) return 'none';
    if (isHovered) {
      const rotateX = (mouseY - 0.5) * 15;
      const rotateY = (mouseX - 0.5) * 15;
      return `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    }
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  // Attractive prize description based on amount
  const getAttractivePrizeDescription = () => {
    const amount = winnerPrize;
    
    if (amount >= 10000000) {
      return {
        am: `🎉 ታላቅ እድል! ${(amount / 1000000).toLocaleString()} ሚሊዮን ብር ያሸንፉ! ህይወትዎን ሙሉ በሙሉ የሚቀይር ዕድል!`,
        en: `🎉 Mega Opportunity! Win ${(amount / 1000000).toLocaleString()} Million Birr! A life-changing opportunity!`
      };
    } else if (amount >= 1000000) {
      return {
        am: `🏆 ወርቃማ እድል! ${(amount / 1000000).toLocaleString()} ሚሊዮን ብር ሚሊየነር ያደርግዎታል!`,
        en: `🏆 Golden Chance! Win ${(amount / 1000000).toLocaleString()} Million Birr - Become a Millionaire!`
      };
    } else if (amount >= 500000) {
      return {
        am: `⭐ ከፍተኛ ሽልማት! ${amount.toLocaleString()} ብር ያሸንፉ! ህልሞችዎን እውን ያድርጉ!`,
        en: `⭐ Grand Prize! Win ${amount.toLocaleString()} Birr! Make your dreams come true!`
      };
    } else if (amount >= 100000) {
      return {
        am: `💎 አስደናቂ ሽልማት! ${amount.toLocaleString()} ብር ያሸንፉ! ዛሬ እድለኛ ቀንዎ ነው!`,
        en: `💎 Amazing Prize! Win ${amount.toLocaleString()} Birr! Today could be your lucky day!`
      };
    } else {
      return {
        am: `🎁 ድንቅ ሽልማት! ${amount.toLocaleString()} ብር ያሸንፉ! ተሳትፎዎ ይክፈላል!`,
        en: `🎁 Great Prize! Win ${amount.toLocaleString()} Birr! Your participation pays off!`
      };
    }
  };

  const prizeDesc = getAttractivePrizeDescription();

  const getCategoryIcon = (category) => {
    const icons = { 
      vehicle: '🚗', 
      machinery: '🏭', 
      electronics: '💻', 
      property: '🏠', 
      furniture: '🛋️', 
      other: '🎁',
      cash: '💰',
      vip: '👑',
      daily: '⭐',
      weekly: '🏆',
      monthly: '💎'
    };
    return icons[category] || '🎁';
  };

  const getDaysLeft = () => {
    if (!pool.end_date || isCompleted) return null;
    return Math.max(0, Math.ceil((new Date(pool.end_date) - new Date()) / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = getDaysLeft();

  const shareOnWhatsApp = () => {
    const poolUrl = typeof window !== 'undefined' ? `${window.location.origin}/pools/${pool.id}` : '';
    const message = `*🏆 ABBAA CARRAA* 🏆\n\n*🎁 ${pool.prize_name}*\n💰 Entry: ETB ${formatPrice(entryFee)}\n🏆 Prize: ETB ${formatPrice(winnerPrize)}\n\n👉 ${poolUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    setShowShareMenu(false);
    if (onShareClick) onShareClick('whatsapp', pool);
  };

  const shareOnTelegram = () => {
    const poolUrl = typeof window !== 'undefined' ? `${window.location.origin}/pools/${pool.id}` : '';
    const message = `🏆 *ABBAA CARRAA* 🏆\n\n🎁 ${pool.prize_name}\n💰 Entry: ETB ${formatPrice(entryFee)}\n🏆 Prize: ETB ${formatPrice(winnerPrize)}\n\n👉 ${poolUrl}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(poolUrl)}&text=${encodeURIComponent(message)}`, '_blank');
    setShowShareMenu(false);
    if (onShareClick) onShareClick('telegram', pool);
  };

  const shareOnFacebook = () => {
    const poolUrl = typeof window !== 'undefined' ? `${window.location.origin}/pools/${pool.id}` : '';
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(poolUrl)}`, '_blank');
    setShowShareMenu(false);
    if (onShareClick) onShareClick('facebook', pool);
  };

  const shareOnTwitter = () => {
    const poolUrl = typeof window !== 'undefined' ? `${window.location.origin}/pools/${pool.id}` : '';
    const message = `🎁 Check out this amazing pool on Abbaa Carraa: ${pool.prize_name}! Win ETB ${formatPrice(winnerPrize)}! ${poolUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, '_blank');
    setShowShareMenu(false);
    if (onShareClick) onShareClick('twitter', pool);
  };

  const copyLink = () => {
    const poolUrl = typeof window !== 'undefined' ? `${window.location.origin}/pools/${pool.id}` : '';
    navigator.clipboard.writeText(poolUrl);
    toast.success('Link copied! 📋');
    setShowShareMenu(false);
    if (onShareClick) onShareClick('copy', pool);
  };

  const handleJoinClick = (e) => {
    if (onJoinClick) {
      e.preventDefault();
      onJoinClick(pool);
    }
    setIsJoining(true);
  };

  const toggle3D = (e) => {
    e.stopPropagation();
    setIs3D(!is3D);
  };

  const handleMouseMove = (e) => {
    if (!is3D) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseX((e.clientX - rect.left) / rect.width);
    setMouseY((e.clientY - rect.top) / rect.height);
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
      <div 
        ref={cardRef}
        className={`bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col ${is3D ? 'transform-gpu' : ''}`}
        style={{
          transform: get3DTransform(),
          transformStyle: 'preserve-3d',
          transition: isHovered ? 'transform 0.1s ease' : 'none',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMouseX(0.5);
          setMouseY(0.5);
        }}
      >
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
            
            {/* 3D Toggle Button */}
            <button
              onClick={toggle3D}
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white text-[10px] px-2 py-1 rounded-full transition z-20"
            >
              {is3D ? '🔄 3D' : '📐 2D'}
            </button>
            
            {featured && (
              <div className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] sm:text-xs font-bold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-md z-10 animate-pulse">
                ⭐ Featured
              </div>
            )}
            
            <div className={`absolute bottom-2 left-2 bg-opacity-90 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-md z-10 text-[10px] sm:text-xs font-bold text-white ${
              isCompleted ? 'bg-green-600' : isActive ? 'bg-red-600 animate-pulse' : 'bg-gray-600'
            }`}>
              {isCompleted ? '✅ Completed' : isActive ? '🔴 Active' : '⏸️ Pending'}
            </div>

            {/* Prize Amount Badge */}
            {isActive && (
              <div className="absolute bottom-2 right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-md z-10">
                🏆 ETB {formatPrice(winnerPrize)}
              </div>
            )}
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

          {/* Attractive Prize Description */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-2 mb-3 text-center border border-purple-100">
            <p className="text-[10px] sm:text-xs font-medium text-purple-700">
              {prizeDesc.am}
            </p>
            <p className="text-[8px] sm:text-[10px] text-purple-600 mt-0.5 italic">
              {prizeDesc.en}
            </p>
          </div>

          {/* Stats Grid - Bilingual with small font */}
          {!compact ? (
            <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mb-3 text-[9px] sm:text-[10px]">
              {/* Winner Gets - Bilingual */}
              <div className="flex justify-between items-center flex-wrap col-span-2">
                <span className="text-gray-500">🏆 Winner Gets:</span>
                <span className="font-bold text-green-600 text-xs sm:text-sm">ETB {formatPrice(winnerPrize)}</span>
              </div>
              <div className="text-right text-[8px] text-gray-400 -mt-1 col-span-2">
                <span className="mr-2">አሸናፊ የሚያገኘው</span>
                <span>Winner Receives</span>
              </div>
              
              {/* Entry Fee - Bilingual */}
              <div className="flex justify-between items-center flex-wrap col-span-2">
                <span className="text-gray-500">🎫 Entry Fee:</span>
                <span className="font-semibold text-xs sm:text-sm">ETB {formatPrice(entryFee)}</span>
              </div>
              <div className="text-right text-[8px] text-gray-400 -mt-1 col-span-2">
                <span className="mr-2">የመግቢያ ክፍያ</span>
                <span>Entry Fee</span>
              </div>
              
              {/* Total Seats - Bilingual */}
              <div className="flex justify-between items-center flex-wrap col-span-2">
                <span className="text-gray-500">💺 Total Seats:</span>
                <span className="font-semibold">{totalSeats.toLocaleString()}</span>
              </div>
              <div className="text-right text-[8px] text-gray-400 -mt-1 col-span-2">
                <span className="mr-2">አጠቃላይ መቀመጫዎች</span>
                <span>Total Seats</span>
              </div>
              
              {/* Available Seats - Bilingual */}
              <div className="flex justify-between items-center flex-wrap col-span-2">
                <span className="text-gray-500">📊 Available:</span>
                <span className="font-semibold text-orange-600">{Math.max(0, availableSeats).toLocaleString()}</span>
              </div>
              <div className="text-right text-[8px] text-gray-400 -mt-1 col-span-2">
                <span className="mr-2">የሚገኙ</span>
                <span>Available</span>
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
                    <span>Days Left</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Compact Stats
            <div className="grid grid-cols-2 gap-1 mb-3 text-[8px] sm:text-[9px]">
              <div className="flex justify-between items-center bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-500">🎫</span>
                <span className="font-semibold">ETB {formatPrice(entryFee)}</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 rounded px-2 py-1">
                <span className="text-gray-500">💺</span>
                <span className="font-semibold">{Math.max(0, availableSeats).toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {showProgress && isActive && (
            <div className="mb-3">
              <div className="flex justify-between text-[8px] sm:text-[9px] text-gray-500 mb-0.5">
                <span>Progress</span>
                <span>{Math.min(Math.round(progress), 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 overflow-hidden">
                <div 
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${
                    isCompleted ? 'bg-green-600' : 'bg-gradient-to-r from-green-500 to-teal-500'
                  }`}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[7px] sm:text-[8px] text-gray-400 mt-0.5">
                <span>ETB {formatPrice(pool.current_amount || 0)} raised</span>
                <span>Target: ETB {formatPrice(totalCollection)}</span>
              </div>
            </div>
          )}

          {/* Action Buttons - mt-auto pushes to bottom */}
          <div className="space-y-2 mt-auto">
            {isCompleted ? (
              <button
                onClick={() => setShowWinnerModal(true)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1 cursor-pointer"
              >
                🏆 View Winner
              </button>
            ) : isActive ? (
              <Link 
                href={`/login?redirect=/pools/${pool.id}`}
                className="block w-full"
                onClick={handleJoinClick}
              >
                <button 
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-70"
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Loading...
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
            {showShare && isActive && (
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded-lg text-xs sm:text-sm transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  📤 Share
                </button>
                
                {showShareMenu && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-lg shadow-lg border overflow-hidden z-20">
                    <button onClick={shareOnWhatsApp} className="w-full px-3 py-2 text-left hover:bg-green-50 flex items-center gap-2 text-xs cursor-pointer transition">
                      <span className="text-green-600 text-lg">📱</span> WhatsApp
                    </button>
                    <button onClick={shareOnTelegram} className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-xs cursor-pointer transition">
                      <span className="text-blue-600 text-lg">💬</span> Telegram
                    </button>
                    <button onClick={shareOnFacebook} className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center gap-2 text-xs cursor-pointer transition">
                      <span className="text-blue-700 text-lg">📘</span> Facebook
                    </button>
                    <button onClick={shareOnTwitter} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-xs cursor-pointer transition border-t">
                      <span className="text-gray-600 text-lg">🐦</span> Twitter
                    </button>
                    <button onClick={copyLink} className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-xs cursor-pointer transition border-t">
                      <span className="text-gray-600 text-lg">🔗</span> Copy Link
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Winner encouragement text */}
          {isActive && (
            <div className="mt-2 text-center">
              <span className="text-[8px] sm:text-[9px] text-gray-400 flex flex-wrap items-center justify-center gap-1">
                ⚡ እድለኛ ሊሆኑ ይችላሉ! | You could be the next winner!
              </span>
            </div>
          )}

          {/* Cash Equivalent Badge */}
          {isActive && (
            <div className="mt-1 text-center">
              <span className="text-[7px] sm:text-[8px] text-gray-400 flex flex-wrap items-center justify-center gap-1">
                <span>💰</span> Cash Equivalent Guaranteed
                <span className="text-[6px] mx-0.5">|</span>
                <span>የገንዘብ ዋስትና</span>
              </span>
            </div>
          )}
        </div>
      </div>

      <WinnerAnnouncement
        poolId={pool.id}
        isOpen={showWinnerModal}
        onClose={() => setShowWinnerModal(false)}
        showConfetti={true}
        show3D={true}
        autoRotate={true}
        showShareMenu={true}
      />
    </>
  );
}
