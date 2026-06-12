// frontend/components/BankingStyleView.js - 100% MOBILE RESPONSIVE
import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import BankingBottomNav from './BankingBottomNav';

// Dynamic import for MovingAd (no SSR to avoid hydration issues)
const MovingAd = dynamic(() => import('./MovingAd'), { ssr: false, loading: () => null });

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
      
      {/* ========== BACKGROUND IMAGE BANNER - FULL WIDTH ========== */}
      <div className="w-full bg-gray-800">
        <img 
          src="/images/abbaa-carraa-bg.png" 
          alt="Abbaa Carraa Background" 
          className="w-full h-auto object-cover block"
          style={{ maxHeight: '200px', objectPosition: 'top center' }}
        />
      </div>

      {/* ========== MOVING AD ========== */}
      <MovingAd />

      {/* ========== HERO SECTION ========== */}
      <div id="hero" className="bg-white text-gray-800 pt-4 pb-6 px-3 mx-3 rounded-xl shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-[10px] font-bold shadow-sm border border-emerald-200 mb-3">
            🔥 Ethiopia's #1 Prize Platform 🏆
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1 text-gray-900">Abbaa Carraa</h1>
          <p className="text-gray-600 text-xs px-3 mb-4">
            {language === 'am' 
              ? 'መኪናዎችን፣ ቤቶችን እና ሌሎችንም በማህበረሰብ ቁጠባ ያሸንፉ!'
              : 'Win cars, houses, and more through community savings!'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button 
              onClick={() => document.getElementById('merkato-vip')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-md border border-emerald-500 active:scale-95 transition-transform hover:bg-emerald-700"
            >
              🏪 {language === 'am' ? 'መርካቶ VIP' : 'Merkato VIP'}
            </button>
            <button 
              onClick={() => document.getElementById('city-vip')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-md border border-emerald-500 active:scale-95 transition-transform hover:bg-emerald-700"
            >
              🏙️ {language === 'am' ? 'የከተማ VIP' : 'City VIP'}
            </button>
            <button 
              onClick={() => document.getElementById('regular-pools')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-emerald-600 text-white px-3 py-1.5 rounded-full text-[11px] font-semibold shadow-md border border-emerald-500 active:scale-95 transition-transform hover:bg-emerald-700"
            >
              🏊 {language === 'am' ? 'መደበኛ የእጣ መደብ' : 'Regular Pools'}
            </button>
          </div>
        </div>

        {/* Stats Row - Mobile Responsive Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
          <div className="bg-gray-50 rounded-lg p-1.5 text-center shadow-sm border border-gray-200">
            <div className="text-base">💰</div>
            <div className="font-bold text-gray-800 text-[11px]">{Math.floor(stats.total_raised / 1000)}+K</div>
            <div className="text-[8px] text-gray-500 font-bold">{language === 'am' ? 'ተሰብስቧል' : 'Raised'}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-1.5 text-center shadow-sm border border-gray-200">
            <div className="text-base">🏆</div>
            <div className="font-bold text-gray-800 text-[11px]">{stats.total_winners}+</div>
            <div className="text-[8px] text-gray-500 font-bold">{language === 'am' ? 'አሸናፊዎች' : 'Winners'}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-1.5 text-center shadow-sm border border-gray-200">
            <div className="text-base">🎯</div>
            <div className="font-bold text-gray-800 text-[11px]">{stats.total_pools}+</div>
            <div className="text-[8px] text-gray-500 font-bold">{language === 'am' ? 'ንቁ' : 'Active'}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-1.5 text-center shadow-sm border border-gray-200">
            <div className="text-base">🏙️</div>
            <div className="font-bold text-gray-800 text-[11px]">{uniqueCities.length}</div>
            <div className="text-[8px] text-gray-500 font-bold">{language === 'am' ? 'ከተሞች' : 'Cities'}</div>
          </div>
        </div>

        {/* Health Support Banner */}
        <div className="mt-3 text-center">
          <div className="inline-flex items-center gap-1 bg-emerald-50 rounded-full px-2 py-1 text-[9px] text-emerald-700 shadow-sm border border-emerald-200">
            <span>💚</span>
            <span className="font-bold">{language === 'am' ? '2% የኩላሊት እና የልብ ህመም ታማሚዎችን ይደግፋል' : '2% supports kidney & heart patients'}</span>
          </div>
        </div>

        {/* Description under Hero */}
        <div className="mt-4 text-center border-t border-gray-200 pt-3">
          <p className="text-[9px] font-bold text-gray-700">
            {language === 'am' 
              ? '✨ በAbbaa Carraa የማህበረሰብ ቁጠባ መድረክ ሽልማቶችን ያሸንፉ! እስከ 40 ሚሊዮን ብር የሚደርሱ ሽልማቶች ይጠብቁዎታል ✨'
              : '✨ Win amazing prizes through community savings! Prizes up to 40 Million ETB await you ✨'}
          </p>
        </div>
      </div>

      {/* Merkato VIP Section */}
      <div id="merkato-vip" className="px-3 py-1 scroll-mt-20">
        <div 
          onClick={() => window.location.href = '/merkato-vip'}
          className="relative bg-white rounded-xl p-3 text-gray-800 shadow-md border-2 border-gray-300 overflow-hidden cursor-pointer transform transition active:scale-[0.98]"
        >
          <div className="relative z-10">
            <div className="flex justify-between items-center flex-wrap gap-1">
              <div>
                <h2 className="text-sm font-bold text-gray-900">Merkato VIP</h2>
                <p className="text-[9px] text-gray-500 font-bold">የመርካቶ VIP ፕሮግራም</p>
              </div>
              <div className="flex gap-0.5">
                <span className="bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-[8px] font-bold border border-yellow-300">⭐ 1M</span>
                <span className="bg-purple-100 text-purple-800 px-1 py-0.5 rounded text-[8px] font-bold border border-purple-300">🏆 10M</span>
                <span className="bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded text-[8px] font-bold border border-emerald-300">👑 40M</span>
              </div>
            </div>
            <p className="text-[10px] mt-1.5 font-bold text-center text-gray-700">
              {language === 'am' 
                ? '"ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው"'
                : '"Today, this week, and this month - let\'s make one participant a millionaire"'}
            </p>
            <div className="mt-2 text-center">
              <span className="inline-block bg-gray-800 text-white px-3 py-1 rounded-full text-[10px] font-bold active:scale-95 transition-transform border border-gray-600">
                {language === 'am' ? 'ይቀላቀሉ →' : 'Join Now →'}
              </span>
            </div>
            <p className="text-[9px] font-bold text-center text-gray-800 mt-2 pt-1.5 border-t border-gray-200 bg-yellow-50 p-1.5 rounded-lg">
              {language === 'am' 
                ? '🏆 በየቀኑ፣ በየሳምንቱ እና በየወሩ አንድ እድለኛ ተሳታፊ ሚሊየነር ይሆናል!'
                : '🏆 Every day, week, and month - one lucky participant becomes a millionaire!'}
            </p>
          </div>
        </div>
      </div>

      {/* City VIP Section */}
      <div id="city-vip" className="px-3 py-1 scroll-mt-20">
        <div className="bg-white rounded-xl p-3 shadow-md border-2 border-gray-300">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-gray-900">City VIP</h2>
              <p className="text-[9px] text-gray-500 font-bold">የከተማ VIP ፕሮግራም</p>
              <p className="text-[8px] text-gray-400 font-bold mt-0.5">{uniqueCities.length}+ ከተሞች</p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="bg-gray-800 text-white px-2 py-1.5 rounded-lg text-[10px] font-semibold flex items-center gap-0.5 active:scale-95 transition-transform border border-gray-600"
              >
                🎯 {language === 'am' ? 'ከተማ ምረጡ' : 'Select'}
                <svg className={`w-2.5 h-2.5 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCityDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
                  <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-xl shadow-2xl border-2 border-gray-300 z-50 overflow-hidden">
                    <div className="p-2 bg-gray-50 border-b border-gray-200">
                      <input 
                        type="text" 
                        placeholder={language === 'am' ? '🔍 ከተማ ፈልግ...' : '🔍 Search city...'} 
                        value={citySearchTerm} 
                        onChange={(e) => setCitySearchTerm(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-gray-400"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {filteredCityList.length === 0 ? (
                        <div className="p-3 text-center text-gray-500 text-xs">{language === 'am' ? 'ምንም ከተሞች አልተገኙም' : 'No cities found'}</div>
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
                            className="w-full text-left px-2 py-2 hover:bg-gray-50 transition border-b border-gray-200 last:border-0 flex items-center gap-2 cursor-pointer"
                          >
                            <span className="text-lg">{city.icon}</span>
                            <div className="flex-1">
                              <div className="font-bold text-gray-800 text-xs">
                                {getCityDisplayName(city)}
                              </div>
                              <div className="text-[9px] text-gray-400 font-bold">{city.prize}</div>
                            </div>
                            <span className="text-gray-400 text-[10px]">→</span>
                          </a>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-1 mt-3 pt-2 border-t-2 border-gray-200">
            <div className="text-center bg-gray-50 rounded p-1 border border-gray-200">
              <div className="text-sm">🏆</div>
              <div className="text-gray-800 font-bold text-[8px]">1M</div>
              <div className="text-[7px] text-gray-400 font-bold">{language === 'am' ? 'ዕለታዊ' : 'Daily'}</div>
            </div>
            <div className="text-center bg-gray-50 rounded p-1 border border-gray-200">
              <div className="text-sm">⭐</div>
              <div className="text-gray-800 font-bold text-[8px]">10M</div>
              <div className="text-[7px] text-gray-400 font-bold">{language === 'am' ? 'ሳምንታዊ' : 'Weekly'}</div>
            </div>
            <div className="text-center bg-gray-50 rounded p-1 border border-gray-200">
              <div className="text-sm">👑</div>
              <div className="text-gray-800 font-bold text-[8px]">40M</div>
              <div className="text-[7px] text-gray-400 font-bold">{language === 'am' ? 'ወርሃዊ' : 'Monthly'}</div>
            </div>
            <div className="text-center bg-gray-50 rounded p-1 border border-gray-200">
              <div className="text-sm">📍</div>
              <div className="text-gray-800 font-bold text-[8px]">{uniqueCities.length}</div>
              <div className="text-[7px] text-gray-400 font-bold">{language === 'am' ? 'ከተሞች' : 'Cities'}</div>
            </div>
            <div className="text-center bg-gray-50 rounded p-1 border border-gray-200">
              <div className="text-sm">🇪🇹</div>
              <div className="text-gray-800 font-bold text-[8px]">{language === 'am' ? 'ሁሉም' : 'All'}</div>
              <div className="text-[7px] text-gray-400 font-bold">{language === 'am' ? 'ክልሎች' : 'Regions'}</div>
            </div>
          </div>

          <p className="text-[9px] font-bold text-center text-gray-800 mt-2 pt-1.5 border-t border-gray-200 bg-yellow-50 p-1.5 rounded-lg">
            {language === 'am' 
              ? '🏙️ ዛሬ የከተማችንን ተሳታፊ ሚሊየነር እናድርገው! እስከ 40 ሚሊዮን ብር ያሸንፉ!'
              : '🏙️ Make your city participant a millionaire today! Win up to 40M ETB!'}
          </p>
        </div>
      </div>

      {/* Regular Pools Section - FULLY CLICKABLE CARDS */}
      <div id="regular-pools" className="px-3 py-1 scroll-mt-20">
        <div className="bg-white rounded-xl shadow-md border-2 border-gray-300 overflow-hidden">
          <button 
            onClick={() => setShowRegularPools(!showRegularPools)}
            className="w-full bg-gray-50 p-3 text-gray-800 flex justify-between items-center active:bg-gray-100 transition border-b border-gray-200"
          >
            <div className="flex items-center gap-2">
              <span className="text-xl">🏊</span>
              <div className="text-left">
                <h3 className="font-bold text-xs">{language === 'am' ? 'መደበኛ የእጣ መደብ' : 'Regular Pools'}</h3>
                <p className="text-[9px] text-gray-500 font-bold">{language === 'am' ? 'መኪና፣ ቤት፣ ኤሌክትሮኒክስ' : 'Cars, Houses, Electronics'}</p>
              </div>
            </div>
            <svg className={`w-3.5 h-3.5 transition-transform ${showRegularPools ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showRegularPools && (
            <div className="p-2 bg-white">
              {/* Filter Buttons - Horizontal Scroll on Mobile */}
              <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 no-scrollbar">
                <button 
                  onClick={() => setRegularPoolFilter('all')}
                  className={`px-2 py-1 rounded-full text-[9px] font-semibold whitespace-nowrap transition border ${regularPoolFilter === 'all' ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                >
                  {language === 'am' ? 'ሁሉም' : 'All'}
                </button>
                <button 
                  onClick={() => setRegularPoolFilter('lowToHigh')}
                  className={`px-2 py-1 rounded-full text-[9px] font-semibold whitespace-nowrap transition border ${regularPoolFilter === 'lowToHigh' ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                >
                  {language === 'am' ? 'ውድ ወደ ርካሽ' : 'Low → High'}
                </button>
                <button 
                  onClick={() => setRegularPoolFilter('highToLow')}
                  className={`px-2 py-1 rounded-full text-[9px] font-semibold whitespace-nowrap transition border ${regularPoolFilter === 'highToLow' ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
                >
                  {language === 'am' ? 'ርካሽ ወደ ውድ' : 'High → Low'}
                </button>
              </div>

              {/* Results Count */}
              <div className="text-[9px] text-gray-500 font-bold mb-2">
                {language === 'am' ? `${displayedPools.length} ንቁ የእጣ መደቦች` : `${displayedPools.length} active pools`}
              </div>

              {/* Pools Grid - FULLY CLICKABLE CARDS with CTA Button */}
              {displayedPools.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-300">
                  <div className="text-3xl mb-1">🏊</div>
                  <p className="text-gray-500 text-[10px] font-bold">{language === 'am' ? 'ምንም ንቁ የእጣ መደቦች የሉም' : 'No active pools'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {displayedPools.slice(0, 10).map(pool => (
                    <div key={pool.id} className="bg-gray-50 rounded-xl p-2.5 shadow-sm border border-gray-300 transition hover:shadow-md">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-800 text-xs truncate">{pool.prize_name}</h4>
                          <p className="text-[9px] text-gray-500 mt-0.5 line-clamp-2">
                            {pool.description?.slice(0, 50)}...
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {pool.target_amount >= 1000000 && (
                              <span className="bg-yellow-100 text-yellow-800 text-[8px] px-1 py-0.5 rounded font-bold border border-yellow-300">💰 High Value</span>
                            )}
                            {pool.is_featured && (
                              <span className="bg-purple-100 text-purple-800 text-[8px] px-1 py-0.5 rounded font-bold border border-purple-300">⭐ Featured</span>
                            )}
                          </div>
                        </div>
                        {pool.is_featured && (
                          <span className="bg-yellow-400 text-gray-900 text-[8px] px-1 py-0.5 rounded-full border border-yellow-500 font-bold shrink-0">⭐</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-gray-200">
                        <div>
                          <span className="text-gray-800 font-bold text-[11px]">ETB {(pool.entry_fee || 10).toLocaleString()}</span>
                          <span className="text-[8px] text-gray-400 ml-0.5">{language === 'am' ? 'በአንድ መቀመጫ' : '/seat'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-bold text-emerald-600">
                            {language === 'am' 
                              ? `እስከ ${(pool.target_amount || 0).toLocaleString()} ብር`
                              : `Win up to ${(pool.target_amount || 0).toLocaleString()} ETB`}
                          </p>
                          <Link 
                            href={`/pools/${pool.id}`}
                            className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[9px] font-bold active:scale-95 transition-transform whitespace-nowrap"
                          >
                            {language === 'am' ? 'ይቀላቀሉ' : 'Join'} →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {displayedPools.length > 10 && (
                <p className="text-center text-[9px] text-gray-400 font-bold mt-2">
                  +{displayedPools.length - 10} more pools
                </p>
              )}

              <p className="text-[9px] font-bold text-center text-gray-800 mt-3 pt-2 border-t border-gray-200 bg-yellow-50 p-1.5 rounded-lg">
                {language === 'am' 
                  ? '🎁 መኪናዎችን፣ ቤቶችን፣ ማሽኖችን እና ሌሎችንም ያሸንፉ! ዛሬ ይሳተፉ!'
                  : '🎁 Win cars, houses, machinery, and more! Join today!'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-4 px-3 mt-2 shadow-sm border-2 border-gray-300 rounded-xl mx-3">
        <h2 className="text-sm font-bold text-center mb-3 text-gray-800">
          {language === 'am' ? 'እንዴት እንሳተፋለን?' : 'How It Works'}
        </h2>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold text-gray-600 border border-gray-300">1</div>
            <h3 className="font-bold text-[10px] mb-0.5 text-gray-700">{language === 'am' ? 'የእጣ መደብ ምረጡ' : 'Find a Pool'}</h3>
            <p className="text-[8px] text-gray-500">{language === 'am' ? 'ይምረጡ' : 'Browse'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold text-gray-600 border border-gray-300">2</div>
            <h3 className="font-bold text-[10px] mb-0.5 text-gray-700">{language === 'am' ? 'ክፍያ ይክፈሉ' : 'Contribute'}</h3>
            <p className="text-[8px] text-gray-500">{language === 'am' ? 'በአስተማማኝ ሁኔታ' : 'Pay'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-1.5 border border-gray-200">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold text-gray-600 border border-gray-300">3</div>
            <h3 className="font-bold text-[10px] mb-0.5 text-gray-700">{language === 'am' ? 'ያሸንፉ' : 'Win!'}</h3>
            <p className="text-[8px] text-gray-500">{language === 'am' ? 'ሽልማት ያግኙ' : 'Win'}</p>
          </div>
        </div>
      </div>

      {/* Partner Program Section */}
      <div className="bg-yellow-50 text-gray-800 py-4 px-3 mt-2 mx-3 rounded-xl border border-yellow-300">
        <div className="text-center">
          <h2 className="text-sm font-bold mb-0.5">{language === 'am' ? 'ተባባሪ ፕሮግራም' : 'Partner Program'}</h2>
          <p className="text-gray-600 text-[9px] mb-2 px-2 font-bold">{language === 'am' ? 'የአጋርነት ፕሮግራማችንን ይቀላቀሉ' : 'Join our partner program'}</p>
          <div className="flex flex-wrap justify-center gap-1.5">
            <button onClick={() => window.location.href = '/become-agent'} className="bg-gray-800 text-white px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-0.5 active:scale-95 transition-transform border border-gray-600">
              🤝 {language === 'am' ? 'ወኪል' : 'Agent'}
            </button>
            <button onClick={() => window.location.href = '/become-vendor'} className="bg-gray-800 text-white px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-0.5 active:scale-95 transition-transform border border-gray-600">
              🏪 {language === 'am' ? 'ነጋዴ' : 'Vendor'}
            </button>
            <button onClick={() => window.location.href = '/become-organization'} className="bg-gray-800 text-white px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-0.5 active:scale-95 transition-transform border border-gray-600">
              🏢 {language === 'am' ? 'ድርጅት' : 'Org'}
            </button>
          </div>
          <div className="mt-2 text-[7px] text-gray-600 font-bold">
            <p>✓ No fees ✓ Earn 10% ✓ 24/7 support</p>
          </div>
          <p className="text-[8px] font-bold text-gray-700 mt-2 pt-1.5 border-t border-yellow-200">
            {language === 'am' 
              ? '💼 ወኪሎች፣ ነጋዴዎች እና ድርጅቶች ተቀላቀሉ እና ኮሚሽን ያግኙ!'
              : '💼 Join as Agent, Vendor, or Organization - Earn commission!'}
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BankingBottomNav />
    </div>
  );
}
