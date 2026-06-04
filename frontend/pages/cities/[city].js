import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import SeatSelector from '../../components/SeatSelector';
import BankTransferUpload from '../../components/BankTransferUpload';

// City-specific data - Complete with all Ethiopian cities
const cityData = {
  // ================= MAJOR & METROPOLITAN CITIES =================
  'addis-ababa': {
    name: 'አዲስ አበባ | Addis Ababa',
    slogan: 'የኢትዮጵያ የንግድ እና የዲፕሎማሲ ልብ | Heart of Ethiopian Commerce & Diplomacy',
    businesses: '50,000+',
    workers: '200,000+',
    color: 'from-green-700 to-teal-700',
    icon: '🏙️',
    product: 'ዘመናዊ አገልግሎቶች, ቴክኖሎጂ | Modern Services, Technology',
    description: 'የኢትዮጵያ ዋና ከተማ እና የንግድ ማዕከል | Capital & Business Hub'
  },
  'shaggar': {
    name: 'ሸገር ከተማ | Shaggar City',
    slogan: 'ብልህ ከተማ እና የወደፊት ኢንቨስትመንት | Smart City & Future Investment Hub',
    businesses: '15,000+',
    workers: '60,000+',
    color: 'from-cyan-700 to-blue-700',
    icon: '🏗️',
    product: 'ሪል እስቴት, መሠረተ ልማት | Real Estate, Infrastructure',
    description: 'አዲስ የከተማ ልማት ፕሮጀክት | New Urban Development Project'
  },
  'dire-dawa': {
    name: 'ድሬ ዳዋ | Dire Dawa',
    slogan: 'የሎጂስቲክስ እና የማኑፋክቸሪንግ በር | Logistics & Manufacturing Gateway',
    businesses: '15,000+',
    workers: '60,000+',
    color: 'from-orange-600 to-red-700',
    icon: '🚂',
    product: 'ጨርቃጨርቅ, ሎጂስቲክስ | Textiles, Logistics',
    description: 'ሁለተኛዋ ትልቋ ከተማ | Second Largest City'
  },
  'mekelle': {
    name: 'መቀሌ | Mekelle',
    slogan: 'የሰሜኑ የኢንዱስትሪ እና የትምህርት ማዕከል | Industrial & Educational Hub of the North',
    businesses: '18,000+',
    workers: '70,000+',
    color: 'from-red-700 to-rose-700',
    icon: '🏭',
    product: 'ሲሚንቶ, ፋርማሲዩቲካልስ | Cement, Pharmaceuticals',
    description: 'የሰሜን ኢትዮጵያ የንግድ ማዕከል | Northern Trade Hub'
  },
  'adama': {
    name: 'አዳማ | Adama',
    slogan: 'የመኪና እና የኢንዱስትሪ ከተማ | Automotive & Industrial City',
    businesses: '20,000+',
    workers: '80,000+',
    color: 'from-blue-700 to-cyan-700',
    icon: '🏭',
    product: 'የመኪና መሰብሰቢያ, ጨርቃጨርቅ | Vehicle Assembly, Textiles',
    description: 'የኢንዱስትሪ ከተማ | Industrial City'
  },
  'hawassa': {
    name: 'ሀዋሳ | Hawassa',
    slogan: 'የኢንዱስትሪ ፓርክ እና የሀይቅ ከተማ | Industrial Park & Lake City',
    businesses: '12,000+',
    workers: '50,000+',
    color: 'from-teal-600 to-green-700',
    icon: '🏞️',
    product: 'ጨርቃጨርቅ, አሳ | Textiles, Fish',
    description: 'የኢንዱስትሪ ፓርክ ከተማ | Industrial Park City'
  },
  'gondar': {
    name: 'ጎንደር | Gondar',
    slogan: 'የባህል ቅርስ እና የቱሪዝም ከተማ | Heritage & Tourism City',
    businesses: '10,000+',
    workers: '40,000+',
    color: 'from-purple-600 to-pink-700',
    icon: '🏰',
    product: 'ቱሪዝም, ጨርቃጨርቅ | Tourism, Textiles',
    description: 'የባህል ቅርስ ከተማ | Heritage City'
  },
  'bahir-dar': {
    name: 'ባህር ዳር | Bahir Dar',
    slogan: 'የሀይቆች እና የጨርቃጨርቅ ከተማ | Lakes & Textile City',
    businesses: '12,000+',
    workers: '50,000+',
    color: 'from-blue-600 to-indigo-700',
    icon: '🏞️',
    product: 'ጨርቃጨርቅ, ቱሪዝም | Textiles, Tourism',
    description: 'የታና ሀይቅ ዳርቻ | Shores of Lake Tana'
  },
  'jimma': {
    name: 'ጅማ | Jimma',
    slogan: 'የቡና እና የንግድ ከተማ | Coffee & Trade City',
    businesses: '8,000+',
    workers: '30,000+',
    color: 'from-amber-600 to-orange-700',
    icon: '☕',
    product: 'ቡና, ማር | Coffee, Honey',
    description: 'የቡና ከተማ | Coffee City'
  },
  'nekemte': {
    name: 'ነቀምቴ | Nekemte',
    slogan: 'የምእራብ ኢትዮጵያ የንግድ ማዕከል | Trade Hub of Western Ethiopia',
    businesses: '15,000+',
    workers: '60,000+',
    color: 'from-amber-500 to-yellow-600',
    icon: '☕',
    product: 'ቡና, እንስሳት | Coffee, Livestock',
    description: 'የምእራብ ኢትዮጵያ የንግድ ማዕከል | Western Trade Hub'
  },
  'dessie': {
    name: 'ደሴ | Dessie',
    slogan: 'የንግድ እና የግብርና ማዕከል | Trade & Agriculture Center',
    businesses: '8,000+',
    workers: '30,000+',
    color: 'from-yellow-600 to-orange-600',
    icon: '🛍️',
    product: 'እህል, እንስሳት | Grains, Livestock',
    description: 'የንግድ እና የግብርና ማዕከል | Trade & Agriculture Center'
  },
  'jijiga': {
    name: 'ጅጅጋ | Jijiga',
    slogan: 'የምስራቅ ኢትዮጵያ የንግድ ማዕከል | Trade Hub of Eastern Ethiopia',
    businesses: '10,000+',
    workers: '40,000+',
    color: 'from-emerald-600 to-teal-600',
    icon: '🐪',
    product: 'እንስሳት, ቆዳ | Livestock, Hides',
    description: 'የምስራቅ ኢትዮጵያ የንግድ ማዕከል | Eastern Trade Hub'
  },
  'harar': {
    name: 'ሀረር | Harar',
    slogan: 'የኢስላማዊ ቅርስ እና የባህል ከተማ | Islamic Heritage & Culture City',
    businesses: '6,000+',
    workers: '25,000+',
    color: 'from-rose-500 to-pink-600',
    icon: '🏛️',
    product: 'ቡና, ፍራፍሬ | Coffee, Fruits',
    description: 'የዩኔስኮ ቅርስ | UNESCO Heritage'
  },
  'kombolcha': {
    name: 'ኮምቦልቻ | Kombolcha',
    slogan: 'የኢንዱስትሪ እና የደረቅ ወደብ ከተማ | Industrial & Dry Port City',
    businesses: '10,000+',
    workers: '40,000+',
    color: 'from-slate-600 to-gray-700',
    icon: '🏭',
    product: 'ጨርቃጨርቅ, ማምረቻ | Textiles, Manufacturing',
    description: 'የኢንዱስትሪ ዞን | Industrial Zone'
  },

  // ================= OROMIA REGION CITIES =================
  'bishoftu': {
    name: 'ቢሾፍቱ | Bishoftu (Debre Zeyit)',
    slogan: 'የሀይቆች እና የአየር ሃይል ከተማ | City of Lakes & Air Force Base',
    businesses: '12,000+',
    workers: '45,000+',
    color: 'from-sky-500 to-blue-600',
    icon: '✈️',
    product: 'ቱሪዝም, አቪዬሽን | Tourism, Aviation',
    description: 'የሀይቆች ከተማ | City of Lakes'
  },
  'gelan': {
    name: 'ገላን | Gelan',
    slogan: 'ፈጣን የከተማ ልማት እና የመኖሪያ አካባቢ | Rapid Urban Development & Residential Area',
    businesses: '15,000+',
    workers: '60,000+',
    color: 'from-gray-500 to-slate-600',
    icon: '🏘️',
    product: 'ሪል እስቴት, ንግድ | Real Estate, Trade',
    description: 'ፈጣን የከተማ ልማት | Rapid Urban Growth'
  },
  'modjo': {
    name: 'ሞጆ | Modjo',
    slogan: 'የሎጂስቲክስ እና የደረቅ ወደብ ከተማ | Logistics & Dry Port City',
    businesses: '8,000+',
    workers: '35,000+',
    color: 'from-amber-600 to-orange-600',
    icon: '🚛',
    product: 'ሎጂስቲክስ, መጋዘን | Logistics, Warehousing',
    description: 'የሎጂስቲክስ ማዕከል | Logistics Hub'
  },
  'metu': {
    name: 'መቱ | Metu',
    slogan: 'የቡና እና የግብርና ከተማ | Coffee & Agriculture City',
    businesses: '6,000+',
    workers: '25,000+',
    color: 'from-emerald-600 to-green-700',
    icon: '🌿',
    product: 'ቡና, አቮካዶ | Coffee, Avocado',
    description: 'የቡና እርሻ አካባቢ | Coffee Growing Area'
  },
  'meki': {
    name: 'መቂ | Meki',
    slogan: 'የእህል እርሻ እና የንግድ ማዕከል | Grain Farming & Trade Center',
    businesses: '4,000+',
    workers: '18,000+',
    color: 'from-green-500 to-emerald-600',
    icon: '🌾',
    product: 'በቆሎ, ስንዴ | Maize, Wheat',
    description: 'የእህል ማብቀያ | Grain Farming Area'
  },
  'ziway': {
    name: 'ዚዋይ | Ziway',
    slogan: 'የአሳ ማጥመድ እና የቱሪዝም ከተማ | Fishing & Tourism City',
    businesses: '5,000+',
    workers: '20,000+',
    color: 'from-teal-500 to-cyan-600',
    icon: '🐟',
    product: 'አሳ, አትክልት | Fish, Vegetables',
    description: 'የአሳ ማጥመድ ከተማ | Fishing City'
  },
  'shashemene': {
    name: 'ሻሸመኔ | Shashemene',
    slogan: 'የንግድ እና የኢንዱስትሪ ከተማ | Trade & Industrial City',
    businesses: '12,000+',
    workers: '50,000+',
    color: 'from-yellow-600 to-amber-600',
    icon: '🛍️',
    product: 'ንግድ, ኢንዱስትሪ | Trade, Industry',
    description: 'የንግድ እና ኢንዱስትሪ ከተማ | Trade & Industrial City'
  },
  'robe': {
    name: 'ሮቤ | Robe',
    slogan: 'የከፍተኛ ሀይላንድ ቱሪዝም በር | Highland Tourism Gateway',
    businesses: '5,000+',
    workers: '20,000+',
    color: 'from-green-600 to-teal-600',
    icon: '🌄',
    product: 'ቱሪዝም, ገብስ | Tourism, Barley',
    description: 'የከፍተኛ ሀይላንድ ከተማ | Highland City'
  },
  'ambo': {
    name: 'አምቦ | Ambo',
    slogan: 'የማዕድን ውሃ እና የግብርና ከተማ | Mineral Water & Agriculture City',
    businesses: '8,000+',
    workers: '30,000+',
    color: 'from-green-500 to-teal-500',
    icon: '💧',
    product: 'ማዕድን ውሃ, ቡና | Mineral Water, Coffee',
    description: 'የማዕድን ውሃ ከተማ | Mineral Water City'
  },
  'holeta': {
    name: 'ሆሌታ | Holeta',
    slogan: 'የግብርና እና የሰልጠኛ ከተማ | Agriculture & Training Center',
    businesses: '5,000+',
    workers: '20,000+',
    color: 'from-lime-500 to-green-500',
    icon: '🌾',
    product: 'ስንዴ, ወተት | Wheat, Dairy',
    description: 'የግብርና ምርምር ማዕከል | Agricultural Research Center'
  },
  'weliso': {
    name: 'ወሊሶ | Weliso',
    slogan: 'የሙቀት ምንጭ እና የቱሪዝም ከተማ | Hot Springs & Tourism City',
    businesses: '5,000+',
    workers: '20,000+',
    color: 'from-teal-500 to-cyan-600',
    icon: '🏞️',
    product: 'ሙቀት ምንጭ, ቱሪዝም | Hot Springs, Tourism',
    description: 'የሙቀት ምንጭ ስፍራ | Hot Springs Resort'
  },
  'butajira': {
    name: 'ቡታጅራ | Butajira',
    slogan: 'የግብርና እና የንግድ ከተማ | Agriculture & Trade City',
    businesses: '7,000+',
    workers: '28,000+',
    color: 'from-green-600 to-emerald-700',
    icon: '🌽',
    product: 'በቆሎ, ስንዴ | Maize, Wheat',
    description: 'የግብርና ማዕከል | Agricultural Center'
  },
  'welkite': {
    name: 'ወልቂጤ | Welkite',
    slogan: 'የግብርና እና የእርሻ ከተማ | Agriculture & Farming City',
    businesses: '5,000+',
    workers: '22,000+',
    color: 'from-lime-600 to-green-700',
    icon: '🌾',
    product: 'ጤፍ, ስንዴ | Teff, Wheat',
    description: 'የእህል ማብቀያ | Grain Production Area'
  },
  'hosana': {
    name: 'ሆሳና | Hosana',
    slogan: 'የግብርና እና የንግድ ከተማ | Agriculture & Trade City',
    businesses: '8,000+',
    workers: '30,000+',
    color: 'from-yellow-600 to-amber-700',
    icon: '🌻',
    product: 'ቡና, ማር | Coffee, Honey',
    description: 'የንግድ ማዕከል | Trade Center'
  },

  // ================= SOUTHERN REGION CITIES =================
  'arba-minch': {
    name: 'አርባ ምንጭ | Arba Minch',
    slogan: 'የቱሪዝም እና የግብርና ከተማ | Tourism & Agriculture City',
    businesses: '10,000+',
    workers: '40,000+',
    color: 'from-blue-500 to-cyan-600',
    icon: '🏞️',
    product: 'ቱሪዝም, ሙዝ | Tourism, Banana',
    description: 'የአርባ ምንጭ ፓርክ | Arba Minch Park'
  },
  'sodo': {
    name: 'ሶዶ | Sodo',
    slogan: 'የንግድ እና የግብርና ማዕከል | Trade & Agriculture Center',
    businesses: '10,000+',
    workers: '40,000+',
    color: 'from-orange-500 to-red-600',
    icon: '🛍️',
    product: 'እህል, እንስሳት | Grains, Livestock',
    description: 'የንግድ ማዕከል | Trade Center'
  },

  // ================= OTHER REGIONS =================
  'shindi': {
    name: 'ሺንዲ | Shindi',
    slogan: 'የንግድ እና የግብርና ከተማ | Trade & Agriculture City',
    businesses: '6,000+',
    workers: '25,000+',
    color: 'from-emerald-500 to-teal-600',
    icon: '🌾',
    product: 'እህል, ዘይት | Grains, Oil Seeds',
    description: 'የንግድ ማዕከል | Trade Center'
  },
  'assosa': {
    name: 'አሶሳ | Assosa',
    slogan: 'የቤኒሻንጉል ጉሙዝ የንግድ ማዕከል | Trade Hub of Benishangul-Gumuz',
    businesses: '6,000+',
    workers: '25,000+',
    color: 'from-green-500 to-emerald-600',
    icon: '🌿',
    product: 'ወርቅ, እህል | Gold, Grains',
    description: 'የክልል ዋና ከተማ | Regional Capital'
  },
  'semera': {
    name: 'ሰሜና ሸዋ | Semera',
    slogan: 'የአፋር ክልል የንግድ ማዕከል | Trade Hub of the Afar Region',
    businesses: '3,000+',
    workers: '15,000+',
    color: 'from-yellow-500 to-orange-600',
    icon: '🐪',
    product: 'ጨው, እንስሳት | Salt, Livestock',
    description: 'የክልል ዋና ከተማ | Regional Capital'
  }
};

export default function CityVip() {
  const router = useRouter();
  const { city, name } = router.query;
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedPool, setSelectedPool] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [showBankUpload, setShowBankUpload] = useState(false);
  const [selectedSeatsData, setSelectedSeatsData] = useState(null);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [cityInfo, setCityInfo] = useState(null);

  useEffect(() => {
    if (city) {
      // Get city data from the mapping or use custom city name from query
      const data = cityData[city];
      if (data) {
        setCityInfo(data);
      } else {
        // Custom city from "Other" option
        setCityInfo({
          name: name ? decodeURIComponent(name) : city.replace(/-/g, ' '),
          slogan: 'አንድ ብሔር አንድ እድል | One Nation One Chance',
          businesses: '1,000+',
          workers: '5,000+',
          color: 'from-gray-700 to-gray-900',
          icon: '🇪🇹',
          product: 'ማህበረሰብ እና ንግድ | Community & Trade',
          description: 'የኢትዮጵያ ከተማ | Ethiopian City'
        });
      }
    }
    checkUser();
  }, [city, name]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const vipPools = {
    daily: {
      name: "ዕለታዊ ሚሊየነር | Daily Millionaire",
      tier: "ለሁሉም ኢትዮጵያዊ | For Every Ethiopian",
      frequency: "Daily",
      contribution: "500 ETB",
      prize: "1,000,000 ETB",
      prizeNumber: 1000000,
      winnerCount: 1,
      totalSeats: 2400,
      time: "Every Day at 8:00 PM",
      color: "from-yellow-500 to-orange-600",
      icon: "⭐",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      description: "Start your day with a chance to become an instant millionaire!"
    },
    weekly: {
      name: "ሳምንታዊ ግዙፍ አሸናፊ | Weekly Mega Winner",
      tier: "VIP 2",
      frequency: "Weekly",
      contribution: "2,500 ETB",
      prize: "10,000,000 ETB",
      prizeNumber: 10000000,
      winnerCount: 1,
      totalSeats: 4800,
      time: "Every Sunday at 6:00 PM",
      color: "from-purple-500 to-pink-600",
      icon: "🏆",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      description: "Ten MILLION Birr changes everything!"
    },
    monthly: {
      name: "ወርሃዊ አሸናፊ | Monthly Winner",
      tier: "VIP 1",
      frequency: "Monthly",
      contribution: "5,000 ETB",
      prize: "40,000,000 ETB",
      prizeNumber: 40000000,
      winnerCount: 1,
      totalSeats: 9600,
      time: "Last Day of Month at 8:00 PM",
      color: "from-green-600 to-teal-700",
      icon: "👑",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      description: "The ULTIMATE nationwide prize pool!"
    }
  };

  const handleJoinPool = async (poolType) => {
    if (!user) {
      sessionStorage.setItem('pendingRole', 'individual');
      sessionStorage.setItem('pendingPoolType', poolType);
      sessionStorage.setItem('pendingCity', city);
      sessionStorage.setItem('redirectAfterLogin', `/cities/${city}`);
      toast.loading('እባክዎ ይግቡ | Please login to join...');
      router.push('/login');
      return;
    }
    setSelectedPool(poolType);
    setShowSeatSelector(true);
  };

  const handleSeatsSelected = async (seatData) => {
    setSelectedSeatsData(seatData);
    setShowSeatSelector(false);
    setShowBankUpload(true);
    setReservedSeats(seatData.seats);
    toast.success(`✅ Seats ${seatData.seats.join(', ')} reserved!`);
  };

  const handlePaymentSuccess = async () => {
    setShowBankUpload(false);
    router.push('/dashboard');
  };

  const handleCancelReservation = async () => {
    setReservedSeats([]);
    setShowBankUpload(false);
    setShowSeatSelector(true);
  };

  const handleCancelSeatSelection = () => {
    setShowSeatSelector(false);
  };

  const PoolCard = ({ type, pool }) => (
    <div className="group relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
        🏆 {pool.prize}
      </div>
      <div className={`bg-gradient-to-r ${pool.color} p-6 text-white relative`}>
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{pool.tier}</p>
            <h3 className="text-2xl font-bold mt-1">{pool.name}</h3>
          </div>
          <div className="text-5xl animate-bounce">{pool.icon}</div>
        </div>
        <div className="mt-3 bg-white/20 backdrop-blur rounded-lg p-2 text-center">
          <p className="text-sm font-bold">{pool.slogan}</p>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div><p className="text-sm opacity-80">የመግቢያ ክፍያ | Entry Fee</p><p className="text-3xl font-bold">{pool.contribution}</p></div>
          <div className="text-right"><p className="text-sm opacity-80">የተረጋገጠ ሽልማት | Prize</p><p className="text-3xl font-bold">{pool.prize}</p></div>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>{pool.time}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg><span>{pool.winnerCount} አሸናፊ | Winner Every {pool.frequency}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg><span>💺 Total Seats: {pool.totalSeats.toLocaleString()}</span></div>
        </div>
        <p className="text-gray-600 text-sm mb-6">{pool.description}</p>
        <button onClick={() => handleJoinPool(type)} className={`w-full bg-gradient-to-r ${pool.color} text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition transform hover:scale-105 flex items-center justify-center gap-2`}>🎯 Select Seat & Join {pool.frequency} Pool →</button>
      </div>
    </div>
  );

  if (!cityInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{cityInfo.name} VIP - Win 1M Daily, 10M Weekly, 40M Monthly | Abbaa Carraa</title>
        <meta name="description" content={`Join ${cityInfo.name} VIP program. Win 1 Million Birr daily, 10 Million weekly, or 40 Million monthly. Open to all ${cityInfo.name} traders and participants.`} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Hero Section - City Specific */}
        <div className={`relative bg-gradient-to-r ${cityInfo.color} text-white overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 text-9xl animate-bounce">{cityInfo.icon}</div>
            <div className="absolute bottom-10 right-10 text-9xl animate-pulse">🇪🇹</div>
            <div className="absolute top-1/3 left-1/4 text-8xl animate-spin-slow">⭐</div>
          </div>
          <div className="relative container mx-auto px-4 py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full text-sm font-bold mb-6 animate-pulse">
              <span>🏆</span> {cityInfo.name} Special Program
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="block">{cityInfo.name.split('|')[0]}</span>
              <span className="bg-gradient-to-r from-yellow-300 to-green-300 bg-clip-text text-transparent">VIP</span>
            </h1>
            <p className="text-xl text-yellow-200 max-w-2xl mx-auto">{cityInfo.slogan}</p>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3"><div className="text-3xl font-bold">{cityInfo.businesses}</div><div className="text-sm">ንግዶች | Businesses</div></div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3"><div className="text-3xl font-bold">{cityInfo.workers}</div><div className="text-sm">ሠራተኞች | Workers</div></div>
              <div className="bg-white/10 backdrop-blur rounded-lg px-6 py-3"><div className="text-3xl font-bold">ሁሉም</div><div className="text-sm">ኢትዮጵያዊያን | All Ethiopians</div></div>
            </div>
          </div>
        </div>

        {/* About City Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">🌟 ስለ {cityInfo.name.split('|')[0]} | About {cityInfo.name.split('|')[1] || cityInfo.name}</h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  በ{cityInfo.name.split('|')[0]} ውስጥ የሚገኙ ነጋዴዎች እና ተሳታፊዎች በዚህ ልዩ ፕሮግራም አማካኝነት በየቀኑ፣ በየሳምንቱ እና በየወሩ ሚሊየነር የመሆን እድል አላቸው!
                </p>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {cityInfo.description}
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="border-l-4 border-green-500 pl-3"><p className="font-semibold">የእምነት ንግድ | Trust-Based Commerce</p></div>
                  <div className="border-l-4 border-green-500 pl-3"><p className="font-semibold">ዘመናዊ እኩብ | Modern Equb</p></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">💎 ዋና ምርቶች | Main Products</h3>
                <p className="text-gray-700 text-sm mb-4">{cityInfo.product}</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየቀኑ አንድ ሚሊየነር | One Millionaire Every Day</div>
                  <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየሳምንቱ አንድ ሚሊየነር | One Millionaire Every Week</div>
                  <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየወሩ አንድ ሚሊየነር | One Millionaire Every Month</div>
                </div>
                <div className="mt-4 p-3 bg-yellow-100 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-800 text-center">✨ ሁሉም በአንድ ላይ | All Together Now!</p>
                  <p className="text-xs text-center mt-1">በመላው ኢትዮጵያ ያሉ ነጋዴዎች እንኳን ደህና መጡ!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIP Tabs */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button onClick={() => setActiveTab('daily')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'daily' ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>⭐ ዕለታዊ | Daily (1M)</button>
            <button onClick={() => setActiveTab('weekly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'weekly' ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>🏆 ሳምንታዊ | Weekly (10M)</button>
            <button onClick={() => setActiveTab('monthly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'monthly' ? 'bg-gradient-to-r from-green-600 to-teal-700 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>👑 ወርሃዊ | Monthly (40M)</button>
          </div>
          <div className="max-w-4xl mx-auto"><PoolCard type={activeTab} pool={vipPools[activeTab]} /></div>
        </div>

        {/* Seat Selection & Payment */}
        {showSeatSelector && selectedPool && (
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <SeatSelector
              poolId={`${city}_${selectedPool}`}
              entryFee={parseInt(vipPools[selectedPool].contribution)}
              maxSeats={5}
              totalSeats={vipPools[selectedPool].totalSeats}
              onSeatsSelected={handleSeatsSelected}
              onCancel={handleCancelSeatSelection}
            />
          </div>
        )}

        {showBankUpload && selectedSeatsData && (
          <BankTransferUpload
            poolId={`${city}_${selectedPool}`}
            amount={selectedSeatsData.totalAmount}
            seatNumbers={selectedSeatsData.seats}
            onSuccess={handlePaymentSuccess}
            onClose={handleCancelReservation}
          />
        )}

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-green-700 to-teal-700 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">ዛሬውኑ ይቀላቀሉ!</h2>
            <p className="text-xl mb-6">Join Today and Become {cityInfo.name.split('|')[0]}'s Next Millionaire!</p>
            <Link href="/" className="inline-block bg-white text-green-700 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl">🎯 Back to Cities →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
