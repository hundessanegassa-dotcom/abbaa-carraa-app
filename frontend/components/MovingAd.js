import { useState, useEffect } from 'react';

export default function MovingAd() {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const ads = [
    { text: "🎉 Join Abbaa Carraa today and win amazing prizes!", link: "/register" },
    { text: "🏆 Recent winner won a Toyota Vitz worth 650,000 ETB!", link: "/winners" },
    { text: "💰 Become an Agent and earn 10% commission!", link: "/agent/register" },
    { text: "🏭 Vendors: List your products as prizes!", link: "/vendor/register" },
    { text: "🎯 Over 1,000+ participants have joined our pools!", link: "/dashboard" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 overflow-hidden">
      <div className="container mx-auto px-4">
        <Link href={ads[currentIndex].link}>
          <div className="flex items-center justify-center gap-3 animate-pulse cursor-pointer">
            <span className="text-xl">📢</span>
            <p className="text-sm md:text-base font-medium">{ads[currentIndex].text}</p>
            <span className="text-sm underline">Learn More →</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
