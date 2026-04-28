import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function MovingAd() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const ads = [
    { text: t('moving_ad.join_today'), link: "/register" },
    { text: t('moving_ad.recent_winner'), link: "/winners" },
    { text: t('moving_ad.become_agent'), link: "/agent/register" },
    { text: t('moving_ad.vendor_opportunity'), link: "/vendor/register" },
    { text: t('moving_ad.participants'), link: "/dashboard" }
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
            <span className="text-sm underline">{t('moving_ad.learn_more')} →</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
