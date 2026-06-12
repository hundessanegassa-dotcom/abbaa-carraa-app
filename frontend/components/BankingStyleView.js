// frontend/components/BankingStyleView.js - FIXED REACT ERROR #31
import { useState } from 'react';
import Link from 'next/link';
import BankingBottomNav from './BankingBottomNav';

export default function BankingStyleView({ 
  pools, 
  stats, 
  uniqueCities, 
  onRegisterClick,
  language = 'am',
  t,
  changeLanguage
}) {
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [regularPoolFilter, setRegularPoolFilter] = useState('all');
  const [showRegularPools, setShowRegularPools] = useState(true);
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Safe text getter - ensures we always return a string
  const getText = (key, defaultValue = '') => {
    const value = t?.[key];
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      // If it's an object, try to get the language-specific version
      return value[language] || defaultValue || key;
    }
    return defaultValue || key;
  };

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

  // Helper function to get city display name based on language
  const getCityDisplayName = (city) => {
    if (language === 'en') return city.nameEn;
    return city.name;
  };

  const getCityDescription = (city) => {
    if (language === 'en') return city.descriptionEn;
    return city.descriptionAm;
  };

  // Available languages for selector
  const availableLanguages = {
    en: { name: 'English', flag: '🇬🇧' },
    am: { name: 'አማርኛ', flag: '🇪🇹' },
    om: { name: 'Oromoo', flag: '🇪🇹' },
    so: { name: 'Soomaali', flag: '🇸🇴' },
    ti: { name: 'ትግርኛ', flag: '🇪🇹' }
  };

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Section */}
      <div id="hero" className="bg-gradient-to-br from-emerald-700 to-teal-700 text-white pt-8 pb-12 px-5">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold mb-4">
            🔥 Ethiopia's #1 Prize Platform 🏆
          </div>
          <h1 className="text-3xl font-bold mb-2">Abbaa Carraa</h1>
          <p className="text-emerald-100 text-sm mb-6">
            Win cars, houses, machinery, electronics, and more through community savings!
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={() => document.getElementById('merkato-vip')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-yellow-500 text-gray-900 px-5 py-2 rounded-full text-sm font-semibold shadow-lg"
            >
              🏪 Merkato VIP
            </button>
            <button 
              onClick={() => document.getElementById('city-vip')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-gray-900 px-5 py-2 rounded-full text-sm font-semibold shadow-lg"
            >
              🏙️ City VIP
            </button>
            <button 
              onClick={() => document.getElementById('regular-pools')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-lg"
            >
              🏊 Regular Pools
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-2 mt-8 bg-white/10 rounded-2xl p-4 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-xl">💰</div>
            <div className="font-bold text-sm">{Math.floor(stats.total_raised / 1000)}+K</div>
            <div className="text-[10px] opacity-80">Raised</div>
          </div>
          <div className="text-center">
            <div className="text-xl">🏆</div>
            <div className="font-bold text-sm">{stats.total_winners}+</div>
            <div className="text-[10px] opacity-80">Winners</div>
          </div>
          <div className="text-center">
            <div className="text-xl">🎯</div>
            <div className="font-bold text-sm">{stats.total_pools}+</div>
            <div className="text-[10px] opacity-80">Active</div>
          </div>
          <div className="text-center">
            <div className="text-xl">🏙️</div>
            <div className="font-bold text-sm">{uniqueCities.length}</div>
            <div className="text-[10px] opacity-80">Cities</div>
          </div>
        </div>

        {/* Health Support Banner */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-3 py-1.5 text-xs">
            <span>💚</span>
            <span>2% supports kidney & heart disease patients</span>
          </div>
        </div>
      </div>

      {/* Merkato VIP Section */}
      <div id="merkato-vip" className="px-5 py-6 scroll-mt-20">
        <div 
          onClick={() => window.location.href = '/merkato-vip'}
          className="relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-2xl p-5 text-white shadow-xl overflow-hidden cursor-pointer transform transition hover:scale-[1.02]"
        >
          <div className="absolute -top-5 -left-5 text-7xl opacity-20">🏪</div>
          <div className="relative z-10">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold">Merkato VIP</h2>
                <p className="text-xs opacity-90">የመርካቶ ቪአይፒ ፕሮግራም</p>
              </div>
              <div className="flex gap-1">
                <span className="bg-yellow-400 text-gray-900 px-2 py-0.5 rounded text-[10px] font-bold">⭐ 1M ETB</span>
                <span className="bg-purple-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">🏆 10M ETB</span>
                <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">👑 40M ETB</span>
              </div>
            </div>
            <p className="text-sm mt-3 font-semibold text-center">
              {language === 'am' 
                ? '"ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው"'
                : '"Today, this week, and this month - let\'s make one participant a millionaire"'}
            </p>
            <div className="mt-3 text-center">
              <span className="inline-block bg-white text-gray-900 px-4 py-1 rounded-full text-xs font-bold">
                Join Now →
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* City VIP Section */}
      <div id="city-vip" className="px-5 py-4 scroll-mt-20">
        <div className="bg-gray-900 rounded-2xl p-5 text-white">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold">City VIP Programs</h2>
              <p className="text-xs text-gray-400">
                Join your city's exclusive VIP program - {uniqueCities.length}+ Ethiopian cities available!
              </p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="bg-emerald-600 px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                🎯 Select City
                <svg className={`w-3 h-3 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showCityDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCityDropdown(false)} />
                  <div className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b">
                      <input 
                        type="text" 
                        placeholder="🔍 Search your city... (94 cities available)" 
                        value={citySearchTerm} 
                        onChange={(e) => setCitySearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        autoFocus
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Showing {filteredCityList.length} of {uniqueCities.length} cities
                      </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {filteredCityList.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No cities found</div>
                      ) : (
                        filteredCityList.map(city => (
                          <a 
                            key={city.id} 
                            href={`/cities/${city.id}`}
                            onClick={(e) => { 
                              e.preventDefault(); 
                              setShowCityDropdown(false); 
                              setCitySearchTerm(''); 
                              window.location.href = `/cities/${city.id}`; 
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b last:border-0 flex items-center gap-3 cursor-pointer group"
                          >
                            <span className="text-2xl">{city.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-gray-800 group-hover:text-emerald-600 transition">
                                {getCityDisplayName(city)} 
                                <span className="text-gray-400 text-xs"> | {language === 'en' ? city.name : city.nameEn}</span>
                              </div>
                              <div className="text-xs text-gray-500">{getCityDescription(city)}</div>
                              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">🏆 {city.prize}</div>
                            </div>
                            <span className="text-emerald-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                              Join <span>→</span>
                            </span>
                          </a>
                        ))
                      )}
                    </div>
                    <div className="p-2 text-center text-xs text-gray-400 bg-gray-50">
                      {uniqueCities.length}+ Ethiopian cities available • እስከ 40M ብር ለማሸነፍ ይቀላቀሉ
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Prize Tiers */}
          <div className="grid grid-cols-5 gap-2 mt-6 pt-4 border-t border-gray-700">
            <div className="text-center">
              <div className="text-2xl">🏆</div>
              <div className="text-white font-bold text-sm">1M ETB</div>
              <div className="text-[10px] text-gray-400">Daily</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">⭐</div>
              <div className="text-white font-bold text-sm">10M ETB</div>
              <div className="text-[10px] text-gray-400">Weekly</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">👑</div>
              <div className="text-white font-bold text-sm">40M ETB</div>
              <div className="text-[10px] text-gray-400">Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">📍</div>
              <div className="text-white font-bold text-sm">{uniqueCities.length}+</div>
              <div className="text-[10px] text-gray-400">Cities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">🇪🇹</div>
              <div className="text-white font-bold text-sm">All Regions</div>
              <div className="text-[10px] text-gray-400">Nationwide</div>
            </div>
          </div>
        </div>
      </div>

      {/* Regular Pools Section */}
      <div id="regular-pools" className="px-5 py-4 scroll-mt-20">
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          <button 
            onClick={() => setShowRegularPools(!showRegularPools)}
            className="w-full bg-gradient-to-r from-gray-700 to-gray-800 p-5 text-white flex justify-between items-center"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏊</span>
              <div className="text-left">
                <h3 className="font-bold">Regular Prize Pools</h3>
                <p className="text-xs text-gray-400">Cars, Houses, Electronics & More</p>
              </div>
            </div>
            <svg className={`w-5 h-5 transition-transform ${showRegularPools ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showRegularPools && (
            <div className="p-4 bg-white">
              {/* Filter Buttons */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button 
                  onClick={() => setRegularPoolFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${regularPoolFilter === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  All Pools
                </button>
                <button 
                  onClick={() => setRegularPoolFilter('lowToHigh')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${regularPoolFilter === 'lowToHigh' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Price: Low → High
                </button>
                <button 
                  onClick={() => setRegularPoolFilter('highToLow')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${regularPoolFilter === 'highToLow' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Price: High → Low
                </button>
              </div>

              {/* Results Count */}
              <div className="text-xs text-gray-500 mb-3">
                Showing {displayedPools.length} active pools
              </div>

              {/* Pools Grid */}
              {displayedPools.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-2">🏊</div>
                  <p className="text-gray-500 text-sm">No active pools at the moment</p>
                  <p className="text-xs text-gray-400 mt-1">Check back soon for new opportunities!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {displayedPools.map(pool => (
                    <div key={pool.id} className="bg-gray-50 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{pool.prize_name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {pool.description?.slice(0, 80)}...
                          </p>
                          {/* Prize tags */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pool.target_amount >= 1000000 && (
                              <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded">💰 High Value</span>
                            )}
                            {pool.is_featured && (
                              <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded">⭐ Featured</span>
                            )}
                          </div>
                        </div>
                        {pool.is_featured && (
                          <span className="bg-yellow-400 text-gray-900 text-[10px] px-2 py-0.5 rounded-full ml-2">⭐</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div>
                          <span className="text-emerald-600 font-bold">ETB {(pool.entry_fee || 10).toLocaleString()}</span>
                          <span className="text-xs text-gray-400 ml-1">per seat</span>
                        </div>
                        <Link href={`/pools/${pool.id}`} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-emerald-700 transition">
                          Join Now →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-gray-50 py-8 px-5 mt-4">
        <h2 className="text-2xl font-bold text-center mb-6">እንዴት እንሳተፋለን? | How It Works</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold text-emerald-600">1</div>
            <h3 className="font-semibold text-sm mb-1">የእጣ መደብ ምረጡ | Find a Pool</h3>
            <p className="text-xs text-gray-500">Browse available prize pools</p>
          </div>
          <div>
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold text-emerald-600">2</div>
            <h3 className="font-semibold text-sm mb-1">ክፍያ ይክፈሉ | Contribute</h3>
            <p className="text-xs text-gray-500">Make your contribution securely</p>
          </div>
          <div>
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold text-emerald-600">3</div>
            <h3 className="font-semibold text-sm mb-1">ያሸንፉ | Win!</h3>
            <p className="text-xs text-gray-500">Win amazing prizes!</p>
          </div>
        </div>
      </div>

      {/* Partner Program Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-8 px-5 mt-2">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-1">ተባባሪ ፕሮግራም | Partner Program</h2>
          <p className="text-gray-300 text-xs mb-4">Join our partner program and start earning commissions today!</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => window.location.href = '/become-agent'} className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1">
              🤝 Become an Agent
            </button>
            <button onClick={() => window.location.href = '/become-vendor'} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1">
              🏪 Become a Vendor
            </button>
            <button onClick={() => window.location.href = '/become-organization'} className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1">
              🏢 Become an Organization
            </button>
          </div>
          <div className="mt-3 text-[10px] text-gray-400">
            <p>✓ No upfront fees ✓ Earn 10% on every successful pool ✓ 24/7 support</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BankingBottomNav />
    </div>
  );
}
