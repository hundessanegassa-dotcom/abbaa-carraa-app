import Link from 'next/link';
import { useState, useEffect } from 'react';

const AD_SLIDES = [
  { id: 1, title: 'Win Houses & Heavy Machinery! 🚗🏠', desc: 'Join regular pools and secure your physical assets today. Under abbaa carraa ethiopia shop, vendors list cars with CBE escrow.', image: '🚗', promo: 'Regular Pools', bgColor: 'bg-green-50 border-green-200', textAccent: 'text-green-600', badgeColor: 'bg-green-100 text-green-800 border-green-200', linkUrl: '/listings', ctaText: 'Join Regular Pools →' },
  { id: 2, title: 'Win up to 40 Million Birr! 🏪🏆', desc: 'Secure your seats in Merkato VIP. Draws are held across daily, weekly, and monthly draws with high seats capability.', image: '🏪', promo: 'Merkato VIP', bgColor: 'bg-yellow-50 border-yellow-200', textAccent: 'text-yellow-600', badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200', linkUrl: '/merkato-vip', ctaText: 'Enter Merkato VIP →' },
  { id: 3, title: 'Win Cash up to 10 Million Birr! 🏙️💎', desc: 'Join City VIP across 94 major cities in Ethiopia. Play in Silver, Gold, Platinum, Diamond, or Royal tiers.', image: '🏙️', promo: 'City VIP', bgColor: 'bg-blue-50 border-blue-200', textAccent: 'text-blue-600', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200', linkUrl: '/cities', ctaText: 'Explore City VIP →' },
  { id: 4, title: 'Earn 10% Partner Commissions! 🤝💵', desc: 'Become an authorized Agent, Vendor, or Organizer. Bring clients to City VIP & Merkato VIP and earn 50% of the platform generated fees!', image: '🤝', promo: 'Partner Program', bgColor: 'bg-purple-50 border-purple-200', textAccent: 'text-purple-600', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200', linkUrl: '/become-agent', ctaText: 'Apply as Partner →' },
  { id: 5, title: 'Open Your Shop & Set CBE/Telebirr! 🏪🏦', desc: 'Create private custom pools for your members, secure them under your own CBE escrow, CBE Birr and Telebirr direct configuration settings!', image: '🏪', promo: 'Open Your Shop', bgColor: 'bg-rose-50 border-rose-200', textAccent: 'text-rose-600', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200', linkUrl: '/become-creator', ctaText: 'Create Your Shop →' },
  { id: 6, title: 'Register Instant Google & Telebirr Login! 📱💚', desc: 'Register or login securely in one-tap using Google Auth, Telebirr OTP, or your verified phone number.', image: '📱', promo: 'Google & Telebirr', bgColor: 'bg-teal-50 border-teal-200', textAccent: 'text-teal-600', badgeColor: 'bg-teal-100 text-teal-800 border-teal-200', linkUrl: '/login', ctaText: 'Login / Register →' },
  { id: 7, title: 'Verified Escrow Escrow Protection! 🔒📁', desc: 'All payments and draws are verified with verified CBE bank accounts. Get clear digital tickets for your seats instantly!', image: '🔒', promo: 'CBE Escrow', bgColor: 'bg-emerald-50 border-emerald-200', textAccent: 'text-emerald-600', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200', linkUrl: '/listings', ctaText: 'View Escrow Pools →' },
  { id: 8, title: 'Organization Pools For Members! 🏢👥', desc: 'Are you an internal organizer? Create specialized private pools for your organization members and collect custom fees safely.', image: '🏢', promo: 'Organization Pool', bgColor: 'bg-violet-50 border-violet-200', textAccent: 'text-violet-600', badgeColor: 'bg-violet-100 text-violet-800 border-violet-200', linkUrl: '/become-organization', ctaText: 'Apply as Organizer →' },
  { id: 9, title: '2% Charity Support for Health Patients! 💚🏥', desc: '2% of all platform commissions are directly donated to kidney & heart disease patients under abbaa carraa sub-brand.', image: '🏥', promo: 'Health Charity', bgColor: 'bg-red-50 border-red-200', textAccent: 'text-red-600', badgeColor: 'bg-red-100 text-red-800 border-red-200', linkUrl: '/about', ctaText: 'View Charity Goals →' },
  { id: 10, title: '100% Optimized Digital Seat selection! 🎟️💺', desc: 'Experience theater-style seat selections showing all seats dynamically. Secure up to five seats per pool instantly.', image: '🎟', promo: 'Theater Seats', bgColor: 'bg-cyan-50 border-cyan-200', textAccent: 'text-cyan-600', badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200', linkUrl: '/tickets', ctaText: 'View My Tickets →' }
];

export default function AdvertisingBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % AD_SLIDES.length);
    }, 6000); // 6 seconds for better reading
    return () => clearInterval(interval);
  }, []);

  const slide = AD_SLIDES[currentIndex];

  return (
    <div className="my-10 px-4 max-w-4xl mx-auto">
      {/* Label above banner */}
      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-center mb-2 animate-pulse">
        📢 Premium Sponsor Advertising Spot
      </p>

      <div className={`${slide.bgColor} text-gray-800 rounded-3xl overflow-hidden shadow-md border transition-all duration-500`}>
        <div className="flex flex-col md:flex-row min-h-[220px]">
          {/* Static Left Icon or Picture representing the ad category */}
          <div className="md:w-1/3 bg-white/40 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-gray-300/30">
            <span className="text-7xl mb-2 filter drop-shadow-md animate-bounce">{slide.image}</span>
            <span className={`${slide.badgeColor} border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
              {slide.promo}
            </span>
          </div>

          {/* Right Ad Message Content */}
          <div className="md:w-2/3 p-8 flex flex-col justify-between bg-white/20">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className={`text-xs font-bold ${slide.textAccent} uppercase tracking-wider`}>TAKE ACTION NOW</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                {slide.title}
              </h3>
              <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                {slide.desc}
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href={slide.linkUrl}
                className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white text-center py-2.5 rounded-xl font-bold transition text-xs sm:text-sm shadow-md"
              >
                {slide.ctaText}
              </Link>
              <Link href="/contact" className="flex-1 bg-white hover:bg-gray-50 text-gray-700 text-center py-2.5 rounded-xl font-semibold transition text-xs sm:text-sm border border-gray-200">
                Contact Ad Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* 10 Dot Indicators */}
      <div className="flex justify-center gap-2.5 mt-4">
        {AD_SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentIndex === idx ? 'w-8 bg-green-600' : 'w-2 bg-gray-300'
            }`}
            title={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}