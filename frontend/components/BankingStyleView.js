// frontend/components/BankingStyleView.js - FULLY MOBILE OPTIMIZED
import { useState } from 'react';
import Link from 'next/link';
import BankingBottomNav from './BankingBottomNav';

export default function BankingStyleView({ 
  pools, 
  stats, 
  uniqueCities, 
  onRegisterClick,
  language = 'am'
}) {
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [regularPoolFilter, setRegularPoolFilter] = useState('all');
  const [showRegularPools, setShowRegularPools] = useState(true);

  const filteredCityList = uniqueCities.filter(city => 
    city.name.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
    city.nameEn.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
    city.region.toLowerCase().includes(citySearchTerm.toLowerCase())
  );

  const getFilteredPools = () => {
    let filtered = [...pools];
    switch (regularPoolFilter) {
      case 'lowToHigh': 
        filtered.sort((a, b) => (a.entry_fee || 0) - (b.entry_fee || 0)); 
        break;
      case 'highToLow': 
        filtered.sort((a, b) => (b.entry_fee || 0) - (a.entry_fee || 0)); 
        break;
      default: 
        break;
    }
    return filtered;
  };

  const displayedPools = getFilteredPools();

  const getCityDisplayName = (city) => {
    if (language === 'en') return city.nameEn;
    return city.name;
  };

  const getCityDescription = (city) => {
    if (language === 'en') return city.descriptionEn;
    return city.descriptionAm;
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-24">
      
      {/* Hero Section - Mobile Optimized */}
      <div id="hero" className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 pt-6 pb-10 px-4">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm mb-4">
            🔥 Ethiopia's #1 Prize Platform 🏆
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900">Abbaa Carraa</h1>
          <p className="text-gray-600 text-sm px-4 mb-6">
            {language === 'am' 
              ? 'መኪናዎችን፣ ቤቶችን እና ሌሎችንም በማህበረሰብ ቁጠባ ያሸንፉ!'
              : 'Win cars, houses, and more through community savings!'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={() => document.getElementById('merkato-vip')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-gray-800 px-5 py-2.5 rounded-full text-sm font-semibold shadow-md border border-gray-200 active:scale-95 transition-transform"
            >
              🏪 {language === 'am' ? 'መርካቶ ቪአይፒ' : 'Merkato VIP'}
            </button>
            <button 
              onClick={() => document.getElementById('city-vip')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-gray-800 px-5 py-2.5 rounded-full text-sm font-semibold shadow-md border border-gray-200 active:scale-95 transition-transform"
            >
              🏙️ {language === 'am' ? 'የከተማ ቪአይፒ' : 'City VIP'}
            </button>
            <button 
              onClick={() => document.getElementById('regular-pools')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gray-800 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md active:scale-95 transition-transform"
            >
              🏊 {language === 'am' ? 'መደበኛ የእጣ መደብ' : 'Regular Pools'}
            </button>
          </div>
        </div>

        {/* Stats Row - Mobile Optimized Grid */}
        <div className="grid grid-cols-4 gap-2 mt-8">
          <div className="bg-white rounded-xl p-2 text-center shadow-sm">
            <div className="text-lg">💰</div>
            <div className="font-bold text-gray-800 text-xs sm:text-sm">{Math.floor(stats.total_raised / 1000)}+K</div>
            <div className="text-[9px] sm:text-[10px] text-gray-500">{language === 'am' ? 'ተሰብስቧል' : 'Raised'}</div>
          </div>
          <div className="bg-white rounded-xl p-2 text-center shadow-sm">
            <div className="text-lg">🏆</div>
            <div className="font-bold text-gray-800 text-xs sm:text-sm">{stats.total_winners}+</div>
            <div className="text-[9px] sm:text-[10px] text-gray-500">{language === 'am' ? 'አሸናፊዎች' : 'Winners'}</div>
          </div>
          <div className="bg-white rounded-xl p-2 text-center shadow-sm">
            <div className="text-lg">🎯</div>
            <div className="font-bold text-gray-800 text-xs sm:text-sm">{stats.total_pools}+</div>
            <div className="text-[9px] sm:text-[10px] text-gray-500">{language === 'am' ? 'ንቁ' : 'Active'}</div>
          </div>
          <div className="bg-white rounded-xl p-2 text-center shadow-sm">
            <div className="text-lg">🏙️</div>
            <div className="font-bold text-gray-800 text-xs sm:text-sm">{uniqueCities.length}</div>
            <div className="text-[9px] sm:text-[10px] text-gray-500">{language === 'am' ? 'ከተሞች' : 'Cities'}</div>
          </div>
        </div>

        {/* Health Support Banner - Mobile Optimized */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 rounded-full px-3 py-1.5 text-xs text-gray-600 shadow-sm">
            <span>💚</span>
            <span className="text-[10px] sm:text-xs">{language === 'am' ? '2% የኩላሊት እና የልብ ህመም ታማሚዎችን ይደግፋል' : '2% supports kidney & heart disease patients'}</span>
          </div>
        </div>
      </div>

      {/* Merkato VIP Section - Mobile Card */}
      <div id="merkato-vip" className="px-4 py-4 scroll-mt-20">
        <div 
          onClick={() => window.location.href = '/merkato-vip'}
          className="relative bg-white rounded-xl p-4 text-gray-800 shadow-md border border-gray-100 overflow-hidden cursor-pointer transform transition active:scale-[0.98]"
        >
          <div className="absolute -top-5 -left-5 text-6xl opacity-10">🏪</div>
          <div className="relative z-10">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Merkato VIP</h2>
                <p className="text-[10px] text-gray-500">የመርካቶ ቪአይፒ ፕሮግራም</p>
              </div>
              <div className="flex gap-1">
                <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[9px] font-bold">⭐ 1M</span>
                <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[9px] font-bold">🏆 10M</span>
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold">👑 40M</span>
              </div>
            </div>
            <p className="text-xs mt-2 font-semibold text-center text-gray-700">
              {language === 'am' 
                ? '"ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው"'
                : '"Today, this week, and this month - let\'s make one participant a millionaire"'}
            </p>
            <div className="mt-3 text-center">
              <span className="inline-block bg-gray-800 text-white px-4 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-transform">
                {language === 'am' ? 'ይቀላቀሉ →' : 'Join Now →'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* City VIP Section - Mobile Optimized */}
      <div id="city-vip" className="px-4 py-2 scroll-mt-20">
        <div className="bg-white rounded-xl p-4 shadow-md border border-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">City VIP Programs</h2>
              <p className="text-[10px] text-gray-500">
                {language === 'am' 
                  ? `${uniqueCities.length}+ የኢትዮጵያ ከተሞች`
                  : `${uniqueCities.length}+ Ethiopian cities`}
              </p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="bg-gray-800 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-transform"
              >
                🎯 {language === 'am' ? 'ከተማ ምረጡ' : 'Select'}
                <svg className={`w-3 h-3 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCityDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b">
                      <input 
                        type="text" 
                        placeholder={language === 'am' ? '🔍 ከተማ ፈልግ...' : '🔍 Search city...'} 
                        value={citySearchTerm} 
                        onChange={(e) => setCitySearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {filteredCityList.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">{language === 'am' ? 'ምንም ከተሞች አልተገኙም' : 'No cities found'}</div>
                      ) : (
                        filteredCityList.slice(0, 30).map(city => (
                          <a 
                            key={city.id} 
                            href={`/cities/${city.id}`}
                            onClick={(e) => { 
                              e.preventDefault(); 
                              setShowCityDropdown(false); 
                              setCitySearchTerm(''); 
                              window.location.href = `/cities/${city.id}`; 
                            }}
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition border-b last:border-0 flex items-center gap-2 cursor-pointer"
                          >
                            <span className="text-xl">{city.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 text-sm">
                                {getCityDisplayName(city)}
                              </div>
                              <div className="text-[10px] text-gray-400">{city.prize}</div>
                            </div>
                            <span className="text-gray-400 text-xs">→</span>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Prize Tiers - Mobile Grid */}
          <div className="grid grid-cols-5 gap-1 mt-4 pt-3 border-t border-gray-100">
            <div className="text-center">
              <div className="text-lg">🏆</div>
              <div className="text-gray-800 font-bold text-[10px]">1M</div>
              <div className="text-[8px] text-gray-400">{language === 'am' ? 'ዕለታዊ' : 'Daily'}</div>
            </div>
            <div className="text-center">
              <div className="text-lg">⭐</div>
              <div className="text-gray-800 font-bold text-[10px]">10M</div>
              <div className="text-[8px] text-gray-400">{language === 'am' ? 'ሳምንታዊ' : 'Weekly'}</div>
            </div>
            <div className="text-center">
              <div className="text-lg">👑</div>
              <div className="text-gray-800 font-bold text-[10px]">40M</div>
              <div className="text-[8px] text-gray-400">{language === 'am' ? 'ወርሃዊ' : 'Monthly'}</div>
            </div>
            <div className="text-center">
              <div className="text-lg">📍</div>
              <div className="text-gray-800 font-bold text-[10px]">{uniqueCities.length}</div>
              <div className="text-[8px] text-gray-400">{language === 'am' ? 'ከተሞች' : 'Cities'}</div>
            </div>
            <div className="text-center">
              <div className="text-lg">🇪🇹</div>
              <div className="text-gray-800 font-bold text-[10px]">{language === 'am' ? 'ሁሉም' : 'All'}</div>
              <div className="text-[8px] text-gray-400">{language === 'am' ? 'ክልሎች' : 'Regions'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Regular Pools Section - Mobile Optimized */}
      <div id="regular-pools" className="px-4 py-2 scroll-mt-20">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <button 
            onClick={() => setShowRegularPools(!showRegularPools)}
            className="w-full bg-gray-50 p-4 text-gray-800 flex justify-between items-center active:bg-gray-100 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏊</span>
              <div className="text-left">
                <h3 className="font-bold text-sm">{language === 'am' ? 'መደበኛ የእጣ መደብ' : 'Regular Prize Pools'}</h3>
                <p className="text-[10px] text-gray-500">{language === 'am' ? 'መኪናዎች፣ ቤቶች፣ ኤሌክትሮኒክስ' : 'Cars, Houses, Electronics'}</p>
              </div>
            </div>
            <svg className={`w-4 h-4 transition-transform ${showRegularPools ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showRegularPools && (
            <div className="p-3 bg-white">
              {/* Filter Buttons - Horizontal Scroll on Mobile */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                <button 
                  onClick={() => setRegularPoolFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${regularPoolFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {language === 'am' ? 'ሁሉም' : 'All Pools'}
                </button>
                <button 
                  onClick={() => setRegularPoolFilter('lowToHigh')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${regularPoolFilter === 'lowToHigh' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {language === 'am' ? 'ውድ ወደ ርካሽ' : 'Low → High'}
                </button>
                <button 
                  onClick={() => setRegularPoolFilter('highToLow')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${regularPoolFilter === 'highToLow' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {language === 'am' ? 'ርካሽ ወደ ውድ' : 'High → Low'}
                </button>
              </div>

              {/* Results Count */}
              <div className="text-[10px] text-gray-500 mb-3">
                {language === 'am' ? `${displayedPools.length} ንቁ የእጣ መደቦች` : `${displayedPools.length} active pools`}
              </div>

              {/* Pools Grid - Mobile Optimized Cards */}
              {displayedPools.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <div className="text-4xl mb-2">🏊</div>
                  <p className="text-gray-500 text-xs">{language === 'am' ? 'ምንም ንቁ የእጣ መደቦች የሉም' : 'No active pools'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedPools.slice(0, 10).map(pool => (
                    <div key={pool.id} className="bg-gray-50 rounded-xl p-3 shadow-sm active:scale-[0.98] transition-transform">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-sm">{pool.prize_name}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                            {pool.description?.slice(0, 60)}...
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {pool.target_amount >= 1000000 && (
                              <span className="bg-yellow-100 text-yellow-800 text-[9px] px-1.5 py-0.5 rounded">💰 High Value</span>
                            )}
                            {pool.is_featured && (
                              <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.5 rounded">⭐ Featured</span>
                            )}
                          </div>
                        </div>
                        {pool.is_featured && (
                          <span className="bg-yellow-400 text-gray-900 text-[9px] px-1.5 py-0.5 rounded-full ml-1">⭐</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                        <div>
                          <span className="text-gray-800 font-bold text-sm">ETB {(pool.entry_fee || 10).toLocaleString()}</span>
                          <span className="text-[9px] text-gray-400 ml-0.5">{language === 'am' ? 'በአንድ መቀመጫ' : '/seat'}</span>
                        </div>
                        <Link href={`/pools/${pool.id}`} className="bg-gray-800 text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold active:scale-95 transition-transform">
                          {language === 'am' ? 'ይቀላቀሉ' : 'Join'} →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {displayedPools.length > 10 && (
                <p className="text-center text-[10px] text-gray-400 mt-3">
                  +{displayedPools.length - 10} more pools available
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* How It Works Section - Mobile Optimized */}
      <div className="bg-white py-6 px-4 mt-3 shadow-sm border-t border-gray-100">
        <h2 className="text-lg font-bold text-center mb-5 text-gray-800">
          {language === 'am' ? 'እንዴት እንሳተፋለን?' : 'How It Works'}
        </h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-base font-bold text-gray-600">1</div>
            <h3 className="font-semibold text-xs mb-0.5 text-gray-700">{language === 'am' ? 'የእጣ መደብ ምረጡ' : 'Find a Pool'}</h3>
            <p className="text-[9px] text-gray-500">{language === 'am' ? 'ይምረጡ' : 'Browse'}</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-base font-bold text-gray-600">2</div>
            <h3 className="font-semibold text-xs mb-0.5 text-gray-700">{language === 'am' ? 'ክፍያ ይክፈሉ' : 'Contribute'}</h3>
            <p className="text-[9px] text-gray-500">{language === 'am' ? 'በአስተማማኝ ሁኔታ' : 'Securely'}</p>
          </div>
          <div>
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-base font-bold text-gray-600">3</div>
            <h3 className="font-semibold text-xs mb-0.5 text-gray-700">{language === 'am' ? 'ያሸንፉ' : 'Win!'}</h3>
            <p className="text-[9px] text-gray-500">{language === 'am' ? 'ሽልማት ያግኙ' : 'Win prizes'}</p>
          </div>
        </div>
      </div>

      {/* Partner Program Section - Mobile Optimized */}
      <div className="bg-gray-800 text-white py-6 px-4 mt-2">
        <div className="text-center">
          <h2 className="text-base font-bold mb-1">{language === 'am' ? 'ተባባሪ ፕሮግራም' : 'Partner Program'}</h2>
          <p className="text-gray-300 text-[10px] mb-3 px-4">{language === 'am' ? 'የአጋርነት ፕሮግራማችንን ይቀላቀሉ' : 'Join our partner program'}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => window.location.href = '/become-agent'} className="bg-gray-700 text-white px-3 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1 active:scale-95 transition-transform">
              🤝 {language === 'am' ? 'ወኪል ይሁኑ' : 'Agent'}
            </button>
            <button onClick={() => window.location.href = '/become-vendor'} className="bg-gray-700 text-white px-3 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1 active:scale-95 transition-transform">
              🏪 {language === 'am' ? 'ነጋዴ ይሁኑ' : 'Vendor'}
            </button>
            <button onClick={() => window.location.href = '/become-organization'} className="bg-gray-700 text-white px-3 py-1.5 rounded-full text-[10px] font-semibold flex items-center gap-1 active:scale-95 transition-transform">
              🏢 {language === 'am' ? 'ድርጅት ይሁኑ' : 'Org'}
            </button>
          </div>
          <div className="mt-3 text-[8px] text-gray-400">
            <p>✓ No fees ✓ Earn 10% ✓ 24/7 support</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BankingBottomNav />
    </div>
  );
}
