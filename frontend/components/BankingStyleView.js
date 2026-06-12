import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import BankingBottomNav from './BankingBottomNav';
import TopCitySelector from './TopCitySelector';
import PoolCard from './PoolCard';

export default function BankingStyleView({ 
  pools, 
  stats, 
  uniqueCities, 
  allCityVipPrograms,
  onRegisterClick 
}) {
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [regularPoolFilter, setRegularPoolFilter] = useState('all');
  const [showRegularPools, setShowRegularPools] = useState(true);

  const merkatoRef = useRef(null);
  const cityVipRef = useRef(null);
  const regularPoolsRef = useRef(null);

  useEffect(() => {
    // Set up section IDs for scrolling
    const hero = document.getElementById('hero');
    const merkato = document.getElementById('merkato-vip');
    const cityVip = document.getElementById('city-vip');
    const regularPools = document.getElementById('regular-pools');
  }, []);

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

  return (
    <div className="bg-white min-h-screen pb-20">
      {/* Hero Section */}
      <div id="hero" className="bg-gradient-to-br from-emerald-700 to-teal-700 text-white pt-8 pb-12 px-5">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs font-bold mb-4">
            🔥 Ethiopia's #1 Prize Platform
          </div>
          <h1 className="text-3xl font-bold mb-2">Abbaa Carraa</h1>
          <p className="text-emerald-100 text-sm mb-6">Win cars, houses, and more through community savings!</p>
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
      </div>

      {/* Merkato VIP Section */}
      <div id="merkato-vip" className="px-5 py-6 scroll-mt-20">
        <div 
          onClick={() => window.location.href = '/merkato-vip'}
          className="relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-2xl p-5 text-white shadow-xl overflow-hidden cursor-pointer transform transition hover:scale-[1.02]"
        >
          <div className="absolute -top-5 -left-5 text-7xl opacity-20">🏪</div>
          <div className="relative z-10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">Merkato VIP</h2>
                <p className="text-xs opacity-90">የመርካቶ ቪአይፒ ፕሮግራም</p>
              </div>
              <div className="flex gap-1">
                <span className="bg-yellow-400 text-gray-900 px-2 py-0.5 rounded text-xs font-bold">⭐ 1M</span>
                <span className="bg-purple-500 px-2 py-0.5 rounded text-xs font-bold">🏆 10M</span>
                <span className="bg-emerald-500 px-2 py-0.5 rounded text-xs font-bold">👑 40M</span>
              </div>
            </div>
            <p className="text-sm mt-3 font-semibold text-center">"ዛሬ አንድ ተሳታፊ ሚሊየነር እናድርገው"</p>
            <div className="mt-3 text-center">
              <span className="inline-block bg-white text-gray-900 px-4 py-1 rounded-full text-xs font-bold">ይቀላቀሉ →</span>
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
              <p className="text-xs text-gray-400">{uniqueCities.length}+ Ethiopian cities</p>
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
                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="p-3 bg-gray-50 border-b">
                    <input 
                      type="text" 
                      placeholder="🔍 Search city..." 
                      value={citySearchTerm} 
                      onChange={(e) => setCitySearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {filteredCityList.slice(0, 20).map(city => (
                      <a 
                        key={city.id} 
                        href={`/cities/${city.id}`}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b last:border-0"
                      >
                        <span className="text-2xl">{city.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{city.name}</div>
                          <div className="text-xs text-gray-500">{city.prize}</div>
                        </div>
                        <span className="text-emerald-600 text-xs">Join →</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-5 gap-2 mt-4 pt-3 border-t border-gray-700">
            <div className="text-center"><div className="text-xl">🏆</div><div className="text-xs font-bold">1M ETB</div><div className="text-[8px] text-gray-400">Daily</div></div>
            <div className="text-center"><div className="text-xl">⭐</div><div className="text-xs font-bold">10M ETB</div><div className="text-[8px] text-gray-400">Weekly</div></div>
            <div className="text-center"><div className="text-xl">👑</div><div className="text-xs font-bold">40M ETB</div><div className="text-[8px] text-gray-400">Monthly</div></div>
            <div className="text-center"><div className="text-xl">📍</div><div className="text-xs font-bold">{uniqueCities.length}+</div><div className="text-[8px] text-gray-400">Cities</div></div>
            <div className="text-center"><div className="text-xl">🇪🇹</div><div className="text-xs font-bold">All</div><div className="text-[8px] text-gray-400">Regions</div></div>
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

              {/* Pools Grid */}
              {displayedPools.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-2">🏊</div>
                  <p className="text-gray-500 text-sm">No active pools at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {displayedPools.map(pool => (
                    <div key={pool.id} className="bg-gray-50 rounded-xl p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{pool.prize_name}</h4>
                          <p className="text-xs text-gray-500 mt-1">{pool.description?.slice(0, 60)}...</p>
                        </div>
                        {pool.is_featured && <span className="bg-yellow-400 text-gray-900 text-[10px] px-2 py-0.5 rounded-full">⭐</span>}
                      </div>
                      <div className="flex justify-between items-center mt-3">
                        <div>
                          <span className="text-emerald-600 font-bold">ETB {(pool.entry_fee || 10).toLocaleString()}</span>
                          <span className="text-xs text-gray-400 ml-1">per seat</span>
                        </div>
                        <Link href={`/pools/${pool.id}`} className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold">
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

      {/* Bottom Navigation */}
      <BankingBottomNav />
    </div>
  );
}
