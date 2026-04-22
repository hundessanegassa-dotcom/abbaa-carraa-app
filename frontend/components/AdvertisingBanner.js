import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function AdvertisingBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const ads = [
    {
      icon: "📢",
      title: "Advertise Here",
      description: "Reach thousands of potential customers. Promote your business on Abbaa Carraa!",
      buttonText: "Contact Us",
      buttonLink: "/contact"
    },
    {
      icon: "🏪",
      title: "Shop Promotion",
      description: "Get featured placement for your products. Limited slots available!",
      buttonText: "Learn More",
      buttonLink: "/vendor/register"
    },
    {
      icon: "🎯",
      title: "Target Audience",
      description: "Reach 10,000+ active users. Advertise with us today!",
      buttonText: "Get Started",
      buttonLink: "/contact"
    },
    {
      icon: "⭐",
      title: "Premium Listing",
      description: "Get your business featured at the top. Maximum visibility!",
      buttonText: "Upgrade Now",
      buttonLink: "/contact"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const currentAd = ads[currentIndex];

  return (
    <div className="space-y-4 my-4">
      {/* ONLY THIS BANNER SLIDES - Advertise Here */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-6 rounded-xl">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <span className="text-4xl mb-2 block animate-pulse">{currentAd.icon}</span>
              <h3 className="text-xl font-bold mb-1">{currentAd.title}</h3>
              <p className="text-sm opacity-90">{currentAd.description}</p>
            </div>
            <div>
              <Link href={currentAd.buttonLink}>
                <button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-2 rounded-full font-semibold transition border border-white/30">
                  {currentAd.buttonText} →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Dots for sliding ad only */}
      <div className="flex justify-center gap-2">
        {ads.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentIndex === idx ? 'w-6 bg-green-600' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>

      {/* STATIC BANNERS - These DO NOT slide */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-8 rounded-xl">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <span className="text-5xl mb-3 block">🎁</span>
              <h3 className="text-2xl font-bold mb-2">Special Promotion!</h3>
              <p className="text-sm opacity-90">Register today and get 10% bonus on your first pool creation</p>
            </div>
            <div className="flex-1">
              <span className="text-5xl mb-3 block">🏆</span>
              <h3 className="text-2xl font-bold mb-2">Winner's Circle</h3>
              <p className="text-sm opacity-90">See our recent winners and their amazing prizes</p>
            </div>
            <div>
              <Link href="/register">
                <button className="bg-white text-purple-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition">
                  Claim Offer →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
