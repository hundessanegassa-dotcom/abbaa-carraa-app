import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function PoolCard({ pool, featured = false }) {
  const { t } = useTranslation();
  
  const progress = pool.target_amount > 0 
    ? (pool.current_amount / pool.target_amount) * 100 
    : 0;

  const getRemainingDays = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const remainingDays = getRemainingDays(pool.end_date);
  const isEndingSoon = remainingDays > 0 && remainingDays < 7;

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden ${featured ? 'ring-2 ring-green-500' : ''}`}>
      {/* Image Section */}
      <div className="relative h-36 sm:h-44 md:h-48 w-full overflow-hidden bg-gray-100">
        {pool.image_url ? (
          <img 
            src={pool.image_url} 
            alt={pool.prize_name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
            <span className="text-3xl">🎁</span>
          </div>
        )}
        {featured && (
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full">
            ⭐ {t('pools.featured_pools')}
          </div>
        )}
        {remainingDays > 0 && (
          <div className={`absolute bottom-2 left-2 text-white text-xs px-2 py-0.5 rounded-full ${isEndingSoon ? 'bg-red-500' : 'bg-black/50'}`}>
            {isEndingSoon ? `🔥 ${remainingDays} ${t('pools.days_left')}` : `${remainingDays} ${t('pools.days_left')}`}
          </div>
        )}
      </div>
      
      <div className="p-3 sm:p-4">
        <h3 className="text-sm sm:text-base md:text-lg font-bold mb-1 text-gray-800 line-clamp-1">
          {pool.prize_name}
        </h3>
        
        <p className="text-xs text-gray-500 mb-2 line-clamp-2 min-h-[32px]">
          {pool.description || t('pools.join_now')}
        </p>
        
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-0.5">
            <span className="text-gray-500">{t('pools.progress')}</span>
            <span className="font-semibold text-green-600">{progress.toFixed(0)}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-green-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-2 text-xs">
          <span className="text-gray-500">{t('pools.entry_fee')}:</span>
          <span className="font-bold text-green-600">ETB {pool.contribution_amount?.toLocaleString() || 0}</span>
        </div>
        
        <Link href={`/pools/${pool.id}`}>
          <button className="w-full mt-2 bg-green-600 text-white py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm hover:bg-green-700 transition-all duration-200">
            {t('common.join')} 🎯
          </button>
        </Link>
      </div>
    </div>
  );
}
