import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const ethiopianCities = [
  // ================= MAJOR & METROPOLITAN CITIES =================
  { name: "አዲስ አበባ | Addis Ababa", code: "addis-ababa", region: "Central", population: "5M+", economy: "Capital & Trade Hub", color: "from-green-700 to-teal-700", icon: "🏙️", description: "የኢትዮጵያ የንግድ ልብ | Heart of Ethiopian Commerce" },
  { name: "ሸገር ከተማ | Shaggar City", code: "shaggar", region: "Oromia", population: "3M+", economy: "Smart City & Investment Hub", color: "from-cyan-700 to-blue-700", icon: "🏗️", description: "ብልህ ከተማ እና የኢንቨስትመንት ማዕከል | Smart City & Investment Hub" },
  { name: "ድሬ ዳዋ | Dire Dawa", code: "dire-dawa", region: "Dire Dawa", population: "535K+", economy: "Trade & Manufacturing", color: "from-orange-600 to-red-700", icon: "🚂", description: "የንግድ እና የማኑፋክቸሪንግ ከተማ | Trade & Manufacturing Hub" },
  { name: "መቀሌ | Mekelle", code: "mekelle", region: "Tigray", population: "500K+", economy: "Industry & Trade", color: "from-red-700 to-rose-700", icon: "🏭", description: "ከፍተኛ የኢኮኖሚ ዕድገት | Highest GDP per Capita" },
  { name: "አዳማ | Adama", code: "adama", region: "Oromia", population: "500K+", economy: "Industrial & Transport", color: "from-blue-700 to-cyan-700", icon: "🏭", description: "የኢንዱስትሪ እና የንግድ ከተማ | Industrial & Trade City" },
  { name: "ሀዋሳ | Hawassa", code: "hawassa", region: "Sidama", population: "387K+", economy: "Industry & Tourism", color: "from-teal-600 to-green-700", icon: "🏞️", description: "የኢንዱስትሪ ፓርክ ከተማ | Industrial Park City" },
  { name: "ጎንደር | Gondar", code: "gondar", region: "Amhara", population: "350K+", economy: "Tourism & Culture", color: "from-purple-600 to-pink-700", icon: "🏰", description: "የባህል እና የቱሪዝም ከተማ | Culture & Tourism City" },
  { name: "ባህር ዳር | Bahir Dar", code: "bahir-dar", region: "Amhara", population: "350K+", economy: "Tourism & Textiles", color: "from-blue-600 to-indigo-700", icon: "🏞️", description: "የቱሪዝም እና የጨርቃጨርቅ ከተማ | Tourism & Textile City" },
  { name: "ጅማ | Jimma", code: "jimma", region: "Oromia", population: "250K+", economy: "Coffee & Trade", color: "from-amber-600 to-orange-700", icon: "☕", description: "የቡና እና የንግድ ከተማ | Coffee & Trade City" },
  { name: "ነቀምቴ | Nekemte", code: "nekemte", region: "Oromia", population: "150K+", economy: "Trade & Coffee", color: "from-amber-500 to-yellow-600", icon: "☕", description: "የንግድ እና የቡና ከተማ | Trade & Coffee City" },
  { name: "ደሴ | Dessie", code: "dessie", region: "Amhara", population: "229K+", economy: "Trade & Agriculture", color: "from-yellow-600 to-orange-600", icon: "🛍️", description: "የንግድ እና የእርሻ ከተማ | Trade & Agriculture City" },
  { name: "ጅጅጋ | Jijiga", code: "jijiga", region: "Somali", population: "200K+", economy: "Trade & Livestock", color: "from-emerald-600 to-teal-600", icon: "🐪", description: "የንግድ እና የእንስሳት ከተማ | Trade & Livestock City" },
  { name: "ሀረር | Harar", code: "harar", region: "Harari", population: "150K+", economy: "Tourism & Culture", color: "from-rose-500 to-pink-600", icon: "🏛️", description: "የባህል እና የቱሪዝም ከተማ | Culture & Tourism City" },
  { name: "ኮምቦልቻ | Kombolcha", code: "kombolcha", region: "Amhara", population: "120K+", economy: "Industry & Dry Port", color: "from-slate-600 to-gray-700", icon: "🏭", description: "የኢንዱስትሪ ዞን እና ደረቅ ወደብ | Industrial Zone & Dry Port" },

  // ================= OROMIA REGION CITIES =================
  { name: "ቢሾፍቱ | Bishoftu (Debre Zeyit)", code: "bishoftu", region: "Oromia", population: "150K+", economy: "Tourism & Aviation", color: "from-sky-500 to-blue-600", icon: "✈️", description: "የሀይቆች ከተማ እና የአየር ሃይል ቤዝ | City of Lakes & Air Force Base" },
  { name: "ገላን | Gelan", code: "gelan", region: "Oromia", population: "200K+", economy: "Industrial & Residential", color: "from-gray-500 to-slate-600", icon: "🏘️", description: "ፈጣን የከተማ ልማት | Rapid Urban Expansion" },
  { name: "ሞጆ | Modjo", code: "modjo", region: "Oromia", population: "120K+", economy: "Logistics & Dry Port", color: "from-amber-600 to-orange-600", icon: "🚛", description: "የሎጂስቲክስ እና የደረቅ ወደብ ከተማ | Logistics & Dry Port City" },
  { name: "መቱ | Metu", code: "metu", region: "Oromia", population: "60K+", economy: "Coffee & Agriculture", color: "from-emerald-600 to-green-700", icon: "🌿", description: "የቡና እና የግብርና ከተማ | Coffee & Agriculture City" },
  { name: "መቂ | Meki", code: "meki", region: "Oromia", population: "50K+", economy: "Agriculture & Trade", color: "from-green-500 to-emerald-600", icon: "🌾", description: "የእህል እርሻ እና የንግድ ማዕከል | Grain Farming & Trade Center" },
  { name: "ዚዋይ | Ziway", code: "ziway", region: "Oromia", population: "80K+", economy: "Fishing & Tourism", color: "from-teal-500 to-cyan-600", icon: "🐟", description: "የአሳ ማጥመድ እና የቱሪዝም ከተማ | Fishing & Tourism City" },
  { name: "ሻሸመኔ | Shashemene", code: "shashemene", region: "Oromia", population: "150K+", economy: "Trade & Industry", color: "from-yellow-600 to-amber-600", icon: "🛍️", description: "የንግድ እና የኢንዱስትሪ ከተማ | Trade & Industrial City" },
  { name: "ሮቤ | Robe", code: "robe", region: "Oromia", population: "80K+", economy: "Tourism & Agriculture", color: "from-green-600 to-teal-600", icon: "🌄", description: "የከፍተኛ ሀይላንድ ቱሪዝም | Highland Tourism Gateway" },
  { name: "አምቦ | Ambo", code: "ambo", region: "Oromia", population: "100K+", economy: "Agriculture & Trade", color: "from-green-500 to-teal-500", icon: "💧", description: "የማዕድን ውሃ እና የግብርና ከተማ | Mineral Water & Agriculture City" },
  { name: "ሆሌታ | Holeta", code: "holeta", region: "Oromia", population: "80K+", economy: "Agriculture & Military", color: "from-lime-500 to-green-500", icon: "🌾", description: "የግብርና እና የሰልጠኛ ከተማ | Agriculture & Training Center" },
  { name: "ወሊሶ | Weliso", code: "weliso", region: "Oromia", population: "50K+", economy: "Tourism & Agriculture", color: "from-teal-500 to-cyan-600", icon: "🏞️", description: "የሙቀት ምንጭ እና የቱሪዝም ከተማ | Hot Springs & Tourism City" },

  // ================= SOUTHERN REGION CITIES =================
  { name: "አርባ ምንጭ | Arba Minch", code: "arba-minch", region: "South Ethiopia", population: "150K+", economy: "Tourism & Agriculture", color: "from-blue-500 to-cyan-600", icon: "🏞️", description: "የቱሪዝም እና የግብርና ከተማ | Tourism & Agriculture City" },
  { name: "ሶዶ | Sodo", code: "sodo", region: "South Ethiopia", population: "150K+", economy: "Trade & Agriculture", color: "from-orange-500 to-red-600", icon: "🛍️", description: "የንግድ እና የግብርና ከተማ | Trade & Agriculture City" },
  { name: "ቡታጅራ | Butajira", code: "butajira", region: "South Ethiopia", population: "80K+", economy: "Agriculture & Trade", color: "from-green-600 to-emerald-700", icon: "🌽", description: "የግብርና እና የንግድ ከተማ | Agriculture & Trade City" },
  { name: "ወልቂጤ | Welkite", code: "welkite", region: "South Ethiopia", population: "70K+", economy: "Agriculture", color: "from-lime-600 to-green-700", icon: "🌾", description: "የግብርና እና የእርሻ ከተማ | Agriculture & Farming City" },
  { name: "ሆሳና | Hosana", code: "hosana", region: "South Ethiopia", population: "90K+", economy: "Agriculture & Trade", color: "from-yellow-600 to-amber-700", icon: "🌻", description: "የግብርና እና የንግድ ከተማ | Agriculture & Trade City" },

  // ================= OTHER REGIONS =================
  { name: "ሺንዲ | Shindi", code: "shindi", region: "Benishangul", population: "100K+", economy: "Trade & Agriculture", color: "from-emerald-500 to-teal-600", icon: "🌾", description: "የንግድ እና የግብርና ከተማ | Trade & Agriculture City" },
  { name: "አሶሳ | Assosa", code: "assosa", region: "Benishangul", population: "100K+", economy: "Trade & Agriculture", color: "from-green-500 to-emerald-600", icon: "🌿", description: "የንግድ እና የግብርና ከተማ | Trade & Agriculture City" },
  { name: "ሰሜና ሸዋ | Semera", code: "semera", region: "Afar", population: "50K+", economy: "Trade & Livestock", color: "from-yellow-500 to-orange-600", icon: "🐪", description: "የንግድ እና የእንስሳት ከተማ | Trade & Livestock City" }
];

export default function CitySelector({ variant = "full", onCitySelect, onClose }) {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCities, setFilteredCities] = useState(ethiopianCities);

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredCities(
        ethiopianCities.filter(city => 
          city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          city.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          city.region.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    } else {
      setFilteredCities(ethiopianCities);
    }
  }, [searchTerm]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const handleCitySelect = (cityCode) => {
    setSelectedCity(cityCode);
    setShowCustomInput(cityCode === "other");
    if (cityCode !== "other" && cityCode) {
      const city = ethiopianCities.find(c => c.code === cityCode);
      if (city && onCitySelect) onCitySelect(city);
    }
  };

  const handleJoinCity = async () => {
    let cityCode = selectedCity;
    let cityName = "";
    let cityData = null;
    
    if (selectedCity === "other") {
      if (!customCity.trim()) {
        toast.error("እባክዎ የከተማዎን ስም ያስገቡ | Please enter your city name");
        return;
      }
      cityCode = customCity.toLowerCase().replace(/\s+/g, '-');
      cityName = customCity;
    } else {
      const city = ethiopianCities.find(c => c.code === selectedCity);
      if (!city) {
        toast.error("Please select a city");
        return;
      }
      cityName = city.name;
      cityData = city;
    }

    setLoading(true);

    if (!user) {
      sessionStorage.setItem('pendingRole', 'individual');
      sessionStorage.setItem('pendingCity', cityCode);
      sessionStorage.setItem('pendingCityName', cityName);
      sessionStorage.setItem('redirectAfterLogin', `/cities/${cityCode}`);
      toast.loading('እባክዎ ይግቡ | Please login to join...');
      router.push('/login');
      return;
    }

    router.push(`/cities/${cityCode}?name=${encodeURIComponent(cityName)}`);
  };

  if (variant === "compact") {
    return (
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex gap-2">
          <select
            value={selectedCity}
            onChange={(e) => handleCitySelect(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 text-sm"
          >
            <option value="">ምረጥ ከተማ | Select City</option>
            {ethiopianCities.map(city => (
              <option key={city.code} value={city.code}>{city.name}</option>
            ))}
            <option value="other">ሌላ | Other (Type manually)</option>
          </select>
          <button
            onClick={handleJoinCity}
            disabled={!selectedCity || loading}
            className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 text-sm"
          >
            {loading ? '...' : 'Join'}
          </button>
        </div>
        {showCustomInput && (
          <input
            type="text"
            placeholder="Enter your city name | የከተማዎን ስም ያስገቡ"
            value={customCity}
            onChange={(e) => setCustomCity(e.target.value)}
            className="w-full mt-2 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 text-sm"
          />
        )}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">🇪🇹 ምረጥ ከተማህን | Select Your City</h2>
            <p className="text-sm text-gray-500 mt-1">ከተማህን ምረጥ እና በአካባቢህ ያሉ ነጋዴዎችን ተቀላቀል</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-3xl leading-none">×</button>
        </div>

        {/* Search */}
        <div className="p-4 border-b bg-gray-50">
          <div className="relative">
            <input
              type="text"
              placeholder="🔍 ፈልግ ከተማ | Search city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 pl-10 focus:ring-2 focus:ring-green-500"
            />
            <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        {/* Cities Grid */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredCities.map(city => (
              <button
                key={city.code}
                onClick={() => handleCitySelect(city.code)}
                className={`group p-4 rounded-xl text-left transition-all transform hover:scale-[1.02] ${
                  selectedCity === city.code
                    ? `bg-gradient-to-r ${city.color} text-white shadow-lg`
                    : 'bg-white hover:bg-gray-100 border border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-3xl ${selectedCity === city.code ? 'text-white drop-shadow-md' : 'text-gray-500'}`}>{city.icon}</div>
                  <div className="flex-1">
                    <div className="font-bold text-sm leading-tight">{city.name}</div>
                    <div className={`text-xs mt-1 flex gap-2 ${selectedCity === city.code ? 'text-white/80' : 'text-gray-400'}`}>
                      <span>{city.region}</span>
                      <span>•</span>
                      <span>{city.population}</span>
                    </div>
                    <div className={`text-[11px] mt-1.5 leading-tight ${selectedCity === city.code ? 'text-white/70' : 'text-gray-500'}`}>
                      {city.description}
                    </div>
                  </div>
                  {selectedCity === city.code && (
                    <div className="text-white text-xl font-bold">✓</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Other City Option */}
          <div className={`mt-4 border rounded-xl p-4 transition-colors ${selectedCity === 'other' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="city"
                checked={selectedCity === 'other'}
                onChange={() => handleCitySelect('other')}
                className="w-4 h-4 text-green-600"
              />
              <span className="font-medium text-gray-700">ሌላ | Other City</span>
            </label>
            {selectedCity === 'other' && (
              <input
                type="text"
                placeholder="የከተማዎን ስም ያስገቡ | Enter your city name"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="w-full mt-3 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4">
          <button
            onClick={handleJoinCity}
            disabled={(!selectedCity || (selectedCity === 'other' && !customCity)) || loading}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                በመጠባበቅ ላይ | Loading...
              </>
            ) : (
              <>🎯 ይቀላቀሉ | Join Your City Pool →</>
            )}
          </button>
          <p className="text-xs text-gray-400 text-center mt-3">
            በከተማዎ ውስጥ ካሉ ሌሎች ነጋዴዎች እና ተሳታፊዎች ጋር በመሆን ሚሊየነር ይሁኑ!
          </p>
        </div>
      </div>
    </div>
  );
}
