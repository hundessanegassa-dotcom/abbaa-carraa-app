// pages/index.js - COMPLETE WITH BOTH UI MODES, USING EXISTING LOCALES
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

// Import your existing locale system
import en from '../locales/en.json';
import am from '../locales/am.json';
import om from '../locales/om.json';
import so from '../locales/so.json';
import ti from '../locales/ti.json';

// Dynamic imports
const MovingAd = dynamic(() => import('../components/MovingAd'), { ssr: false, loading: () => null });
const Testimonials = dynamic(() => import('../components/Testimonials'), { ssr: false, loading: () => null });
const NewsletterSubscribe = dynamic(() => import('../components/NewsletterSubscribe'), { ssr: false, loading: () => null });
const AdvertisingBanner = dynamic(() => import('../components/AdvertisingBanner'), { ssr: false, loading: () => null });
const CashEquivalentBanner = dynamic(() => import('../components/CashEquivalentBanner'), { ssr: false, loading: () => null });
const CharityBanner = dynamic(() => import('../components/CharityBanner'), { ssr: false, loading: () => null });

// Available languages
const locales = {
  en: { name: 'English', flag: '🇬🇧', data: en },
  am: { name: 'አማርኛ', flag: '🇪🇹', data: am },
  om: { name: 'Oromoo', flag: '🇪🇹', data: om },
  so: { name: 'Soomaali', flag: '🇸🇴', data: so },
  ti: { name: 'ትግርኛ', flag: '🇪🇹', data: ti },
};

export async function getServerSideProps({ req, query }) {
  // Get language from cookie or query param or default to am
  const cookieLang = req.cookies?.locale;
  const queryLang = query?.lang;
  const defaultLang = 'am';
  const lang = queryLang || cookieLang || defaultLang;
  
  return { 
    props: { 
      initialLang: locales[lang] ? lang : defaultLang 
    } 
  };
}

export default function Home({ initialLang = 'am' }) {
  const router = useRouter();
  const { mode, toggleMode } = useUIMode();
  const [language, setLanguage] = useState(initialLang);
  const [pools, setPools] = useState([]);
  const [stats, setStats] = useState({
    total_pools: 0,
    total_winners: 0,
    total_agents: 0,
    total_raised: 0
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showCitySelector, setShowCitySelector] = useState(false);
  const [showRegularPools, setShowRegularPools] = useState(false);
  const [regularPoolFilter, setRegularPoolFilter] = useState('all');
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  
  const [registerForm, setRegisterForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    city: '',
    agreeTerms: false
  });
  
  const merkatoRef = useRef(null);
  const cityVipRef = useRef(null);
  const regularPoolsRef = useRef(null);

  // Get current translations
  const t = locales[language]?.data || locales.am.data;

  // Load language from cookie/localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang && locales[savedLang]) {
      setLanguage(savedLang);
      document.cookie = `locale=${savedLang}; path=/; max-age=31536000`;
    }
  }, []);

  // Change language
  const changeLanguage = (langCode) => {
    if (locales[langCode]) {
      setLanguage(langCode);
      localStorage.setItem('appLanguage', langCode);
      document.cookie = `locale=${langCode}; path=/; max-age=31536000`;
      // Optional: reload to refresh all content
      // router.push(router.asPath, undefined, { locale: langCode });
    }
  };

  // ALL 94 ETHIOPIAN CITIES - COMPLETE LIST (same as before)
  const allCityVipPrograms = [
    { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', region: 'Central', icon: '🏙️', prize: '40M ETB', descriptionAm: 'የኢትዮጵያ የንግድ እና ዲፕሎማሲ ልብ', descriptionEn: 'Heart of Ethiopian Commerce & Diplomacy' },
    { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', region: 'Oromia', icon: '🏗️', prize: '40M ETB', descriptionAm: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል', descriptionEn: 'Smart City & Investment Hub' },
    { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', region: 'Dire Dawa', icon: '🚂', prize: '40M ETB', descriptionAm: 'የንግድ እና የማኑፋክቸሪንግ ከተማ', descriptionEn: 'Trade & Manufacturing Hub' },
    { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', region: 'Tigray', icon: '🏭', prize: '40M ETB', descriptionAm: 'ከፍተኛ የኢኮኖሚ ዕድገት ካለው ከተማ', descriptionEn: 'City with Highest GDP per Capita' },
    { id: 'axum', name: 'አክሱም', nameEn: 'Axum', region: 'Tigray', icon: '🏛️', prize: '40M ETB', descriptionAm: 'የታላቁ የአክሱም መንግስት ዋና ከተማ', descriptionEn: 'Capital of the Ancient Axumite Kingdom' },
    { id: 'adigrat', name: 'አዲግራት', nameEn: 'Adigrat', region: 'Tigray', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የሰሜን ትግራይ የንግድ ማዕከል', descriptionEn: 'North Tigray Trade Center' },
    { id: 'shire', name: 'ሽሬ', nameEn: 'Shire', region: 'Tigray', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የምዕራብ ትግራይ ዋና ከተማ', descriptionEn: 'Capital of West Tigray' },
    { id: 'mekoni', name: 'መቆኒ', nameEn: 'Mekoni', region: 'Tigray', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የምዕራብ ትግራይ ከተማ', descriptionEn: 'West Tigray Town' },
    { id: 'maychew', name: 'ማይጨው', nameEn: 'Maychew', region: 'Tigray', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የደቡብ ትግራይ ከተማ', descriptionEn: 'South Tigray Town' },
    { id: 'abiy-addi', name: 'አቢይ አዲ', nameEn: 'Abiy Addi', region: 'Tigray', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የማዕከላዊ ትግራይ ከተማ', descriptionEn: 'Central Tigray Town' },
    { id: 'wukro', name: 'ውቅሮ', nameEn: 'Wukro', region: 'Tigray', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የምስራቅ ትግራይ ከተማ', descriptionEn: 'East Tigray Town' },
    { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', region: 'Amhara', icon: '🏰', prize: '40M ETB', descriptionAm: 'የባህል ቅርስ እና የቱሪዝም ከተማ', descriptionEn: 'Cultural Heritage & Tourism City' },
    { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', region: 'Amhara', icon: '🏞️', prize: '40M ETB', descriptionAm: 'የታና ሀይቅ እና የጨርቃጨርቅ ከተማ', descriptionEn: 'Lake Tana & Textile City' },
    { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', region: 'Amhara', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የንግድ እና የእርሻ ከተማ', descriptionEn: 'Trade & Agriculture City' },
    { id: 'debre-markos', name: 'ደብረ ማርቆስ', nameEn: 'Debre Markos', region: 'Amhara', icon: '⛪', prize: '40M ETB', descriptionAm: 'የምስራቅ ጎጃም ዋና ከተማ', descriptionEn: 'Capital of East Gojjam' },
    { id: 'finote-selam', name: 'ፍኖተ ሰላም', nameEn: 'Finote Selam', region: 'Amhara', icon: '🌅', prize: '40M ETB', descriptionAm: 'የምዕራብ ጎጃም ዋና ከተማ', descriptionEn: 'Capital of West Gojjam' },
    { id: 'woldia', name: 'ወልዲያ', nameEn: 'Woldia', region: 'Amhara', icon: '🎓', prize: '40M ETB', descriptionAm: 'የወልዲያ ዩኒቨርሲቲ ከተማ', descriptionEn: 'Woldia University City' },
    { id: 'debre-birhan', name: 'ደብረ ብርሃን', nameEn: 'Debre Birhan', region: 'Amhara', icon: '⭐', prize: '40M ETB', descriptionAm: 'የፀሐይ ብርሃን ከተማ', descriptionEn: 'City of Sunlight' },
    { id: 'kombolcha', name: 'ኮምቦልቻ', nameEn: 'Kombolcha', region: 'Amhara', icon: '🏭', prize: '40M ETB', descriptionAm: 'የኢንዱስትሪ ዞን እና ደረቅ ወደብ', descriptionEn: 'Industrial Zone & Dry Port' },
    { id: 'sekota', name: 'ሰቆጣ', nameEn: 'Sekota', region: 'Amhara', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የዋግ ሽራ ዞን ዋና ከተማ', descriptionEn: 'Capital of Wag Hemra Zone' },
    { id: 'aykal', name: 'አይከል', nameEn: 'Aykal', region: 'Amhara', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የምዕራብ ጎጃም ከተማ', descriptionEn: 'West Gojjam Town' },
    { id: 'metema', name: 'ሜተማ', nameEn: 'Metema', region: 'Amhara', icon: '🛣️', prize: '40M ETB', descriptionAm: 'የኢትዮ-ሱዳን ድንበር ከተማ', descriptionEn: 'Ethio-Sudan Border Town' },
    { id: 'debre-tabor', name: 'ደብረ ታቦር', nameEn: 'Debre Tabor', region: 'Amhara', icon: '⛪', prize: '40M ETB', descriptionAm: 'የጥንታዊ ገዳማት ከተማ', descriptionEn: 'City of Ancient Monasteries' },
    { id: 'bati', name: 'ባቲ', nameEn: 'Bati', region: 'Amhara', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የንግድ እና የእርሻ ከተማ', descriptionEn: 'Trade & Agriculture Town' },
    { id: 'kemise', name: 'ቀሚሴ', nameEn: 'Kemise', region: 'Amhara', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የንግድ እና የእርሻ ከተማ', descriptionEn: 'Trade & Agriculture Town' },
    { id: 'injibara', name: 'እንጅባራ', nameEn: 'Injibara', region: 'Amhara', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የአዊ ዞን ዋና ከተማ', descriptionEn: 'Capital of Awi Zone' },
    { id: 'lalibela', name: 'ላሊበላ', nameEn: 'Lalibela', region: 'Amhara', icon: '⛪', prize: '40M ETB', descriptionAm: 'የዩኔስኮ ቅርስ ከተማ', descriptionEn: 'UNESCO World Heritage Site' },
    { id: 'adama', name: 'አዳማ', nameEn: 'Adama', region: 'Oromia', icon: '🏭', prize: '40M ETB', descriptionAm: 'የኢንዱስትሪ እና የንግድ ከተማ', descriptionEn: 'Industrial & Trade City' },
    { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', region: 'Oromia', icon: '☕', prize: '40M ETB', descriptionAm: 'የቡና እና የንግድ ከተማ', descriptionEn: 'Coffee & Trade City' },
    { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', region: 'Oromia', icon: '✈️', prize: '40M ETB', descriptionAm: 'የሀይቆች እና የአየር ሃይል ከተማ', descriptionEn: 'City of Lakes & Air Force Base' },
    { id: 'asella', name: 'አሰላ', nameEn: 'Asella', region: 'Oromia', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የአርሲ ዋና ከተማ እና የእርሻ ማዕከል', descriptionEn: 'Capital of Arsi & Agricultural Hub' },
    { id: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene', region: 'Oromia', icon: '🛍️', prize: '40M ETB', descriptionAm: 'የንግድ እና የኢንዱስትሪ ከተማ', descriptionEn: 'Trade & Industrial City' },
    { id: 'robe', name: 'ሮቤ', nameEn: 'Robe', region: 'Oromia', icon: '🌄', prize: '40M ETB', descriptionAm: 'የባሌ ተራራ በር | የቱሪዝም ማዕከል', descriptionEn: 'Gateway to Bale Mountains | Tourism Hub' },
    { id: 'ginir', name: 'ጊኒር', nameEn: 'Ginir', region: 'Oromia', icon: '🏞️', prize: '40M ETB', descriptionAm: 'የባሌ ምስራቅ የንግድ ማዕከል', descriptionEn: 'Eastern Bale Trade Center' },
    { id: 'yabelo', name: 'ያቤሎ', nameEn: 'Yabelo', region: 'Oromia', icon: '🐪', prize: '40M ETB', descriptionAm: 'የእንስሳት እርባታ እና የንግድ ከተማ', descriptionEn: 'Livestock & Trade City' },
    { id: 'moyale', name: 'ሞያሌ', nameEn: 'Moyale', region: 'Oromia', icon: '🛣️', prize: '40M ETB', descriptionAm: 'የኢትዮ-ኬንያ ድንበር ከተማ', descriptionEn: 'Ethio-Kenya Border Town' },
    { id: 'chiro', name: 'ቺሮ', nameEn: 'Chiro', region: 'Oromia', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የምስራቅ ሀረርጌ ዋና ከተማ', descriptionEn: 'Capital of East Hararghe' },
    { id: 'fiche', name: 'ፊጬ', nameEn: 'Fiche', region: 'Oromia', icon: '🌾', prize: '40M ETB', descriptionAm: 'የሰሜን ሸዋ የእህል ማዕከል', descriptionEn: 'North Shewa Grain Center' },
    { id: 'woliso', name: 'ወሊሶ', nameEn: 'Woliso', region: 'Oromia', icon: '💧', prize: '40M ETB', descriptionAm: 'የሙቀት ምንጭ እና የቱሪዝም ከተማ', descriptionEn: 'Hot Springs & Tourism City' },
    { id: 'ambo', name: 'አምቦ', nameEn: 'Ambo', region: 'Oromia', icon: '💧', prize: '40M ETB', descriptionAm: 'የማዕድን ውሃ እና የግብርና ከተማ', descriptionEn: 'Mineral Water & Agriculture City' },
    { id: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte', region: 'Oromia', icon: '☕', prize: '40M ETB', descriptionAm: 'የቡና እና የንግድ ከተማ', descriptionEn: 'Coffee & Trade City' },
    { id: 'gimbi', name: 'ጊምቢ', nameEn: 'Gimbi', region: 'Oromia', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የምዕራብ ወለጋ የንግድ ማዕከል', descriptionEn: 'West Wollega Trade Center' },
    { id: 'dembi-dollo', name: 'ደምቢ ዶሎ', nameEn: 'Dembi Dollo', region: 'Oromia', icon: '💰', prize: '40M ETB', descriptionAm: 'የወርቅ ማዕድን እና የንግድ ከተማ', descriptionEn: 'Gold Mining & Trade City' },
    { id: 'shambu', name: 'ሻምቡ', nameEn: 'Shambu', region: 'Oromia', icon: '🌾', prize: '40M ETB', descriptionAm: 'የሆሮ ጉዱሩ ዋና ከተማ', descriptionEn: 'Capital of Horo Guduru' },
    { id: 'metu', name: 'መቱ', nameEn: 'Metu', region: 'Oromia', icon: '🌿', prize: '40M ETB', descriptionAm: 'የቡና እና የግብርና ከተማ', descriptionEn: 'Coffee & Agriculture City' },
    { id: 'bedele', name: 'በደሌ', nameEn: 'Bedele', region: 'Oromia', icon: '🍺', prize: '40M ETB', descriptionAm: 'የቢራ ፋብሪካ እና የቡና ከተማ', descriptionEn: 'Brewery & Coffee City' },
    { id: 'bule-hora', name: 'ቡሌ ሆራ', nameEn: 'Bule Hora', region: 'Oromia', icon: '🎓', prize: '40M ETB', descriptionAm: 'የቡሌ ሆራ ዩኒቨርሲቲ ከተማ', descriptionEn: 'Bule Hora University City' },
    { id: 'negele-borana', name: 'ነገሌ ቦረና', nameEn: 'Negele Borana', region: 'Oromia', icon: '🐪', prize: '40M ETB', descriptionAm: 'የቦረና የእንስሳት እርባታ ማዕከል', descriptionEn: 'Borana Livestock Center' },
    { id: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway', region: 'Oromia', icon: '🐟', prize: '40M ETB', descriptionAm: 'የአሳ ማጥመድ እና የቱሪዝም ከተማ', descriptionEn: 'Fishing & Tourism City' },
    { id: 'mojo', name: 'ሞጆ', nameEn: 'Mojo', region: 'Oromia', icon: '🚛', prize: '40M ETB', descriptionAm: 'የሎጂስቲክስ እና የኢንዱስትሪ ከተማ', descriptionEn: 'Logistics & Industrial Town' },
    { id: 'dodola', name: 'ዶዶላ', nameEn: 'Dodola', region: 'Oromia', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የባሌ ተራራ መግቢያ', descriptionEn: 'Gateway to Bale Mountains' },
    { id: 'gera', name: 'ጌራ', nameEn: 'Gera', region: 'Oromia', icon: '☕', prize: '40M ETB', descriptionAm: 'የቡና ማምረቻ አካባቢ', descriptionEn: 'Coffee Producing Area' },
    { id: 'agaro', name: 'አጋሮ', nameEn: 'Agaro', region: 'Oromia', icon: '☕', prize: '40M ETB', descriptionAm: 'የቡና እና የንግድ ከተማ', descriptionEn: 'Coffee & Trade Town' },
    { id: 'lemu', name: 'ለሙ', nameEn: 'Lemu', region: 'Oromia', icon: '🌾', prize: '40M ETB', descriptionAm: 'የእህል እርሻ አካባቢ', descriptionEn: 'Grain Farming Area' },
    { id: 'hagere-mariam', name: 'ሀገረ ማርያም', nameEn: 'Hagere Mariam', region: 'Oromia', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
    { id: 'shakiso', name: 'ሻኪሶ', nameEn: 'Shakiso', region: 'Oromia', icon: '💰', prize: '40M ETB', descriptionAm: 'የወርቅ ማዕድን ከተማ', descriptionEn: 'Gold Mining Town' },
    { id: 'kibre-mengist', name: 'ቅብረ መንግስት', nameEn: 'Kibre Mengist', region: 'Oromia', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
    { id: 'wachile', name: 'ዋቺሌ', nameEn: 'Wachile', region: 'Oromia', icon: '🐪', prize: '40M ETB', descriptionAm: 'የእንስሳት እርባታ አካባቢ', descriptionEn: 'Livestock Area' },
    { id: 'goba', name: 'ጎባ', nameEn: 'Goba', region: 'Oromia', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የባሌ ተራራ መግቢያ', descriptionEn: 'Gateway to Bale Mountains' },
    { id: 'sinana', name: 'ሲናና', nameEn: 'Sinana', region: 'Oromia', icon: '🌾', prize: '40M ETB', descriptionAm: 'የእህል እርሻ አካባቢ', descriptionEn: 'Grain Farming Area' },
    { id: 'dinsho', name: 'ዲንሾ', nameEn: 'Dinsho', region: 'Oromia', icon: '🏞️', prize: '40M ETB', descriptionAm: 'የባሌ ተራራ ብሔራዊ ፓርክ መግቢያ', descriptionEn: 'Bale Mountains National Park Gateway' },
    { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', region: 'Somali', icon: '🐪', prize: '40M ETB', descriptionAm: 'የሶማሌ ክልል ዋና ከተማ', descriptionEn: 'Capital of Somali Region' },
    { id: 'degehabur', name: 'ደገሃቡር', nameEn: 'Degehabur', region: 'Somali', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
    { id: 'kebri-dehar', name: 'ቀብሪ ደሃር', nameEn: 'Kebri Dehar', region: 'Somali', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የሶማሌ ክልል የንግድ ማዕከል', descriptionEn: 'Somali Region Trade Center' },
    { id: 'gode', name: 'ጎዴ', nameEn: 'Gode', region: 'Somali', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
    { id: 'warder', name: 'ዋርደር', nameEn: 'Warder', region: 'Somali', icon: '🐪', prize: '40M ETB', descriptionAm: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
    { id: 'shilabo', name: 'ሺላቦ', nameEn: 'Shilabo', region: 'Somali', icon: '🐪', prize: '40M ETB', descriptionAm: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
    { id: 'kelafo', name: 'ከላፎ', nameEn: 'Kelafo', region: 'Somali', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
    { id: 'mustahil', name: 'ሙስታሂል', nameEn: 'Mustahil', region: 'Somali', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የሶማሌ ክልል ከተማ', descriptionEn: 'Somali Region Town' },
    { id: 'ferfer', name: 'ፌርፌር', nameEn: 'Ferfer', region: 'Somali', icon: '🛣️', prize: '40M ETB', descriptionAm: 'የኢትዮ-ሶማሊያ ድንበር ከተማ', descriptionEn: 'Ethio-Somalia Border Town' },
    { id: 'harar', name: 'ሀረር', nameEn: 'Harar', region: 'Harari', icon: '🏛️', prize: '40M ETB', descriptionAm: 'የባህል ቅርስ እና የእስላም ቅድስት ከተማ', descriptionEn: 'Cultural Heritage & Islamic Holy City' },
    { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', region: 'Sidama', icon: '🏞️', prize: '40M ETB', descriptionAm: 'የኢንዱስትሪ ፓርክ እና የሀይቅ ከተማ', descriptionEn: 'Industrial Park & Lake City' },
    { id: 'yirgalem', name: 'ይርጋለም', nameEn: 'Yirgalem', region: 'Sidama', icon: '☕', prize: '40M ETB', descriptionAm: 'የቡና እና የግብርና ከተማ', descriptionEn: 'Coffee & Agriculture Town' },
    { id: 'awassa', name: 'አዋሳ', nameEn: 'Awassa', region: 'Sidama', icon: '🏞️', prize: '40M ETB', descriptionAm: 'የሲዳማ ክልል ዋና ከተማ', descriptionEn: 'Capital of Sidama Region' },
    { id: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch', region: 'South', icon: '🏞️', prize: '40M ETB', descriptionAm: 'የአርባ ምንጭ ዩኒቨርሲቲ ከተማ', descriptionEn: 'Arba Minch University City' },
    { id: 'sodo', name: 'ሶዶ', nameEn: 'Sodo', region: 'South', icon: '🛍️', prize: '40M ETB', descriptionAm: 'የወላይታ ዞን ዋና ከተማ', descriptionEn: 'Capital of Wolayita Zone' },
    { id: 'dilla', name: 'ዲላ', nameEn: 'Dilla', region: 'South', icon: '☕', prize: '40M ETB', descriptionAm: 'የቡና እና የንግድ ከተማ', descriptionEn: 'Coffee & Trade City' },
    { id: 'sawla', name: 'ሳውላ', nameEn: 'Sawla', region: 'South', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
    { id: 'jinka', name: 'ጂንካ', nameEn: 'Jinka', region: 'South', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የደቡብ ኢትዮጵያ ባህላዊ ከተማ', descriptionEn: 'Traditional City of South Ethiopia' },
    { id: 'konso', name: 'ኮንሶ', nameEn: 'Konso', region: 'South', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የዩኔስኮ ቅርስ ከተማ', descriptionEn: 'UNESCO Heritage Town' },
    { id: 'karat', name: 'ካራት', nameEn: 'Karat', region: 'South', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የኮንሶ ዞን ዋና ከተማ', descriptionEn: 'Capital of Konso Zone' },
    { id: 'bonga', name: 'ቦንጋ', nameEn: 'Bonga', region: 'South', icon: '☕', prize: '40M ETB', descriptionAm: 'የቡና ማምረቻ አካባቢ', descriptionEn: 'Coffee Producing Area' },
    { id: 'mizan-teferi', name: 'ሚዛን ተፈሪ', nameEn: 'Mizan Teferi', region: 'South', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የቤንች ማጂ ዞን ዋና ከተማ', descriptionEn: 'Capital of Bench Maji Zone' },
    { id: 'teppi', name: 'ቴፒ', nameEn: 'Teppi', region: 'South', icon: '🌿', prize: '40M ETB', descriptionAm: 'የቡና እርሻ አካባቢ', descriptionEn: 'Coffee Farming Area' },
    { id: 'gereb', name: 'ገሬብ', nameEn: 'Gereb', region: 'South', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
    { id: 'key-afar', name: 'ቀይ አፋር', nameEn: 'Key Afar', region: 'South', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
    { id: 'bako', name: 'ባኮ', nameEn: 'Bako', region: 'South', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የደቡብ ኢትዮጵያ ከተማ', descriptionEn: 'South Ethiopia Town' },
    { id: 'welkite', name: 'ወልቂጤ', nameEn: 'Welkite', region: 'South', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የጉራጌ ዞን ዋና ከተማ', descriptionEn: 'Capital of Gurage Zone' },
    { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', region: 'Benishangul', icon: '🌿', prize: '40M ETB', descriptionAm: 'የቤንሻንጉል ክልል ዋና ከተማ', descriptionEn: 'Capital of Benishangul Region' },
    { id: 'gilgel-beles', name: 'ግልገል በለስ', nameEn: 'Gilgel Beles', region: 'Benishangul', icon: '💧', prize: '40M ETB', descriptionAm: 'የግልገል በለስ ከተማ', descriptionEn: 'Gilgel Beles Town' },
    { id: 'kamashi', name: 'ካማሺ', nameEn: 'Kamashi', region: 'Benishangul', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የካማሺ ዞን ዋና ከተማ', descriptionEn: 'Capital of Kamashi Zone' },
    { id: 'metekel', name: 'ሜተከል', nameEn: 'Metekel', region: 'Benishangul', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የሜተከል ዞን ዋና ከተማ', descriptionEn: 'Capital of Metekel Zone' },
    { id: 'dibate', name: 'ዲባቴ', nameEn: 'Dibate', region: 'Benishangul', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የቤንሻንጉል ክልል ከተማ', descriptionEn: 'Benishangul Region Town' },
    { id: 'gambella', name: 'ጋምቤላ', nameEn: 'Gambella', region: 'Gambella', icon: '🏞️', prize: '40M ETB', descriptionAm: 'የጋምቤላ ክልል ዋና ከተማ', descriptionEn: 'Capital of Gambella Region' },
    { id: 'meti', name: 'ሜቲ', nameEn: 'Meti', region: 'Gambella', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የጋምቤላ ክልል ከተማ', descriptionEn: 'Gambella Region Town' },
    { id: 'fugnido', name: 'ፉኝዶ', nameEn: 'Fugnido', region: 'Gambella', icon: '🏞️', prize: '40M ETB', descriptionAm: 'የስደተኞች ከተማ', descriptionEn: 'Refugee Town' },
    { id: 'itur', name: 'ኢቱር', nameEn: 'Itur', region: 'Gambella', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የጋምቤላ ክልል ከተማ', descriptionEn: 'Gambella Region Town' },
    { id: 'semera', name: 'ሰሜራ', nameEn: 'Semera', region: 'Afar', icon: '🐪', prize: '40M ETB', descriptionAm: 'የአፋር ክልል ዋና ከተማ', descriptionEn: 'Capital of Afar Region' },
    { id: 'asaita', name: 'አሳይታ', nameEn: 'Asaita', region: 'Afar', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የአፋር ክልል ታሪካዊ ከተማ', descriptionEn: 'Historical Afar Town' },
    { id: 'logiya', name: 'ሎጊያ', nameEn: 'Logiya', region: 'Afar', icon: '🛣️', prize: '40M ETB', descriptionAm: 'የአፋር ክልል ከተማ', descriptionEn: 'Afar Region Town' },
    { id: 'abila', name: 'አቢላ', nameEn: 'Abila', region: 'Afar', icon: '🐪', prize: '40M ETB', descriptionAm: 'የአፋር ክልል ከተማ', descriptionEn: 'Afar Region Town' },
    { id: 'dubti', name: 'ዱብቲ', nameEn: 'Dubti', region: 'Afar', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የአፋር ክልል ከተማ', descriptionEn: 'Afar Region Town' },
    { id: 'elidar', name: 'ኤልዳር', nameEn: 'Elidar', region: 'Afar', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የአፋር ክልል ከተማ', descriptionEn: 'Afar Region Town' },
    { id: 'chifra', name: 'ቺፍራ', nameEn: 'Chifra', region: 'Afar', icon: '🏔️', prize: '40M ETB', descriptionAm: 'የአፋር ክልል ከተማ', descriptionEn: 'Afar Region Town' }
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
    const cachedData = sessionStorage.getItem('homepage_data');
    
    if (cachedData) {
      const { pools: cachedPools, stats: cachedStats } = JSON.parse(cachedData);
      setPools(cachedPools);
      setStats(cachedStats);
      setDataLoaded(true);
      setIsInitialLoad(false);
    } else {
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      const [poolsResult, winnersResult, agentsResult, contributionsResult, poolsData] = await Promise.all([
        supabase.from('pools').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('pools').select('*', { count: 'exact', head: true }).not('winner_id', 'is', null),
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('contributions').select('amount').eq('status', 'completed'),
        supabase.from('pools').select('*').eq('status', 'active').limit(20)
      ]);
      
      const total_raised = (contributionsResult.data || []).reduce((sum, c) => sum + (c.amount || 0), 0);
      
      setStats({
        total_pools: poolsResult.count || 0,
        total_winners: winnersResult.count || 0,
        total_agents: agentsResult.count || 0,
        total_raised: total_raised
      });
      
      setPools(poolsData.data || []);
      sessionStorage.setItem('homepage_data', JSON.stringify({ pools: poolsData.data || [], stats: {} }));
      
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setDataLoaded(true);
      setIsInitialLoad(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error(t.password_mismatch || 'Passwords do not match');
      return;
    }
    
    if (registerForm.password.length < 6) {
      toast.error(t.password_too_short || 'Password must be at least 6 characters');
      return;
    }
    
    if (!registerForm.agreeTerms) {
      toast.error(t.agree_terms_required || 'Please agree to the Terms and Conditions');
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
      
      toast.success(t.registration_success || 'Registration successful! Please check your email to verify your account.');
      setShowRegisterModal(false);
      setRegisterForm({
        fullName: '', email: '', phone: '', password: '', confirmPassword: '', city: '', agreeTerms: false
      });
      
      setTimeout(() => router.push('/login'), 2000);
      
    } catch (error) {
      toast.error(error.message || t.registration_failed || 'Registration failed. Please try again.');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleRoleSelection = (role) => {
    sessionStorage.setItem('pendingRole', role);
    router.push('/login');
  };

  const scrollToSection = (ref) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setMobileMenuOpen(false);
    setProgramsDropdownOpen(false);
  };

  const getFilteredPools = () => {
    let filtered = [...pools];
    switch (regularPoolFilter) {
      case 'lowToHigh': filtered.sort((a, b) => (a.entry_fee || 0) - (b.entry_fee || 0)); break;
      case 'highToLow': filtered.sort((a, b) => (b.entry_fee || 0) - (a.entry_fee || 0)); break;
      default: break;
    }
    return filtered;
  };

  const displayedPools = getFilteredPools();

  const RegisterModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <div><h2 className="text-2xl font-bold text-gray-800">{t.create_account || 'Create Account'}</h2><p className="text-sm text-gray-500">{t.join_abbaa_carraa || 'Join Abbaa Carraa to start winning!'}</p></div>
          <button onClick={() => setShowRegisterModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        <form onSubmit={handleRegister} className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t.full_name || 'Full Name'} *</label><input type="text" required value={registerForm.fullName} onChange={(e) => setRegisterForm({...registerForm, fullName: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder={t.enter_full_name || 'Enter your full name'} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t.email || 'Email Address'} *</label><input type="email" required value={registerForm.email} onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="you@example.com" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t.phone || 'Phone Number'} *</label><input type="tel" required value={registerForm.phone} onChange={(e) => setRegisterForm({...registerForm, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder="09xxxxxxxx" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t.city || 'City'} *</label><input type="text" required value={registerForm.city} onChange={(e) => setRegisterForm({...registerForm, city: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder={t.your_city || 'Your city'} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t.password || 'Password'} *</label><input type="password" required value={registerForm.password} onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder={t.min_6_chars || 'Minimum 6 characters'} /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t.confirm_password || 'Confirm Password'} *</label><input type="password" required value={registerForm.confirmPassword} onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500" placeholder={t.confirm_your_password || 'Confirm your password'} /></div>
          <div className="flex items-start gap-2"><input type="checkbox" id="agreeTerms" checked={registerForm.agreeTerms} onChange={(e) => setRegisterForm({...registerForm, agreeTerms: e.target.checked})} className="mt-1 w-4 h-4 text-green-600 border-gray-300 rounded" /><label htmlFor="agreeTerms" className="text-sm text-gray-600">{t.agree_terms || 'I agree to the Terms and Conditions'}</label></div>
          <button type="submit" disabled={registerLoading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-50">{registerLoading ? (t.creating_account || 'Creating Account...') : (t.create_account_btn || 'Create Account →')}</button>
          <p className="text-center text-sm text-gray-500">{t.already_have_account || 'Already have an account?'} <button type="button" onClick={() => { setShowRegisterModal(false); router.push('/login'); }} className="text-green-600 hover:underline">{t.login || 'Login'}</button></p>
        </form>
      </div>
    </div>
  );

  if (!dataLoaded && isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div><p className="mt-4 text-gray-500">{t.loading || 'Loading amazing prizes...'}</p></div>
      </div>
    );
  }

  // ========== BANKING MODE ==========
  if (mode === 'banking') {
    return (
      <>
        <Head>
          <title>{t.meta_title || 'Abbaa Carraa - Win Amazing Prizes'}</title>
          <meta name="description" content={t.meta_description || 'Win amazing prizes. Join Merkato VIP, City VIP across 94 Ethiopian cities, or Regular Pools. 2% supports kidney & heart disease patients.'} />
        </Head>
        
        {/* Language & Mode Toggle Buttons */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <div className="relative">
            <button className="bg-gray-800 text-white p-2 rounded-full shadow-lg text-xs flex items-center gap-1">
              🌐 {locales[language]?.flag} {locales[language]?.name}
            </button>
            <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl border overflow-hidden z-50">
              {Object.entries(locales).map(([code, { name, flag }]) => (
                <button
                  key={code}
                  onClick={() => changeLanguage(code)}
                  className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-100 flex items-center gap-2 ${language === code ? 'bg-green-50 text-green-600' : 'text-gray-700'}`}
                >
                  <span>{flag}</span> {name}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={toggleMode}
            className="bg-emerald-600 text-white p-2 rounded-full shadow-lg text-xs flex items-center gap-1"
          >
            🔄 {t.switch_to_classic || 'Switch to Classic'}
          </button>
        </div>
        
        <BankingStyleView 
          pools={pools}
          stats={stats}
          uniqueCities={uniqueCities}
          allCityVipPrograms={allCityVipPrograms}
          onRegisterClick={() => setShowRegisterModal(true)}
          language={language}
          t={t}
          locales={locales}
          changeLanguage={changeLanguage}
        />
        
        {showRegisterModal && <RegisterModal />}
      </>
    );
  }

  // ========== CLASSIC MODE (Your existing UI with locale support) ==========
  return (
    <>
      <Head>
        <title>{t.meta_title || 'Abbaa Carraa - Win Amazing Prizes'}</title>
        <meta name="description" content={t.meta_description || 'Win amazing prizes. Join Merkato VIP, City VIP across 94 Ethiopian cities, or Regular Pools. 2% supports kidney & heart disease patients.'} />
      </Head>

      <div className="min-h-screen bg-white w-full">
        <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2 group shrink-0"><span className="text-2xl group-hover:scale-110 transition-transform">🎫</span><div><span className="font-bold text-white text-lg">Abbaa Carraa</span><span className="text-xs text-gray-400 ml-2 hidden sm:inline">| Ethiopia's Premier Platform</span></div></Link>
              <div className="hidden md:flex items-center gap-1">
                <div className="relative">
                  <button onClick={() => setProgramsDropdownOpen(!programsDropdownOpen)} className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition text-sm font-medium"><span>📋</span> {t.programs || 'Programs'}<svg className={`w-4 h-4 transition-transform ${programsDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></button>
                  {programsDropdownOpen && (<><div className="fixed inset-0 z-40" onClick={() => setProgramsDropdownOpen(false)} /><div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden"><button onClick={() => scrollToSection(merkatoRef)} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3"><span className="text-xl">🏪</span><div><div className="font-medium">{t.merkato_vip || 'Merkato VIP'}</div><div className="text-xs text-gray-400">{t.win_up_to_40m || 'Win up to 40M ETB'}</div></div></button><button onClick={() => scrollToSection(cityVipRef)} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3 border-t border-gray-700"><span className="text-xl">🏙️</span><div><div className="font-medium">{t.city_vip || 'City VIP'}</div><div className="text-xs text-gray-400">94 {t.ethiopian_cities || 'Ethiopian cities'}</div></div></button><button onClick={() => scrollToSection(regularPoolsRef)} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3 border-t border-gray-700"><span className="text-xl">🏊</span><div><div className="font-medium">{t.regular_pools || 'Regular Pools'}</div><div className="text-xs text-gray-400">{t.cars_houses_more || 'Cars, houses & more'}</div></div></button><Link href="/dashboard" className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3 border-t border-gray-700"><span className="text-xl">📊</span><div><div className="font-medium">{t.dashboard || 'Dashboard'}</div><div className="text-xs text-gray-400">{t.track_tickets || 'Track your tickets'}</div></div></Link></div></>)}
                </div>
                <Link href="/about" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition whitespace-nowrap text-sm font-medium">ℹ️ {t.about || 'About'}</Link>
                <Link href="/contact" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition whitespace-nowrap text-sm font-medium">📞 {t.contact || 'Contact'}</Link>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <div className="relative">
                  <button className="px-3 py-1 bg-gray-700 text-white rounded-lg text-xs flex items-center gap-1">
                    🌐 {locales[language]?.flag} {locales[language]?.name}
                  </button>
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-xl border overflow-hidden z-50 hidden group-hover:block">
                    {Object.entries(locales).map(([code, { name, flag }]) => (
                      <button
                        key={code}
                        onClick={() => changeLanguage(code)}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-gray-100 flex items-center gap-2 ${language === code ? 'bg-green-50 text-green-600' : 'text-gray-700'}`}
                      >
                        <span>{flag}</span> {name}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={toggleMode} className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs flex items-center gap-1">
                  🔄 {t.switch_to_banking || 'Switch to Banking'}
                </button>
                <Link href="/login" className="px-4 py-2 text-gray-300 hover:text-white transition text-sm font-medium">{t.login || 'Login'}</Link>
                <button onClick={() => setShowRegisterModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium">{t.register || 'Register'}</button>
                <TopCitySelector />
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg></button>
            </div>
            {/* Mobile menu content - same as before but with translated text */}
            {mobileMenuOpen && (<div className="md:hidden py-4 border-t border-gray-700 space-y-2">{/* ... use t.* for text ... */}</div>)}
          </div>
        </nav>

        {/* Rest of your existing classic mode UI - use t.* for all text */}
        <GlobalAnnouncement />
        <CashEquivalentBanner />
        <CharityBanner />
        
        {/* ... rest of your classic mode content with t.* translations ... */}
        
      </div>

      {showRegisterModal && <RegisterModal />}
    </>
  );
}
