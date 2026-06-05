// components/CityLayout.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

// Complete list of ALL Ethiopian cities (no "coming soon")
const allEthiopianCities = [
  { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', icon: '🏙️', region: 'Central', available: true },
  { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', icon: '🏗️', region: 'Oromia', available: true },
  { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', icon: '🚂', region: 'Dire Dawa', available: true },
  { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', icon: '🏭', region: 'Tigray', available: true },
  { id: 'adama', name: 'አዳማ', nameEn: 'Adama', icon: '🏭', region: 'Oromia', available: true },
  { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', icon: '🏞️', region: 'Sidama', available: true },
  { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', icon: '🏰', region: 'Amhara', available: true },
  { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', icon: '🏞️', region: 'Amhara', available: true },
  { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', icon: '☕', region: 'Oromia', available: true },
  { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', icon: '✈️', region: 'Oromia', available: true },
  { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', icon: '🏔️', region: 'Amhara', available: true },
  { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', icon: '🐪', region: 'Somali', available: true },
  { id: 'harar', name: 'ሀረር', nameEn: 'Harar', icon: '🏛️', region: 'Harari', available: true },
  { id: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte', icon: '☕', region: 'Oromia', available: true },
  { id: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch', icon: '🏞️', region: 'South', available: true },
  { id: 'sodo', name: 'ሶዶ', nameEn: 'Sodo', icon: '🛍️', region: 'South', available: true },
  { id: 'ambo', name: 'አምቦ', nameEn: 'Ambo', icon: '💧', region: 'Oromia', available: true },
  { id: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene', icon: '🛍️', region: 'Oromia', available: true },
  { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', icon: '🌿', region: 'Benishangul', available: true },
  { id: 'semera', name: 'ሰሜና', nameEn: 'Semera', icon: '🐪', region: 'Afar', available: true },
  { id: 'welkite', name: 'ወልቂጤ', nameEn: 'Welkite', icon: '🌾', region: 'South', available: true },
  { id: 'hosana', name: 'ሆሳና', nameEn: 'Hosana', icon: '🌻', region: 'South', available: true },
  { id: 'metu', name: 'መቱ', nameEn: 'Metu', icon: '🌿', region: 'Oromia', available: true },
  { id: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway', icon: '🐟', region: 'Oromia', available: true },
  { id: 'robe', name: 'ሮቤ', nameEn: 'Robe', icon: '🌄', region: 'Oromia', available: true },
  { id: 'holeta', name: 'ሆሌታ', nameEn: 'Holeta', icon: '🌾', region: 'Oromia', available: true },
  { id: 'gelan', name: 'ገላን', nameEn: 'Gelan', icon: '🏘️', region: 'Oromia', available: true },
  { id: 'modjo', name: 'ሞጆ', nameEn: 'Modjo', icon: '🚛', region: 'Oromia', available: true },
  { id: 'kombolcha', name: 'ኮምቦልቻ', nameEn: 'Kombolcha', icon: '🏭', region: 'Amhara', available: true },
];

export default function CityLayout({ children, currentCityId }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);

  // Load selected city on mount
  useEffect(() => {
    const savedCity = localStorage.getItem('merkato_selected_city');
    if (savedCity) {
      try {
        const city = JSON.parse(savedCity);
        setSelectedCity(city);
      } catch(e) {}
    } else if (currentCityId) {
      const city = allEthiopianCities.find(c => c.id === currentCityId);
      if (city) setSelectedCity(city);
    }
  }, [currentCityId]);

  const filteredCities = allEthiopianCities.filter(city => 
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCitySelect = (city) => {
    setSelectedCity(city);
    localStorage.setItem('merkato_selected_city', JSON.stringify(city));
    setIsOpen(false);
    setSearchTerm('');
    
    toast.success(`${city.icon} ${city.name} | ${city.nameEn} selected`, {
      duration: 2000,
      icon: '📍'
    });
    
    // Navigate to the selected city page
    if (router.pathname.startsWith('/cities/')) {
      router.push(`/cities/${city.id}`);
    } else {
      router.push(`/cities/${city.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      {/* Persistent Top Navbar - Grey Theme */}
      <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">🎫</span>
              <div>
                <span className="font-bold text-white text-lg">Merkato VIP</span>
                <span className="text-xs text-gray-400 ml-2 hidden sm:inline">| Ethiopia's Premier Event Hub</span>
              </div>
            </Link>

            {/* City Selector Dropdown - PERSISTENT at top */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-200 border border-gray-600 shadow-md"
              >
                <span className="text-xl">{selectedCity?.icon || '📍'}</span>
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] text-gray-400">Your City</div>
                  <div className="text-sm font-semibold text-white">
                    {selectedCity ? selectedCity.name : 'Select City'}
                  </div>
                </div>
                <div className="text-left sm:hidden">
                  <div className="text-xs font-semibold text-white">
                    {selectedCity ? selectedCity.name : 'City'}
                  </div>
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-800 bg-gray-900">
                      <h3 className="text-white font-semibold flex items-center gap-2">
                        <span>🇪🇹</span> Select Your City
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {allEthiopianCities.length}+ Ethiopian cities available
                      </p>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-gray-800">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="🔍 Search city..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-lg px-4 py-2 pl-10 border border-gray-700 focus:border-gray-500 focus:ring-1 focus:ring-gray-500 outline-none text-sm"
                          autoFocus
                        />
                        <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* Cities List - Scrollable */}
                    <div className="max-h-80 overflow-y-auto">
                      {filteredCities.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">
                          <span className="text-4xl block mb-2">🔍</span>
                          No cities found
                        </div>
                      ) : (
                        filteredCities.map(city => (
                          <button
                            key={city.id}
                            onClick={() => handleCitySelect(city)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0 flex items-center gap-3 group ${
                              selectedCity?.id === city.id ? 'bg-gray-800' : ''
                            }`}
                          >
                            <span className="text-2xl">{city.icon}</span>
                            <div className="flex-1">
                              <div className="font-medium text-white group-hover:text-gray-200 text-sm">
                                {city.name} <span className="text-gray-400 text-xs">| {city.nameEn}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">{city.region}</div>
                            </div>
                            {selectedCity?.id === city.id && (
                              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        ))
                      )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-gray-800 bg-gray-900 text-center">
                      <p className="text-[10px] text-gray-500">
                        All cities fully activated • No restrictions
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - Your existing seat selection, payment, ticket generation */}
      <main>
        {children}
      </main>
    </div>
  );
}
