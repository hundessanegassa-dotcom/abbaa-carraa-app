// pages/cities.js - DYNAMIC ADMIN-CREATED CITY VIP POOLS
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getCityData } from '../lib/cityData';

export default function CitiesPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminCities, setAdminCities] = useState([]);

  useEffect(() => {
    checkUser();
    fetchAdminCityVipPools();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAdminCityVipPools = async () => {
    setLoading(true);
    try {
      // Fetch configs from city_vip_config
      const { data: configData, error: configError } = await supabase
        .from('city_vip_config')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Fetch active pools with category 'city_vip'
      const { data: poolsData, error: poolsError } = await supabase
        .from('pools')
        .select('*')
        .eq('category', 'city_vip')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      const combinedMap = new Map();

      if (configData && configData.length > 0) {
        configData.forEach(c => {
          const cityId = c.city_id || (c.city_name ? c.city_name.toLowerCase().replace(/\s+/g, '-') : 'city');
          const meta = getCityData(cityId);
          combinedMap.set(cityId, {
            id: cityId,
            name: c.city_name || meta.name.split('|')[0].trim(),
            nameEn: meta.name.split('|')[1]?.trim() || cityId,
            slogan: c.description || meta.slogan || 'Join City VIP and win big!',
            prize: `ETB ${(c.prize_amount || 1000000).toLocaleString()}`,
            contribution: c.contribution_amount || 500,
            color: meta.color || 'from-gray-700 to-gray-900',
            icon: meta.icon || '🏙️',
            businesses: meta.businesses || '5,000+',
            workers: meta.workers || '20,000+'
          });
        });
      }

      if (poolsData && poolsData.length > 0) {
        poolsData.forEach(p => {
          const cityId = p.city ? p.city.toLowerCase().replace(/\s+/g, '-') : 'city';
          if (!combinedMap.has(cityId)) {
            const meta = getCityData(cityId);
            combinedMap.set(cityId, {
              id: cityId,
              name: p.city || meta.name.split('|')[0].trim(),
              nameEn: meta.name.split('|')[1]?.trim() || cityId,
              slogan: p.description || meta.slogan || 'Join City VIP and win big!',
              prize: `ETB ${(p.target_amount || 1000000).toLocaleString()}`,
              contribution: p.entry_fee || p.contribution_amount || 500,
              color: meta.color || 'from-gray-700 to-gray-900',
              icon: meta.icon || '🏙️',
              businesses: meta.businesses || '5,000+',
              workers: meta.workers || '20,000+'
            });
          }
        });
      }

      setAdminCities(Array.from(combinedMap.values()));
    } catch (e) {
      console.error('Error fetching admin city VIP pools:', e);
    } finally {
      setLoading(false);
    }
  };

  // Merkato VIP Card
  const MerkatoCard = () => (
    <Link href="/merkato-vip">
      <div className="group relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer h-full">
        <div className="absolute top-4 right-4 z-10 bg-yellow-500 text-gray-900 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
          🔥 SPECIAL
        </div>
        <div className="p-6 text-center">
          <div className="text-7xl mb-4 animate-bounce">🏪</div>
          <h3 className="text-2xl font-bold text-white mb-2">መርካቶ VIP</h3>
          <p className="text-sm text-gray-300 mb-3">Merkato VIP Program</p>
          <p className="text-xs text-gray-400">የአፍሪካ ትልቁ ገበያ | Africa's Largest Market</p>
          <div className="mt-4 flex justify-center gap-4 text-xs">
            <div>
              <p className="text-yellow-400 font-bold">7,100+</p>
              <p className="text-gray-400">ንግዶች</p>
            </div>
            <div>
              <p className="text-yellow-400 font-bold">13,000+</p>
              <p className="text-gray-400">ሠራተኞች</p>
            </div>
          </div>
          <div className="mt-4 bg-white/10 rounded-lg p-2">
            <p className="text-xs text-gray-300">ዕለታዊ 1ሚሊዮን | ሳምንታዊ 10ሚሊዮን | ወርሃዊ 40ሚሊዮን</p>
          </div>
          <button className="mt-4 w-full bg-white text-gray-900 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition transform hover:scale-105">
            ይጫኑ | Join Now →
          </button>
        </div>
      </div>
    </Link>
  );

  const CityCard = ({ city }) => (
    <Link href={`/cities/${city.id}`}>
      <div className="group relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer h-full flex flex-col justify-between">
        <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-3 py-1 rounded-full text-xs font-bold">
          🏆 {city.prize}
        </div>
        <div>
          <div className={`bg-gradient-to-r ${city.color} p-4 text-white text-center`}>
            <div className="text-5xl mb-2">{city.icon}</div>
            <h3 className="text-xl font-bold">{city.name}</h3>
            <p className="text-xs opacity-80 mt-1">{city.nameEn}</p>
          </div>
          <div className="p-5">
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">{city.slogan}</p>
            <div className="flex justify-around text-center text-xs mb-4">
              <div>
                <p className="font-bold text-gray-800">{city.businesses}</p>
                <p className="text-gray-500">ንግዶች</p>
              </div>
              <div>
                <p className="font-bold text-gray-800">{city.workers}</p>
                <p className="text-gray-500">ሠራተኞች</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-5 pt-0">
          <button className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white py-2 rounded-lg font-semibold text-sm hover:shadow-lg transition transform hover:scale-105">
            Join {city.name} VIP →
          </button>
        </div>
      </div>
    </Link>
  );

  return (
    <>
      <Head>
        <title>City VIP Programs - Win 40 Million Birr | Abbaa Carraa</title>
        <meta name="description" content="Join VIP programs in your city. Win up to 40 Million Birr. Created by Admin across Ethiopian cities." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-9xl animate-bounce">🏙️</div>
            <div className="absolute bottom-10 right-10 text-9xl animate-pulse">🇪🇹</div>
            <div className="absolute top-1/3 left-1/4 text-8xl animate-spin-slow">⭐</div>
          </div>
          
          <div className="relative container mx-auto px-4 py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
              <span>🏆</span> በኢትዮጵያ ዙሪያ | Across Ethiopia
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="block">CITY</span>
              <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">VIP</span>
              <span className="block text-3xl md:text-4xl mt-2">የኢትዮጵያ የሚሊየነር ፕሮግራም</span>
            </h1>
            
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              በከተማዎ ይቀላቀሉ እና በየቀኑ ሚሊየነር ይሁኑ!
              <br />
              Join your city's VIP program and become a millionaire!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto mt-12">
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">1,000,000 ብር</p>
                <p className="text-xs">ዕለታዊ ሽልማት | Daily Prize</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">10,000,000 ብር</p>
                <p className="text-xs">ሳምንታዊ ሽልማት | Weekly Prize</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-yellow-400">40,000,000 ብር</p>
                <p className="text-xs">ወርሃዊ ሽልማት | Monthly Prize</p>
              </div>
            </div>
          </div>
        </div>

        {/* Active City VIP Programs */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-800 mb-2">🏆 የከተማ ቪአይፒ ፑሎች</h2>
            <p className="text-gray-600">Active City VIP Pools Created by Admin</p>
            <div className="w-24 h-1 bg-gradient-to-r from-gray-700 to-gray-900 mx-auto mt-4 rounded-full"></div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <MerkatoCard />
              {adminCities.map((city) => (
                <CityCard key={city.id} city={city} />
              ))}
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="container mx-auto px-4 py-16 border-t border-gray-200">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">እንዴት እንሳተፋለን?</h2>
            <p className="text-gray-600">How It Works</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-white shadow-lg animate-bounce">1️⃣</div>
              <h3 className="font-bold text-xl mb-2">ምረጥ | Choose</h3>
              <p className="text-gray-600">ከተማዎን እና የፑል አይነት ይምረጡ</p>
              <p className="text-green-600 text-sm mt-1">Select your city and pool type</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-white shadow-lg animate-bounce">2️⃣</div>
              <h3 className="font-bold text-xl mb-2">ክፈል | Pay</h3>
              <p className="text-gray-600">በቴሌብር ወይም በንግድ ባንክ ይክፈሉ</p>
              <p className="text-green-600 text-sm mt-1">Pay via TeleBirr or CBE Bank</p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-white shadow-lg animate-bounce">3️⃣</div>
              <h3 className="font-bold text-xl mb-2">ሽለም | WIN!</h3>
              <p className="text-gray-600">እጣው ሲነሳ ሚሊየነር ይሁኑ!</p>
              <p className="text-green-600 text-sm mt-1">Become a MILLIONAIRE!</p>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div>
                <div className="text-4xl font-bold mb-2">{adminCities.length}+</div>
                <div className="text-sm opacity-80">ንቁ የከተማ ፑሎች | Active City Pools</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">150,000+</div>
                <div className="text-sm opacity-80">ንግዶች | Businesses</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">600,000+</div>
                <div className="text-sm opacity-80">ሠራተኞች | Workers</div>
              </div>
            </div>
            <div className="mt-8 inline-flex items-center gap-2 bg-white/10 backdrop-blur px-6 py-3 rounded-full">
              <span>💚</span>
              <span className="text-sm">2% of every contribution supports kidney & heart disease patients</span>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">ዛሬውኑ ይቀላቀሉ!</h2>
            <p className="text-xl mb-6">Join Your City's VIP Program Today!</p>
            <Link href="/merkato-vip" className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl">
              🎯 Start Winning Now →
            </Link>
            <p className="text-xs opacity-70 mt-4">በቴሌብር እና በንግድ ባንክ መክፈል ይቻላል | Pay via TeleBirr or CBE</p>
          </div>
        </div>
      </div>
    </>
  );
}
