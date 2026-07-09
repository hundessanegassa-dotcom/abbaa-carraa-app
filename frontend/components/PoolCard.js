// components/PoolCard.js - Fixed with Full Numbers & Bilingual
import Link from 'next/link';
import { useState } from 'react';

export default function PoolCard({ pool, featured = false }) {
  const [imageError, setImageError] = useState(false);
  
  if (!pool) return null;

  const {
    id,
    title,
    prize_name,
    prize_image,
    image_url,
    entry_fee,
    contribution_amount,
    target_amount,
    current_amount,
    status,
    end_date
  } = pool;

  // Get the actual entry fee and prize amount
  const entryFee = entry_fee || contribution_amount || 10;
  const prizeAmount = target_amount || 0;
  const isActive = status === 'active';
  const isCompleted = status === 'completed';

  // Calculate progress
  const progress = target_amount > 0 ? (current_amount / target_amount) * 100 : 0;

  // Format currency - FULL NUMBERS (no K or M)
  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return amount.toLocaleString();
  };

  // Get days left
  const getDaysLeft = () => {
    if (!end_date || isCompleted) return null;
    const days = Math.ceil((new Date(end_date) - new Date()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const daysLeft = getDaysLeft();

  // Get image source - try multiple possible fields
  const getImageSrc = () => {
    if (imageError) return null;
    return prize_image || image_url || null;
  };

  const imageSrc = getImageSrc();

  // Prize emoji based on type/name
  const getPrizeEmoji = () => {
    const name = (prize_name || title || '').toLowerCase();
    if (name.includes('car') || name.includes('vehicle') || name.includes('🚗')) return '🚗';
    if (name.includes('house') || name.includes('home') || name.includes('property')) return '🏠';
    if (name.includes('cash') || name.includes('money')) return '💰';
    if (name.includes('phone') || name.includes('electronics')) return '📱';
    if (name.includes('machinery') || name.includes('machine')) return '🏭';
    if (name.includes('gold') || name.includes('jewelry')) return '💎';
    if (name.includes('vip') || name.includes('merkato')) return '👑';
    if (name.includes('city')) return '🏙️';
    return '🎁';
  };

  return (
    <Link href={`/pools/${id}`} className="block h-full">
      <div className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col border ${
        featured ? 'border-green-500 ring-2 ring-green-500 ring-offset-2' : 'border-gray-100'
      }`}>
        
        {/* Prize Image */}
        <div className="relative w-full aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
          {imageSrc && !imageError ? (
            <img
              src={imageSrc}
              alt={prize_name || title || 'Prize'}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
              <span className="text-6xl mb-1">{getPrizeEmoji()}</span>
              <span className="text-xs text-gray-500 font-medium">{prize_name || 'Prize'}</span>
            </div>
          )}
          
          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-3 left-3 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10">
              ⭐ {language === 'am' ? 'ተለይቶ' : 'Featured'}
            </div>
          )}
          
          {/* Status Badge */}
          <div className={`absolute top-3 right-3 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10 ${
            isCompleted ? 'bg-green-600' : isActive ? 'bg-red-600 animate-pulse' : 'bg-gray-600'
          }`}>
            {isCompleted ? '✅ ' + (language === 'am' ? 'አሸንፏል' : 'Won') : 
             isActive ? '🔴 ' + (language === 'am' ? 'በስራ ላይ' : 'Live') : 
             '⏸️ ' + (language === 'am' ? 'አልቋል' : 'Ended')}
          </div>
          
          {/* Prize Amount Badge */}
          <div className="absolute bottom-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
            🏆 {formatCurrency(prizeAmount)} ETB
          </div>
          
          {/* Days Left */}
          {daysLeft !== null && daysLeft > 0 && isActive && (
            <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm z-10">
              ⏰ {daysLeft} {language === 'am' ? 'ቀናት ቀርተዋል' : 'days left'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-grow">
          {/* Prize Name */}
          <h3 className="text-base font-bold text-gray-800 line-clamp-1 mb-1">
            {prize_name || title || (language === 'am' ? 'ሽልማት' : 'Prize')}
          </h3>
          
          {/* Description */}
          {pool.description && (
            <p className="text-xs text-gray-500 line-clamp-1 mb-3">
              {pool.description}
            </p>
          )}

          {/* MAIN INFO: Pay → Win - Bilingual */}
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-3 mb-3 border border-green-100">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-[10px] text-gray-500 font-medium">🎫 {language === 'am' ? 'ክፈል' : 'Pay'}</div>
                <div className="text-lg font-bold text-green-700">
                  ETB {formatCurrency(entryFee)}
                </div>
              </div>
              
              <div className="text-2xl text-green-500 px-2">→</div>
              
              <div className="text-center flex-1">
                <div className="text-[10px] text-gray-500 font-medium">🏆 {language === 'am' ? 'አሸንፍ' : 'Win'}</div>
                <div className="text-lg font-bold text-orange-600">
                  ETB {formatCurrency(prizeAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {isActive && (
            <div className="mb-3">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>{language === 'am' ? 'እድገት' : 'Progress'}</span>
                <span>{Math.min(Math.round(progress), 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-teal-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Stats - Bilingual */}
          {isActive && (
            <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 mb-3">
              <div className="flex items-center gap-1">
                <span>👥</span>
                <span>{current_amount ? Math.floor(current_amount / entryFee) : 0} {language === 'am' ? 'ተቀላቅለዋል' : 'joined'}</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🎯</span>
                <span>{Math.floor(target_amount / entryFee)} {language === 'am' ? 'መቀመጫዎች' : 'seats'}</span>
              </div>
            </div>
          )}

          {/* Action Button - Bilingual */}
          <div className="mt-auto">
            {isCompleted ? (
              <div className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-center py-2.5 rounded-xl font-semibold text-sm">
                🏆 {language === 'am' ? 'አሸናፊ ታውቋል' : 'Winner Announced'}
              </div>
            ) : isActive ? (
              <button className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-2.5 rounded-xl font-semibold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98]">
                🎯 {language === 'am' ? 'አሁን ይቀላቀሉ' : 'Join Now'} - ETB {formatCurrency(entryFee)}
              </button>
            ) : (
              <div className="w-full bg-gray-400 text-white text-center py-2.5 rounded-xl font-semibold text-sm">
                ⏳ {language === 'am' ? 'በቅርቡ ይገኛል' : 'Coming Soon'}
              </div>
            )}
          </div>

          {/* Footer - Bilingual */}
          {isActive && (
            <p className="text-center text-[8px] text-gray-400 mt-2">
              💰 {language === 'am' ? 'የገንዘብ ዋስትና ተረጋግጧል' : 'Cash equivalent guaranteed'}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
