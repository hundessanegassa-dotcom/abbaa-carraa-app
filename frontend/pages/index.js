// pages/index.js - Complete with 6 Tiers & Correct Seat Counts
// 100K: 1200 seats | 500K: 1200 seats | 1M: 2400 seats | 2M: 2400 seats | 5M: 2400 seats | 10M: 2400 seats
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
  const [activeView, setActiveView] = useState('app');
  const [showModeDrawer, setShowModeDrawer] = useState(false);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  // MERKATO VIP TIERS with Seat Counts & Premium Naming
  // 100K: 1200 seats | 500K: 1200 seats | 1M: 2400 seats | 2M: 2400 seats | 5M: 2400 seats | 10M: 2400 seats
  const merkatoVipTiers = [
    { 
      id: 'merkato-100k', 
      name: '100K ETB', 
      nameAm: 'መርካቶ 100K', 
      displayName: 'Silver', 
      displayNameAm: 'ብር', 
      icon: '🥈', 
      prize: '100K ETB', 
      seats: 1200, 
      tier: 1,
      color: 'from-gray-400 to-gray-500',
      badge: 'Silver'
    },
    { 
      id: 'merkato-500k', 
      name: '500K ETB', 
      nameAm: 'መርካቶ 500K', 
      displayName: 'Gold', 
      displayNameAm: 'ወርቅ', 
      icon: '🥇', 
      prize: '500K ETB', 
      seats: 1200, 
      tier: 2,
      color: 'from-yellow-400 to-yellow-600',
      badge: 'Gold'
    },
    { 
      id: 'merkato-1m', 
      name: '1M ETB', 
      nameAm: 'መርካቶ 1M', 
      displayName: 'Platinum', 
      displayNameAm: 'ፕላቲኒየም', 
      icon: '💎', 
      prize: '1M ETB', 
      seats: 2400, 
      tier: 3,
      color: 'from-gray-300 to-blue-400',
      badge: 'Platinum'
    },
    { 
      id: 'merkato-2m', 
      name: '2M ETB', 
      nameAm: 'መርካቶ 2M', 
      displayName: 'Diamond', 
      displayNameAm: 'አልማዝ', 
      icon: '💠', 
      prize: '2M ETB', 
      seats: 2400, 
      tier: 4,
      color: 'from-blue-400 to-cyan-400',
      badge: 'Diamond'
    },
    { 
      id: 'merkato-5m', 
      name: '5M ETB', 
      nameAm: 'መርካቶ 5M', 
      displayName: 'Royal', 
      displayNameAm: 'ንጉሣዊ', 
      icon: '👑', 
      prize: '5M ETB', 
      seats: 2400, 
      tier: 5,
      color: 'from-purple-500 to-pink-500',
      badge: 'Royal'
    },
    { 
      id: 'merkato-10m', 
      name: '10M ETB', 
      nameAm: 'መርካቶ 10M', 
      displayName: 'Emperor', 
      displayNameAm: 'ንጉሠ ነገሥት', 
      icon: '🏆', 
      prize: '10M ETB', 
      seats: 2400, 
      tier: 6,
      color: 'from-red-500 to-orange-600',
      badge: 'Emperor'
    }
  ];

  // ALL 94 ETHIOPIAN CITIES with Seat Counts & Premium Naming
  // 100K: 1200 seats | 500K: 1200 seats | 1M+: 2400 seats
  const allCityVipPrograms = [
    // Tier 1: Silver - 100K ETB - 1200 seats each
    { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', region: 'Central', icon: '🏙️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', region: 'Oromia', icon: '🏗️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', region: 'Dire Dawa', icon: '🚂', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', region: 'Tigray', icon: '🏭', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'axum', name: 'አክሱም', nameEn: 'Axum', region: 'Tigray', icon: '🏛️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'adigrat', name: 'አዲግራት', nameEn: 'Adigrat', region: 'Tigray', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'shire', name: 'ሽሬ', nameEn: 'Shire', region: 'Tigray', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'mekoni', name: 'መቆኒ', nameEn: 'Mekoni', region: 'Tigray', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'maychew', name: 'ማይጨው', nameEn: 'Maychew', region: 'Tigray', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'abiy-addi', name: 'አቢይ አዲ', nameEn: 'Abiy Addi', region: 'Tigray', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'wukro', name: 'ውቅሮ', nameEn: 'Wukro', region: 'Tigray', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', region: 'Amhara', icon: '🏰', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', region: 'Amhara', icon: '🏞️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', region: 'Amhara', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'debre-markos', name: 'ደብረ ማርቆስ', nameEn: 'Debre Markos', region: 'Amhara', icon: '⛪', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'finote-selam', name: 'ፍኖተ ሰላም', nameEn: 'Finote Selam', region: 'Amhara', icon: '🌅', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'woldia', name: 'ወልዲያ', nameEn: 'Woldia', region: 'Amhara', icon: '🎓', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'debre-birhan', name: 'ደብረ ብርሃን', nameEn: 'Debre Birhan', region: 'Amhara', icon: '⭐', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'kombolcha', name: 'ኮምቦልቻ', nameEn: 'Kombolcha', region: 'Amhara', icon: '🏭', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'sekota', name: 'ሰቆጣ', nameEn: 'Sekota', region: 'Amhara', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'aykal', name: 'አይከል', nameEn: 'Aykal', region: 'Amhara', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'metema', name: 'ሜተማ', nameEn: 'Metema', region: 'Amhara', icon: '🛣️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'debre-tabor', name: 'ደብረ ታቦር', nameEn: 'Debre Tabor', region: 'Amhara', icon: '⛪', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'bati', name: 'ባቲ', nameEn: 'Bati', region: 'Amhara', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'kemise', name: 'ቀሚሴ', nameEn: 'Kemise', region: 'Amhara', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'injibara', name: 'እንጅባራ', nameEn: 'Injibara', region: 'Amhara', icon: '🏔️', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    { id: 'lalibela', name: 'ላሊበላ', nameEn: 'Lalibela', region: 'Amhara', icon: '⛪', prize: '100K ETB', seats: 1200, tier: 1, badge: 'Silver' },
    
    // Tier 2: Gold - 500K ETB - 1200 seats each
    { id: 'adama', name: 'አዳማ', nameEn: 'Adama', region: 'Oromia', icon: '🏭', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', region: 'Oromia', icon: '☕', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', region: 'Oromia', icon: '✈️', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'asella', name: 'አሰላ', nameEn: 'Asella', region: 'Oromia', icon: '🏔️', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene', region: 'Oromia', icon: '🛍️', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'robe', name: 'ሮቤ', nameEn: 'Robe', region: 'Oromia', icon: '🌄', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'ginir', name: 'ጊኒር', nameEn: 'Ginir', region: 'Oromia', icon: '🏞️', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'yabelo', name: 'ያቤሎ', nameEn: 'Yabelo', region: 'Oromia', icon: '🐪', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'moyale', name: 'ሞያሌ', nameEn: 'Moyale', region: 'Oromia', icon: '🛣️', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'chiro', name: 'ቺሮ', nameEn: 'Chiro', region: 'Oromia', icon: '🏔️', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'fiche', name: 'ፊጬ', nameEn: 'Fiche', region: 'Oromia', icon: '🌾', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'woliso', name: 'ወሊሶ', nameEn: 'Woliso', region: 'Oromia', icon: '💧', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'ambo', name: 'አምቦ', nameEn: 'Ambo', region: 'Oromia', icon: '💧', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte', region: 'Oromia', icon: '☕', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'gimbi', name: 'ጊምቢ', nameEn: 'Gimbi', region: 'Oromia', icon: '🏔️', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'dembi-dollo', name: 'ደምቢ ዶሎ', nameEn: 'Dembi Dollo', region: 'Oromia', icon: '💰', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'shambu', name: 'ሻምቡ', nameEn: 'Shambu', region: 'Oromia', icon: '🌾', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'metu', name: 'መቱ', nameEn: 'Metu', region: 'Oromia', icon: '🌿', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'bedele', name: 'በደሌ', nameEn: 'Bedele', region: 'Oromia', icon: '🍺', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    { id: 'bule-hora', name: 'ቡሌ ሆራ', nameEn: 'Bule Hora', region: 'Oromia', icon: '🎓', prize: '500K ETB', seats: 1200, tier: 2, badge: 'Gold' },
    
    // Tier 3: Platinum - 1M ETB - 2400 seats each
    { id: 'negele-borana', name: 'ነገሌ ቦረና', nameEn: 'Negele Borana', region: 'Oromia', icon: '🐪', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway', region: 'Oromia', icon: '🐟', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'mojo', name: 'ሞጆ', nameEn: 'Mojo', region: 'Oromia', icon: '🚛', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'dodola', name: 'ዶዶላ', nameEn: 'Dodola', region: 'Oromia', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'gera', name: 'ጌራ', nameEn: 'Gera', region: 'Oromia', icon: '☕', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'agaro', name: 'አጋሮ', nameEn: 'Agaro', region: 'Oromia', icon: '☕', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'lemu', name: 'ለሙ', nameEn: 'Lemu', region: 'Oromia', icon: '🌾', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'hagere-mariam', name: 'ሀገረ ማርያም', nameEn: 'Hagere Mariam', region: 'Oromia', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'shakiso', name: 'ሻኪሶ', nameEn: 'Shakiso', region: 'Oromia', icon: '💰', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'kibre-mengist', name: 'ቅብረ መንግስት', nameEn: 'Kibre Mengist', region: 'Oromia', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'wachile', name: 'ዋቺሌ', nameEn: 'Wachile', region: 'Oromia', icon: '🐪', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'goba', name: 'ጎባ', nameEn: 'Goba', region: 'Oromia', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'sinana', name: 'ሲናና', nameEn: 'Sinana', region: 'Oromia', icon: '🌾', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'dinsho', name: 'ዲንሾ', nameEn: 'Dinsho', region: 'Oromia', icon: '🏞️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', region: 'Somali', icon: '🐪', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'degehabur', name: 'ደገሃቡር', nameEn: 'Degehabur', region: 'Somali', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'kebri-dehar', name: 'ቀብሪ ደሃር', nameEn: 'Kebri Dehar', region: 'Somali', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'gode', name: 'ጎዴ', nameEn: 'Gode', region: 'Somali', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'warder', name: 'ዋርደር', nameEn: 'Warder', region: 'Somali', icon: '🐪', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'shilabo', name: 'ሺላቦ', nameEn: 'Shilabo', region: 'Somali', icon: '🐪', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'kelafo', name: 'ከላፎ', nameEn: 'Kelafo', region: 'Somali', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'mustahil', name: 'ሙስታሂል', nameEn: 'Mustahil', region: 'Somali', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'ferfer', name: 'ፌርፌር', nameEn: 'Ferfer', region: 'Somali', icon: '🛣️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'harar', name: 'ሀረር', nameEn: 'Harar', region: 'Harari', icon: '🏛️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', region: 'Sidama', icon: '🏞️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'yirgalem', name: 'ይርጋለም', nameEn: 'Yirgalem', region: 'Sidama', icon: '☕', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'awassa', name: 'አዋሳ', nameEn: 'Awassa', region: 'Sidama', icon: '🏞️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch', region: 'South', icon: '🏞️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'sodo', name: 'ሶዶ', nameEn: 'Sodo', region: 'South', icon: '🛍️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'dilla', name: 'ዲላ', nameEn: 'Dilla', region: 'South', icon: '☕', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'sawla', name: 'ሳውላ', nameEn: 'Sawla', region: 'South', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'jinka', name: 'ጂንካ', nameEn: 'Jinka', region: 'South', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'konso', name: 'ኮንሶ', nameEn: 'Konso', region: 'South', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'karat', name: 'ካራት', nameEn: 'Karat', region: 'South', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'bonga', name: 'ቦንጋ', nameEn: 'Bonga', region: 'South', icon: '☕', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'mizan-teferi', name: 'ሚዛን ተፈሪ', nameEn: 'Mizan Teferi', region: 'South', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'teppi', name: 'ቴፒ', nameEn: 'Teppi', region: 'South', icon: '🌿', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'gereb', name: 'ገሬብ', nameEn: 'Gereb', region: 'South', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'key-afar', name: 'ቀይ አፋር', nameEn: 'Key Afar', region: 'South', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'bako', name: 'ባኮ', nameEn: 'Bako', region: 'South', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'welkite', name: 'ወልቂጤ', nameEn: 'Welkite', region: 'South', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', region: 'Benishangul', icon: '🌿', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'gilgel-beles', name: 'ግልገል በለስ', nameEn: 'Gilgel Beles', region: 'Benishangul', icon: '💧', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'kamashi', name: 'ካማሺ', nameEn: 'Kamashi', region: 'Benishangul', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'metekel', name: 'ሜተከል', nameEn: 'Metekel', region: 'Benishangul', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'dibate', name: 'ዲባቴ', nameEn: 'Dibate', region: 'Benishangul', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'gambella', name: 'ጋምቤላ', nameEn: 'Gambella', region: 'Gambella', icon: '🏞️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'meti', name: 'ሜቲ', nameEn: 'Meti', region: 'Gambella', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'fugnido', name: 'ፉኝዶ', nameEn: 'Fugnido', region: 'Gambella', icon: '🏞️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'itur', name: 'ኢቱር', nameEn: 'Itur', region: 'Gambella', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'semera', name: 'ሰሜራ', nameEn: 'Semera', region: 'Afar', icon: '🐪', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'asaita', name: 'አሳይታ', nameEn: 'Asaita', region: 'Afar', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'logiya', name: 'ሎጊያ', nameEn: 'Logiya', region: 'Afar', icon: '🛣️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'abila', name: 'አቢላ', nameEn: 'Abila', region: 'Afar', icon: '🐪', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'dubti', name: 'ዱብቲ', nameEn: 'Dubti', region: 'Afar', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'elidar', name: 'ኤልዳር', nameEn: 'Elidar', region: 'Afar', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    { id: 'chifra', name: 'ቺፍራ', nameEn: 'Chifra', region: 'Afar', icon: '🏔️', prize: '1M ETB', seats: 2400, tier: 3, badge: 'Platinum' },
    
    // Tier 4: Diamond - 2M ETB - 2400 seats each
    { id: 'bahir-dar-2m', name: 'ባህር ዳር 2M', nameEn: 'Bahir Dar 2M', region: 'Amhara', icon: '💠', prize: '2M ETB', seats: 2400, tier: 4, badge: 'Diamond' },
    { id: 'gondar-2m', name: 'ጎንደር 2M', nameEn: 'Gondar 2M', region: 'Amhara', icon: '💠', prize: '2M ETB', seats: 2400, tier: 4, badge: 'Diamond' },
    { id: 'dessie-2m', name: 'ደሴ 2M', nameEn: 'Dessie 2M', region: 'Amhara', icon: '💠', prize: '2M ETB', seats: 2400, tier: 4, badge: 'Diamond' },
    { id: 'adama-2m', name: 'አዳማ 2M', nameEn: 'Adama 2M', region: 'Oromia', icon: '💠', prize: '2M ETB', seats: 2400, tier: 4, badge: 'Diamond' },
    { id: 'jimma-2m', name: 'ጅማ 2M', nameEn: 'Jimma 2M', region: 'Oromia', icon: '💠', prize: '2M ETB', seats: 2400, tier: 4, badge: 'Diamond' },
    { id: 'hawassa-2m', name: 'ሀዋሳ 2M', nameEn: 'Hawassa 2M', region: 'Sidama', icon: '💠', prize: '2M ETB', seats: 2400, tier: 4, badge: 'Diamond' },
    { id: 'mekelle-2m', name: 'መቀሌ 2M', nameEn: 'Mekelle 2M', region: 'Tigray', icon: '💠', prize: '2M ETB', seats: 2400, tier: 4, badge: 'Diamond' },
    { id: 'dire-dawa-2m', name: 'ድሬ ዳዋ 2M', nameEn: 'Dire Dawa 2M', region: 'Dire Dawa', icon: '💠', prize: '2M ETB', seats: 2400, tier: 4, badge: 'Diamond' },
    { id: 'harar-2m', name: 'ሀረር 2M', nameEn: 'Harar 2M', region: 'Harari', icon: '💠', prize: '2M ETB', seats: 2400, tier: 4, badge: 'Diamond' },
    
    // Tier 5: Royal - 5M ETB - 2400 seats each
    { id: 'addis-ababa-5m', name: 'አዲስ አበባ 5M', nameEn: 'Addis Ababa 5M', region: 'Central', icon: '👑', prize: '5M ETB', seats: 2400, tier: 5, badge: 'Royal' },
    { id: 'shaggar-5m', name: 'ሸገር 5M', nameEn: 'Shaggar 5M', region: 'Oromia', icon: '👑', prize: '5M ETB', seats: 2400, tier: 5, badge: 'Royal' },
    { id: 'bahir-dar-5m', name: 'ባህር ዳር 5M', nameEn: 'Bahir Dar 5M', region: 'Amhara', icon: '👑', prize: '5M ETB', seats: 2400, tier: 5, badge: 'Royal' },
    { id: 'gondar-5m', name: 'ጎንደር 5M', nameEn: 'Gondar 5M', region: 'Amhara', icon: '👑', prize: '5M ETB', seats: 2400, tier: 5, badge: 'Royal' },
    { id: 'hawassa-5m', name: 'ሀዋሳ 5M', nameEn: 'Hawassa 5M', region: 'Sidama', icon: '👑', prize: '5M ETB', seats: 2400, tier: 5, badge: 'Royal' },
    { id: 'mekelle-5m', name: 'መቀሌ 5M', nameEn: 'Mekelle 5M', region: 'Tigray', icon: '👑', prize: '5M ETB', seats: 2400, tier: 5, badge: 'Royal' },
    { id: 'dire-dawa-5m', name: 'ድሬ ዳዋ 5M', nameEn: 'Dire Dawa 5M', region: 'Dire Dawa', icon: '👑', prize: '5M ETB', seats: 2400, tier: 5, badge: 'Royal' },
    { id: 'adama-5m', name: 'አዳማ 5M', nameEn: 'Adama 5M', region: 'Oromia', icon: '👑', prize: '5M ETB', seats: 2400, tier: 5, badge: 'Royal' },
    
    // Tier 6: Emperor - 10M ETB - 2400 seats each
    { id: 'addis-ababa-10m', name: 'አዲስ አበባ 10M', nameEn: 'Addis Ababa 10M', region: 'Central', icon: '🏆', prize: '10M ETB', seats: 2400, tier: 6, badge: 'Emperor' },
    { id: 'shaggar-10m', name: 'ሸገር 10M', nameEn: 'Shaggar 10M', region: 'Oromia', icon: '🏆', prize: '10M ETB', seats: 2400, tier: 6, badge: 'Emperor' },
    { id: 'bahir-dar-10m', name: 'ባህር ዳር 10M', nameEn: 'Bahir Dar 10M', region: 'Amhara', icon: '🏆', prize: '10M ETB', seats: 2400, tier: 6, badge: 'Emperor' },
    { id: 'hawassa-10m', name: 'ሀዋሳ 10M', nameEn: 'Hawassa 10M', region: 'Sidama', icon: '🏆', prize: '10M ETB', seats: 2400, tier: 6, badge: 'Emperor' }
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
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

      setPools(poolsData || []);
      setFeaturedPools(featuredData || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load pools');
    } finally {
      setLoading(false);
      setDataLoaded(true);
      setIsInitialLoad(false);
    }
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

  const RegisterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <div><h2 className="text-2xl font-bold text-gray-800">Create Account</h2><p className="text-sm text-gray-500">Join Abbaa Carraa to start winning!</p></div>
          <button onClick={() => setShowRegisterModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        <form onSubmit={handleRegister} className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><input type="text" required value={registerForm.fullName} onChange={(e) => setRegisterForm({...registerForm, fullName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="Enter your full name" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label><input type="email" required value={registerForm.email} onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="you@example.com" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label><input type="tel" required value={registerForm.phone} onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="09xxxxxxxx" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">City *</label><input type="text" required value={registerForm.city} onChange={(e) => setRegisterForm({...registerForm, city: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="Your city" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Password *</label><input type="password" required value={registerForm.password} onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="Minimum 6 characters" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label><input type="password" required value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="Confirm your password" /></div>
          <div className="flex items-start gap-2"><input type="checkbox" id="agreeTerms" checked={registerForm.agreeTerms} onChange={(e) => setRegisterForm({...registerForm, agreeTerms: e.target.checked})} className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded" /><label htmlFor="agreeTerms" className="text-sm text-gray-600">I agree to the Terms and Conditions</label></div>
          <button type="submit" disabled={registerLoading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50">{registerLoading ? 'Creating Account...' : 'Create Account →'}</button>
          <p className="text-center text-sm text-gray-500">Already have an account? <button type="button" onClick={() => { setShowRegisterModal(false); router.push('/login'); }} className="text-green-600 hover:underline">Login here</button></p>
        </form>
      </div>
    </div>
  );

  // ========== MOVING MARQUEE ==========
  const MovingMarquee = () => {
    const marqueeText = `🏆 በAbbaa Carraa ወርቃማ እድልን ያሸንፉ! • 🥈 Silver: 100K ETB (1200 Seats) • 🥇 Gold: 500K ETB (1200 Seats) • 💎 Platinum: 1M ETB (2400 Seats) • 💠 Diamond: 2M ETB (2400 Seats) • 👑 Royal: 5M ETB (2400 Seats) • 🏆 Emperor: 10M ETB (2400 Seats) • 🏪 Merkato VIP & 🏙️ City VIP Available! • 💚 2% Supports Health • Join & Start Winning Today! 🎯`;

    return (
      <div className="w-full overflow-hidden bg-gradient-to-r from-green-600 to-teal-600 py-2.5 md:py-3 shadow-inner">
        <div className="whitespace-nowrap animate-marquee-slow" style={{ display: 'inline-block' }}>
          <span className="text-white font-semibold text-[11px] md:text-sm tracking-wide px-4">
            {marqueeText}
          </span>
        </div>
        <style jsx>{`
          @keyframes marquee-slow {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee-slow {
            animation: marquee-slow 45s linear infinite;
            will-change: transform;
          }
          .animate-marquee-slow:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>
    );
  };

  // ========== COLLAPSIBLE MODE DRAWER ==========
  const ModeDrawer = () => (
    <div className="relative">
      <button 
        onClick={() => setShowModeDrawer(!showModeDrawer)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700 transition"
      >
        <span>⚙️</span>
        <span>Views</span>
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
            <span>📱</span> App View
            {activeView === 'app' && <span className="ml-auto text-white">✓</span>}
          </button>
          <button 
            onClick={() => { setActiveView('classic'); setShowModeDrawer(false); }} 
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${activeView === 'classic' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <span>🖥️</span> Classic View
            {activeView === 'classic' && <span className="ml-auto text-white">✓</span>}
          </button>
          <button 
            onClick={() => { setActiveView('banking'); setShowModeDrawer(false); }} 
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 flex items-center gap-2 ${activeView === 'banking' ? 'bg-green-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <span>🏦</span> Banking View
            {activeView === 'banking' && <span className="ml-auto text-white">✓</span>}
          </button>
          <div className="border-t border-gray-100 my-1"></div>
          <button 
            onClick={() => { toggleLanguage(); setShowModeDrawer(false); }} 
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
          >
            <span>🌐</span> {language === 'am' ? 'Switch to English' : 'ወደ አማርኛ ቀይር'}
          </button>
        </div>
      )}
    </div>
  );

  if (loading && isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div><p className="mt-4 text-gray-500">Loading amazing prizes...</p></div>
      </div>
    );
  }

  // ========== BANKING MODE ==========
  if (activeView === 'banking') {
    return (
      <>
        <Head>
          <title>Abbaa Carraa - Win Amazing Prizes</title>
          <meta name="description" content="Win amazing prizes. Join Merkato VIP, City VIP across 94 Ethiopian cities, or Regular Pools." />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>
        
        <MovingMarquee />
        
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

  // ========== APP MODE ==========
  if (activeView === 'app') {
    return (
      <>
        <Head>
          <title>Abbaa Carraa - Win Amazing Prizes</title>
          <meta name="description" content="Win amazing prizes. Join Merkato VIP, City VIP across 94 Ethiopian cities, or Regular Pools." />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>

        <div className="min-h-screen bg-gray-50 pb-20">
          {/* MOVING MARQUEE */}
          <MovingMarquee />

          {/* TOP APP BAR - LIGHT GREEN BACKGROUNDS */}
          <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100 px-3 md:px-4 py-2.5 md:py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="text-xl md:text-2xl">🎫</span>
                <span className="font-bold text-sm md:text-lg text-gray-800">Abbaa Carraa</span>
              </div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <button className="hidden sm:block text-[10px] md:text-xs bg-green-100 text-green-700 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full hover:bg-green-200 transition font-medium">
                  👁️ View
                </button>
                <Link href="/login" className="text-[10px] md:text-xs bg-green-100 text-green-700 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full hover:bg-green-200 transition font-medium">
                  Login
                </Link>
                <button onClick={() => setShowRegisterModal(true)} className="text-[10px] md:text-xs bg-green-100 text-green-700 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full hover:bg-green-200 transition font-medium">
                  Register
                </button>
                <button className="relative p-1">
                  <span className="text-lg md:text-xl">🔔</span>
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 md:w-4 md:h-4 bg-red-500 text-white text-[7px] md:text-[9px] rounded-full flex items-center justify-center">3</span>
                </button>
                <Link href="/profile" className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-xs md:text-sm">
                  U
                </Link>
                <ModeDrawer />
              </div>
            </div>
          </header>

          {/* WELCOME SECTION */}
          <div className="px-3 md:px-4 py-3 md:py-4 bg-white border-b border-gray-100">
            <p className="text-xs md:text-sm text-gray-500">Welcome back,</p>
            <p className="text-lg md:text-xl font-bold text-gray-800">Guest</p>
            <div className="flex flex-wrap gap-1.5 md:gap-2 mt-1.5 md:mt-2">
              <span className="bg-green-100 text-green-700 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-medium">⭐ {stats.total_pools} Active</span>
              <span className="bg-yellow-100 text-yellow-700 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-medium">🏆 {stats.total_winners} Winners</span>
              <span className="bg-blue-100 text-blue-700 text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded-full font-medium">🏙️ {uniqueCities.length} Cities</span>
            </div>
          </div>

          {/* COUNTERS REMOVED */}

          {/* CATEGORIES SECTION - ALL GREEN BORDERS */}
          <div className="px-3 md:px-4 py-2">
            <h2 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 md:mb-3">
              {language === 'am' ? 'ምድቦች' : 'Categories'}
            </h2>
            <div className="grid grid-cols-4 gap-2 md:gap-4">
              <Link href="/listings" className="flex flex-col items-center bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 border-2 border-green-500 hover:shadow-md transition">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">🏊</span>
                <span className="text-[9px] md:text-xs font-bold text-gray-700 text-center leading-tight">Regular Pools</span>
                <span className="text-[6px] md:text-[8px] text-gray-400 mt-0.5">Cars • Houses</span>
              </Link>

              <Link href="/merkato-vip" className="flex flex-col items-center bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 border-2 border-green-500 hover:shadow-md transition">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">🏪</span>
                <span className="text-[9px] md:text-xs font-bold text-gray-700 text-center leading-tight">Merkato VIP</span>
                <span className="text-[6px] md:text-[8px] text-gray-400 mt-0.5">6 Tiers • Cash</span>
              </Link>

              <button onClick={() => setShowCityDropdown(!showCityDropdown)} className="flex flex-col items-center bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 border-2 border-green-500 hover:shadow-md transition relative">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">🏙️</span>
                <span className="text-[9px] md:text-xs font-bold text-gray-700 text-center leading-tight">City VIP</span>
                <span className="text-[6px] md:text-[8px] text-gray-400 mt-0.5">6 Tiers • Cash</span>
                {showCityDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 md:w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="p-2 md:p-3 bg-gray-50 border-b">
                      <input type="text" placeholder="🔍 Search city..." value={citySearchTerm} onChange={(e) => setCitySearchTerm(e.target.value)} className="w-full px-2 md:px-3 py-1.5 md:py-2 border rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-green-500" autoFocus />
                    </div>
                    <div className="max-h-48 md:max-h-64 overflow-y-auto">
                      {filteredCityList.slice(0, 15).map(city => (
                        <Link key={city.id} href={`/cities/${city.id}`} className="block px-3 md:px-4 py-1.5 md:py-2 hover:bg-gray-50 transition border-b last:border-0 text-left">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <span className="text-base md:text-lg">{city.icon}</span>
                            <span className="text-xs md:text-sm font-medium text-gray-800">{city.name}</span>
                            <span className="text-[8px] md:text-xs text-gray-400">{city.nameEn}</span>
                            <span className="ml-auto text-[8px] md:text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">{city.badge}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[8px] md:text-[10px] text-gray-500">{city.prize}</span>
                            <span className="text-[8px] md:text-[10px] text-green-600">• {city.seats} Seats</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="p-2 text-center text-[8px] md:text-[10px] text-gray-400 bg-gray-50 border-t">
                      {uniqueCities.length}+ Cities • 6 Premium Tiers • Up to 10M ETB
                    </div>
                  </div>
                )}
              </button>

              <Link href="/winners" className="flex flex-col items-center bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 border-2 border-green-500 hover:shadow-md transition">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">🏆</span>
                <span className="text-[9px] md:text-xs font-bold text-gray-700 text-center leading-tight">Winners</span>
                <span className="text-[6px] md:text-[8px] text-gray-400 mt-0.5">Hall of Fame</span>
              </Link>

              <Link href="/how-it-works" className="flex flex-col items-center bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 border-2 border-green-500 hover:shadow-md transition">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">📖</span>
                <span className="text-[9px] md:text-xs font-bold text-gray-700 text-center leading-tight">How It Works</span>
              </Link>

              <Link href="/about" className="flex flex-col items-center bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 border-2 border-green-500 hover:shadow-md transition">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">ℹ️</span>
                <span className="text-[9px] md:text-xs font-bold text-gray-700 text-center leading-tight">About</span>
              </Link>

              <Link href="/contact" className="flex flex-col items-center bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 border-2 border-green-500 hover:shadow-md transition">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">📞</span>
                <span className="text-[9px] md:text-xs font-bold text-gray-700 text-center leading-tight">Contact</span>
              </Link>

              <button onClick={() => setShowRegisterModal(true)} className="flex flex-col items-center bg-gradient-to-r from-green-500 to-teal-500 rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-4 text-white hover:shadow-md transition">
                <span className="text-2xl md:text-3xl mb-0.5 md:mb-1">📝</span>
                <span className="text-[9px] md:text-xs font-bold text-center leading-tight">Register</span>
              </button>
            </div>
          </div>

          {/* VIP TIERS QUICK VIEW - GREEN BORDER CARDS */}
          <div className="px-3 md:px-4 py-2">
            <h2 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 md:mb-3">
              {language === 'am' ? 'የVIP ደረጃዎች' : 'VIP Tiers'}
            </h2>
            <div className="grid grid-cols-3 gap-2 md:gap-3">
              {merkatoVipTiers.map((tier) => (
                <Link key={tier.id} href="/merkato-vip" className={`bg-white rounded-xl md:rounded-2xl shadow-sm p-2.5 md:p-3 border-2 border-green-500 hover:shadow-md transition text-center`}>
                  <div className="text-2xl md:text-3xl">{tier.icon}</div>
                  <div className="text-[8px] md:text-[10px] font-bold text-gray-800">{tier.displayName}</div>
                  <div className="text-[7px] md:text-[9px] text-green-600 font-semibold">{tier.prize}</div>
                  <div className="text-[6px] md:text-[8px] text-gray-400">{tier.seats} Seats</div>
                </Link>
              ))}
            </div>
          </div>

          {/* FEATURED POOLS */}
          {featuredPools.length > 0 && (
            <div className="px-3 md:px-4 py-3 md:py-4">
              <div className="flex justify-between items-center mb-2 md:mb-3">
                <h2 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider">⭐ Featured Pools</h2>
                <Link href="/listings" className="text-[10px] md:text-xs text-green-600 font-medium">See All</Link>
              </div>
              <div className="flex overflow-x-auto gap-3 md:gap-4 pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {featuredPools.map((pool) => (
                  <div key={pool.id} className="min-w-[280px] md:min-w-[300px] max-w-[280px] md:max-w-[300px] snap-start flex-shrink-0 transform transition-all duration-300 hover:scale-[1.02]">
                    <PoolCard pool={pool} featured={true} language={language} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REGULAR POOLS */}
          <div className="px-3 md:px-4 py-3 md:py-4">
            <div className="flex justify-between items-center mb-2 md:mb-3">
              <h2 className="text-[10px] md:text-sm font-bold text-gray-500 uppercase tracking-wider">🏊 Regular Pools</h2>
              <Link href="/listings" className="text-[10px] md:text-xs text-green-600 font-medium">View All</Link>
            </div>
            
            {pools.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <div className="text-4xl mb-2">🏊</div>
                <p className="text-gray-500 text-sm">No active pools at the moment</p>
                <p className="text-xs text-gray-400 mt-1">Check back soon!</p>
              </div>
            ) : (
              <div className="flex overflow-x-auto gap-3 md:gap-4 pb-3 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {pools.map((pool) => (
                  <div key={pool.id} className="min-w-[280px] md:min-w-[300px] max-w-[280px] md:max-w-[300px] snap-start flex-shrink-0 transform transition-all duration-300 hover:scale-[1.02]">
                    <PoolCard pool={pool} featured={pool.is_featured === true} language={language} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CHARITY BANNER */}
          <div className="mx-3 md:mx-4 p-3 md:p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl md:rounded-2xl border border-red-100 mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-2xl md:text-3xl">💚</span>
              <div>
                <p className="font-bold text-sm md:text-base text-red-800">2% for Health</p>
                <p className="text-[10px] md:text-xs text-red-700">Supporting kidney & heart disease patients</p>
              </div>
            </div>
          </div>

          {/* BOTTOM NAVIGATION */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-1.5 md:py-2 px-2 md:px-4 z-40 shadow-lg">
            <Link href="/" className="flex flex-col items-center text-green-600">
              <span className="text-xl md:text-2xl">🏠</span>
              <span className="text-[8px] md:text-[10px] font-bold">Home</span>
            </Link>
            <Link href="/listings" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-xl md:text-2xl">🎁</span>
              <span className="text-[8px] md:text-[10px] font-bold">Pools</span>
            </Link>
            <Link href="/winners" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-xl md:text-2xl">🏆</span>
              <span className="text-[8px] md:text-[10px] font-bold">Winners</span>
            </Link>
            <Link href="/dashboard" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-xl md:text-2xl">👤</span>
              <span className="text-[8px] md:text-[10px] font-bold">Profile</span>
            </Link>
          </nav>

          {showRegisterModal && <RegisterModal />}

          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </div>
      </>
    );
  }

  // ========== CLASSIC MODE ==========
  return (
    <>
      <Head>
        <title>Abbaa Carraa - Win Amazing Prizes | Merkato VIP | City VIP | Regular Pools</title>
        <meta name="description" content="Win amazing prizes. Join Merkato VIP, City VIP across 94 Ethiopian cities, or Regular Pools. 2% supports kidney & heart disease patients." />
      </Head>

      <div className="min-h-screen bg-white w-full">
        <MovingMarquee />

        <div className="fixed top-4 right-4 z-50">
          <ModeDrawer />
        </div>

        <nav className="sticky top-0 z-40 bg-gray-900 shadow-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <span className="text-2xl group-hover:scale-110 transition-transform">🎫</span>
                <div><span className="font-bold text-white text-lg">Abbaa Carraa</span><span className="text-xs text-gray-400 ml-2 hidden sm:inline">| Ethiopia's Premier Platform</span></div>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                <div className="relative">
                  <button onClick={() => setProgramsDropdownOpen(!programsDropdownOpen)} className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition text-sm font-medium">
                    <span>📋</span> Programs
                    <svg className={`w-4 h-4 transition-transform ${programsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {programsDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-72 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden">
                      <Link href="/merkato-vip" className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-700">
                        <span className="text-xl">🏪</span>
                        <div>
                          <div className="font-medium">Merkato VIP</div>
                          <div className="text-xs text-gray-400">6 Tiers • Up to 10M ETB</div>
                        </div>
                      </Link>
                      <Link href="/city-vip" className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-700">
                        <span className="text-xl">🏙️</span>
                        <div>
                          <div className="font-medium">City VIP</div>
                          <div className="text-xs text-gray-400">94 Cities • 6 Tiers</div>
                        </div>
                      </Link>
                      <button onClick={() => scrollToSection('regular-pools')} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3 border-b border-gray-700">
                        <span className="text-xl">🏊</span>
                        <div>
                          <div className="font-medium">Regular Pools</div>
                          <div className="text-xs text-gray-400">Cars, Houses & More</div>
                        </div>
                      </button>
                      <Link href="/dashboard" className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3">
                        <span className="text-xl">📊</span>
                        <div>
                          <div className="font-medium">Dashboard</div>
                          <div className="text-xs text-gray-400">Track your tickets</div>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
                <Link href="/about" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition whitespace-nowrap text-sm font-medium">ℹ️ About</Link>
                <Link href="/contact" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition whitespace-nowrap text-sm font-medium">📞 Contact</Link>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <TopCitySelector />
                <Link href="/login" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium shadow-sm">Login</Link>
                <button onClick={() => setShowRegisterModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium shadow-sm">Register</button>
                <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium shadow-sm">👁️ View</button>
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-gray-700 space-y-2">
                <div className="flex gap-2 px-4 py-2">
                  <Link href="/login" className="flex-1 text-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs">🔐 Login</Link>
                  <button onClick={() => { setShowRegisterModal(true); setMobileMenuOpen(false); }} className="flex-1 text-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs">📝 Register</button>
                  <button className="flex-1 text-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs">👁️ View</button>
                </div>
                <Link href="/merkato-vip" className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                  <span className="text-xl">🏪</span><div><div>Merkato VIP</div><div className="text-xs text-gray-400">6 Tiers • Up to 10M</div></div>
                </Link>
                <Link href="/city-vip" className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                  <span className="text-xl">🏙️</span><div><div>City VIP</div><div className="text-xs text-gray-400">94 Cities • 6 Tiers</div></div>
                </Link>
                <button onClick={() => scrollToSection('regular-pools')} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                  <span className="text-xl">🏊</span><div><div>Regular Pools</div><div className="text-xs text-gray-400">Cars, Houses & More</div></div>
                </button>
                <div className="h-px bg-gray-700 my-2"></div>
                <Link href="/dashboard" className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                  <span className="text-xl">📊</span><div><div>Dashboard</div><div className="text-xs text-gray-400">Track your tickets</div></div>
                </Link>
                <Link href="/about" className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                  <span className="text-xl">ℹ️</span><div><div>About</div><div className="text-xs text-gray-400">Learn about us</div></div>
                </Link>
                <Link href="/contact" className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                  <span className="text-xl">📞</span><div><div>Contact</div><div className="text-xs text-gray-400">Get in touch</div></div>
                </Link>
                <div className="pt-2"><TopCitySelector /></div>
              </div>
            )}
          </div>
        </nav>

        <GlobalAnnouncement />
        <CashEquivalentBanner />
        <CharityBanner />

        <div className="w-full bg-gradient-to-br from-green-700 to-teal-700">
          <div className="max-w-7xl mx-auto">
            <img src="/images/abbaa-carraa-bg.png" alt="Abbaa Carraa" className="w-full h-auto object-cover block" loading="eager" fetchPriority="high" style={{ maxHeight: '500px', objectPosition: 'center' }} />
          </div>
        </div>

        <div className="bg-white py-12 w-full">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-4 py-1.5 rounded-full text-sm font-semibold mb-5 animate-pulse">🔥 Ethiopia's #1 Prize Platform 🏆</div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900">Welcome to <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Abbaa Carraa</span></h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mt-4">Win cars, houses, machinery, electronics, and more through community savings!</p>
            <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 px-4 py-2 rounded-full">
              <span className="text-green-600 text-lg">💚</span>
              <span className="text-green-700 font-medium">2% supports kidney & heart disease patients</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Link href="/merkato-vip" className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition hover:scale-105 transform inline-flex items-center gap-2">
                <span>🏪</span> Join Merkato VIP <span>→</span>
              </Link>
              <Link href="/city-vip" className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition hover:scale-105 transform inline-flex items-center gap-2">
                <span>🏙️</span> Join City VIP <span>→</span>
              </Link>
              <button onClick={() => scrollToSection('regular-pools')} className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition hover:scale-105 transform inline-flex items-center gap-2">
                <span>🏊</span> Join Regular Pools <span>→</span>
              </button>
            </div>
          </div>
        </div>

        <div ref={counterRef} className="bg-gradient-to-r from-gray-50 to-white border-y border-gray-200 py-3">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
              <div className="flex items-center gap-2"><span className="text-green-600 text-lg">💰</span><span className="text-gray-600">Total Prize:</span><span className="font-bold text-gray-800">{counterInView ? <CountUp start={0} end={Math.floor(stats.total_raised / 1000)} duration={2} separator="," /> : '0'}+K ETB</span></div>
              <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2"><span className="text-yellow-600 text-lg">🏆</span><span className="text-gray-600">Winners:</span><span className="font-bold text-gray-800">{stats.total_winners}+</span></div>
              <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2"><span className="text-blue-600 text-lg">🎯</span><span className="text-gray-600">Active Pools:</span><span className="font-bold text-gray-800">{stats.total_pools}+</span></div>
              <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2"><span className="text-purple-600 text-lg">🤝</span><span className="text-gray-600">Agents:</span><span className="font-bold text-gray-800">{stats.total_agents}+</span></div>
              <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
              <div className="flex items-center gap-2"><span className="text-orange-600 text-lg">🏙️</span><span className="text-gray-600">Cities:</span><span className="font-bold text-gray-800">{uniqueCities.length}+</span></div>
            </div>
          </div>
        </div>

        <MovingAd />
        <AdvertisingBanner />

        <div id="pools-section" className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center mb-4">Available Opportunities</h2>
          <p className="text-center text-gray-500 mb-8">Choose from VIP programs or regular pools</p>

          {/* VIP TIERS QUICK REFERENCE */}
          <div className="mb-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {merkatoVipTiers.map((tier) => (
              <div key={tier.id} className={`bg-gradient-to-r ${tier.color} rounded-xl p-3 text-center text-white shadow-lg`}>
                <div className="text-2xl">{tier.icon}</div>
                <div className="text-xs font-bold uppercase">{tier.displayName}</div>
                <div className="text-xs font-semibold">{tier.prize}</div>
                <div className="text-[10px] opacity-80">{tier.seats} Seats</div>
              </div>
            ))}
          </div>

          {/* Merkato VIP */}
          <div id="merkato-vip" className="mb-12 scroll-mt-20">
            <Link href="/merkato-vip" className="block relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-2xl p-6 md:p-8 text-white transform hover:scale-105 transition-all duration-500 shadow-2xl overflow-hidden group cursor-pointer">
              <div className="absolute inset-0 opacity-20">
                <div className="absolute -top-10 -left-10 text-8xl animate-bounce">🏪</div>
                <div className="absolute -bottom-10 -right-10 text-8xl animate-pulse">💰</div>
              </div>
              <div className="relative z-10">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-5xl md:text-6xl animate-bounce">🏪</div>
                    <div>
                      <div className="font-bold text-2xl md:text-3xl">መርካቶ VIP</div>
                      <div className="text-xs md:text-sm opacity-90">6 Premium Tiers • Win Cash up to 10M ETB</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-gray-400 text-white px-2 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-lg">🥈 Silver</div>
                    <div className="bg-yellow-400 text-gray-900 px-2 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-lg">🥇 Gold</div>
                    <div className="bg-blue-300 text-gray-900 px-2 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-lg">💎 Platinum</div>
                    <div className="bg-cyan-400 text-gray-900 px-2 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-lg">💠 Diamond</div>
                    <div className="bg-purple-500 text-white px-2 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-lg">👑 Royal</div>
                    <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-[10px] md:text-xs font-bold shadow-lg">🏆 Emperor</div>
                  </div>
                  <div className="bg-white text-gray-900 px-5 py-2 rounded-full font-bold hover:bg-gray-100 transition transform hover:scale-105 shadow-xl flex items-center gap-2 text-sm md:text-base">
                    <span>🎯</span><span>Join Now</span><span>→</span>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  <p className="text-sm md:text-lg font-bold animate-pulse">"ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው"</p>
                  <p className="text-xs md:text-sm opacity-80 mt-1">"Today, this week, and this month - let's make one participant a millionaire"</p>
                </div>
              </div>
            </Link>
          </div>

          {/* City VIP */}
          <div id="city-vip" className="mb-12 scroll-mt-20">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🏙️</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">City VIP Programs</h3>
                    <p className="text-sm text-gray-300">6 Premium Tiers • {uniqueCities.length}+ Ethiopian cities available!</p>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setShowCityDropdown(!showCityDropdown)} className="flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition shadow-md">
                    <span>🎯</span><span>Select City</span>
                    <svg className={`w-4 h-4 transition-transform ${showCityDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showCityDropdown && (
                    <div className="absolute top-full left-0 mt-2 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                      <div className="p-3 bg-gray-50 border-b">
                        <input type="text" placeholder="🔍 Search your city... (94 cities available)" value={citySearchTerm} onChange={(e) => setCitySearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" autoFocus />
                        <p className="text-xs text-gray-400 mt-1">Showing {filteredCityList.length} of {uniqueCities.length} cities</p>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {filteredCityList.length === 0 ? <div className="p-4 text-center text-gray-500">No cities found</div> : filteredCityList.slice(0, 20).map(city => (
                          <a key={city.id} href={`/cities/${city.id}`} onClick={(e) => { e.preventDefault(); setShowCityDropdown(false); setCitySearchTerm(''); window.location.href = `/cities/${city.id}`; }} className="w-full text-left px-4 py-3 hover:bg-gray-50 transition border-b last:border-0 flex items-center gap-3 cursor-pointer group">
                            <span className="text-2xl">{city.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800 group-hover:text-green-600 transition">{city.name}</span>
                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">{city.badge}</span>
                              </div>
                              <div className="text-xs text-gray-500">{city.nameEn} • {city.region}</div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-green-600 font-semibold">🏆 {city.prize}</span>
                                <span className="text-[10px] text-gray-400">• {city.seats} Seats</span>
                              </div>
                            </div>
                            <span className="text-green-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition flex items-center gap-1">Join <span>→</span></span>
                          </a>
                        ))}
                      </div>
                      <div className="p-2 text-center text-xs text-gray-400 bg-gray-50">{uniqueCities.length}+ Ethiopian cities • 6 Premium Tiers • Up to 10M ETB</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-6 pt-4 border-t border-gray-700">
                <div className="text-center bg-gray-800 rounded-lg p-2">
                  <div className="text-2xl">🥈</div>
                  <div className="text-white font-bold text-xs">100K</div>
                  <div className="text-[8px] text-gray-400">1,200 Seats</div>
                </div>
                <div className="text-center bg-gray-800 rounded-lg p-2">
                  <div className="text-2xl">🥇</div>
                  <div className="text-white font-bold text-xs">500K</div>
                  <div className="text-[8px] text-gray-400">1,200 Seats</div>
                </div>
                <div className="text-center bg-gray-800 rounded-lg p-2">
                  <div className="text-2xl">💎</div>
                  <div className="text-white font-bold text-xs">1M</div>
                  <div className="text-[8px] text-gray-400">2,400 Seats</div>
                </div>
                <div className="text-center bg-gray-800 rounded-lg p-2">
                  <div className="text-2xl">💠</div>
                  <div className="text-white font-bold text-xs">2M</div>
                  <div className="text-[8px] text-gray-400">2,400 Seats</div>
                </div>
                <div className="text-center bg-gray-800 rounded-lg p-2">
                  <div className="text-2xl">👑</div>
                  <div className="text-white font-bold text-xs">5M</div>
                  <div className="text-[8px] text-gray-400">2,400 Seats</div>
                </div>
                <div className="text-center bg-gray-800 rounded-lg p-2">
                  <div className="text-2xl">🏆</div>
                  <div className="text-white font-bold text-xs">10M</div>
                  <div className="text-[8px] text-gray-400">2,400 Seats</div>
                </div>
              </div>
            </div>
          </div>

          {/* Regular Pools */}
          <div id="regular-pools" className="mb-12 scroll-mt-20">
            <button onClick={() => setShowRegularPools(!showRegularPools)} className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-2xl p-6 transition-all duration-300 shadow-lg group">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl group-hover:scale-110 transition-transform">🏊</span>
                    <div className="text-left">
                      <h3 className="text-2xl font-bold">Regular Prize Pools</h3>
                      <p className="text-sm text-gray-300">Win Cars, Houses, Machinery & Electronics</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{showRegularPools ? 'Close' : 'View'}</span>
                    <svg className={`w-5 h-5 transition-transform duration-300 ${showRegularPools ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-600 w-full">
                  <div className="rounded-lg p-2">
                    <p className="text-sm md:text-base font-bold text-yellow-300">🎯 Join and WIN!</p>
                    <p className="text-xs text-gray-300">ይሳተፉ እና ያሸንፉ!</p>
                    <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                      <span className="text-lg">🚗</span><span className="text-xs font-semibold text-white">Car</span><span className="text-gray-400">•</span>
                      <span className="text-lg">🏭</span><span className="text-xs font-semibold text-white">Machinery</span><span className="text-gray-400">•</span>
                      <span className="text-lg">🏠</span><span className="text-xs font-semibold text-white">House</span><span className="text-gray-400">•</span>
                      <span className="text-lg">💻</span><span className="text-xs font-semibold text-white">Electronics</span><span className="text-gray-400">•</span>
                      <span className="text-lg">🎁</span><span className="text-xs font-semibold text-white">Much More</span>
                    </div>
                  </div>
                </div>
              </div>
            </button>
            {showRegularPools && (
              <div className="mt-6 animate-fade-in">
                <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700">Available Prize Pools</h4>
                    <p className="text-sm text-gray-500">Choose based on your budget and preference</p>
                  </div>
                </div>
                {pools.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-5xl mb-3">🏊</div>
                    <p className="text-gray-500">No active pools at the moment</p>
                    <p className="text-sm text-gray-400 mt-2">Check back soon!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pools.map((pool) => <PoolCard key={pool.id} pool={pool} featured={pool.is_featured === true} language={language} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <Testimonials />
        <NewsletterSubscribe />

        <div className="bg-gray-50 py-16 w-full">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">እንዴት እንሳተፋለን? | How It Works</h2>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">1</div>
                <h3 className="font-bold text-xl mb-2">Find a Pool</h3>
                <p className="text-gray-600">Browse available prize pools</p>
              </div>
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">2</div>
                <h3 className="font-bold text-xl mb-2">Contribute</h3>
                <p className="text-gray-600">Make your contribution securely</p>
              </div>
              <div className="hover:scale-105 transition transform">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-green-600">3</div>
                <h3 className="font-bold text-xl mb-2">Win!</h3>
                <p className="text-gray-600">Win amazing prizes!</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200"></div>
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Partner Program</h2>
            <p className="text-gray-300 text-sm md:text-base mb-6">Join our partner program and start earning commissions today!</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button onClick={() => handleRoleSelection('agent')} className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
                <span>🤝</span> Become an Agent
              </button>
              <button onClick={() => handleRoleSelection('vendor')} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
                <span>🏪</span> Become a Vendor
              </button>
              <button onClick={() => handleRoleSelection('organization')} className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
                <span>🏢</span> Become an Organization
              </button>
            </div>
            <div className="mt-4 text-xs text-gray-400">
              <p>✓ No upfront fees ✓ Earn 10% on every successful pool ✓ 24/7 support</p>
            </div>
          </div>
        </div>

        {showCitySelector && <CitySelector onClose={() => setShowCitySelector(false)} />}
      </div>

      {showRegisterModal && <RegisterModal />}

      <style jsx>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.5s ease-out; }
        .scroll-mt-20 { scroll-margin-top: 80px; }
        @keyframes marquee-slow {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-slow {
          animation: marquee-slow 45s linear infinite;
          will-change: transform;
        }
        .animate-marquee-slow:hover {
          animation-play-state: paused;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}
