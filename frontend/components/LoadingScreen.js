// components/LoadingScreen.js
import { useState, useEffect } from 'react';

export default function LoadingScreen({ onLoadingComplete }) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('መጫን ጀምሯል...');
  const [currentFact, setCurrentFact] = useState(0);
  const [isClient, setIsClient] = useState(false);

  // Fascinating facts about Abbaa Carraa - Regular Pools + Merkato VIP
  const facts = [
    { am: '🏊 በየቀኑ አዳዲስ ፑሎች ይከፈታሉ!', en: 'New pools open every day!' },
    { am: '💚 በየቀኑ አንድ ተሳታፊ ሚሊየነር እናደርጋለን!', en: 'We make ONE participant a MILLIONAIRE every day!' },
    { am: '🏆 እስከ 40,000,000 ብር ድረስ ማሸነፍ ይቻላል!', en: 'Win up to 40,000,000 ETB!' },
    { am: '🎯 እንደ እኩብ አሰራር ነገር ግን ዘመናዊ እና ግልጽ!', en: 'Like Equb but modern & transparent!' },
    { am: '⭐ ዕለታዊ ሽልማት 1,000,000 ብር!', en: 'Daily prize of 1,000,000 ETB!' },
    { am: '🏆 ሳምንታዊ ሽልማት 10,000,000 ብር!', en: 'Weekly prize of 10,000,000 ETB!' },
    { am: '👑 ወርሃዊ ሽልማት 40,000,000 ብር!', en: 'Monthly prize of 40,000,000 ETB!' },
    { am: '🤝 ከ7,100 በላይ ንግዶች እና 13,000 ሰራተኞች ተቀላቅለዋል', en: '7,100+ businesses and 13,000+ workers have joined!' },
    { am: '💚 2% የልብ እና የኩላሊት ህሙማን ይደገፋል', en: '2% supports heart & kidney patients!' },
    { am: '🏪 መርካቶ VIP - ለሁሉም ክፍት ነው!', en: 'Merkato VIP - Open to ALL!' },
    { am: '🎟️ እያንዳንዱ ተሳታፊ ዲጂታል እጣ ያገኛል!', en: 'Every participant gets a Digital Ticket!' },
  ];

  // Mark when component is on client side to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            if (onLoadingComplete) onLoadingComplete();
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 300);

    // Rotate facts every 2.5 seconds
    const factInterval = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % facts.length);
    }, 2500);

    // Update loading text based on progress
    const textInterval = setInterval(() => {
      setProgress(currentProgress => {
        if (currentProgress < 30) {
          setLoadingText('🚀 እየተዘጋጀ ነው...');
        } else if (currentProgress < 60) {
          setLoadingText('⚡ ፑሎችን እና ሽልማቶችን እያዘጋጀን ነው...');
        } else if (currentProgress < 90) {
          setLoadingText('🎯 አሸናፊዎችን እያዘጋጀን ነው...');
        } else {
          setLoadingText('🎉 እንኳን ደህና መጡ!');
        }
        return currentProgress;
      });
    }, 500);

    return () => {
      clearInterval(interval);
      clearInterval(factInterval);
      clearInterval(textInterval);
    };
  }, [isClient, onLoadingComplete]);

  // Generate particles only on client side to avoid hydration mismatch
  const particles = isClient ? [...Array(20)].map((_, i) => ({
    id: i,
    width: Math.random() * 100 + 50,
    height: Math.random() * 100 + 50,
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 10,
  })) : [];

  // Don't render during SSR, just return null
  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-green-900 via-teal-800 to-emerald-900 flex flex-col items-center justify-center p-4">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bg-white/10 rounded-full animate-float"
            style={{
              width: particle.width + 'px',
              height: particle.height + 'px',
              left: particle.left + '%',
              top: particle.top + '%',
              animationDelay: particle.delay + 's',
              animationDuration: particle.duration + 's',
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-md w-full">
        {/* Rotating Object */}
        <div className="relative w-44 h-44 mx-auto mb-8">
          <div className="absolute inset-0 animate-spin-slow">
            <div className="w-full h-full rounded-full border-4 border-yellow-400/30 border-t-yellow-400 border-r-yellow-400/50"></div>
          </div>
          <div className="absolute inset-2 animate-spin-slow-reverse">
            <div className="w-full h-full rounded-full border-4 border-green-400/30 border-b-green-400 border-l-green-400/50"></div>
          </div>
          <div className="absolute inset-4 animate-spin-slow">
            <div className="w-full h-full rounded-full border-4 border-orange-400/20 border-r-orange-400 border-t-orange-400/50"></div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center animate-pulse-slow">
            <div className="text-7xl animate-rotate-center">🎁</div>
          </div>
          <div className="absolute inset-6 rounded-full bg-yellow-500/20 animate-ping"></div>
        </div>

        {/* Brand Name */}
        <div className="mb-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 animate-fade-in">
            Abbaa Carraa
          </h1>
          <div className="flex items-center justify-center gap-2 text-yellow-300 text-sm">
            <span>🎫</span>
            <span>Ethiopian Digital እጣ</span>
            <span>🎫</span>
          </div>
        </div>

        {/* Tagline */}
        <div className="mb-6">
          <p className="text-green-200 text-sm md:text-base animate-slide-up">
            &quot;አንድን ተሳታፊ ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር ሚሊየነር እናድርገው&quot;
          </p>
          <p className="text-green-300 text-xs mt-1">
            &quot;Let&apos;s make one participant a millionaire today, this week and this month&quot;
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2 mb-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-yellow-400 via-orange-500 to-green-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Loading Text */}
        <p className="text-white/80 text-sm mb-4 animate-pulse">
          {loadingText}
        </p>

        {/* Progress Percentage */}
        <p className="text-yellow-300 text-xs font-mono">
          {Math.floor(Math.min(progress, 100))}%
        </p>

        {/* Rotating Facts */}
        <div className="mt-8 p-4 bg-white/10 backdrop-blur rounded-xl border border-white/20 animate-fade-in">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-yellow-300 text-sm">✨</span>
            <p className="text-yellow-200 text-xs font-semibold">ይህን ያውቃሉ?</p>
            <span className="text-yellow-300 text-sm">✨</span>
          </div>
          <p className="text-white text-sm font-medium">{facts[currentFact].am}</p>
          <p className="text-green-300 text-xs mt-1">{facts[currentFact].en}</p>
        </div>

        {/* What We Offer */}
        <div className="mt-6 grid grid-cols-2 gap-2 text-center">
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-lg">🏊</div>
            <p className="text-[10px] text-white/70">Regular Pools</p>
            <p className="text-[8px] text-green-300">ዕለታዊ ሽልማት</p>
          </div>
          <div className="bg-white/5 rounded-lg p-2">
            <div className="text-lg">🏪</div>
            <p className="text-[10px] text-white/70">Merkato VIP</p>
            <p className="text-[8px] text-yellow-300">እስከ 40M ብር</p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex flex-wrap justify-center gap-3 text-[10px] text-white/50">
          <span className="flex items-center gap-1">✓ በብሎክቼይን የተረጋገጠ</span>
          <span className="flex items-center gap-1">✓ 24/7 ድጋፍ</span>
          <span className="flex items-center gap-1">✓ ግልጽ እና አስተማማኝ</span>
          <span className="flex items-center gap-1">✓ ዲጂታል እጣ</span>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes rotate-center {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        @keyframes float {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          50% { opacity: 0.3; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
        .animate-spin-slow-reverse { animation: spin-slow-reverse 3s linear infinite; }
        .animate-rotate-center { animation: rotate-center 3s ease-in-out infinite; }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .animate-slide-up { animation: slide-up 0.6s ease-out; }
        .animate-pulse-slow { animation: pulse-slow 1.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
