// components/MovingMarquee.js
import React from 'react';

export default function MovingMarquee() {
  const marqueeText = `🏆 በPrizeHub Ethiopia ወርቃማ እድልን ያሸንፉ! • 🥈 Silver: 100 ETB (1200 Seats) • 🥇 Gold: 500 ETB (1200 Seats) • 💎 Platinum: 1,000 ETB (2400 Seats) • 💠 Diamond: 2,500 ETB (2400 Seats) • 👑 Royal: 5,000 ETB (2400 Seats) • 🏪 Merkato VIP & 🏙️ City VIP Available! • 💚 2% Supports Health • Join & Start Winning Today! 🎯`;

  return (
    <div className="w-full overflow-hidden bg-gradient-to-r from-green-600 to-teal-600 py-2.5 md:py-3 shadow-inner relative z-50">
      <div className="whitespace-nowrap animate-marquee-slow" style={{ display: 'inline-block' }}>
        <span className="text-white font-semibold text-[11px] md:text-sm tracking-wide px-4">{marqueeText}</span>
      </div>
      <style jsx>{`
        @keyframes marquee-slow {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-slow {
          animation: marquee-slow 45s linear infinite;
          will-change: transform;
        }
        .animate-marquee-slow:hover { animation-play-state: paused; }
      `}</style>
    </div>
  );
}
