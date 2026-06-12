// frontend/components/BankingStyleView.js - COMPLETE WITH SEPARATE BACKGROUND IMAGE
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
    <div className="bg-gray-100 min-h-screen pb-24">
      
      {/* Hero Section - With Separate Background Image (No Overlay) */}
      <div 
        id="hero" 
        className="relative text-white pt-6 pb-10 px-4 m-3 rounded-2xl shadow-sm overflow-hidden"
        style={{ 
          backgroundImage: "url('/images/abbaa-carraa-bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#1a3c34'
        }}
      >
        {/* Content without overlay - text directly on background */}
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-sm border border-white/30 mb-4">
            🔥 Ethiopia's #1 Prize Platform 🏆
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 drop-shadow-lg">Abbaa Carraa</h1>
          <p className="text-white/95 text-sm px-4 mb-6 drop-shadow">
            {language === 'am' 
              ? 'መኪናዎችን፣ ቤቶችን እና ሌሎችንም በማህበረሰብ ቁጠባ ያሸንፉ!'
              : 'Win cars, houses, and more through community savings!'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={() => document.getElementById('merkato-vip')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md border border-emerald-500 active:scale-95 transition-transform hover:bg-emerald-700"
            >
              🏪 {language === 'am' ? 'መርካቶ VIP' : 'Merkato VIP'}
            </button>
            <button 
              onClick={() => document.getElementById('city-vip')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md border border-emerald-500 active:scale-95 transition-transform hover:bg-emerald-700"
            >
              🏙️ {language === 'am' ? 'የከተማ VIP' : 'City VIP'}
            </button>
            <button 
              onClick={() => document.getElementById('regular-pools')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md border border-emerald-500 active:scale-95 transition-transform hover:bg-emerald-700"
            >
              🏊 {language === 'am' ? 'መደበኛ የእጣ መደብ' : 'Regular Pools'}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 grid grid-cols-4 gap-2 mt-8">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center shadow-sm border border-white/30">
            <div className="text-lg">💰</div>
            <div className="font-bold text-white text-xs sm:text-sm">{Math.floor(stats.total_raised / 1000)}+K</div>
            <div className="text-[9px] sm:text-[10px] text-white/90 font-bold">{language === 'am' ? 'ተሰብስቧል' : 'Raised'}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center shadow-sm border border-white/30">
            <div className="text-lg">🏆</div>
            <div className="font-bold text-white text-xs sm:text-sm">{stats.total_winners}+</div>
            <div className="text-[9px] sm:text-[10px] text-white/90 font-bold">{language === 'am' ? 'አሸናፊዎች' : 'Winners'}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center shadow-sm border border-white/30">
            <div className="text-lg">🎯</div>
            <div className="font-bold text-white text-xs sm:text-sm">{stats.total_pools}+</div>
            <div className="text-[9px] sm:text-[10px] text-white/90 font-bold">{language === 'am' ? 'ንቁ' : 'Active'}</div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-2 text-center shadow-sm border border-white/30">
            <div className="text-lg">🏙️</div>
            <div className="font-bold text-white text-xs sm:text-sm">{uniqueCities.length}</div>
            <div className="text-[9px] sm:text-[10px] text-white/90 font-bold">{language === 'am' ? 'ከተሞች' : 'Cities'}</div>
          </div>
        </div>

        {/* Health Support Banner */}
        <div className="relative z-10 mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1.5 text-xs text-white shadow-sm border border-white/30">
            <span>💚</span>
            <span className="text-[10px] sm:text-xs font-bold">{language === 'am' ? '2% የኩላሊት እና የልብ ህመም ታማሚዎችን ይደግፋል' : '2% supports kidney & heart disease patients'}</span>
          </div>
        </div>

        {/* Description under Hero */}
        <div className="relative z-10 mt-6 text-center border-t border-white/30 pt-4">
          <p className="text-xs font-bold text-white drop-shadow">
            {language === 'am' 
              ? '✨ በAbbaa Carraa የማህበረሰብ ቁጠባ መድረክ ሽልማቶችን ያሸንፉ! እስከ 40 ሚሊዮን ብር የሚደርሱ ሽልማቶች ይጠብቁዎታል ✨'
              : '✨ Win amazing prizes through community savings! Prizes up to 40 Million ETB await you ✨'}
          </p>
        </div>
      </div>

      {/* Merkato VIP Section */}
      <div id="merkato-vip" className="px-4 py-2 scroll-mt-20">
        <div 
          onClick={() => window.location.href = '/merkato-vip'}
          className="relative bg-white rounded-xl p-4 text-gray-800 shadow-md border-2 border-gray-300 overflow-hidden cursor-pointer transform transition active:scale-[0.98]"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Merkato VIP</h2>
                <p className="text-[10px] text-gray-500 font-bold">የመርካቶ VIP ፕሮግራም</p>
              </div>
              <div className="flex gap-1">
                <span className="bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded text-[9px] font-bold border border-yellow-300">⭐ 1M</span>
                <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[9px] font-bold border border-purple-300">🏆 10M</span>
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-300">👑 40M</span>
              </div>
            </div>
            <p className="text-xs mt-2 font-bold text-center text-gray-700">
              {language === 'am' 
                ? '"ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው"'
                : '"Today, this week, and this month - let\'s make one participant a millionaire"'}
            </p>
            <div className="mt-3 text-center">
              <span className="inline-block bg-gray-800 text-white px-4 py-1.5 rounded-full text-xs font-bold active:scale-95 transition-transform border border-gray-600">
                {language === 'am' ? 'ይቀላቀሉ →' : 'Join Now →'}
              </span>
            </div>
            <p className="text-[10px] font-bold text-center text-gray-800 mt-3 pt-2 border-t border-gray-200 bg-yellow-50 p-2 rounded-lg">
              {language === 'am' 
                ? '🏆 በየቀኑ፣ በየሳምንቱ እና በየወሩ አንድ እድለኛ ተሳታፊ ሚሊየነር ይሆናል!'
                : '🏆 Every day, week, and month - one lucky participant becomes a millionaire!'}
            </p>
          </div>
        </div>
      </div>

      {/* City VIP Section */}
      <div id="city-vip" className="px-4 py-2 scroll-mt-20">
        <div className="bg-white rounded-xl p-4 shadow-md border-2 border-gray-300">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">City VIP Programs</h2>
              <p className="text-[10px] text-gray-500 font-bold">የከተማ VIP ፕሮግራም</p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="bg-gray-800 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 active:scale-95 transition-transform border border-gray-600"
              >
                🎯 {language === 'am' ? 'ከተማ ምረጡ' : 'Select'}
                <svg className={`w-3 h-3 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCityDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border-2 border-gray-300 z-50 overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b border-gray-200">
                      <input 
                        type="text" 
                        placeholder={language === 'am' ? '🔍 ከተማ ፈልግ...' : '🔍 Search city...'} 
                        value={citySearchTerm} 
                        onChange={(e) => setCitySearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
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
                            className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition border-b border-gray-200 last:border-0 flex items-center gap-2 cursor-pointer"
                          >
                            <span className="text-xl">{city.icon}</span>
                            <div className="flex-1">
                              <div className="font-bold text-gray-800 text-sm">
                                {getCityDisplayName(city)}
                              </div>
                              <div className="text-[10px] text-gray-400 font-bold">{city.prize}</div>
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
          
          {/* Prize Tiers */}
          <div className="grid grid-cols-5 gap-1 mt-4 pt-3 border-t-2 border-gray-200">
            <div className="text-center bg-gray-50 rounded-lg p-1 border border-gray-200">
              <div className="text-lg">🏆</div>
              <div className="text-gray-800 font-bold text-[10px]">1M ETB</div>
              <div className="text-[8px] text-gray-400 font-bold">{language === 'am' ? 'ዕለታዊ' : 'Daily'}</div>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-1 border border-gray-200">
              <div className="text-lg">⭐</div>
              <div className="text-gray-800 font-bold text-[10px]">10M ETB</div>
              <div className="text-[8px] text-gray-400 font-bold">{language === 'am' ? 'ሳምንታዊ' : 'Weekly'}</div>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-1 border border-gray-200">
              <div className="text-lg">👑</div>
              <div className="text-gray-800 font-bold text-[10px]">40M ETB</div>
              <div className="text-[8px] text-gray-400 font-bold">{language === 'am' ? 'ወርሃዊ' : 'Monthly'}</div>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-1 border border-gray-200">
              <div className="text-lg">📍</div>
              <div className="text-gray-800 font-bold text-[10px]">{uniqueCities.length}</div>
              <div className="text-[8px] text-gray-400 font-bold">{language === 'am' ? 'ከተሞች' : 'Cities'}</div>
            </div>
            <div className="text-center bg-gray-50 rounded-lg p-1 border border-gray-200">
              <div className="text-lg">🇪🇹</div>
              <div className="text-gray-800 font-bold text-[10px]">{language === 'am' ? 'ሁሉም' : 'All'}</div>
              <div className="text-[8px] text-gray-400 font-bold">{language === 'am' ? 'ክልሎች' : 'Regions'}</div>
            </div>
          </div>

          <p className="text-[10px] font-bold text-center text-gray-800 mt-3 pt-2 border-t border-gray-200 bg-yellow-50 p-2 rounded-lg">
            {language === 'am' 
              ? '🏙️ ዛሬ የከተማችንን ተሳታፊ ሚሊየነር እናድርገው! ይቀላቀሉ እና እስከ 40 ሚሊዮን ብር ያሸንፉ!'
              : '🏙️ Let\'s make our city participant a millionaire today! Join and win up to 40 Million ETB!'}
          </p>
        </div>
      </div>

      {/* Regular Pools Section */}
      <div id="regular-pools" className="px-4 py-2 scroll-mt-20">
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-300 overflow-hidden">
          <button 
            onClick={() => setShowRegularPools(!showRegularPools)}
            className="w-full bg-gray-50 p-4 text-gray-800 flex justify-between items-center active:bg-gray-100 transition border-b border-gray-200"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏊</span>
              <div className="text-left">
                <h3 className="font-bold text-sm">{language === 'am' ? 'መደበኛ የእጣ መደብ' : 'Regular Prize Pools'}</h3>
                <p className="text-[10px] text-gray-500 font-bold">{language === 'am' ? 'መኪናዎች፣ ቤቶች፣ ኤሌክትሮኒክስ እና ሌሎች' : 'Cars, Houses, Electronics & More'}</p>
              </div>
            </div>
            <svg className={`w-4 h-4 transition-transform ${showRegularPools ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showRegularPools && (
            <div className="p-3 bg-white">
              {/* Filter Buttons */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
                <button 
                  onClick={() => setRegularPoolFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${regularPoolFilter === 'all' ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                >
                  {language === 'am' ? 'ሁሉም' : 'All Pools'}
                </button>
                <button 
                  onClick={() => setRegularPoolFilter('lowToHigh')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${regularPoolFilter === 'lowToHigh' ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                >
                  {language === 'am' ? 'ውድ ወደ ርካሽ' : 'Low → High'}
                </button>
                <button 
                  onClick={() => setRegularPoolFilter('highToLow')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition border ${regularPoolFilter === 'highToLow' ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                >
                  {language === 'am' ? 'ርካሽ ወደ ውድ' : 'High → Low'}
                </button>
              </div>

              {/* Results Count */}
              <div className="text-[10px] text-gray-500 font-bold mb-3">
                {language === 'am' ? `${displayedPools.length} ንቁ የእጣ መደቦች` : `${displayedPools.length} active pools`}
              </div>

              {/* Pools Grid */}
              {displayedPools.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-300">
                  <div className="text-4xl mb-2">🏊</div>
                  <p className="text-gray-500 text-xs font-bold">{language === 'am' ? 'ምንም ንቁ የእጣ መደቦች የሉም' : 'No active pools'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedPools.slice(0, 10).map(pool => (
                    <div key={pool.id} className="bg-gray-50 rounded-xl p-3 shadow-sm border border-gray-300 active:scale-[0.98] transition-transform">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 text-sm">{pool.prize_name}</h4>
                          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2 font-bold">
                            {pool.description?.slice(0, 60)}...
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {pool.target_amount >= 1000000 && (
                              <span className="bg-yellow-100 text-yellow-800 text-[9px] px-1.5 py-0.5 rounded font-bold border border-yellow-300">💰 High Value</span>
                            )}
                            {pool.is_featured && (
                              <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.5 rounded font-bold border border-purple-300">⭐ Featured</span>
                            )}
                          </div>
                        </div>
                        {pool.is_featured && (
                          <span className="bg-yellow-400 text-gray-900 text-[9px] px-1.5 py-0.5 rounded-full ml-1 border border-yellow-500 font-bold">⭐</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                        <div>
                          <span className="text-gray-800 font-bold text-sm">ETB {(pool.entry_fee || 10).toLocaleString()}</span>
                          <span className="text-[9px] text-gray-400 ml-0.5 font-bold">{language === 'am' ? 'በአንድ መቀመጫ' : '/seat'}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-emerald-600">
                            {language === 'am' 
                              ? `እስከ ${(pool.target_amount || 0).toLocaleString()} ብር ያሸንፉ!`
                              : `Win up to ${(pool.target_amount || 0).toLocaleString()} ETB!`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {displayedPools.length > 10 && (
                <p className="text-center text-[10px] text-gray-400 font-bold mt-3">
                  +{displayedPools.length - 10} more pools available
                </p>
              )}

              <p className="text-[10px] font-bold text-center text-gray-800 mt-4 pt-3 border-t border-gray-200 bg-yellow-50 p-2 rounded-lg">
                {language === 'am' 
                  ? '🎁 መኪናዎችን፣ ቤቶችን፣ ማሽኖችን እና ሌሎችንም ያሸንፉ! ዛሬ ይሳተፉ!'
                  : '🎁 Win cars, houses, machinery, and more! Join today!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-6 px-4 mt-3 shadow-sm border-2 border-gray-300 rounded-xl mx-3">
        <h2 className="text-lg font-bold text-center mb-5 text-gray-800">
          {language === 'am' ? 'እንዴት እንሳተፋለን?' : 'How It Works'}
        </h2>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-gray-50 rounded-xl p-2 border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-base font-bold text-gray-600 border border-gray-300">1</div>
            <h3 className="font-bold text-xs mb-0.5 text-gray-700">{language === 'am' ? 'የእጣ መደብ ምረጡ' : 'Find a Pool'}</h3>
            <p className="text-[9px] text-gray-500 font-bold">{language === 'am' ? 'ይምረጡ' : 'Browse pools'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-base font-bold text-gray-600 border border-gray-300">2</div>
            <h3 className="font-bold text-xs mb-0.5 text-gray-700">{language === 'am' ? 'ክፍያ ይክፈሉ' : 'Contribute'}</h3>
            <p className="text-[9px] text-gray-500 font-bold">{language === 'am' ? 'በአስተማማኝ ሁኔታ' : 'Pay securely'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-2 border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-base font-bold text-gray-600 border border-gray-300">3</div>
            <h3 className="font-bold text-xs mb-0.5 text-gray-700">{language === 'am' ? 'ያሸንፉ' : 'Win!'}</h3>
            <p className="text-[9px] text-gray-500 font-bold">{language === 'am' ? 'ሽልማት ያግኙ' : 'Get prizes'}</p>
          </div>
        </div>
      </div>

      {/* Partner Program Section */}
      <div className="bg-yellow-50 text-gray-800 py-5 px-4 mt-2 mx-3 rounded-xl border border-yellow-300">
        <div className="text-center">
          <h2 className="text-base font-bold mb-1">{language === 'am' ? 'ተባባሪ ፕሮግራም' : 'Partner Program'}</h2>
          <p className="text-gray-600 text-[10px] mb-3 px-4 font-bold">{language === 'am' ? 'የአጋርነት ፕሮግራማችንን ይቀላቀሉ' : 'Join our partner program'}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => window.location.href = '/become-agent'} className="bg-gray-800 text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-transform border border-gray-600">
              🤝 {language === 'am' ? 'ወኪል ይሁኑ' : 'Agent'}
            </button>
            <button onClick={() => window.location.href = '/become-vendor'} className="bg-gray-800 text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-transform border border-gray-600">
              🏪 {language === 'am' ? 'ነጋዴ ይሁኑ' : 'Vendor'}
            </button>
            <button onClick={() => window.location.href = '/become-organization'} className="bg-gray-800 text-white px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 active:scale-95 transition-transform border border-gray-600">
              🏢 {language === 'am' ? 'ድርጅት ይሁኑ' : 'Org'}
            </button>
          </div>
          <div className="mt-3 text-[8px] text-gray-600 font-bold">
            <p>✓ No fees ✓ Earn 10% ✓ 24/7 support</p>
          </div>
          <p className="text-[9px] font-bold text-gray-700 mt-3 pt-2 border-t border-yellow-200">
            {language === 'am' 
              ? '💼 ወኪሎች፣ ነጋዴዎች እና ድርጅቶች ተቀላቀሉ እና ኮሚሽን ያግኙ!'
              : '💼 Agents, vendors, and organizations - join and earn commission!'}
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BankingBottomNav />
    </div>
  );
}
