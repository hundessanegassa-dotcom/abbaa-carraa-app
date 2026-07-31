// pages/index.js - COMPLETE WITH PARTNER PROGRAM, CITY VIP TIERS & SEARCH
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import GlobalAnnouncement from '../components/GlobalAnnouncement';
import CitySelector from '../components/CitySelector';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';
import TopCitySelector from '../components/TopCitySelector';
import PoolCard from '../components/PoolCard';
import toast from 'react-hot-toast';
import { useUIMode } from '../hooks/useUIMode';
import BankingStyleView from '../components/BankingStyleView';
import { getAllCities, getCityData } from '../lib/cityData';
import { useTelegram } from '../hooks/useTelegram';
import { TIERS } from '../components/SeatSelector';

// Lazy loaded components
const MovingAd = dynamic(() => import('../components/MovingAd'), { ssr: false, loading: () => null });
const Testimonials = dynamic(() => import('../components/Testimonials'), { ssr: false, loading: () => null });
const NewsletterSubscribe = dynamic(() => import('../components/NewsletterSubscribe'), { ssr: false, loading: () => null });
const AdvertisingBanner = dynamic(() => import('../components/AdvertisingBanner'), { ssr: false, loading: () => null });
const CashEquivalentBanner = dynamic(() => import('../components/CashEquivalentBanner'), { ssr: false, loading: () => null });
const CharityBanner = dynamic(() => import('../components/CharityBanner'), { ssr: false, loading: () => null });

export async function getServerSideProps() {
  return { props: {} };
}

export default function Home() {
  const router = useRouter();
  const { mode, toggleMode } = useUIMode();
  const { isInTelegram, user: telegramUser } = useTelegram();
  
  const [language, setLanguage] = useState('am');
  const [pools, setPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_agents: 0,
    total_raised: 0,
    total_cities: 94
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showRegularPools, setShowRegularPools] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registerForm, setRegisterForm] = useState({
    fullName: '', email: '', phone: '', password: '', confirmPassword: '', city: '', agreeTerms: false
  });
  const [activeView, setActiveView] = useState('classic');
  const [showModeDrawer, setShowModeDrawer] = useState(false);
  const [selectedCityForTiers, setSelectedCityForTiers] = useState(null);
  const [showCityTiersModal, setShowCityTiersModal] = useState(false);

  // ALL 94 ETHIOPIAN CITIES
  const allCityVipPrograms = [
    // ===================== CENTRAL & MAJOR CITIES =====================
    { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', region: 'Central', icon: '🏙️', prize: '10M ETB' },
    { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', region: 'Oromia', icon: '🏗️', prize: '10M ETB' },
    { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', region: 'Dire Dawa', icon: '🚂', prize: '10M ETB' },
    { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', region: 'Tigray', icon: '🏭', prize: '10M ETB' },
    { id: 'axum', name: 'አክሱም', nameEn: 'Axum', region: 'Tigray', icon: '🏛️', prize: '10M ETB' },
    { id: 'adigrat', name: 'አዲግራት', nameEn: 'Adigrat', region: 'Tigray', icon: '🏔️', prize: '10M ETB' },
    { id: 'shire', name: 'ሽሬ', nameEn: 'Shire', region: 'Tigray', icon: '🏔️', prize: '10M ETB' },
    { id: 'mekoni', name: 'መቆኒ', nameEn: 'Mekoni', region: 'Tigray', icon: '🏔️', prize: '10M ETB' },
    { id: 'maychew', name: 'ማይጨው', nameEn: 'Maychew', region: 'Tigray', icon: '🏔️', prize: '10M ETB' },
    { id: 'abiy-addi', name: 'አቢይ አዲ', nameEn: 'Abiy Addi', region: 'Tigray', icon: '🏔️', prize: '10M ETB' },
    { id: 'wukro', name: 'ውቅሮ', nameEn: 'Wukro', region: 'Tigray', icon: '🏔️', prize: '10M ETB' },
    { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', region: 'Amhara', icon: '🏰', prize: '10M ETB' },
    { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', region: 'Amhara', icon: '🏞️', prize: '10M ETB' },
    { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', region: 'Amhara', icon: '🏔️', prize: '10M ETB' },
    { id: 'debre-markos', name: 'ደብረ ማርቆስ', nameEn: 'Debre Markos', region: 'Amhara', icon: '⛪', prize: '10M ETB' },
    { id: 'finote-selam', name: 'ፍኖተ ሰላም', nameEn: 'Finote Selam', region: 'Amhara', icon: '🌅', prize: '10M ETB' },
    { id: 'woldia', name: 'ወልዲያ', nameEn: 'Woldia', region: 'Amhara', icon: '🎓', prize: '10M ETB' },
    { id: 'debre-birhan', name: 'ደብረ ብርሃን', nameEn: 'Debre Birhan', region: 'Amhara', icon: '⭐', prize: '10M ETB' },
    { id: 'kombolcha', name: 'ኮምቦልቻ', nameEn: 'Kombolcha', region: 'Amhara', icon: '🏭', prize: '10M ETB' },
    { id: 'sekota', name: 'ሰቆጣ', nameEn: 'Sekota', region: 'Amhara', icon: '🏔️', prize: '10M ETB' },
    { id: 'aykal', name: 'አይከል', nameEn: 'Aykal', region: 'Amhara', icon: '🏔️', prize: '10M ETB' },
    { id: 'metema', name: 'ሜተማ', nameEn: 'Metema', region: 'Amhara', icon: '🛣️', prize: '10M ETB' },
    { id: 'debre-tabor', name: 'ደብረ ታቦር', nameEn: 'Debre Tabor', region: 'Amhara', icon: '⛪', prize: '10M ETB' },
    { id: 'bati', name: 'ባቲ', nameEn: 'Bati', region: 'Amhara', icon: '🏔️', prize: '10M ETB' },
    { id: 'kemise', name: 'ቀሚሴ', nameEn: 'Kemise', region: 'Amhara', icon: '🏔️', prize: '10M ETB' },
    { id: 'injibara', name: 'እንጅባራ', nameEn: 'Injibara', region: 'Amhara', icon: '🏔️', prize: '10M ETB' },
    { id: 'lalibela', name: 'ላሊበላ', nameEn: 'Lalibela', region: 'Amhara', icon: '⛪', prize: '10M ETB' },
    { id: 'adama', name: 'አዳማ', nameEn: 'Adama', region: 'Oromia', icon: '🏭', prize: '10M ETB' },
    { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', region: 'Oromia', icon: '☕', prize: '10M ETB' },
    { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', region: 'Oromia', icon: '✈️', prize: '10M ETB' },
    { id: 'asella', name: 'አሰላ', nameEn: 'Asella', region: 'Oromia', icon: '🏔️', prize: '10M ETB' },
    { id: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene', region: 'Oromia', icon: '🛍️', prize: '10M ETB' },
    { id: 'robe', name: 'ሮቤ', nameEn: 'Robe', region: 'Oromia', icon: '🌄', prize: '10M ETB' },
    { id: 'ginir', name: 'ጊኒር', nameEn: 'Ginir', region: 'Oromia', icon: '🏞️', prize: '10M ETB' },
    { id: 'yabelo', name: 'ያቤሎ', nameEn: 'Yabelo', region: 'Oromia', icon: '🐪', prize: '10M ETB' },
    { id: 'moyale', name: 'ሞያሌ', nameEn: 'Moyale', region: 'Oromia', icon: '🛣️', prize: '10M ETB' },
    { id: 'chiro', name: 'ቺሮ', nameEn: 'Chiro', region: 'Oromia', icon: '🏔️', prize: '10M ETB' },
    { id: 'fiche', name: 'ፊጬ', nameEn: 'Fiche', region: 'Oromia', icon: '🌾', prize: '10M ETB' },
    { id: 'woliso', name: 'ወሊሶ', nameEn: 'Woliso', region: 'Oromia', icon: '💧', prize: '10M ETB' },
    { id: 'ambo', name: 'አምቦ', nameEn: 'Ambo', region: 'Oromia', icon: '💧', prize: '10M ETB' },
    { id: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte', region: 'Oromia', icon: '☕', prize: '10M ETB' },
    { id: 'gimbi', name: 'ጊምቢ', nameEn: 'Gimbi', region: 'Oromia', icon: '🏔️', prize: '10M ETB' },
    { id: 'dembi-dollo', name: 'ደምቢ ዶሎ', nameEn: 'Dembi Dollo', region: 'Oromia', icon: '💰', prize: '10M ETB' },
    { id: 'shambu', name: 'ሻምቡ', nameEn: 'Shambu', region: 'Oromia', icon: '🌾', prize: '10M ETB' },
    { id: 'metu', name: 'መቱ', nameEn: 'Metu', region: 'Oromia', icon: '🌿', prize: '10M ETB' },
    { id: 'bedele', name: 'በደሌ', nameEn: 'Bedele', region: 'Oromia', icon: '🍺', prize: '10M ETB' },
    { id: 'bule-hora', name: 'ቡሌ ሆራ', nameEn: 'Bule Hora', region: 'Oromia', icon: '🎓', prize: '10M ETB' },
    { id: 'negele-borana', name: 'ነገሌ ቦረና', nameEn: 'Negele Borana', region: 'Oromia', icon: '🐪', prize: '10M ETB' },
    { id: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway', region: 'Oromia', icon: '🐟', prize: '10M ETB' },
    { id: 'mojo', name: 'ሞጆ', nameEn: 'Mojo', region: 'Oromia', icon: '🚛', prize: '10M ETB' },
    { id: 'dodola', name: 'ዶዶላ', nameEn: 'Dodola', region: 'Oromia', icon: '🏔️', prize: '10M ETB' },
    { id: 'gera', name: 'ጌራ', nameEn: 'Gera', region: 'Oromia', icon: '☕', prize: '10M ETB' },
    { id: 'agaro', name: 'አጋሮ', nameEn: 'Agaro', region: 'Oromia', icon: '☕', prize: '10M ETB' },
    { id: 'lemu', name: 'ለሙ', nameEn: 'Lemu', region: 'Oromia', icon: '🌾', prize: '10M ETB' },
    { id: 'hagere-mariam', name: 'ሀገረ ማርያም', nameEn: 'Hagere Mariam', region: 'Oromia', icon: '🏔️', prize: '10M ETB' },
    { id: 'shakiso', name: 'ሻኪሶ', nameEn: 'Shakiso', region: 'Oromia', icon: '💰', prize: '10M ETB' },
    { id: 'kibre-mengist', name: 'ቅብረ መንግስት', nameEn: 'Kibre Mengist', region: 'Oromia', icon: '🏔️', prize: '10M ETB' },
    { id: 'wachile', name: 'ዋቺሌ', nameEn: 'Wachile', region: 'Oromia', icon: '🐪', prize: '10M ETB' },
    { id: 'goba', name: 'ጎባ', nameEn: 'Goba', region: 'Oromia', icon: '🏔️', prize: '10M ETB' },
    { id: 'sinana', name: 'ሲናና', nameEn: 'Sinana', region: 'Oromia', icon: '🌾', prize: '10M ETB' },
    { id: 'dinsho', name: 'ዲንሾ', nameEn: 'Dinsho', region: 'Oromia', icon: '🏞️', prize: '10M ETB' },
    { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', region: 'Somali', icon: '🐪', prize: '10M ETB' },
    { id: 'degehabur', name: 'ደገሃቡር', nameEn: 'Degehabur', region: 'Somali', icon: '🏔️', prize: '10M ETB' },
    { id: 'kebri-dehar', name: 'ቀብሪ ደሃር', nameEn: 'Kebri Dehar', region: 'Somali', icon: '🏔️', prize: '10M ETB' },
    { id: 'gode', name: 'ጎዴ', nameEn: 'Gode', region: 'Somali', icon: '🏔️', prize: '10M ETB' },
    { id: 'warder', name: 'ዋርደር', nameEn: 'Warder', region: 'Somali', icon: '🐪', prize: '10M ETB' },
    { id: 'shilabo', name: 'ሺላቦ', nameEn: 'Shilabo', region: 'Somali', icon: '🐪', prize: '10M ETB' },
    { id: 'kelafo', name: 'ከላፎ', nameEn: 'Kelafo', region: 'Somali', icon: '🏔️', prize: '10M ETB' },
    { id: 'mustahil', name: 'ሙስታሂል', nameEn: 'Mustahil', region: 'Somali', icon: '🏔️', prize: '10M ETB' },
    { id: 'ferfer', name: 'ፌርፌር', nameEn: 'Ferfer', region: 'Somali', icon: '🛣️', prize: '10M ETB' },
    { id: 'harar', name: 'ሀረር', nameEn: 'Harar', region: 'Harari', icon: '🏛️', prize: '10M ETB' },
    { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', region: 'Sidama', icon: '🏞️', prize: '10M ETB' },
    { id: 'yirgalem', name: 'ይርጋለም', nameEn: 'Yirgalem', region: 'Sidama', icon: '☕', prize: '10M ETB' },
    { id: 'awassa', name: 'አዋሳ', nameEn: 'Awassa', region: 'Sidama', icon: '🏞️', prize: '10M ETB' },
    { id: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch', region: 'South', icon: '🏞️', prize: '10M ETB' },
    { id: 'sodo', name: 'ሶዶ', nameEn: 'Sodo', region: 'South', icon: '🛍️', prize: '10M ETB' },
    { id: 'dilla', name: 'ዲላ', nameEn: 'Dilla', region: 'South', icon: '☕', prize: '10M ETB' },
    { id: 'sawla', name: 'ሳውላ', nameEn: 'Sawla', region: 'South', icon: '🏔️', prize: '10M ETB' },
    { id: 'jinka', name: 'ጂንካ', nameEn: 'Jinka', region: 'South', icon: '🏔️', prize: '10M ETB' },
    { id: 'konso', name: 'ኮንሶ', nameEn: 'Konso', region: 'South', icon: '🏔️', prize: '10M ETB' },
    { id: 'karat', name: 'ካራት', nameEn: 'Karat', region: 'South', icon: '🏔️', prize: '10M ETB' },
    { id: 'bonga', name: 'ቦንጋ', nameEn: 'Bonga', region: 'South', icon: '☕', prize: '10M ETB' },
    { id: 'mizan-teferi', name: 'ሚዛን ተፈሪ', nameEn: 'Mizan Teferi', region: 'South', icon: '🏔️', prize: '10M ETB' },
    { id: 'teppi', name: 'ቴፒ', nameEn: 'Teppi', region: 'South', icon: '🌿', prize: '10M ETB' },
    { id: 'gereb', name: 'ገሬብ', nameEn: 'Gereb', region: 'South', icon: '🏔️', prize: '10M ETB' },
    { id: 'key-afar', name: 'ቀይ አፋር', nameEn: 'Key Afar', region: 'South', icon: '🏔️', prize: '10M ETB' },
    { id: 'bako', name: 'ባኮ', nameEn: 'Bako', region: 'South', icon: '🏔️', prize: '10M ETB' },
    { id: 'welkite', name: 'ወልቂጤ', nameEn: 'Welkite', region: 'South', icon: '🏔️', prize: '10M ETB' },
    { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', region: 'Benishangul', icon: '🌿', prize: '10M ETB' },
    { id: 'gilgel-beles', name: 'ግልገል በለስ', nameEn: 'Gilgel Beles', region: 'Benishangul', icon: '💧', prize: '10M ETB' },
    { id: 'kamashi', name: 'ካማሺ', nameEn: 'Kamashi', region: 'Benishangul', icon: '🏔️', prize: '10M ETB' },
    { id: 'metekel', name: 'ሜተከል', nameEn: 'Metekel', region: 'Benishangul', icon: '🏔️', prize: '10M ETB' },
    { id: 'dibate', name: 'ዲባቴ', nameEn: 'Dibate', region: 'Benishangul', icon: '🏔️', prize: '10M ETB' },
    { id: 'gambella', name: 'ጋምቤላ', nameEn: 'Gambella', region: 'Gambella', icon: '🏞️', prize: '10M ETB' },
    { id: 'meti', name: 'ሜቲ', nameEn: 'Meti', region: 'Gambella', icon: '🏔️', prize: '10M ETB' },
    { id: 'fugnido', name: 'ፉኝዶ', nameEn: 'Fugnido', region: 'Gambella', icon: '🏞️', prize: '10M ETB' },
    { id: 'itur', name: 'ኢቱር', nameEn: 'Itur', region: 'Gambella', icon: '🏔️', prize: '10M ETB' },
    { id: 'semera', name: 'ሰሜራ', nameEn: 'Semera', region: 'Afar', icon: '🐪', prize: '10M ETB' },
    { id: 'asaita', name: 'አሳይታ', nameEn: 'Asaita', region: 'Afar', icon: '🏔️', prize: '10M ETB' },
    { id: 'logiya', name: 'ሎጊያ', nameEn: 'Logiya', region: 'Afar', icon: '🛣️', prize: '10M ETB' },
    { id: 'abila', name: 'አቢላ', nameEn: 'Abila', region: 'Afar', icon: '🐪', prize: '10M ETB' },
    { id: 'dubti', name: 'ዱብቲ', nameEn: 'Dubti', region: 'Afar', icon: '🏔️', prize: '10M ETB' },
    { id: 'elidar', name: 'ኤልዳር', nameEn: 'Elidar', region: 'Afar', icon: '🏔️', prize: '10M ETB' },
    { id: 'chifra', name: 'ቺፍራ', nameEn: 'Chifra', region: 'Afar', icon: '🏔️', prize: '10M ETB' }
  ];

  const uniqueCities = allCityVipPrograms.filter((city, index, self) => 
    index === self.findIndex((c) => c.id === city.id)
  );

  const filteredCityList = uniqueCities.filter(city => 
    city.name.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
    city.nameEn.toLowerCase().includes(citySearchTerm.toLowerCase()) ||
    city.region.toLowerCase().includes(citySearchTerm.toLowerCase())
  );

  const { ref: counterRef, inView: counterInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  // Auto-login with Telegram
  useEffect(() => {
    if (isInTelegram && telegramUser) {
      console.log('📱 Telegram user detected:', telegramUser);
      const initData = sessionStorage.getItem('telegram_init_data');
      if (initData) {
        fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData, user: telegramUser })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            console.log('✅ Telegram auto-login successful');
            toast.success('Welcome via Telegram! 🎉');
          }
        })
        .catch(err => console.error('Telegram auto-login error:', err));
      }
    }
  }, [isInTelegram, telegramUser]);

  const loadData = async () => {
    setLoading(true);
    const fallbackPools = [
      {
        id: 'mock-1',
        prize_name: 'Toyota Vitz 2018',
        description: 'Highly economical and clean family hatchback.',
        target_amount: 850000,
        entry_fee: 500,
        category: 'cars',
        is_featured: true,
        status: 'active',
        current_amount: 425000,
        current_participants: 850,
        total_seats: 1700,
        prize_image: '/images/v8-car.jpg'
      },
      {
        id: 'mock-2',
        prize_name: 'Modern Apartment in Addis Ababa',
        description: '2-bedroom modern apartment near Bole.',
        target_amount: 15000000,
        entry_fee: 5000,
        category: 'houses',
        is_featured: true,
        status: 'active',
        current_amount: 6000000,
        current_participants: 1200,
        total_seats: 3000,
        prize_image: '/images/modern-house.jpg'
      },
      {
        id: 'mock-3',
        prize_name: 'Heavy Wheel Loader',
        description: 'Premium machinery for high productivity.',
        target_amount: 6500000,
        entry_fee: 2500,
        category: 'machinery',
        is_featured: false,
        status: 'active',
        current_amount: 1950000,
        current_participants: 780,
        total_seats: 2600,
        prize_image: '/images/wheel-loader.jpg'
      }
    ];

    try {
      const { data: poolsData, error: poolsError } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (poolsError) throw poolsError;

      const { data: featuredData, error: featuredError } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (featuredError) throw featuredError;

      const { data: allPools, error: statsError } = await supabase
        .from('pools')
        .select('status, target_amount, current_amount');

      if (!statsError && allPools) {
        const totalRaised = allPools.reduce((sum, p) => sum + (p.current_amount || 0), 0);
        
        const { count: winnersCount } = await supabase
          .from('pools')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'completed')
          .not('winner_id', 'is', null);

        const { count: agentsCount } = await supabase
          .from('agents')
          .select('*', { count: 'exact', head: true });

        setStats({
          total_pools: allPools.length,
          total_winners: winnersCount || 0,
          total_agents: agentsCount || 0,
          total_raised: totalRaised,
          total_cities: uniqueCities.length
        });
      }

      setPools((poolsData && poolsData.length > 0) ? poolsData : fallbackPools);
      setFeaturedPools((featuredData && featuredData.length > 0) ? featuredData : fallbackPools.filter(p => p.is_featured));
      
    } catch (error) {
      console.warn('Supabase offline or failed to load. Displaying robust fallback pools:', error.message);
      setPools(fallbackPools);
      setFeaturedPools(fallbackPools.filter(p => p.is_featured));
      setStats({
        total_pools: fallbackPools.length,
        total_winners: 14,
        total_agents: 35,
        total_raised: 8375000,
        total_cities: uniqueCities.length
      });
    } finally {
      setLoading(false);
      setDataLoaded(true);
      setIsInitialLoad(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (registerForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (!registerForm.agreeTerms) {
      toast.error('Please agree to the Terms and Conditions');
      return;
    }
    
    setRegisterLoading(true);
    
    try {
      const { error } = await supabase.auth.signUp({
        email: registerForm.email,
        password: registerForm.password,
        options: {
          data: {
            full_name: registerForm.fullName,
            phone: registerForm.phone,
            city: registerForm.city,
            role: 'individual'
          }
        }
      });
      
      if (error) throw error;
      
      toast.success('Registration successful! Please check your email to verify your account.');
      setShowRegisterModal(false);
      setRegisterForm({
        fullName: '', email: '', phone: '', password: '', confirmPassword: '', city: '', agreeTerms: false
      });
      
      setTimeout(() => router.push('/login'), 2000);
      
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRoleSelection = (role) => {
    sessionStorage.setItem('pendingRole', role);
    router.push('/login');
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
    setProgramsDropdownOpen(false);
  };

  const t = (am, en) => language === 'am' ? am : en;

  // ============================================
  // CITY VIP TIERS MODAL
  // ============================================
  const CityTiersModal = () => {
    if (!showCityTiersModal || !selectedCityForTiers) return null;
    
    const tiers = [
      { id: 'silver', label: language === 'am' ? 'ብር' : 'Silver', icon: '🥈', contribution: 100, prize: 100000, seats: 1200 },
      { id: 'gold', label: language === 'am' ? 'ወርቅ' : 'Gold', icon: '🥇', contribution: 500, prize: 500000, seats: 1200 },
      { id: 'platinum', label: language === 'am' ? 'ፕላቲኒየም' : 'Platinum', icon: '💎', contribution: 1000, prize: 2000000, seats: 2400 },
      { id: 'diamond', label: language === 'am' ? 'አልማዝ' : 'Diamond', icon: '💠', contribution: 2500, prize: 5000000, seats: 2400 },
      { id: 'royal', label: language === 'am' ? 'ንጉሣዊ' : 'Royal', icon: '👑', contribution: 5000, prize: 10000000, seats: 2400 }
    ];
    
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowCityTiersModal(false)}>
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span>{selectedCityForTiers.icon}</span>
                {selectedCityForTiers.name} VIP
                <span className="text-sm font-normal text-gray-500 ml-2">{selectedCityForTiers.nameEn}</span>
              </h2>
              <p className="text-sm text-gray-500">{t('5 Premium Tiers • Win Cash up to 10M ETB', '5 Premium Tiers • Win Cash up to 10M ETB')}</p>
            </div>
            <button onClick={() => setShowCityTiersModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tiers.map((tier) => (
                <div key={tier.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition">
                  <div className={`p-4 text-center text-white bg-gradient-to-r ${
                    tier.id === 'silver' ? 'from-gray-400 to-gray-500' :
                    tier.id === 'gold' ? 'from-yellow-400 to-yellow-600' :
                    tier.id === 'platinum' ? 'from-gray-300 to-blue-400' :
                    tier.id === 'diamond' ? 'from-blue-400 to-cyan-400' :
                    'from-purple-500 to-pink-500'
                  }`}>
                    <div className="text-4xl mb-1">{tier.icon}</div>
                    <h3 className="font-bold text-xl">{tier.label}</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-gray-500">{t('ክፍያ', 'Entry')}</span>
                      <span className="font-bold">ETB {tier.contribution.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm border-b pb-2">
                      <span className="text-gray-500">{t('ሽልማት', 'Prize')}</span>
                      <span className="font-bold text-green-600">ETB {tier.prize.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('መቀመጫዎች', 'Seats')}</span>
                      <span className="font-bold">{tier.seats.toLocaleString()}</span>
                    </div>
                    <Link 
                      href={`/cities/${selectedCityForTiers.id}?tier=${tier.id}`}
                      className="block w-full text-center bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold text-sm transition"
                    >
                      {t('ይምረጡ', 'Select')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <Link 
                href={`/cities/${selectedCityForTiers.id}`}
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                {t('ሁሉንም ደረጃዎች ይመልከቱ →', 'View all tiers →')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // REGISTER MODAL
  // ============================================
  const RegisterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{t('Create Account', 'Create Account')}</h2>
            <p className="text-sm text-gray-500">{t('Join PrizeHub Ethiopia to start winning!', 'Join PrizeHub Ethiopia to start winning!')}</p>
          </div>
          <button onClick={() => setShowRegisterModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        <form onSubmit={handleRegister} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Full Name', 'Full Name')} *</label>
            <input type="text" required value={registerForm.fullName} onChange={(e) => setRegisterForm({...registerForm, fullName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder={t('Enter your full name', 'Enter your full name')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Email Address', 'Email Address')} *</label>
            <input type="email" required value={registerForm.email} onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Phone Number', 'Phone Number')} *</label>
            <input type="tel" required value={registerForm.phone} onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="09xxxxxxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('City', 'City')} *</label>
            <input type="text" required value={registerForm.city} onChange={(e) => setRegisterForm({...registerForm, city: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder={t('Your city', 'Your city')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Password', 'Password')} *</label>
            <input type="password" required value={registerForm.password} onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder={t('Minimum 6 characters', 'Minimum 6 characters')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('Confirm Password', 'Confirm Password')} *</label>
            <input type="password" required value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder={t('Confirm your password', 'Confirm your password')} />
          </div>
          <div className="flex items-start gap-2">
            <input type="checkbox" id="agreeTerms" checked={registerForm.agreeTerms} onChange={(e) => setRegisterForm({...registerForm, agreeTerms: e.target.checked})} className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded" />
            <label htmlFor="agreeTerms" className="text-sm text-gray-600">{t('I agree to the Terms and Conditions', 'I agree to the Terms and Conditions')}</label>
          </div>
          <button type="submit" disabled={registerLoading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50">
            {registerLoading ? t('Creating Account...', 'Creating Account...') : t('Create Account →', 'Create Account →')}
          </button>
          <p className="text-center text-sm text-gray-500">
            {t('Already have an account?', 'Already have an account?')}{' '}
            <button type="button" onClick={() => { setShowRegisterModal(false); router.push('/login'); }} className="text-green-600 hover:underline">
              {t('Login here', 'Login here')}
            </button>
          </p>
        </form>
      </div>
    </div>
  );

  // ============================================
  // MODE DRAWER
  // ============================================
  const ModeDrawer = () => (
    <div className="relative">
      <button 
        onClick={() => setShowModeDrawer(!showModeDrawer)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700 transition"
      >
        <span>⚙️</span>
        <span>{t('Views', 'Views')}</span>
        <svg className={`w-3 h-3 transition-transform ${showModeDrawer ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showModeDrawer && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl border border-gray-200 p-1.5 z-50 min-w-[160px]">
          <button 
            onClick={() => { setActiveView('app'); setShowModeDrawer(false); }} 
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${activeView === 'app' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <span>📱</span> {t('App View', 'App View')}
            {activeView === 'app' && <span className="ml-auto text-white">✓</span>}
          </button>
          <button 
            onClick={() => { setActiveView('classic'); setShowModeDrawer(false); }} 
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${activeView === 'classic' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <span>🖥️</span> {t('Classic View', 'Classic View')}
            {activeView === 'classic' && <span className="ml-auto text-white">✓</span>}
          </button>
          <button 
            onClick={() => { setActiveView('banking'); setShowModeDrawer(false); }} 
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${activeView === 'banking' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <span>🏦</span> {t('Banking View', 'Banking View')}
            {activeView === 'banking' && <span className="ml-auto text-white">✓</span>}
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button 
            onClick={() => { toggleLanguage(); setShowModeDrawer(false); }} 
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
          >
            <span>🌐</span> {language === 'am' ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}
          </button>
          <Link href="/become-creator" className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 transition flex items-center gap-2">
            <span>🏪</span> {t('Become Creator', 'Become Creator')}
          </Link>
        </div>
      )}
    </div>
  );

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading && isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">{t('Loading amazing prizes...', 'Loading amazing prizes...')}</p>
        </div>
      </div>
    );
  }

  // ============================================
  // BANKING MODE
  // ============================================
  if (activeView === 'banking') {
    return (
      <>
        <Head>
          <title>PrizeHub Ethiopia - Win Amazing Prizes</title>
          <meta name="description" content="Win amazing prizes. Join Merkato VIP, City VIP across 94 Ethiopian cities, or Regular Pools." />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        
        <div className="fixed top-4 right-4 z-50">
          <ModeDrawer />
        </div>
        
        <BankingStyleView 
          pools={pools}
          stats={stats}
          uniqueCities={uniqueCities}
          allCityVipPrograms={allCityVipPrograms}
          onRegisterClick={() => setShowRegisterModal(true)}
          language={language}
        />
        
        {showRegisterModal && <RegisterModal />}
      </>
    );
  }

  // ============================================
  // APP MODE
  // ============================================
  if (activeView === 'app') {
    return (
      <>
        <Head>
          <title>PrizeHub Ethiopia - Win Amazing Prizes</title>
          <meta name="description" content="Win amazing prizes. Join Merkato VIP, City VIP across 94 Ethiopian cities, or Regular Pools." />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>

        <div className="min-h-screen bg-gray-50 pb-20">

          {/* Telegram Badge */}
          {isInTelegram && (
            <div className="bg-blue-600 text-white px-4 py-1.5 text-center text-xs flex items-center justify-center gap-2 shadow-md">
              <span>📱</span>
              <span>{t('Connected via Telegram', 'Connected via Telegram')}</span>
              {telegramUser && (
                <span className="bg-blue-700 px-2 py-0.5 rounded-full text-[10px]">
                  @{telegramUser.username || telegramUser.id}
                </span>
              )}
            </div>
          )}

          {/* Header */}
          <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100 px-3 md:px-4 py-2.5 md:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="text-xl md:text-2xl">🎫</span>
                <span className="font-bold text-sm md:text-lg text-gray-800">PrizeHub Ethiopia</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <Link href="/login" className="text-[10px] md:text-xs bg-green-100 text-green-700 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full hover:bg-green-200 transition font-medium">
                  {t('Login', 'Login')}
                </Link>
                <button onClick={() => setShowRegisterModal(true)} className="text-[10px] md:text-xs bg-green-100 text-green-700 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full hover:bg-green-200 transition font-medium">
                  {t('Register', 'Register')}
                </button>
                <Link href="/profile" className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                  {telegramUser?.first_name?.[0]?.toUpperCase() || 'U'}
                </Link>
                <ModeDrawer />
              </div>
            </div>
          </header>

          {/* Welcome */}
          <div className="px-3 md:px-4 py-3 md:py-4 bg-white border-b border-gray-100">
            <p className="text-xs md:text-sm text-gray-500">{t('Welcome back,', 'Welcome back,')}</p>
            <p className="text-lg md:text-xl font-bold text-gray-800">
              {telegramUser?.first_name || t('Guest', 'Guest')}
              {isInTelegram && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">📱 Telegram</span>}
            </p>
            <div className="flex flex-wrap gap-1.5 md:gap-2 mt-1.5 md:mt-2">
              <span className="bg-green-100 text-green-700 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-medium">⭐ {stats.total_pools} {t('Active', 'Active')}</span>
              <span className="bg-yellow-100 text-yellow-700 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-medium">🏆 {stats.total_winners} {t('Winners', 'Winners')}</span>
              <span className="bg-blue-100 text-blue-700 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-medium">🏙️ {uniqueCities.length} {t('Cities', 'Cities')}</span>
            </div>
          </div>

          {/* Categories */}
          <div className="px-3 md:px-4 py-2">
            <h2 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 md:mb-3">
              {t('Categories', 'Categories')}
            </h2>
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              <Link href="/listings" className="flex flex-col items-center bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 border-2 border-green-500 hover:shadow-md transition">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">🏊</span>
                <span className="text-[9px] md:text-xs font-bold text-gray-700 text-center leading-tight">{t('Regular Pools', 'Regular Pools')}</span>
              </Link>
              <Link href="/merkato-vip" className="flex flex-col items-center bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 border-2 border-green-500 hover:shadow-md transition">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">🏪</span>
                <span className="text-[9px] md:text-xs font-bold text-gray-700 text-center leading-tight">{t('Merkato VIP', 'Merkato VIP')}</span>
              </Link>
              <button onClick={() => setShowCityDropdown(!showCityDropdown)} className="flex flex-col items-center bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 border-2 border-green-500 hover:shadow-md transition relative">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">🏙️</span>
                <span className="text-[9px] md:text-xs font-bold text-gray-700 text-center leading-tight">{t('City VIP', 'City VIP')}</span>
                {showCityDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 md:w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="p-2 md:p-3 bg-gray-50 border-b">
                      <input type="text" placeholder={t('🔍 Search city... (94 cities)', '🔍 Search city... (94 cities)')} value={citySearchTerm} onChange={(e) => setCitySearchTerm(e.target.value)} className="w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500" autoFocus />
                      <p className="text-xs text-gray-400 mt-1">{filteredCityList.length} / {uniqueCities.length} cities</p>
                    </div>
                    <div className="max-h-48 md:max-h-64 overflow-y-auto">
                      {filteredCityList.slice(0, 20).map(city => (
                        <button
                          key={city.id}
                          onClick={() => {
                            setSelectedCityForTiers(city);
                            setShowCityTiersModal(true);
                            setShowCityDropdown(false);
                            setCitySearchTerm('');
                          }}
                          className="w-full text-left px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-50 transition border-b last:border-0 flex items-center gap-2"
                        >
                          <span className="text-base md:text-lg">{city.icon}</span>
                          <span className="text-xs md:text-sm font-medium text-gray-800">{city.name}</span>
                          <span className="text-[8px] md:text-xs text-gray-400">{city.nameEn}</span>
                          <span className="ml-auto text-xs text-green-600">👁️ Tiers</span>
                        </button>
                      ))}
                      {filteredCityList.length > 20 && (
                        <Link href="/cities" className="block px-3 md:px-4 py-2 text-center text-xs text-green-600 hover:bg-gray-50">
                          {t(`View all ${filteredCityList.length} cities →`, `View all ${filteredCityList.length} cities →`)}
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </button>
              <Link href="/become-creator" className="flex flex-col items-center bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 text-white hover:shadow-md transition">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">🏪</span>
                <span className="text-[9px] md:text-xs font-bold text-center leading-tight">{t('Open Shop', 'Open Shop')}</span>
              </Link>
            </div>
          </div>

          {/* Featured Pools */}
          {featuredPools.length > 0 && (
            <div className="px-3 md:px-4 py-3 md:py-4">
              <div className="flex justify-between items-center mb-2 md:mb-3">
                <h2 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider">⭐ {t('Featured Pools', 'Featured Pools')}</h2>
                <Link href="/listings" className="text-[10px] md:text-xs text-green-600 font-medium">{t('See All', 'See All')}</Link>
              </div>
              <div className="flex overflow-x-auto gap-3 md:gap-4 pb-3 snap-x snap-mandatory scrollbar-hide">
                {featuredPools.map((pool) => (
                  <div key={pool.id} className="min-w-[280px] md:min-w-[300px] max-w-[280px] md:max-w-[300px] snap-start flex-shrink-0 transform transition-all duration-300 hover:scale-[1.02]">
                    <PoolCard pool={pool} featured={true} language={language} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Pools */}
          <div className="px-3 md:px-4 py-3 md:py-4">
            <div className="flex justify-between items-center mb-2 md:mb-3">
              <h2 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider">🏊 {t('Regular Pools', 'Regular Pools')}</h2>
              <Link href="/listings" className="text-[10px] md:text-xs text-green-600 font-medium">{t('View All', 'View All')}</Link>
            </div>
            {pools.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <div className="text-4xl mb-2">🏊</div>
                <p className="text-gray-500 text-sm">{t('No active pools at the moment', 'No active pools at the moment')}</p>
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-3 md:gap-4 pb-3 snap-x snap-mandatory scrollbar-hide">
                {pools.map((pool) => (
                  <div key={pool.id} className="min-w-[280px] md:min-w-[300px] max-w-[280px] md:max-w-[300px] snap-start flex-shrink-0 transform transition-all duration-300 hover:scale-[1.02]">
                    <PoolCard pool={pool} featured={pool.is_featured === true} language={language} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Partner Program - New Section */}
          <div className="px-3 md:px-4 py-3 md:py-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border-2 border-blue-200">
              <h2 className="text-[10px] md:text-sm font-bold text-blue-700 uppercase tracking-wider mb-2">🤝 {t('Partner Program', 'Partner Program')}</h2>
              <p className="text-xs md:text-sm text-gray-600 mb-3">
                {t('Join our partner program and start earning commissions today!', 'Join our partner program and start earning commissions today!')}
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleRoleSelection('agent')} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                  🤝 {t('Agent', 'Agent')}
                </button>
                <button onClick={() => handleRoleSelection('vendor')} className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                  🏪 {t('Vendor', 'Vendor')}
                </button>
                <button onClick={() => handleRoleSelection('organization')} className="bg-cyan-500 hover:bg-cyan-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                  🏢 {t('Organization', 'Organization')}
                </button>
                <Link href="/become-creator" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1">
                  🏪 {t('Creator', 'Creator')}
                </Link>
              </div>
              <p className="text-[8px] md:text-[10px] text-gray-400 mt-2">
                {t('✓ No upfront fees ✓ Earn 10% on every successful pool ✓ 24/7 support', '✓ No upfront fees ✓ Earn 10% on every successful pool ✓ 24/7 support')}
              </p>
            </div>
          </div>

          {/* Charity Banner */}
          <div className="mx-3 md:mx-4 p-3 md:p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl md:rounded-2xl border border-red-100 mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-2xl md:text-3xl">💚</span>
              <div>
                <p className="font-bold text-sm md:text-base text-red-800">{t('2% for Health', '2% for Health')}</p>
                <p className="text-[10px] md:text-xs text-red-700">{t('Supporting kidney & heart disease patients', 'Supporting kidney & heart disease patients')}</p>
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-1.5 md:py-2 px-2 md:px-4 z-40 shadow-lg">
            <Link href="/" className="flex flex-col items-center text-green-600">
              <span className="text-xl md:text-2xl">🏠</span>
              <span className="text-[8px] md:text-[10px] font-bold">{t('Home', 'Home')}</span>
            </Link>
            <Link href="/listings" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-xl md:text-2xl">🎁</span>
              <span className="text-[8px] md:text-[10px] font-bold">{t('Pools', 'Pools')}</span>
            </Link>
            <Link href="/winners" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-xl md:text-2xl">🏆</span>
              <span className="text-[8px] md:text-[10px] font-bold">{t('Winners', 'Winners')}</span>
            </Link>
            <Link href="/dashboard" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-xl md:text-2xl">👤</span>
              <span className="text-[8px] md:text-[10px] font-bold">{t('Profile', 'Profile')}</span>
            </Link>
            <Link href="/become-creator" className="flex flex-col items-center text-purple-600">
              <span className="text-xl md:text-2xl">🏪</span>
              <span className="text-[8px] md:text-[10px] font-bold">{t('Shop', 'Shop')}</span>
            </Link>
          </nav>

          {showRegisterModal && <RegisterModal />}
          {showCityTiersModal && <CityTiersModal />}

          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </div>
      </>
    );
  }

  // ============================================
  // CLASSIC MODE
  // ============================================
  return (
    <>
      <Head>
        <title>PrizeHub Ethiopia - Win Amazing Prizes | Merkato VIP | City VIP | Regular Pools</title>
        <meta name="description" content="Win amazing prizes. Join Merkato VIP, City VIP across 94 Ethiopian cities, or Regular Pools. 2% supports kidney & heart disease patients." />
      </Head>

      <div className="min-h-screen bg-white w-full">

        <div className="fixed top-4 right-4 z-50">
          <ModeDrawer />
        </div>

        {/* Navbar */}
        <nav className="sticky top-0 z-40 bg-gray-100 shadow-md border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <span className="text-2xl group-hover:scale-110 transition-transform">🎫</span>
                <div>
                  <span className="font-bold text-gray-900 text-lg">PrizeHub Ethiopia</span>
                  <span className="text-xs text-gray-600 ml-2 hidden sm:inline">| abbaa carraa ethiopia shop</span>
                </div>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <div className="relative">
                  <button onClick={() => setProgramsDropdownOpen(!programsDropdownOpen)} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-200 rounded-lg transition text-sm font-medium">
                    <span>📋</span> {t('Programs', 'Programs')}
                    <svg className={`w-4 h-4 transition-transform ${programsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {programsDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
                      <Link href="/merkato-vip" className="w-full text-left px-4 py-3 text-gray-700 hover:text-black hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-100">
                        <span className="text-xl">🏪</span>
                        <div><div className="font-medium">{t('Merkato VIP', 'Merkato VIP')}</div><div className="text-xs text-gray-500">{t('5 Tiers • Up to 10M ETB', '5 Tiers • Up to 10M ETB')}</div></div>
                      </Link>
                      <button onClick={() => setShowCityDropdown(!showCityDropdown)} className="w-full text-left px-4 py-3 text-gray-700 hover:text-black hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-100">
                        <span className="text-xl">🏙️</span>
                        <div><div className="font-medium">{t('City VIP', 'City VIP')}</div><div className="text-xs text-gray-500">{t('94 Cities • 5 Tiers', '94 Cities • 5 Tiers')}</div></div>
                      </button>
                      <button onClick={() => scrollToSection('regular-pools')} className="w-full text-left px-4 py-3 text-gray-700 hover:text-black hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-100">
                        <span className="text-xl">🏊</span>
                        <div><div className="font-medium">{t('Regular Pools', 'Regular Pools')}</div><div className="text-xs text-gray-500">{t('Cars, Houses & More', 'Cars, Houses & More')}</div></div>
                      </button>
                      <Link href="/become-creator" className="w-full text-left px-4 py-3 text-gray-700 hover:text-black hover:bg-gray-50 transition flex items-center gap-3">
                        <span className="text-xl">🏪</span>
                        <div><div className="font-medium">{t('Become Creator', 'Become Creator')}</div><div className="text-xs text-gray-500">{t('Earn 10% Commission', 'Earn 10% Commission')}</div></div>
                      </Link>
                      <div className="border-t border-gray-200 my-1"></div>
                      <div className="px-4 py-2 text-xs text-gray-500">{t('Partner Program', 'Partner Program')}</div>
                      <button onClick={() => handleRoleSelection('agent')} className="w-full text-left px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-55 transition flex items-center gap-2">
                        <span className="text-lg">🤝</span> {t('Become an Agent', 'Become an Agent')}
                      </button>
                      <button onClick={() => handleRoleSelection('vendor')} className="w-full text-left px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-55 transition flex items-center gap-2">
                        <span className="text-lg">🏪</span> {t('Become a Vendor', 'Become a Vendor')}
                      </button>
                      <button onClick={() => handleRoleSelection('organization')} className="w-full text-left px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-55 transition flex items-center gap-2">
                        <span className="text-lg">🏢</span> {t('Become an Organization', 'Become an Organization')}
                      </button>
                    </div>
                  )}
                </div>
                <Link href="/about" className="px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-200 rounded-lg transition whitespace-nowrap text-sm font-medium">ℹ️ {t('About', 'About')}</Link>
                <Link href="/contact" className="px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-200 rounded-lg transition whitespace-nowrap text-sm font-medium">📞 {t('Contact', 'Contact')}</Link>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <TopCitySelector />
                <Link href="/login" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium shadow-sm">{t('Login', 'Login')}</Link>
                <button onClick={() => setShowRegisterModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium shadow-sm">{t('Register', 'Register')}</button>
                <Link href="/become-creator" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition text-sm font-medium shadow-sm flex items-center gap-1">
                  <span>🏪</span> {t('Open Shop', 'Open Shop')}
                </Link>
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-gray-600 hover:text-black hover:bg-gray-200 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-gray-200 space-y-2">
                <div className="flex gap-2 px-4 py-2">
                  <Link href="/login" className="flex-1 text-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs">🔐 {t('Login', 'Login')}</Link>
                  <button onClick={() => { setShowRegisterModal(true); setMobileMenuOpen(false); }} className="flex-1 text-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs">📝 {t('Register', 'Register')}</button>
                  <Link href="/become-creator" className="flex-1 text-center px-3 py-2 bg-purple-600 text-white rounded-lg text-xs">🏪 {t('Shop', 'Shop')}</Link>
                </div>
                <Link href="/merkato-vip" className="w-full text-left px-4 py-3 text-gray-700 hover:text-black hover:bg-gray-200 rounded-lg transition flex items-center gap-3">
                  <span className="text-xl">🏪</span><div><div>{t('Merkato VIP', 'Merkato VIP')}</div><div className="text-xs text-gray-500">{t('5 Tiers • Up to 10M', '5 Tiers • Up to 10M')}</div></div>
                </Link>
                <Link href="/city-vip" className="w-full text-left px-4 py-3 text-gray-700 hover:text-black hover:bg-gray-200 rounded-lg transition flex items-center gap-3">
                  <span className="text-xl">🏙️</span><div><div>{t('City VIP', 'City VIP')}</div><div className="text-xs text-gray-500">{t('94 Cities • 5 Tiers', '94 Cities • 5 Tiers')}</div></div>
                </Link>
                <button onClick={() => scrollToSection('regular-pools')} className="w-full text-left px-4 py-3 text-gray-700 hover:text-black hover:bg-gray-200 rounded-lg transition flex items-center gap-3">
                  <span className="text-xl">🏊</span><div><div>{t('Regular Pools', 'Regular Pools')}</div><div className="text-xs text-gray-500">{t('Cars, Houses & More', 'Cars, Houses & More')}</div></div>
                </button>
                <div className="h-px bg-gray-200 my-2"></div>
                <div className="px-4 py-1 text-xs text-gray-500">{t('Partner Program', 'Partner Program')}</div>
                <button onClick={() => handleRoleSelection('agent')} className="w-full text-left px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-200 rounded-lg transition flex items-center gap-2">
                  <span className="text-lg">🤝</span> {t('Become an Agent', 'Become an Agent')}
                </button>
                <button onClick={() => handleRoleSelection('vendor')} className="w-full text-left px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-200 rounded-lg transition flex items-center gap-2">
                  <span className="text-lg">🏪</span> {t('Become a Vendor', 'Become a Vendor')}
                </button>
                <button onClick={() => handleRoleSelection('organization')} className="w-full text-left px-4 py-2 text-gray-700 hover:text-black hover:bg-gray-200 rounded-lg transition flex items-center gap-2">
                  <span className="text-lg">🏢</span> {t('Become an Organization', 'Become an Organization')}
                </button>
                <div className="pt-2"><TopCitySelector /></div>
              </div>
            )}
          </div>
        </nav>

        <GlobalAnnouncement />
        <CharityBanner />

        {/* Hero Banner */}
        <div className="w-full bg-gradient-to-br from-green-700 to-teal-700">
          <div className="max-w-7xl mx-auto">
            <img src="/images/abbaa-carraa-bg.png" alt="PrizeHub Ethiopia" className="w-full h-auto object-cover block" loading="eager" fetchPriority="high" style={{ maxHeight: '500px', objectPosition: 'center' }} />
          </div>
        </div>

        {/* Hero Text */}
        <div className="bg-gray-100/80 py-16 w-full border-b border-gray-200">
          <div className="container mx-auto px-6 max-w-4xl text-center bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold mb-6 shadow-sm">🔥 {t("Ethiopia's Premium Prize Platform", "Ethiopia's Premium Prize Platform")} 🏆</div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 leading-tight">
              {t('Welcome to', 'Welcome to')} <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">PrizeHub Ethiopia</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mt-4 leading-relaxed font-medium">
              {t('PrizeHub Ethiopia offers a trusted, community-focused savings & prize system under the sub-brand abbaa carraa ethiopia shop. Create customized reward pools, browse high-value regular pools, or step up to our exclusive City & Merkato VIP programs.', 'PrizeHub Ethiopia offers a trusted, community-focused savings & prize system under the sub-brand abbaa carraa ethiopia shop. Create customized reward pools, browse high-value regular pools, or step up to our exclusive City & Merkato VIP programs.')}
            </p>
            <div className="mt-6 inline-flex items-center gap-2 bg-green-50 border border-green-200 px-5 py-2.5 rounded-full shadow-sm">
              <span className="text-green-600 text-xl">💚</span>
              <span className="text-green-800 text-xs sm:text-sm font-semibold">{t('2% supports kidney & heart disease treatment across Ethiopia', '2% supports kidney & heart disease treatment across Ethiopia')}</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-10">
              <button onClick={() => scrollToSection('program-groups')} className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition duration-200 transform inline-flex items-center gap-2 text-sm sm:text-base">
                <span>🏊</span> {t('Explore Programs', 'Explore Programs')} <span>↓</span>
              </button>
              <Link href="/about" className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-8 py-3.5 rounded-2xl font-bold hover:-translate-y-0.5 transition duration-200 transform inline-flex items-center gap-2 text-sm sm:text-base border border-gray-200">
                <span>ℹ️</span> {t('How It Works', 'How It Works')}
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Banner */}
        <div ref={counterRef} className="bg-gradient-to-r from-gray-50 to-white border-y border-gray-200 py-3">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
              <div className="flex items-center gap-2"><span className="text-green-600 text-lg">💰</span><span className="text-gray-600">{t('Total Prize', 'Total Prize')}:</span><span className="font-bold text-gray-800">{counterInView ? <CountUp start={0} end={Math.floor(stats.total_raised / 1000)} duration={2} separator="," /> : '0'}+K ETB</span></div>
              <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2"><span className="text-yellow-600 text-lg">🏆</span><span className="text-gray-600">{t('Winners', 'Winners')}:</span><span className="font-bold text-gray-800">{stats.total_winners}+</span></div>
              <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2"><span className="text-blue-600 text-lg">🎯</span><span className="text-gray-600">{t('Active Pools', 'Active Pools')}:</span><span className="font-bold text-gray-800">{stats.total_pools}+</span></div>
              <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2"><span className="text-purple-600 text-lg">🤝</span><span className="text-gray-600">{t('Agents', 'Agents')}:</span><span className="font-bold text-gray-800">{stats.total_agents}+</span></div>
              <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2"><span className="text-orange-600 text-lg">🏙️</span><span className="text-gray-600">{t('Cities', 'Cities')}:</span><span className="font-bold text-gray-800">{uniqueCities.length}+</span></div>
            </div>
          </div>
        </div>

        <MovingAd />
        <AdvertisingBanner />

        {/* Main Content Groupings - Clean White Background */}
        <div id="program-groups" className="bg-white py-16 scroll-mt-20">
          <div className="container mx-auto px-6 max-w-6xl">
            <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2">
              {t('Explore Our Programs', 'Explore Our Programs')}
            </h2>
            <p className="text-center text-gray-500 max-w-lg mx-auto mb-12 text-sm sm:text-base">
              {t('Participate, save, and win with PrizeHub Ethiopia or build your own audience and earn commission.', 'Participate, save, and win with PrizeHub Ethiopia or build your own audience and earn commission.')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Card 1: Join Regular Pools to win cars, houses, machinery and more */}
              <div className="bg-gray-100 p-8 rounded-3xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex flex-col justify-between">
                <div>
                  <div className="text-4xl mb-4">🚗</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('Join Regular Pools', 'Join Regular Pools')}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {t('Win life-changing physical assets like brand-new cars, modern homes, machinery, and key heavy equipment. Under abbaa carraa ethiopia shop, vendors can easily showcase their properties.', 'Win life-changing physical assets like brand-new cars, modern homes, machinery, and key heavy equipment. Under abbaa carraa ethiopia shop, vendors can easily showcase their properties.')}
                  </p>
                </div>
                <button onClick={() => { scrollToSection('regular-pools-direct'); }} className="w-full bg-white text-green-700 border-2 border-green-500 hover:bg-green-50 py-3 rounded-2xl font-bold transition text-sm flex items-center justify-center gap-2">
                  <span>🚗</span> {t('View Regular Pools', 'View Regular Pools')} <span>→</span>
                </button>
              </div>

              {/* Card 2: Join Merkato VIP and win upto 40 million birr */}
              <div className="bg-gray-100 p-8 rounded-3xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex flex-col justify-between">
                <div>
                  <div className="text-4xl mb-4">🏪</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('Join Merkato VIP', 'Join Merkato VIP')}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {t("Win premium cash rewards up to 40 Million Birr in Merkato's official premier VIP levels. High frequency daily, weekly, and monthly draws with high seats capability.", "Win premium cash rewards up to 40 Million Birr in Merkato's official premier VIP levels. High frequency daily, weekly, and monthly draws with high seats capability.")}
                  </p>
                </div>
                <Link href="/merkato-vip" className="w-full text-center bg-white text-green-700 border-2 border-green-500 hover:bg-green-50 py-3 rounded-2xl font-bold transition text-sm flex items-center justify-center gap-2">
                  <span>🏪</span> {t('Enter Merkato VIP', 'Enter Merkato VIP')} <span>→</span>
                </Link>
              </div>

              {/* Card 3: Join City VIP and win cash upto 10 million birr */}
              <div className="bg-gray-100 p-8 rounded-3xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex flex-col justify-between cursor-pointer" onClick={() => { setShowCityDropdown(!showCityDropdown); }}>
                <div>
                  <div className="text-4xl mb-4">🏙️</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('Join City VIP', 'Join City VIP')}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {t('Win major cash awards up to 10 Million Birr across 94 major cities in Ethiopia. Play in Silver, Gold, Platinum, Diamond, or Royal tiers. Click to choose your city!', 'Win major cash awards up to 10 Million Birr across 94 major cities in Ethiopia. Play in Silver, Gold, Platinum, Diamond, or Royal tiers. Click to choose your city!')}
                  </p>
                </div>
                <div className="relative">
                  <button onClick={(e) => { e.stopPropagation(); setShowCityDropdown(!showCityDropdown); }} className="w-full bg-white text-green-700 border-2 border-green-500 hover:bg-green-50 py-3 rounded-2xl font-bold transition text-sm flex items-center justify-center gap-2">
                    <span>🏙️</span> {t('Choose Your City', 'Choose Your City')} <span>↓</span>
                  </button>
                  {showCityDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden" onClick={(e) => e.stopPropagation()}>
                      <div className="p-3 bg-gray-50 border-b">
                        <input type="text" placeholder={t('🔍 Search city... (94 cities)', '🔍 Search city... (94 cities)')} value={citySearchTerm} onChange={(e) => setCitySearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" autoFocus />
                        <p className="text-xs text-gray-400 mt-1">{filteredCityList.length} / {uniqueCities.length} cities</p>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {filteredCityList.slice(0, 10).map(city => (
                          <button
                            key={city.id}
                            onClick={() => {
                              setSelectedCityForTiers(city);
                              setShowCityTiersModal(true);
                              setShowCityDropdown(false);
                              setCitySearchTerm('');
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition border-b last:border-0 flex items-center gap-3 text-gray-800 text-xs font-semibold"
                          >
                            <span className="text-xl">{city.icon}</span>
                            <span className="flex-1">{city.name} ({city.nameEn})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 4: Join Partner Program and earn commissions */}
              <div className="bg-gray-100 p-8 rounded-3xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex flex-col justify-between">
                <div>
                  <div className="text-4xl mb-4">🤝</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('Join Partner Program', 'Join Partner Program')}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {t('Become an authorized agent, vendor, or organization organizer. Bring clients to our City VIP and Merkato VIP systems and earn half of the total commission generated.', 'Become an authorized agent, vendor, or organization organizer. Bring clients to our City VIP and Merkato VIP systems and earn half of the total commission generated.')}
                  </p>
                </div>
                <button onClick={() => { scrollToSection('partner-program'); }} className="w-full bg-white text-green-700 border-2 border-green-500 hover:bg-green-50 py-3 rounded-2xl font-bold transition text-sm flex items-center justify-center gap-2">
                  <span>🤝</span> {t('Learn Commission Program', 'Learn Commission Program')} <span>→</span>
                </button>
              </div>

              {/* Card 5: Open your shop and create prize pool */}
              <div className="bg-gray-100 p-8 rounded-3xl border-2 border-gray-200 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex flex-col justify-between">
                <div>
                  <div className="text-4xl mb-4">🏪</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {t('Open Your Shop', 'Open Your Shop')}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">
                    {t('Create fully customized prize pools for your members, complete with your own personal bank account and Telebirr configurations for fast direct settlement.', 'Create fully customized prize pools for your members, complete with your own personal bank account and Telebirr configurations for fast direct settlement.')}
                  </p>
                </div>
                <Link href="/become-creator" className="w-full text-center bg-white text-green-700 border-2 border-green-500 hover:bg-green-50 py-3 rounded-2xl font-bold transition text-sm flex items-center justify-center gap-2">
                  <span>🏪</span> {t('Setup Your Shop', 'Setup Your Shop')} <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Regular Pools Display Section */}
        <div id="regular-pools-direct" className="bg-gray-50 py-16 scroll-mt-20">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900">🏊 {t('Active Regular Pools', 'Active Regular Pools')}</h2>
                <p className="text-gray-500 text-sm mt-1">{t('Join today with direct Telebirr & bank payments', 'Join today with direct Telebirr & bank payments')}</p>
              </div>
              <Link href="/listings" className="text-sm font-bold text-green-600 hover:text-green-700">{t('See All Pools →', 'See All Pools →')}</Link>
            </div>
            {pools.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border shadow-sm">
                <p className="text-gray-500 font-medium">{t('No active regular pools available at the moment.', 'No active regular pools available at the moment.')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pools.map((pool) => <PoolCard key={pool.id} pool={pool} featured={pool.is_featured === true} language={language} />)}
              </div>
            )}
          </div>
        </div>

        {/* Partner Program Detailed Commission Grid */}
        <div id="partner-program" className="bg-white py-16 border-t border-gray-100 scroll-mt-20">
          <div className="container mx-auto px-6 max-w-5xl">
            <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-2">🤝 {t('Commission & Partner Roles', 'Commission & Partner Roles')}</h2>
            <p className="text-center text-gray-500 mb-12 text-sm sm:text-base">
              {t('Transparent direct commission tracking for certified PrizeHub Ethiopia partners.', 'Transparent direct commission tracking for certified PrizeHub Ethiopia partners.')}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Agents */}
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 shadow-sm">
                <span className="text-3xl block mb-4">🤝</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('Verified Agents', 'Verified Agents')}</h3>
                <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider font-semibold">{t('Merkato VIP, City VIP & Regular Pools', 'Merkato VIP, City VIP & Regular Pools')}</p>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  {t('Promote regular and VIP programs to clients. Earn 50% of the platform-generated commission (half of the total platform fee) for every seat booked.', 'Promote regular and VIP programs to clients. Earn 50% of the platform-generated commission (half of the total platform fee) for every seat booked.')}
                </p>
                <button onClick={() => handleRoleSelection('agent')} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2.5 rounded-xl text-xs font-bold transition">
                  {t('Register Agent', 'Register Agent')}
                </button>
              </div>

              {/* Vendors */}
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 shadow-sm">
                <span className="text-3xl block mb-4">🏪</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('Verified Vendors', 'Verified Vendors')}</h3>
                <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider font-semibold">{t('Regular Pools property asset creation', 'Regular Pools property asset creation')}</p>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  {t('List houses, cars, machinery, or heavy assets under official platform bank accounts/Telebirr. When pool reaches target, you earn half of platform-generated commission.', 'List houses, cars, machinery, or heavy assets under official platform bank accounts/Telebirr. When pool reaches target, you earn half of platform-generated commission.')}
                </p>
                <button onClick={() => handleRoleSelection('vendor')} className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2.5 rounded-xl text-xs font-bold transition">
                  {t('Register Vendor', 'Register Vendor')}
                </button>
              </div>

              {/* Organizers */}
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200 shadow-sm">
                <span className="text-3xl block mb-4">🏢</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{t('Organization Organizers', 'Organization Organizers')}</h3>
                <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider font-semibold">{t('Internal staff saving & reward pools', 'Internal staff saving & reward pools')}</p>
                <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                  {t('Establish special internal pools for your corporate or association members. Managed under official platform bank details with custom organizer commissions.', 'Establish special internal pools for your corporate or association members. Managed under official platform bank details with custom organizer commissions.')}
                </p>
                <button onClick={() => handleRoleSelection('organization')} className="w-full bg-cyan-500 hover:bg-cyan-600 text-white py-2.5 rounded-xl text-xs font-bold transition">
                  {t('Register Organizer', 'Register Organizer')}
                </button>
              </div>
            </div>
          </div>
        </div>

        <Testimonials />
        <NewsletterSubscribe />

        {/* How It Works */}
        <div className="bg-gray-50 py-16 w-full">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">{t('እንዴት እንሳተፋለን? | How It Works', 'እንዴት እንሳተፋለን? | How It Works')}</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">1</div>
                <h3 className="font-bold text-xl mb-2">{t('Find a Pool', 'Find a Pool')}</h3>
                <p className="text-gray-600">{t('Browse available prize pools', 'Browse available prize pools')}</p>
              </div>
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">2</div>
                <h3 className="font-bold text-xl mb-2">{t('Contribute', 'Contribute')}</h3>
                <p className="text-gray-600">{t('Make your contribution securely', 'Make your contribution securely')}</p>
              </div>
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">3</div>
                <h3 className="font-bold text-xl mb-2">{t('Win!', 'Win!')}</h3>
                <p className="text-gray-600">{t('Win amazing prizes!', 'Win amazing prizes!')}</p>
              </div>
            </div>
          </div>
        </div>

        {showCitySelector && <CitySelector onClose={() => setShowCitySelector(false)} />}
      </div>

      {showRegisterModal && <RegisterModal />}
      {showCityTiersModal && <CityTiersModal />}

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .scroll-mt-20 { scroll-margin-top: 80px; }
      `}</style>
    </>
  );
}
