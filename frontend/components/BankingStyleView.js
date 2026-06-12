// frontend/components/BankingStyleView.js - WHITE & LIGHT GREY THEME
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
    <div className="bg-gray-50 min-h-screen pb-20">
      
      {/* Hero Section - Light Gradient */}
      <div id="hero" className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 pt-8 pb-12 px-5">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-white text-gray-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm mb-4">
            🔥 Ethiopia's #1 Prize Platform 🏆
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Abbaa Carraa</h1>
          <p className="text-gray-600 text-sm mb-6">
            {language === 'am' 
              ? 'መኪናዎችን፣ ቤቶችን እና ሌሎችንም በማህበረሰብ ቁጠባ ያሸንፉ!'
              : 'Win cars, houses, and more through community savings!'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button 
              onClick={() => document.getElementById('merkato-vip')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-gray-800 px-5 py-2 rounded-full text-sm font-semibold shadow-md border border-gray-200"
            >
              🏪 {language === 'am' ? 'መርካቶ ቪአይፒ' : 'Merkato VIP'}
            </button>
            <button 
              onClick={() => document.getElementById('city-vip')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-gray-800 px-5 py-2 rounded-full text-sm font-semibold shadow-md border border-gray-200"
            >
              🏙️ {language === 'am' ? 'የከተማ ቪአይፒ' : 'City VIP'}
            </button>
            <button 
              onClick={() => document.getElementById('regular-pools')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-gray-800 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-md"
            >
              🏊 {language === 'am' ? 'መደበኛ የእጣ መደብ' : 'Regular Pools'}
            </button>
          </div>
        </div>

        {/* Stats Row - White cards */}
        <div className="grid grid-cols-4 gap-2 mt-8">
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="text-xl">💰</div>
            <div className="font-bold text-gray-800 text-sm">{Math.floor(stats.total_raised / 1000)}+K</div>
            <div className="text-[10px] text-gray-500">{language === 'am' ? 'ተሰብስቧል' : 'Raised'}</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="text-xl">🏆</div>
            <div className="font-bold text-gray-800 text-sm">{stats.total_winners}+</div>
            <div className="text-[10px] text-gray-500">{language === 'am' ? 'አሸናፊዎች' : 'Winners'}</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="text-xl">🎯</div>
            <div className="font-bold text-gray-800 text-sm">{stats.total_pools}+</div>
            <div className="text-[10px] text-gray-500">{language === 'am' ? 'ንቁ' : 'Active'}</div>
          </div>
          <div className="bg-white rounded-2xl p-3 text-center shadow-sm">
            <div className="text-xl">🏙️</div>
            <div className="font-bold text-gray-800 text-sm">{uniqueCities.length}</div>
            <div className="text-[10px] text-gray-500">{language === 'am' ? 'ከተሞች' : 'Cities'}</div>
          </div>
        </div>

        {/* Health Support Banner - Light */}
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/80 rounded-full px-3 py-1.5 text-xs text-gray-600 shadow-sm">
            <span>💚</span>
            <span>{language === 'am' ? '2% የኩላሊት እና የልብ ህመም ታማሚዎችን ይደግፋል' : '2% supports kidney & heart disease patients'}</span>
          </div>
        </div>
      </div>

      {/* Merkato VIP Section - White Card */}
      <div id="merkato-vip" className="px-5 py-6 scroll-mt-20">
        <div 
          onClick={() => window.location.href = '/merkato-vip'}
          className="relative bg-white rounded-2xl p-5 text-gray-800 shadow-md border border-gray-100 overflow-hidden cursor-pointer transform transition hover:shadow-lg"
        >
          <div className="absolute -top-5 -left-5 text-7xl opacity-10">🏪</div>
          <div className="relative z-10">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Merkato VIP</h2>
                <p className="text-xs text-gray-500">የመርካቶ ቪአይፒ ፕሮግራም</p>
              </div>
              <div className="flex gap-1">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-[10px] font-bold">⭐ 1M ETB</span>
                <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">🏆 10M ETB</span>
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">👑 40M ETB</span>
              </div>
            </div>
            <p className="text-sm mt-3 font-semibold text-center text-gray-700">
              {language === 'am' 
                ? '"ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው"'
                : '"Today, this week, and this month - let\'s make one participant a millionaire"'}
            </p>
            <div className="mt-3 text-center">
              <span className="inline-block bg-gray-800 text-white px-4 py-1 rounded-full text-xs font-bold">
                {language === 'am' ? 'ይቀላቀሉ →' : 'Join Now →'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* City VIP Section - Light Grey Background */}
      <div id="city-vip" className="px-5 py-4 scroll-mt-20">
        <div className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-bold text-gray-900">City VIP Programs</h2>
              <p className="text-xs text-gray-500">
                {language === 'am' 
                  ? `የከተማዎን ቪአይፒ ፕሮግራም ይቀላቀሉ - ${uniqueCities.length}+ የኢትዮጵያ ከተሞች`
                  : `Join your city's exclusive VIP program - ${uniqueCities.length}+ Ethiopian cities available!`}
              </p>
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowCityDropdown(!showCityDropdown)}
                className="bg-gray-800 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              >
                🎯 {language === 'am' ? 'ከተማ ምረጡ' : 'Select City'}
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
                        placeholder={language === 'am' ? '🔍 ከተማ ፈልግ... (94 ከተሞች)' : '🔍 Search your city... (94 cities)'} 
                        value={citySearchTerm} 
                        onChange={(e) => setCitySearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                        autoFocus
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {language === 'am' ? `${filteredCityList.length} ከ${uniqueCities.length} ከተሞች ታይተዋል` : `Showing ${filteredCityList.length} of ${uniqueCities.length} cities`}
                      </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {filteredCityList.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">{language === 'am' ? 'ምንም ከተሞች አልተገኙም' : 'No cities found'}</div>
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
                              <div className="font-medium text-gray-800 group-hover:text-gray-600 transition">
                                {getCityDisplayName(city)} 
                                <span className="text-gray-400 text-xs"> | {language === 'en' ? city.name : city.nameEn}</span>
                              </div>
                              <div className="text-xs text-gray-500">{getCityDescription(city)}</div>
                              <div className="text-[10px] text-gray-600 font-semibold mt-0.5">🏆 {city.prize}</div>
                            </div>
                            <span className="text-gray-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                              {language === 'am' ? 'ይቀላቀሉ' : 'Join'} <span>→</span>
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
          
          {/* Prize Tiers - Light */}
          <div className="grid grid-cols-5 gap-2 mt-6 pt-4 border-t border-gray-100">
            <div className="text-center">
              <div className="text-2xl">🏆</div>
              <div className="text-gray-800 font-bold text-sm">1M ETB</div>
              <div className="text-[10px] text-gray-400">{language === 'am' ? 'ዕለታዊ' : 'Daily'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">⭐</div>
              <div className="text-gray-800 font-bold text-sm">10M ETB</div>
              <div className="text-[10px] text-gray-400">{language === 'am' ? 'ሳምንታዊ' : 'Weekly'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">👑</div>
              <div className="text-gray-800 font-bold text-sm">40M ETB</div>
              <div className="text-[10px] text-gray-400">{language === 'am' ? 'ወርሃዊ' : 'Monthly'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">📍</div>
              <div className="text-gray-800 font-bold text-sm">{uniqueCities.length}+</div>
              <div className="text-[10px] text-gray-400">{language === 'am' ? 'ከተሞች' : 'Cities'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl">🇪🇹</div>
              <div className="text-gray-800 font-bold text-sm">{language === 'am' ? 'ሁሉም ክልሎች' : 'All Regions'}</div>
              <div className="text-[10px] text-gray-400">{language === 'am' ? 'በመላ አገሪቱ' : 'Nationwide'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Regular Pools Section - Light */}
      <div id="regular-pools" className="px-5 py-4 scroll-mt-20">
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <button 
            onClick={() => setShowRegularPools(!showRegularPools)}
            className="w-full bg-gray-50 p-5 text-gray-800 flex justify-between items-center hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏊</span>
              <div className="text-left">
                <h3 className="font-bold">{language === 'am' ? 'መደበኛ የእጣ መደብ' : 'Regular Prize Pools'}</h3>
                <p className="text-xs text-gray-500">{language === 'am' ? 'መኪናዎች፣ ቤቶች፣ ኤሌክትሮኒክስ እና ሌሎች' : 'Cars, Houses, Electronics & More'}</p>
              </div>
            </div>
            <svg className={`w-5 h-5 transition-transform ${showRegularPools ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showRegularPools && (
            <div className="p-4 bg-white">
              {/* Filter Buttons - Light */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                <button 
                  onClick={() => setRegularPoolFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${regularPoolFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {language === 'am' ? 'ሁሉም' : 'All Pools'}
                </button>
                <button 
                  onClick={() => setRegularPoolFilter('lowToHigh')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${regularPoolFilter === 'lowToHigh' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {language === 'am' ? 'ውድ ወደ ርካሽ' : 'Price: Low → High'}
                </button>
                <button 
                  onClick={() => setRegularPoolFilter('highToLow')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${regularPoolFilter === 'highToLow' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {language === 'am' ? 'ርካሽ ወደ ውድ' : 'Price: High → Low'}
                </button>
              </div>

              {/* Results Count */}
              <div className="text-xs text-gray-500 mb-3">
                {language === 'am' ? `${displayedPools.length} ንቁ የእጣ መደቦች` : `Showing ${displayedPools.length} active pools`}
              </div>

              {/* Pools Grid - Light Cards */}
              {displayedPools.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <div className="text-5xl mb-2">🏊</div>
                  <p className="text-gray-500 text-sm">{language === 'am' ? 'ምንም ንቁ የእጣ መደቦች የሉም' : 'No active pools at the moment'}</p>
                  <p className="text-xs text-gray-400 mt-1">{language === 'am' ? 'በቅርቡ አዳዲስ ዕድሎች ይመጣሉ' : 'Check back soon for new opportunities!'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {displayedPools.map(pool => (
                    <div key={pool.id} className="bg-gray-50 rounded-xl p-4 shadow-sm hover:shadow-md transition border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{pool.prize_name}</h4>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {pool.description?.slice(0, 80)}...
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pool.target_amount >= 1000000 && (
                              <span className="bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 rounded">💰 {language === 'am' ? 'ከፍተኛ ዋጋ' : 'High Value'}</span>
                            )}
                            {pool.is_featured && (
                              <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded">⭐ {language === 'am' ? 'ታዋቂ' : 'Featured'}</span>
                            )}
                          </div>
                        </div>
                        {pool.is_featured && (
                          <span className="bg-yellow-400 text-gray-900 text-[10px] px-2 py-0.5 rounded-full ml-2">⭐</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div>
                          <span className="text-gray-800 font-bold">ETB {(pool.entry_fee || 10).toLocaleString()}</span>
                          <span className="text-xs text-gray-400 ml-1">{language === 'am' ? 'በአንድ መቀመጫ' : 'per seat'}</span>
                        </div>
                        <Link href={`/pools/${pool.id}`} className="bg-gray-800 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-700 transition">
                          {language === 'am' ? 'ይቀላቀሉ →' : 'Join Now →'}
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

      {/* How It Works Section - Light */}
      <div className="bg-white py-8 px-5 mt-4 shadow-sm border-t border-gray-100">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          {language === 'am' ? 'እንዴት እንሳተፋለን?' : 'How It Works'}
        </h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold text-gray-600">1</div>
            <h3 className="font-semibold text-sm mb-1 text-gray-700">{language === 'am' ? 'የእጣ መደብ ምረጡ' : 'Find a Pool'}</h3>
            <p className="text-xs text-gray-500">{language === 'am' ? 'ከሚገኙ የእጣ መደቦች መካከል ይምረጡ' : 'Browse available prize pools'}</p>
          </div>
          <div>
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold text-gray-600">2</div>
            <h3 className="font-semibold text-sm mb-1 text-gray-700">{language === 'am' ? 'ክፍያ ይክፈሉ' : 'Contribute'}</h3>
            <p className="text-xs text-gray-500">{language === 'am' ? 'በአስተማማኝ ሁኔታ ክፍያዎን ያስገቡ' : 'Make your contribution securely'}</p>
          </div>
          <div>
            <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 text-xl font-bold text-gray-600">3</div>
            <h3 className="font-semibold text-sm mb-1 text-gray-700">{language === 'am' ? 'ያሸንፉ' : 'Win!'}</h3>
            <p className="text-xs text-gray-500">{language === 'am' ? 'አሸናፊ በመሆን ሽልማት ያግኙ' : 'Win amazing prizes!'}</p>
          </div>
        </div>
      </div>

      {/* Partner Program Section - Light */}
      <div className="bg-gray-800 text-white py-8 px-5 mt-2">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-1">{language === 'am' ? 'ተባባሪ ፕሮግራም' : 'Partner Program'}</h2>
          <p className="text-gray-300 text-xs mb-4">{language === 'am' ? 'የአጋርነት ፕሮግራማችንን ይቀላቀሉ እና ዛሬ ማግኘት ይጀምሩ!' : 'Join our partner program and start earning commissions today!'}</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button onClick={() => window.location.href = '/become-agent'} className="bg-gray-700 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-gray-600">
              🤝 {language === 'am' ? 'ወኪል ይሁኑ' : 'Become an Agent'}
            </button>
            <button onClick={() => window.location.href = '/become-vendor'} className="bg-gray-700 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-gray-600">
              🏪 {language === 'am' ? 'ነጋዴ ይሁኑ' : 'Become a Vendor'}
            </button>
            <button onClick={() => window.location.href = '/become-organization'} className="bg-gray-700 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1 hover:bg-gray-600">
              🏢 {language === 'am' ? 'ድርጅት ይሁኑ' : 'Become an Organization'}
            </button>
          </div>
          <div className="mt-3 text-[10px] text-gray-400">
            <p>✓ {language === 'am' ? 'ምንም የቅድሚያ ክፍያ የለም' : 'No upfront fees'} ✓ {language === 'am' ? 'በእያንዳንዱ ስኬታማ የእጣ መደብ 10% ያግኙ' : 'Earn 10% on every successful pool'} ✓ 24/7 {language === 'am' ? 'ድጋፍ' : 'support'}</p>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BankingBottomNav />
    </div>
  );
}
