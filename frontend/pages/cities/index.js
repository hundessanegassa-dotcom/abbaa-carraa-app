// pages/cities/index.js - COMPLETE CITY VIP LISTING PAGE (ALL CITIES)
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { getAllCities, getCityData } from '../../lib/cityData';
// Get all cities dynamically
const ethiopianCities = getAllCities();

export default function CitiesIndex() {
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [showAllCities, setShowAllCities] = useState(false);

  // Get unique regions for filter
  const regions = ['all', ...new Set(ethiopianCities.map(city => city.region || 'Ethiopia'))];

  // Filter cities based on search and region
  const filteredCities = ethiopianCities.filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (city.nameEn || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'all' || city.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  const displayedCities = showAllCities ? filteredCities : filteredCities.slice(0, 12);

  return (
    <>
      <Head>
        <title>City VIP Programs - Join Your City's Exclusive VIP | Abbaa Carraa</title>
        <meta name="description" content="Join your city's VIP program and win up to 10 Million Birr. Available in all Ethiopian cities." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur rounded-full px-4 py-2 mb-6">
              <span className="text-2xl">🏙️</span>
              <span className="text-sm font-semibold">City VIP Programs</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Join Your City's <span className="text-yellow-400">Exclusive VIP</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
              Win up to 10 Million Birr in your city's VIP program. Available in all Ethiopian cities!
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href="#cities" className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-full font-semibold transition flex items-center gap-2">
                Browse Cities <span>↓</span>
              </a>
              <Link href="/become-agent" className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-full font-semibold transition flex items-center gap-2">
                Become a City Agent 🤝
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search city (Addis Ababa...)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border rounded-xl px-4 py-3 pl-10 focus:ring-2 focus:ring-green-500 outline-none"
                />
                <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Region Filter */}
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="border rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 outline-none bg-white"
              >
                {regions.map(region => (
                  <option key={region} value={region}>
                    {region === 'all' ? '📌 All Regions' : `📍 ${region} Region`}
                  </option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-500">
              Found {filteredCities.length} {filteredCities.length === 1 ? 'city' : 'cities'}
            </div>
          </div>

          {/* Cities Grid */}
          <div id="cities" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {displayedCities.map((city) => {
              const cityDetail = getCityData(city.id);
              return (
                <Link key={city.id} href={`/cities/${city.id}`}>
                  <div className={`bg-gradient-to-r ${cityDetail?.color || 'from-gray-700 to-gray-900'} rounded-2xl p-5 text-white hover:shadow-xl transition transform hover:scale-105 cursor-pointer h-full flex flex-col`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-4xl">{city.icon || '🏙️'}</div>
                      <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">{cityDetail?.population || 'N/A'}</span>
                    </div>
                    <h3 className="font-bold text-xl">{city.name}</h3>
                    <p className="text-sm opacity-90 mb-1">{city.nameEn || city.id}</p>
                    <p className="text-xs opacity-80 mt-2 line-clamp-2">{cityDetail?.description || 'Join City VIP and win big!'}</p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">Up to 10M ETB</span>
                      <span className="text-sm font-semibold flex items-center gap-1">
                        Join Now <span className="text-lg">→</span>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* No Results */}
          {filteredCities.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-md">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No cities found</h3>
              <p className="text-gray-500">Try a different search term or clear the filter</p>
              <button
                onClick={() => { setSearchTerm(''); setRegionFilter('all'); }}
                className="mt-4 text-green-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}

          {/* Show More / Show Less Button */}
          {filteredCities.length > 12 && (
            <div className="text-center mt-8">
              <button
                onClick={() => setShowAllCities(!showAllCities)}
                className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center gap-1 mx-auto"
              >
                {showAllCities ? 'Show Less ↑' : `Show All ${filteredCities.length} Cities ↓`}
              </button>
            </div>
          )}
        </div>

        {/* Benefits Section */}
        <div className="bg-gray-100 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Why Join City VIP?</h2>
            <p className="text-center text-gray-600 mb-12">Exclusive benefits for city program participants</p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition">
                <div className="text-5xl mb-4">🏆</div>
                <h3 className="text-xl font-bold mb-2">Huge Prizes</h3>
                <p className="text-gray-600">Win up to 10 Million Birr in your city's VIP program</p>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition">
                <div className="text-5xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-2">5 Premium Tiers</h3>
                <p className="text-gray-600">Choose from Silver, Gold, Platinum, Diamond & Royal</p>
              </div>
              <div className="bg-white rounded-2xl p-6 text-center shadow-md hover:shadow-lg transition">
                <div className="text-5xl mb-4">💚</div>
                <h3 className="text-xl font-bold mb-2">Support Health</h3>
                <p className="text-gray-600">2% supports kidney & heart disease patients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Unlisted City Support */}
        <div className="bg-yellow-50 border-y border-yellow-200 py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-yellow-800">
              🆕 <span className="font-semibold">Don't see your city?</span> 
              {' '}You can still join! Visit <span className="font-mono bg-yellow-100 px-2 py-0.5 rounded">/cities/your-city-name</span>
              {' '}or <Link href="/contact" className="text-yellow-700 underline font-semibold">contact us</Link> to add your city.
            </p>
          </div>
        </div>

        {/* Become Agent CTA */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="text-5xl mb-4">🤝</div>
              <h2 className="text-3xl font-bold mb-4">Become a City Agent</h2>
              <p className="text-gray-300 mb-6">
                Earn 10% commission on every successful contribution from customers you bring to your city's VIP program!
              </p>
              <Link
                href="/become-agent"
                className="inline-block bg-green-600 hover:bg-green-700 px-8 py-3 rounded-full font-semibold transition transform hover:scale-105 shadow-lg"
              >
                Apply as City Agent →
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
