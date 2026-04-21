import Link from 'next/link';

export default function PoolCard({ pool, featured = false }) {
  const progress = pool.target_amount > 0 
    ? (pool.current_amount / pool.target_amount) * 100 
    : 0;

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden ${featured ? 'ring-2 ring-green-500' : ''}`}>
      {featured && (
        <div className="bg-green-600 text-white text-center py-1 text-sm font-semibold">
          ⭐ Featured Pool
        </div>
      )}
      
      {pool.image_url && (
        <div className="h-48 w-full overflow-hidden">
          <img 
            src={pool.image_url} 
            alt={pool.prize_name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <div className="p-5">
        <h3 className="text-xl font-bold mb-2 text-gray-800 line-clamp-1">
          {pool.prize_name}
        </h3>
        
        <p className="text-gray-600 mb-4 text-sm line-clamp-2 min-h-[40px]">
          {pool.description || 'Join this pool for a chance to win!'}
        </p>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-green-600">{progress.toFixed(1)}%</span>
          </div>
          <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Target:</span>
            <span className="font-bold text-gray-800">
              ETB {pool.target_amount?.toLocaleString() || 0}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Contribution:</span>
            <span className="font-bold text-green-600">
              ETB {pool.contribution_amount?.toLocaleString() || 0}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Raised:</span>
            <span className="font-semibold text-gray-800">
              ETB {pool.current_amount?.toLocaleString() || 0}
            </span>
          </div>
          
          {pool.discount_for_non_winners > 0 && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-700">
                🎁 Don't win? Get {pool.discount_for_non_winners}% discount!
              </p>
            </div>
          )}
        </div>
        
        <Link href={`/pools/${pool.id}`}>
          <button className="w-full mt-5 bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200">
            Join This Pool
          </button>
        </Link>
      </div>
    </div>
  );
}
