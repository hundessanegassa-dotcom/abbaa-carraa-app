// components/PoolProductCard.jsx
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';

export default function PoolProductCard({ 
  pool, 
  featured = false, 
  language = 'am',
  show3D = false 
}) {
  const [imageError, setImageError] = useState(false);
  const [showSeats, setShowSeats] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [seats, setSeats] = useState([]);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });
  const [imageLoading, setImageLoading] = useState(true);

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
    end_date,
    description
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

  // Get image source - PRIORITIZE prize_image, then image_url
  const getImageSrc = () => {
    if (imageError) return null;
    // Check if prize_image exists and is not empty
    if (prize_image && typeof prize_image === 'string' && prize_image.trim() !== '') {
      return prize_image;
    }
    if (image_url && typeof image_url === 'string' && image_url.trim() !== '') {
      return image_url;
    }
    return null;
  };

  const imageSrc = getImageSrc();

  // Prize emoji
  const getPrizeEmoji = useMemo(() => {
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
  }, [prize_name, title]);

  // ===== COUNTDOWN TIMER =====
  useEffect(() => {
    if (!end_date) return;
    
    const target = new Date(end_date).getTime();
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        secs: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [end_date]);

  // ===== SEAT SELECTION =====
  useEffect(() => {
    // Generate seat data (simulate available/booked)
    const totalSeats = Math.min(Math.floor((target_amount * 1.2) / entryFee), 50);
    const bookedCount = current_amount ? Math.floor(current_amount / entryFee) : 0;
    const bookedSeats = [];
    // Randomly book some seats for demo (you can replace with real data)
    for (let i = 0; i < Math.min(bookedCount, totalSeats); i++) {
      bookedSeats.push(i);
    }
    setSeats(Array.from({ length: totalSeats }, (_, i) => bookedSeats.includes(i)));
  }, [target_amount, entryFee, current_amount]);

  const toggleSeatSelection = () => setShowSeats(!showSeats);

  const handleSeatClick = (index) => {
    if (seats[index]) return; // already booked
    setSelectedSeat(selectedSeat === index ? null : index);
  };

  const confirmSeat = () => {
    if (selectedSeat === null) {
      alert(language === 'am' ? 'እባክዎ መቀመጫ ይምረጡ' : 'Please select a seat.');
      return;
    }
    alert(
      language === 'am' 
        ? `መቀመጫ ${selectedSeat + 1} ተረጋግጧል!` 
        : `Seat ${selectedSeat + 1} confirmed!`
    );
    setSeats(prev => prev.map((b, i) => i === selectedSeat ? true : b));
    setSelectedSeat(null);
    setShowSeats(false);
  };

  // Get status text based on language
  const getStatusText = () => {
    if (isCompleted) return language === 'am' ? 'አሸንፏል' : 'Won';
    if (isActive) return language === 'am' ? 'በስራ ላይ' : 'Live';
    return language === 'am' ? 'አልቋል' : 'Ended';
  };

  const getStatusEmoji = () => {
    if (isCompleted) return '✅';
    if (isActive) return '🔴';
    return '⏸️';
  };

  // Calculate total seats
  const totalSeats = Math.min(Math.floor((target_amount * 1.2) / entryFee), 50);
  const participants = current_amount ? Math.floor(current_amount / entryFee) : 0;
  const soldTickets = Math.min(participants, totalSeats);

  // ===== 3D TRANSFORM =====
  const get3DTransform = () => {
    if (!show3D) return 'none';
    return 'perspective(800px) rotateY(5deg) scale(1.01)';
  };

  return (
    <Link href={`/pools/${id}`} className="block h-full">
      <div 
        className={`
          max-w-sm w-full 
          bg-gradient-to-br from-green-300 via-green-400 to-emerald-500 
          rounded-3xl p-5 
          shadow-2xl shadow-green-300/50 
          text-white 
          relative overflow-hidden 
          transition-all duration-300 
          hover:scale-[1.02] hover:shadow-green-400/60
          border border-green-200
          h-full flex flex-col
          ${featured ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}
        `}
        style={{
          transform: get3DTransform(),
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glowing animation background */}
        <div className="absolute inset-0 bg-gradient-to-t from-green-200/20 to-transparent animate-pulse pointer-events-none" />
        
        {/* Featured Badge */}
        {featured && (
          <div className="absolute top-3 left-3 z-20 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            ⭐ {language === 'am' ? 'ተለይቶ' : 'Featured'}
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 z-20 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg ${
          isCompleted ? 'bg-green-700' : isActive ? 'bg-red-600 animate-pulse' : 'bg-gray-600'
        }`}>
          {getStatusEmoji()} {getStatusText()}
        </div>

        {/* Product Image - OPTIMIZED with Next.js Image component */}
        <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-lg mb-4 z-10 bg-gradient-to-br from-green-200 to-emerald-300">
          {imageSrc && !imageError ? (
            <>
              {/* Loading skeleton */}
              {imageLoading && (
                <div className="absolute inset-0 bg-gradient-to-r from-green-200 via-green-300 to-green-200 animate-pulse" />
              )}
              
              {/* Optimized Image with Next.js */}
              <Image
                src={imageSrc}
                alt={prize_name || title || 'Prize'}
                fill
                className={`
                  object-cover transition-transform duration-500 hover:scale-105
                  ${imageLoading ? 'opacity-0' : 'opacity-100'}
                `}
                sizes="(max-width: 400px) 100vw, 400px"
                quality={75}
                priority={featured}
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k="
                onLoadingComplete={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-7xl mb-2">{getPrizeEmoji}</span>
              <span className="text-sm font-medium text-white drop-shadow-md">
                {prize_name || (language === 'am' ? 'ሽልማት' : 'Prize')}
              </span>
            </div>
          )}
          
          {/* Prize Amount Badge on Image */}
          <div className="absolute bottom-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg z-10">
            🏆 {formatCurrency(prizeAmount)} ETB
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-center drop-shadow-md mb-1 z-10 line-clamp-1">
          {prize_name || title || (language === 'am' ? 'ሽልማት' : 'Prize')}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-xs text-center text-white/80 mb-2 z-10 line-clamp-2">
            {description}
          </p>
        )}

        {/* Countdown Timer */}
        {end_date && isActive && (
          <div className="bg-black/30 backdrop-blur-sm rounded-full py-1.5 px-4 text-center font-mono text-lg font-bold tracking-wider z-10 mb-2">
            {String(timeLeft.days).padStart(2, '0')}d 
            {String(timeLeft.hours).padStart(2, '0')}h 
            {String(timeLeft.mins).padStart(2, '0')}m 
            {String(timeLeft.secs).padStart(2, '0')}s
          </div>
        )}

        {/* Sold Tickets */}
        <div className="text-center text-sm opacity-90 z-10 mb-3">
          🎟️ {language === 'am' ? 'ተሽጧል' : 'Sold'}: <span className="font-semibold">{soldTickets}</span> / {totalSeats} {language === 'am' ? 'ቲኬቶች' : 'tickets'}
        </div>

        {/* Buy & Seat Buttons */}
        <div className="flex flex-wrap gap-3 justify-center z-10 mt-auto">
          <Link href={`/pools/${id}`} className="flex-1 min-w-[140px]">
            <button className="w-full bg-white text-green-700 font-bold py-3 px-4 rounded-full shadow-md hover:bg-gray-100 transition transform hover:scale-105 active:scale-95">
              💰 {language === 'am' ? 'ግዛ' : 'Buy'} ETB {formatCurrency(entryFee)}
            </button>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              toggleSeatSelection();
            }}
            className="flex-1 min-w-[100px] bg-white/20 backdrop-blur-sm border-2 border-white/60 font-semibold py-3 px-4 rounded-full hover:bg-white/30 transition transform hover:scale-105 active:scale-95"
          >
            {showSeats ? '🔽' : '💺'} {showSeats ? (language === 'am' ? 'ዝጋ' : 'Hide') : (language === 'am' ? 'መቀመጫ' : 'Seat')}
          </button>
        </div>

        {/* Seat Selection Panel - ALL SEATS WITH LIGHT GREEN BACKGROUND */}
        {showSeats && (
          <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-2xl p-4 z-10" onClick={(e) => e.preventDefault()}>
            <p className="text-center mb-3 text-sm font-medium text-white">
              {language === 'am' ? 'መቀመጫ ይምረጡ' : 'Choose your seat'}
            </p>
            
            {/* Seat Grid - Each seat has light green background */}
            <div className="grid grid-cols-6 gap-2">
              {seats.map((booked, idx) => (
                <div
                  key={idx}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSeatClick(idx);
                  }}
                  className={`
                    text-center py-2 rounded-lg cursor-pointer text-sm font-semibold transition-all duration-200
                    ${booked 
                      ? 'bg-gray-400/50 text-gray-300 cursor-not-allowed line-through' 
                      : selectedSeat === idx 
                        ? 'bg-green-700 text-white shadow-lg scale-105 ring-2 ring-white' 
                        : 'bg-green-200 text-green-900 hover:bg-green-300 hover:scale-105'
                    }
                  `}
                >
                  {idx + 1}
                </div>
              ))}
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-4 mt-3 text-xs text-white/80">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-200 rounded"></div>
                <span>{language === 'am' ? 'ነፃ' : 'Available'}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-700 rounded ring-1 ring-white"></div>
                <span>{language === 'am' ? 'የተመረጠ' : 'Selected'}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-400/50 rounded"></div>
                <span>{language === 'am' ? 'የተያዘ' : 'Booked'}</span>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                confirmSeat();
              }}
              className="w-full mt-3 bg-green-300 text-green-800 font-bold py-2.5 rounded-full hover:bg-green-200 transition transform hover:scale-105 active:scale-95 shadow-lg"
            >
              ✅ {language === 'am' ? 'አረጋግጥ' : 'Confirm Seat'}
            </button>
          </div>
        )}

        {/* Progress Bar (optional) */}
        {isActive && (
          <div className="mt-3 z-10">
            <div className="w-full bg-black/20 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-white/60 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-[8px] opacity-70 mt-2 z-10">
          💰 {language === 'am' ? 'የገንዘብ ዋስትና ተረጋግጧል' : 'Cash equivalent guaranteed'}
        </p>
      </div>
    </Link>
  );
}
