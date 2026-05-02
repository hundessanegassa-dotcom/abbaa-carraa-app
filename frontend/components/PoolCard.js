import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import WinnerModal from './WinnerModal';

export default function PoolCard({ pool, featured = false }) {
  const { t } = useTranslation();
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  const progress = (pool.current_amount / pool.target_amount) * 100;
  const isCompleted = pool.status === 'completed' && pool.winner_id;
  const isActive = pool.status === 'active';

  const formatPrice = (price) => {
    return price?.toLocaleString() || '0';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      vehicle: '🚗',
      machinery: '🏭',
      electronics: '💻',
      property: '🏠',
      furniture: '🛋️',
      other: '🎁'
    };
    return icons[category] || '🎁';
  };

  return (
    <>
      <div 
        className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 ${
          featured ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
        }`}
      >
        {/* Image Section */}
        <div className="relative h-48 overflow-hidden">
          {pool.image_url ? (
            <img 
              src={pool.image_url} 
              alt={pool.prize_name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
              <span className="text-6xl">{getCategoryIcon(pool.category)}</span>
            </div>
          )}
          
          {/* Featured Badge */}
          {featured && (
            <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              ⭐ {t('pools.featured') || 'Featured'}
            </div>
          )}
          
          {/* Status Badge */}
          {isCompleted ? (
            <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              ✅ {t('common.completed')}
            </div>
          ) : isActive ? (
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              🔴 {t('common.active')}
            </div>
          ) : (
            <div className="absolute top-2 left-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
              ⏸️ {t('common.pending')}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4">
          {/* Prize Name */}
          <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1">
            {pool.prize_name}
          </h3>
          
          {/* Description */}
          <p className="text-gray-500 text-sm mb-3 line-clamp-2">
            {pool.description || t('pools.join_now')}
          </p>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{t('pools.progress')}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-green-600' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>

          {/* Pool Stats */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{t('pools.target_amount')}:</span>
              <span className="font-semibold">ETB {formatPrice(pool.target_amount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{t('pools.current_amount')}:</span>
              <span className="font-semibold text-green-600">ETB {formatPrice(pool.current_amount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{t('pools.entry_fee')}:</span>
              <span className="font-semibold">ETB {formatPrice(pool.contribution_amount)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">{t('pools.participants')}:</span>
              <span className="font-semibold">{pool.participants_count || 0}</span>
            </div>
            {pool.end_date && !isCompleted && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">{t('pools.days_left')}:</span>
                <span className="font-semibold text-orange-600">
                  {Math.max(0, Math.ceil((new Date(pool.end_date) - new Date()) / (1000 * 60 * 60 * 24)))} {t('pools.days_left')}
                </span>
              </div>
            )}
          </div>

          {/* Action Button */}
          {isCompleted ? (
            <button
              onClick={() => setShowWinnerModal(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2"
            >
              🏆 {t('common.view_winners')}
            </button>
          ) : isActive ? (
            <Link href={`/pools/${pool.id}`}>
              <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2">
                🎯 {t('pools.join_now')}
              </button>
            </Link>
          ) : (
            <button
              disabled
              className="w-full bg-gray-400 text-white py-2 rounded-lg font-semibold cursor-not-allowed"
            >
              ⏳ {t('common.coming_soon')}
            </button>
          )}

          {/* Cash Equivalent Guarantee Badge */}
          {isActive && (
            <div className="mt-3 text-center">
              <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <span>💰</span> {t('pools.cash_equivalent')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Winner Modal */}
      <WinnerModal
        poolId={pool.id}
        isOpen={showWinnerModal}
        onClose={() => setShowWinnerModal(false)}
      />
    </>
  );
}
