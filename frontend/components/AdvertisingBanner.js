import Link from 'next/link';
import { useState, useEffect } from 'react';

const AD_SLIDES = [
  { id: 1, title: 'Advertise Here • Your Business in Merkato', desc: 'Reach 7,100+ businesses and 94 Ethiopian cities today.', image: '🏢', promo: 'Premium Ad Spot 1' },
  { id: 2, title: 'Advertise Here • Target City VIP Players', desc: 'Promote your heavy machinery, properties, or premium services.', image: '🏙️', promo: 'Premium Ad Spot 2' },
  { id: 3, title: 'Advertise Here • Feature Your Vehicles', desc: 'Sponsor the next pool and grow your direct dealership sales.', image: '🚗', promo: 'Premium Ad Spot 3' },
  { id: 4, title: 'Advertise Here • Heavy Construction Machinery', desc: 'Showcase excavators, rollers, loaders to qualified corporate buyers.', image: '🏗️', promo: 'Premium Ad Spot 4' },
  { id: 5, title: 'Advertise Here • Premium Real Estate & Homes', desc: 'Feature luxury villas, modern apartments, or land plots.', image: '🏠', promo: 'Premium Ad Spot 5' },
  { id: 6, title: 'Advertise Here • Agricultural Equipment', desc: 'Directly target farmers, associations, and commercial entities.', image: '🚜', promo: 'Premium Ad Spot 6' },
  { id: 7, title: 'Advertise Here • Premium Electronics & Mobile Deals', desc: 'The easiest way to market high-tier laptops, phones, and devices.', image: '💻', promo: 'Premium Ad Spot 7' },
  { id: 8, title: 'Advertise Here • Food & Commodity Imports', desc: 'Promote wholesale imports directly to verified Merkato merchants.', image: '🌾', promo: 'Premium Ad Spot 8' },
  { id: 9, title: 'Advertise Here • Financial & Micro-saving Services', desc: 'Introduce corporate savings and credit programs to our audience.', image: '🏦', promo: 'Premium Ad Spot 9' },
  { id: 10, title: 'Advertise Here • Logistics & Cargo Services', desc: 'Deliver swift shipping solutions directly to Ethiopian retailers.', image: '🚛', promo: 'Premium Ad Spot 10' }
];

export default function AdvertisingBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % AD_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const slide = AD_SLIDES[currentIndex];

  return (
    <div className="my-10 px-4 max-w-4xl mx-auto">
      {/* Label above banner */}
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-2">
        📢 Premium Sponsor Advertising Spot
      </p>

      <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white rounded-3xl overflow-hidden shadow-2xl border border-gray-700/50 transition-all duration-500 hover:shadow-emerald-500/10 hover:border-emerald-500/20">
        <div className="flex flex-col md:flex-row min-h-[220px]">
          {/* Static Left Icon or Picture representing the ad category */}
          <div className="md:w-1/3 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-gray-700/30">
            <span className="text-7xl mb-2 filter drop-shadow-md animate-bounce">{slide.image}</span>
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {slide.promo}
            </span>
          </div>

          {/* Right Ad Message Content */}
          <div className="md:w-2/3 p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">ADVERTISE WITH US</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {slide.title}
              </h3>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                {slide.desc}
              </p>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:hundessanegassa@gmail.com?subject=Advertise%20on%20PrizeHub%20Ethiopia"
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-center py-2.5 rounded-xl font-bold transition text-xs sm:text-sm shadow-md"
              >
                Advertise Here Now →
              </a>
              <Link href="/contact" className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-center py-2.5 rounded-xl font-semibold transition text-xs sm:text-sm border border-gray-700">
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
              currentIndex === idx ? 'w-8 bg-emerald-500' : 'w-2 bg-gray-700'
            }`}
            title={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}