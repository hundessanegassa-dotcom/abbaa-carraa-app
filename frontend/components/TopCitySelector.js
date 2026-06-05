// components/TopCitySelector.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

// Complete list of ALL Ethiopian cities with their joining paths
const allEthiopianCities = [
  { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', icon: '🏙️', region: 'Central', joinPath: '/cities/addis-ababa' },
  { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', icon: '🏗️', region: 'Oromia', joinPath: '/cities/shaggar' },
  { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', icon: '🚂', region: 'Dire Dawa', joinPath: '/cities/dire-dawa' },
  { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', icon: '🏭', region: 'Tigray', joinPath: '/cities/mekelle' },
  { id: 'adama', name: 'አዳማ', nameEn: 'Adama', icon: '🏭', region: 'Oromia', joinPath: '/cities/adama' },
  { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', icon: '🏞️', region: 'Sidama', joinPath: '/cities/hawassa' },
  { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', icon: '🏰', region: 'Amhara', joinPath: '/cities/gondar' },
  { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', icon: '🏞️', region: 'Amhara', joinPath: '/cities/bahir-dar' },
  { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', icon: '☕', region: 'Oromia', joinPath: '/cities/jimma' },
  { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', icon: '✈️', region: 'Oromia', joinPath: '/cities/bishoftu' },
  { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', icon: '🏔️', region: 'Amhara', joinPath: '/cities/dessie' },
  { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', icon: '🐪', region: 'Somali', joinPath: '/cities/jijiga' },
  { id: 'harar', name: 'ሀረር', nameEn: 'Harar', icon: '🏛️', region: 'Harari', joinPath: '/cities/harar' },
  { id: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte', icon: '☕', region: 'Oromia', joinPath: '/cities/nekemte' },
  { id: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch', icon: '🏞️', region: 'South', joinPath: '/cities/arba-minch' },
  { id: 'sodo', name: 'ሶዶ', nameEn: 'Sodo', icon: '🛍️', region: 'South', joinPath: '/cities/sodo' },
  { id: 'ambo', name: 'አምቦ', nameEn: 'Ambo', icon: '💧', region: 'Oromia', joinPath: '/cities/ambo' },
  { id: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene', icon: '🛍️', region: 'Oromia', joinPath: '/cities/shashemene' },
  { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', icon: '🌿', region: 'Benishangul', joinPath: '/cities/assosa' },
  { id: 'semera', name: 'ሰሜና', nameEn: 'Semera', icon: '🐪', region: 'Afar', joinPath: '/cities/semera' },
  { id: 'welkite', name: 'ወልቂጤ', nameEn: 'Welkite', icon: '🌾', region: 'South', joinPath: '/cities/welkite' },
  { id: 'hosana', name: 'ሆሳና', nameEn: 'Hosana', icon: '🌻', region: 'South', joinPath: '/cities/hosana' },
  { id: 'metu', name: 'መቱ', nameEn: 'Metu', icon: '🌿', region: 'Oromia', joinPath: '/cities/metu' },
  { id: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway', icon: '🐟', region: 'Oromia', joinPath: '/cities/ziway' },
  { id: 'robe', name: 'ሮቤ', nameEn: 'Robe', icon: '🌄', region: 'Oromia', joinPath: '/cities/robe' },
  { id: 'holeta', name: 'ሆሌታ', nameEn: 'Holeta', icon: '🌾', region: 'Oromia', joinPath: '/cities/holeta' },
  { id: 'gelan', name: 'ገላን', nameEn: 'Gelan', icon: '🏘️', region: 'Oromia', joinPath: '/cities/gelan' },
  { id: 'modjo', name: 'ሞጆ', nameEn: 'Modjo', icon: '🚛', region: 'Oromia', joinPath: '/cities/modjo' },
  { id: 'kombolcha', name: 'ኮምቦልቻ', nameEn: 'Kombolcha', icon: '🏭', region: 'Amhara', joinPath: '/cities/kombolcha' },
];

export default function TopCitySelector() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState(null);

  useEffect(() => {
    const savedCity = localStorage.getItem('merkato_selected_city');
    if (savedCity) {
      try {
        const city = JSON.parse(savedCity);
        setSelectedCity(city);
      } catch(e) {}
    }
  }, []);

  const filteredCities = allEthiopianCities.filter(city => 
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCitySelect = (city) => {
    localStorage.setItem('merkato_selected_city', JSON.stringify(city));
    setSelectedCity(city);
    setIsOpen(false);
    setSearchTerm('');
    
    toast.success(`${city.icon} Joining ${city.name} VIP Program...`, { duration: 2000, icon: '🎯' });
    router.push(city.joinPath);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl transition-all duration-200 border border-gray-600 shadow-md"
      >
        <span className="text-xl">{selectedCity?.icon || '🎯'}</span>
        <div className="text-left hidden sm:block">
          <div className="text-[10px] text-gray-400">Join City VIP</div>
          <div className="text-sm font-semibold text-white">
            {selectedCity ? selectedCity.name : 'Select City'}
          </div>
        </div>
        <div className="text-left sm:hidden">
          <div className="text-xs font-semibold text-white">
            {selectedCity ? selectedCity.name : 'Join City'}
          </div>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden">
            <div className="p-4 border-b border-gray-800 bg-gray-900">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <span>🇪🇹</span> Join a City VIP Program
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {allEthiopianCities.length}+ Ethiopian cities • Win up to 40M ETB
              </p>
            </div>

            <div className="p-3 border-b border-gray-800">
              <div className="relative">
                <input
                  type="text"
                  placeholder="🔍 Search your city..."
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
                    className="w-full text-left px-4 py-3 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0 flex items-center gap-3 group"
                  >
                    <span className="text-2xl">{city.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium text-white group-hover:text-gray-200 text-sm">
                        {city.name} <span className="text-gray-400 text-xs">| {city.nameEn}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{city.region}</div>
                    </div>
                    <div className="text-green-500 text-xs opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                      <span>Join →</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="p-3 border-t border-gray-800 bg-gray-900 text-center">
              <p className="text-[10px] text-gray-500 flex items-center justify-center gap-2">
                <span>✨</span> Click any city to start your VIP journey
                <span>✨</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
