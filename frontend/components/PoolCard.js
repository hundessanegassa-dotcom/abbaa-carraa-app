import Link from 'next/link';

// Helper function to format the date nicely
function formatDate(dateString) {
  if (!dateString) return 'Not set';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Helper function to calculate days remaining
function getDaysRemaining(endDate) {
  if (!endDate) return null;
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function PoolCard({ pool, featured = false }) {
  // Calculate progress
  const progress = pool.target_amount > 0 
    ? (pool.current_amount / pool.target_amount) * 100 
    : 0;
  const daysRemaining = getDaysRemaining(pool.end_date);

  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden ${featured ? 'ring-2 ring-green-500' : ''}`}>
      
      {/* Image Section - NEW */}
      {pool.image_url ? (
        <div className="relative h-48 w-full overflow-hidden bg-gray-100">
          <img 
            src={pool.image_url} 
            alt={pool.prize_name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {featured && (
            <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-md">
              ⭐ Featured
            </div>
          )}
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-r from-green-100 to-blue-100 flex items-center justify-center">
          <span className="text-5xl">🎁</span>
        </div>
      )}
      
      <div className="p-5">
        <h3 className="text-xl font-bold mb-2 text-gray-800 line-clamp-1">{pool.prize_name}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2 min-h-[48px] text-sm">
          {pool.description || 'Join this pool for a chance to win!'}
        </p>
        
        <div className="space-y-3">
          {/* Progress Bar */}
          <div>
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
          
          {/* Target Amount */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-semibold">Target Amount:</span>
            <span className="font-bold text-gray-800">ETB {pool.target_amount?.toLocaleString() || 0}</span>
          </div>
          
          {/* Contribution Amount */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-semibold">Contribution:</span>
            <span className="font-bold text-green-600">ETB {pool.contribution_amount?.toLocaleString() || 0}</span>
          </div>

          {/* Current Amount */}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-semibold">Raised:</span>
            <span className="font-semibold text-gray-800">ETB {pool.current_amount?.toLocaleString() || 0}</span>
          </div>

          {/* Discount Badge for Supplier Pools */}
          {pool.discount_for_non_winners > 0 && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 font-semibold">🎁 Don't win? Get {pool.discount_for_non_winners}% discount!</p>
              <p className="text-xs text-blue-600">Purchase from supplier at discounted price</p>
            </div>
          )}

          {/* Date Display Section */}
          <div className="border-t border-gray-100 pt-3 mt-2">
            {/* Start Date */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">📅 Started:</span>
              <span className="font-semibold text-gray-700">{formatDate(pool.start_date)}</span>
            </div>
            
            {/* Days Remaining */}
            {daysRemaining !== null && daysRemaining !== undefined && (
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">⏰ Days Left:</span>
                <span className={`font-semibold ${daysRemaining < 7 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                  {daysRemaining > 0 ? `${daysRemaining} days` : '🎉 Draw Today!'}
                </span>
              </div>
            )}
            
            {/* End Date */}
            {pool.end_date && (
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Draw Date:</span>
                <span>{formatDate(pool.end_date)}</span>
              </div>
            )}
          </div>
        </div>
        
        <Link href={`/pools/${pool.id}`}>
          <button className="w-full mt-5 bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-all duration-200 transform hover:scale-[1.02]">
            🎯 Join This Pool
          </button>
        </Link>
      </div>
    </div>
  );
}
