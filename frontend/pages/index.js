// pages/index.js - Three-Mode Modern Homepage (App | Classic | Banking) - WITH MOVING MARQUEE
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
  const [regularPoolFilter, setRegularPoolFilter] = useState('all');
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
  const marqueeRef = useRef(null);

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

  // ALL 94 ETHIOPIAN CITIES - Complete list
  const allCityVipPrograms = [
    { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', region: 'Central', icon: '🏙️', prize: '40M ETB' },
    { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', region: 'Oromia', icon: '🏗️', prize: '40M ETB' },
    { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', region: 'Dire Dawa', icon: '🚂', prize: '40M ETB' },
    { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', region: 'Tigray', icon: '🏭', prize: '40M ETB' },
    { id: 'axum', name: 'አክሱም', nameEn: 'Axum', region: 'Tigray', icon: '🏛️', prize: '40M ETB' },
    { id: 'adigrat', name: 'አዲግራት', nameEn: 'Adigrat', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
    { id: 'shire', name: 'ሽሬ', nameEn: 'Shire', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
    { id: 'mekoni', name: 'መቆኒ', nameEn: 'Mekoni', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
    { id: 'maychew', name: 'ማይጨው', nameEn: 'Maychew', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
    { id: 'abiy-addi', name: 'አቢይ አዲ', nameEn: 'Abiy Addi', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
    { id: 'wukro', name: 'ውቅሮ', nameEn: 'Wukro', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
    { id: 'gondar', name: 'ጎንደር', nameEn: 'Gondar', region: 'Amhara', icon: '🏰', prize: '40M ETB' },
    { id: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar', region: 'Amhara', icon: '🏞️', prize: '40M ETB' },
    { id: 'dessie', name: 'ደሴ', nameEn: 'Dessie', region: 'Amhara', icon: '🏔️', prize: '40M ETB' },
    { id: 'debre-markos', name: 'ደብረ ማርቆስ', nameEn: 'Debre Markos', region: 'Amhara', icon: '⛪', prize: '40M ETB' },
    { id: 'finote-selam', name: 'ፍኖተ ሰላም', nameEn: 'Finote Selam', region: 'Amhara', icon: '🌅', prize: '40M ETB' },
    { id: 'woldia', name: 'ወልዲያ', nameEn: 'Woldia', region: 'Amhara', icon: '🎓', prize: '40M ETB' },
    { id: 'debre-birhan', name: 'ደብረ ብርሃን', nameEn: 'Debre Birhan', region: 'Amhara', icon: '⭐', prize: '40M ETB' },
    { id: 'kombolcha', name: 'ኮምቦልቻ', nameEn: 'Kombolcha', region: 'Amhara', icon: '🏭', prize: '40M ETB' },
    { id: 'sekota', name: 'ሰቆጣ', nameEn: 'Sekota', region: 'Amhara', icon: '🏔️', prize: '40M ETB' },
    { id: 'aykal', name: 'አይከል', nameEn: 'Aykal', region: 'Amhara', icon: '🏔️', prize: '40M ETB' },
    { id: 'metema', name: 'ሜተማ', nameEn: 'Metema', region: 'Amhara', icon: '🛣️', prize: '40M ETB' },
    { id: 'debre-tabor', name: 'ደብረ ታቦር', nameEn: 'Debre Tabor', region: 'Amhara', icon: '⛪', prize: '40M ETB' },
    { id: 'bati', name: 'ባቲ', nameEn: 'Bati', region: 'Amhara', icon: '🏔️', prize: '40M ETB' },
    { id: 'kemise', name: 'ቀሚሴ', nameEn: 'Kemise', region: 'Amhara', icon: '🏔️', prize: '40M ETB' },
    { id: 'injibara', name: 'እንጅባራ', nameEn: 'Injibara', region: 'Amhara', icon: '🏔️', prize: '40M ETB' },
    { id: 'lalibela', name: 'ላሊበላ', nameEn: 'Lalibela', region: 'Amhara', icon: '⛪', prize: '40M ETB' },
    { id: 'adama', name: 'አዳማ', nameEn: 'Adama', region: 'Oromia', icon: '🏭', prize: '40M ETB' },
    { id: 'jimma', name: 'ጅማ', nameEn: 'Jimma', region: 'Oromia', icon: '☕', prize: '40M ETB' },
    { id: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu', region: 'Oromia', icon: '✈️', prize: '40M ETB' },
    { id: 'asella', name: 'አሰላ', nameEn: 'Asella', region: 'Oromia', icon: '🏔️', prize: '40M ETB' },
    { id: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene', region: 'Oromia', icon: '🛍️', prize: '40M ETB' },
    { id: 'robe', name: 'ሮቤ', nameEn: 'Robe', region: 'Oromia', icon: '🌄', prize: '40M ETB' },
    { id: 'ginir', name: 'ጊኒር', nameEn: 'Ginir', region: 'Oromia', icon: '🏞️', prize: '40M ETB' },
    { id: 'yabelo', name: 'ያቤሎ', nameEn: 'Yabelo', region: 'Oromia', icon: '🐪', prize: '40M ETB' },
    { id: 'moyale', name: 'ሞያሌ', nameEn: 'Moyale', region: 'Oromia', icon: '🛣️', prize: '40M ETB' },
    { id: 'chiro', name: 'ቺሮ', nameEn: 'Chiro', region: 'Oromia', icon: '🏔️', prize: '40M ETB' },
    { id: 'fiche', name: 'ፊጬ', nameEn: 'Fiche', region: 'Oromia', icon: '🌾', prize: '40M ETB' },
    { id: 'woliso', name: 'ወሊሶ', nameEn: 'Woliso', region: 'Oromia', icon: '💧', prize: '40M ETB' },
    { id: 'ambo', name: 'አምቦ', nameEn: 'Ambo', region: 'Oromia', icon: '💧', prize: '40M ETB' },
    { id: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte', region: 'Oromia', icon: '☕', prize: '40M ETB' },
    { id: 'gimbi', name: 'ጊምቢ', nameEn: 'Gimbi', region: 'Oromia', icon: '🏔️', prize: '40M ETB' },
    { id: 'dembi-dollo', name: 'ደምቢ ዶሎ', nameEn: 'Dembi Dollo', region: 'Oromia', icon: '💰', prize: '40M ETB' },
    { id: 'shambu', name: 'ሻምቡ', nameEn: 'Shambu', region: 'Oromia', icon: '🌾', prize: '40M ETB' },
    { id: 'metu', name: 'መቱ', nameEn: 'Metu', region: 'Oromia', icon: '🌿', prize: '40M ETB' },
    { id: 'bedele', name: 'በደሌ', nameEn: 'Bedele', region: 'Oromia', icon: '🍺', prize: '40M ETB' },
    { id: 'bule-hora', name: 'ቡሌ ሆራ', nameEn: 'Bule Hora', region: 'Oromia', icon: '🎓', prize: '40M ETB' },
    { id: 'negele-borana', name: 'ነገሌ ቦረና', nameEn: 'Negele Borana', region: 'Oromia', icon: '🐪', prize: '40M ETB' },
    { id: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway', region: 'Oromia', icon: '🐟', prize: '40M ETB' },
    { id: 'mojo', name: 'ሞጆ', nameEn: 'Mojo', region: 'Oromia', icon: '🚛', prize: '40M ETB' },
    { id: 'dodola', name: 'ዶዶላ', nameEn: 'Dodola', region: 'Oromia', icon: '🏔️', prize: '40M ETB' },
    { id: 'gera', name: 'ጌራ', nameEn: 'Gera', region: 'Oromia', icon: '☕', prize: '40M ETB' },
    { id: 'agaro', name: 'አጋሮ', nameEn: 'Agaro', region: 'Oromia', icon: '☕', prize: '40M ETB' },
    { id: 'lemu', name: 'ለሙ', nameEn: 'Lemu', region: 'Oromia', icon: '🌾', prize: '40M ETB' },
    { id: 'hagere-mariam', name: 'ሀገረ ማርያም', nameEn: 'Hagere Mariam', region: 'Oromia', icon: '🏔️', prize: '40M ETB' },
    { id: 'shakiso', name: 'ሻኪሶ', nameEn: 'Shakiso', region: 'Oromia', icon: '💰', prize: '40M ETB' },
    { id: 'kibre-mengist', name: 'ቅብረ መንግስት', nameEn: 'Kibre Mengist', region: 'Oromia', icon: '🏔️', prize: '40M ETB' },
    { id: 'wachile', name: 'ዋቺሌ', nameEn: 'Wachile', region: 'Oromia', icon: '🐪', prize: '40M ETB' },
    { id: 'goba', name: 'ጎባ', nameEn: 'Goba', region: 'Oromia', icon: '🏔️', prize: '40M ETB' },
    { id: 'sinana', name: 'ሲናና', nameEn: 'Sinana', region: 'Oromia', icon: '🌾', prize: '40M ETB' },
    { id: 'dinsho', name: 'ዲንሾ', nameEn: 'Dinsho', region: 'Oromia', icon: '🏞️', prize: '40M ETB' },
    { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', region: 'Somali', icon: '🐪', prize: '40M ETB' },
    { id: 'degehabur', name: 'ደገሃቡር', nameEn: 'Degehabur', region: 'Somali', icon: '🏔️', prize: '40M ETB' },
    { id: 'kebri-dehar', name: 'ቀብሪ ደሃር', nameEn: 'Kebri Dehar', region: 'Somali', icon: '🏔️', prize: '40M ETB' },
    { id: 'gode', name: 'ጎዴ', nameEn: 'Gode', region: 'Somali', icon: '🏔️', prize: '40M ETB' },
    { id: 'warder', name: 'ዋርደር', nameEn: 'Warder', region: 'Somali', icon: '🐪', prize: '40M ETB' },
    { id: 'shilabo', name: 'ሺላቦ', nameEn: 'Shilabo', region: 'Somali', icon: '🐪', prize: '40M ETB' },
    { id: 'kelafo', name: 'ከላፎ', nameEn: 'Kelafo', region: 'Somali', icon: '🏔️', prize: '40M ETB' },
    { id: 'mustahil', name: 'ሙስታሂል', nameEn: 'Mustahil', region: 'Somali', icon: '🏔️', prize: '40M ETB' },
    { id: 'ferfer', name: 'ፌርፌር', nameEn: 'Ferfer', region: 'Somali', icon: '🛣️', prize: '40M ETB' },
    { id: 'harar', name: 'ሀረር', nameEn: 'Harar', region: 'Harari', icon: '🏛️', prize: '40M ETB' },
    { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', region: 'Sidama', icon: '🏞️', prize: '40M ETB' },
    { id: 'yirgalem', name: 'ይርጋለም', nameEn: 'Yirgalem', region: 'Sidama', icon: '☕', prize: '40M ETB' },
    { id: 'awassa', name: 'አዋሳ', nameEn: 'Awassa', region: 'Sidama', icon: '🏞️', prize: '40M ETB' },
    { id: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch', region: 'South', icon: '🏞️', prize: '40M ETB' },
    { id: 'sodo', name: 'ሶዶ', nameEn: 'Sodo', region: 'South', icon: '🛍️', prize: '40M ETB' },
    { id: 'dilla', name: 'ዲላ', nameEn: 'Dilla', region: 'South', icon: '☕', prize: '40M ETB' },
    { id: 'sawla', name: 'ሳውላ', nameEn: 'Sawla', region: 'South', icon: '🏔️', prize: '40M ETB' },
    { id: 'jinka', name: 'ጂንካ', nameEn: 'Jinka', region: 'South', icon: '🏔️', prize: '40M ETB' },
    { id: 'konso', name: 'ኮንሶ', nameEn: 'Konso', region: 'South', icon: '🏔️', prize: '40M ETB' },
    { id: 'karat', name: 'ካራት', nameEn: 'Karat', region: 'South', icon: '🏔️', prize: '40M ETB' },
    { id: 'bonga', name: 'ቦንጋ', nameEn: 'Bonga', region: 'South', icon: '☕', prize: '40M ETB' },
    { id: 'mizan-teferi', name: 'ሚዛን ተፈሪ', nameEn: 'Mizan Teferi', region: 'South', icon: '🏔️', prize: '40M ETB' },
    { id: 'teppi', name: 'ቴፒ', nameEn: 'Teppi', region: 'South', icon: '🌿', prize: '40M ETB' },
    { id: 'gereb', name: 'ገሬብ', nameEn: 'Gereb', region: 'South', icon: '🏔️', prize: '40M ETB' },
    { id: 'key-afar', name: 'ቀይ አፋር', nameEn: 'Key Afar', region: 'South', icon: '🏔️', prize: '40M ETB' },
    { id: 'bako', name: 'ባኮ', nameEn: 'Bako', region: 'South', icon: '🏔️', prize: '40M ETB' },
    { id: 'welkite', name: 'ወልቂጤ', nameEn: 'Welkite', region: 'South', icon: '🏔️', prize: '40M ETB' },
    { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', region: 'Benishangul', icon: '🌿', prize: '40M ETB' },
    { id: 'gilgel-beles', name: 'ግልገል በለስ', nameEn: 'Gilgel Beles', region: 'Benishangul', icon: '💧', prize: '40M ETB' },
    { id: 'kamashi', name: 'ካማሺ', nameEn: 'Kamashi', region: 'Benishangul', icon: '🏔️', prize: '40M ETB' },
    { id: 'metekel', name: 'ሜተከል', nameEn: 'Metekel', region: 'Benishangul', icon: '🏔️', prize: '40M ETB' },
    { id: 'dibate', name: 'ዲባቴ', nameEn: 'Dibate', region: 'Benishangul', icon: '🏔️', prize: '40M ETB' },
    { id: 'gambella', name: 'ጋምቤላ', nameEn: 'Gambella', region: 'Gambella', icon: '🏞️', prize: '40M ETB' },
    { id: 'meti', name: 'ሜቲ', nameEn: 'Meti', region: 'Gambella', icon: '🏔️', prize: '40M ETB' },
    { id: 'fugnido', name: 'ፉኝዶ', nameEn: 'Fugnido', region: 'Gambella', icon: '🏞️', prize: '40M ETB' },
    { id: 'itur', name: 'ኢቱር', nameEn: 'Itur', region: 'Gambella', icon: '🏔️', prize: '40M ETB' },
    { id: 'semera', name: 'ሰሜራ', nameEn: 'Semera', region: 'Afar', icon: '🐪', prize: '40M ETB' },
    { id: 'asaita', name: 'አሳይታ', nameEn: 'Asaita', region: 'Afar', icon: '🏔️', prize: '40M ETB' },
    { id: 'logiya', name: 'ሎጊያ', nameEn: 'Logiya', region: 'Afar', icon: '🛣️', prize: '40M ETB' },
    { id: 'abila', name: 'አቢላ', nameEn: 'Abila', region: 'Afar', icon: '🐪', prize: '40M ETB' },
    { id: 'dubti', name: 'ዱብቲ', nameEn: 'Dubti', region: 'Afar', icon: '🏔️', prize: '40M ETB' },
    { id: 'elidar', name: 'ኤልዳር', nameEn: 'Elidar', region: 'Afar', icon: '🏔️', prize: '40M ETB' },
    { id: 'chifra', name: 'ቺፍራ', nameEn: 'Chifra', region: 'Afar', icon: '🏔️', prize: '40M ETB' }
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

  // ========== MOVING MARQUEE COMPONENT ==========
  const MovingMarquee = () => {
    const marqueeText = `🏆 WIN BIG WITH ABBAA CARRAA • 🏪 Merkato VIP: Win Cash up to 40M ETB • 🏙️ City VIP: Win Cash in 94 Cities • 🏊 Regular Pools: Win Cars, Houses, Machinery & Electronics • 💚 2% Supports Health • Join & Start Winning Today! 🎯`;

    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-teal-600 py-3 px-4 shadow-inner">
        <div 
          className="whitespace-nowrap animate-marquee hover:animation-pause"
          style={{
            display: 'inline-block',
            animation: 'marquee 30s linear infinite',
          }}
        >
          <span className="text-white font-semibold text-sm md:text-base tracking-wide">
            {marqueeText}
          </span>
        </div>
        <style jsx>{`
          @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-marquee {
            animation: marquee 30s linear infinite;
          }
          .hover\\:animation-pause:hover {
            animation-play-state: paused;
          }
        `}</style>
      </div>
    );
  };

  // ========== MODE SWITCHER ==========
  const ModeSwitcher = () => (
    <div className="fixed top-4 right-4 z-50 flex gap-1 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-gray-200 p-1">
      <button 
        onClick={() => { setActiveView('app'); }} 
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${activeView === 'app' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        📱 App
      </button>
      <button 
        onClick={() => { setActiveView('classic'); }} 
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${activeView === 'classic' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        🖥️ Classic
      </button>
      <button 
        onClick={() => { setActiveView('banking'); }} 
        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${activeView === 'banking' ? 'bg-green-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
      >
        🏦 Banking
      </button>
      <button onClick={toggleLanguage} className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-600 hover:bg-gray-100 transition">
        {language === 'am' ? '🇬🇧' : '🇪🇹'}
      </button>
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
        
        <ModeSwitcher />
        
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

  // ========== APP MODE (Mobile App Style) ==========
  if (activeView === 'app') {
    return (
      <>
        <Head>
          <title>Abbaa Carraa - Win Amazing Prizes</title>
          <meta name="description" content="Win amazing prizes. Join Merkato VIP, City VIP across 94 Ethiopian cities, or Regular Pools." />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </Head>

        <div className="min-h-screen bg-gray-50 pb-20">
          <ModeSwitcher />

          {/* TOP APP BAR - No overlap */}
          <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎫</span>
                <span className="font-bold text-lg text-gray-800">Abbaa Carraa</span>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-xs bg-gray-100 px-3 py-1.5 rounded-full text-gray-700 hover:bg-gray-200 transition font-medium">
                  Login
                </Link>
                <button onClick={() => setShowRegisterModal(true)} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-full hover:bg-green-700 transition font-medium">
                  Register
                </button>
                <button className="relative p-1">
                  <span className="text-xl">🔔</span>
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">3</span>
                </button>
                <Link href="/profile" className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  U
                </Link>
              </div>
            </div>
          </header>

          {/* MOVING MARQUEE - Full width, no overlap */}
          <MovingMarquee />

          {/* WELCOME SECTION */}
          <div className="px-4 py-4 bg-white border-b border-gray-100">
            <p className="text-sm text-gray-500">Welcome back,</p>
            <p className="text-xl font-bold text-gray-800">Guest</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">⭐ {stats.total_pools} Active Pools</span>
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">🏆 {stats.total_winners} Winners</span>
              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">🏙️ {uniqueCities.length} Cities</span>
            </div>
          </div>

          {/* QUICK STATS */}
          <div className="grid grid-cols-3 gap-3 px-4 py-4">
            <div className="bg-white rounded-xl shadow-sm p-3 text-center border border-gray-100">
              <div className="text-2xl mb-1">💰</div>
              <div className="font-bold text-gray-800">{counterInView ? <CountUp start={0} end={Math.floor(stats.total_raised / 1000)} duration={2} separator="," /> : '0'}K+</div>
              <div className="text-[10px] text-gray-400">Total Raised</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center border border-gray-100">
              <div className="text-2xl mb-1">🎯</div>
              <div className="font-bold text-gray-800">{stats.total_pools}</div>
              <div className="text-[10px] text-gray-400">Active Pools</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 text-center border border-gray-100">
              <div className="text-2xl mb-1">🏆</div>
              <div className="font-bold text-gray-800">{stats.total_winners}</div>
              <div className="text-[10px] text-gray-400">Winners</div>
            </div>
          </div>

          {/* CATEGORY GRID */}
          <div className="px-4 py-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Explore</h2>
            <div className="grid grid-cols-4 gap-4">
              <Link href="/listings" className="flex flex-col items-center bg-white rounded-2xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
                <span className="text-3xl mb-1">🏊</span>
                <span className="text-xs font-medium text-gray-700">Regular Pools</span>
                <span className="text-[8px] text-gray-400 mt-0.5">Cars • Houses</span>
              </Link>
              <Link href="/merkato-vip" className="flex flex-col items-center bg-white rounded-2xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
                <span className="text-3xl mb-1">🏪</span>
                <span className="text-xs font-medium text-gray-700">Merkato VIP</span>
                <span className="text-[8px] text-gray-400 mt-0.5">Cash up to 40M</span>
              </Link>
              <button onClick={() => setShowCityDropdown(!showCityDropdown)} className="flex flex-col items-center bg-white rounded-2xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition relative">
                <span className="text-3xl mb-1">🏙️</span>
                <span className="text-xs font-medium text-gray-700">City VIP</span>
                <span className="text-[8px] text-gray-400 mt-0.5">94 Cities • Cash</span>
                {showCityDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="p-3 bg-gray-50 border-b">
                      <input type="text" placeholder="🔍 Search city..." value={citySearchTerm} onChange={(e) => setCitySearchTerm(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" autoFocus />
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {filteredCityList.slice(0, 15).map(city => (
                        <Link key={city.id} href={`/cities/${city.id}`} className="block px-4 py-2 hover:bg-gray-50 transition border-b last:border-0 text-left">
                          <div className="flex items-center gap-2">
                            <span>{city.icon}</span>
                            <span className="text-sm font-medium text-gray-800">{city.name}</span>
                            <span className="text-xs text-gray-400">{city.nameEn}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </button>
              <Link href="/winners" className="flex flex-col items-center bg-white rounded-2xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
                <span className="text-3xl mb-1">🏆</span>
                <span className="text-xs font-medium text-gray-700">Winners</span>
                <span className="text-[8px] text-gray-400 mt-0.5">Hall of Fame</span>
              </Link>
              <Link href="/how-it-works" className="flex flex-col items-center bg-white rounded-2xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
                <span className="text-3xl mb-1">📖</span>
                <span className="text-xs font-medium text-gray-700">How It Works</span>
              </Link>
              <Link href="/about" className="flex flex-col items-center bg-white rounded-2xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
                <span className="text-3xl mb-1">ℹ️</span>
                <span className="text-xs font-medium text-gray-700">About</span>
              </Link>
              <Link href="/contact" className="flex flex-col items-center bg-white rounded-2xl shadow-sm p-4 border border-gray-100 hover:shadow-md transition">
                <span className="text-3xl mb-1">📞</span>
                <span className="text-xs font-medium text-gray-700">Contact</span>
              </Link>
              <button onClick={() => setShowRegisterModal(true)} className="flex flex-col items-center bg-gradient-to-r from-green-500 to-teal-500 rounded-2xl shadow-sm p-4 text-white hover:shadow-md transition">
                <span className="text-3xl mb-1">📝</span>
                <span className="text-xs font-medium">Register</span>
              </button>
            </div>
          </div>

          {/* FEATURED POOLS CAROUSEL */}
          {featuredPools.length > 0 && (
            <div className="px-4 py-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">⭐ Featured Pools</h2>
                <Link href="/listings" className="text-xs text-green-600 font-medium">See All</Link>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                {featuredPools.map(pool => (
                  <div key={pool.id} className="min-w-[200px] max-w-[200px] snap-start flex-shrink-0">
                    <PoolCard pool={pool} featured={true} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REGULAR POOLS QUICK VIEW */}
          <div className="px-4 py-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">🏊 Regular Pools</h2>
              <Link href="/listings" className="text-xs text-green-600 font-medium">View All</Link>
            </div>
            <div className="space-y-3">
              {pools.slice(0, 3).map(pool => (
                <PoolCard key={pool.id} pool={pool} featured={false} />
              ))}
            </div>
          </div>

          {/* CHARITY BANNER */}
          <div className="mx-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl border border-red-100 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💚</span>
              <div>
                <p className="font-bold text-red-800">2% for Health</p>
                <p className="text-xs text-red-700">Supporting kidney & heart disease patients</p>
              </div>
            </div>
          </div>

          {/* BOTTOM NAVIGATION */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-4 z-40 shadow-lg">
            <Link href="/" className="flex flex-col items-center text-green-600">
              <span className="text-2xl">🏠</span>
              <span className="text-[10px] font-medium">Home</span>
            </Link>
            <Link href="/listings" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-2xl">🎁</span>
              <span className="text-[10px] font-medium">Pools</span>
            </Link>
            <Link href="/winners" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-2xl">🏆</span>
              <span className="text-[10px] font-medium">Winners</span>
            </Link>
            <Link href="/dashboard" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-2xl">👤</span>
              <span className="text-[10px] font-medium">Profile</span>
            </Link>
          </nav>

          {showRegisterModal && <RegisterModal />}
        </div>

        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
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
        <ModeSwitcher />

        <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
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
                    <div className="absolute top-full left-0 mt-2 w-64 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 overflow-hidden">
                      <button onClick={() => scrollToSection('merkato-vip')} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3">
                        <span className="text-xl">🏪</span><div><div className="font-medium">Merkato VIP</div><div className="text-xs text-gray-400">Win Cash up to 40M ETB</div></div>
                      </button>
                      <button onClick={() => scrollToSection('city-vip')} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3 border-t border-gray-700">
                        <span className="text-xl">🏙️</span><div><div className="font-medium">City VIP</div><div className="text-xs text-gray-400">Win Cash in 94 Cities</div></div>
                      </button>
                      <button onClick={() => scrollToSection('regular-pools')} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3 border-t border-gray-700">
                        <span className="text-xl">🏊</span><div><div className="font-medium">Regular Pools</div><div className="text-xs text-gray-400">Cars, Houses & More</div></div>
                      </button>
                      <Link href="/dashboard" className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-700 transition flex items-center gap-3 border-t border-gray-700">
                        <span className="text-xl">📊</span><div><div className="font-medium">Dashboard</div><div className="text-xs text-gray-400">Track your tickets</div></div>
                      </Link>
                    </div>
                  )}
                </div>
                <Link href="/about" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition whitespace-nowrap text-sm font-medium">ℹ️ About</Link>
                <Link href="/contact" className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition whitespace-nowrap text-sm font-medium">📞 Contact</Link>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <TopCitySelector />
                <Link href="/login" className="px-4 py-2 text-gray-300 hover:text-white transition text-sm font-medium">Login</Link>
                <button onClick={() => setShowRegisterModal(true)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition text-sm font-medium">Register</button>
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
                  <Link href="/login" className="flex-1 text-center px-3 py-2 bg-gray-700 text-white rounded-lg text-xs">🔐 Login</Link>
                  <button onClick={() => { setShowRegisterModal(true); setMobileMenuOpen(false); }} className="flex-1 text-center px-3 py-2 bg-green-600 text-white rounded-lg text-xs">📝 Register</button>
                </div>
                <button onClick={() => scrollToSection('merkato-vip')} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                  <span className="text-xl">🏪</span><div><div>Merkato VIP</div><div className="text-xs text-gray-400">Cash up to 40M</div></div>
                </button>
                <button onClick={() => scrollToSection('city-vip')} className="w-full text-left px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center gap-3">
                  <span className="text-xl">🏙️</span><div><div>City VIP</div><div className="text-xs text-gray-400">94 Cities • Cash</div></div>
                </button>
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

        {/* MOVING MARQUEE - Below banners, before hero image */}
        <MovingMarquee />

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
              <button onClick={() => scrollToSection('merkato-vip')} className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition hover:scale-105 transform inline-flex items-center gap-2">
                <span>🏪</span> Join Merkato VIP <span>→</span>
              </button>
              <button onClick={() => scrollToSection('city-vip')} className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-6 py-3 rounded-full font-semibold shadow-md hover:shadow-lg transition hover:scale-105 transform inline-flex items-center gap-2">
                <span>🏙️</span> Join City VIP <span>→</span>
              </button>
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

          {/* Merkato VIP */}
          <div id="merkato-vip" className="mb-12 scroll-mt-20">
            <div onClick={() => router.push('/merkato-vip')} className="relative bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 rounded-2xl p-6 md:p-8 text-white transform hover:scale-105 transition-all duration-500 shadow-2xl overflow-hidden group cursor-pointer">
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
                      <div className="text-xs md:text-sm opacity-90">Win Cash up to 40M ETB</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-lg">⭐ 1M ETB</div>
                    <div className="bg-purple-500 text-white px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-lg">🏆 10M ETB</div>
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs md:text-sm font-bold shadow-lg">👑 40M ETB</div>
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
            </div>
          </div>

          {/* City VIP */}
          <div id="city-vip" className="mb-12 scroll-mt-20">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🏙️</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">City VIP Programs</h3>
                    <p className="text-sm text-gray-300">Win Cash in your city - {uniqueCities.length}+ Ethiopian cities available!</p>
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
                              <div className="font-medium text-gray-800 group-hover:text-green-600 transition">{city.name} <span className="text-gray-400 text-xs">| {city.nameEn}</span></div>
                              <div className="text-xs text-gray-500">{city.region}</div>
                              <div className="text-[10px] text-green-600 font-semibold mt-0.5">🏆 Win Cash {city.prize}</div>
                            </div>
                            <span className="text-green-600 text-xs font-medium opacity-0 group-hover:opacity-100 transition flex items-center gap-1">Join <span>→</span></span>
                          </a>
                        ))}
                      </div>
                      <div className="p-2 text-center text-xs text-gray-400 bg-gray-50">{uniqueCities.length}+ Ethiopian cities available • Win Cash up to 40M ETB</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 pt-4 border-t border-gray-700">
                <div className="text-center"><div className="text-2xl">🏆</div><div className="text-white font-bold text-sm">1M ETB</div><div className="text-[10px] text-gray-400">Daily Cash</div></div>
                <div className="text-center"><div className="text-2xl">⭐</div><div className="text-white font-bold text-sm">10M ETB</div><div className="text-[10px] text-gray-400">Weekly Cash</div></div>
                <div className="text-center"><div className="text-2xl">👑</div><div className="text-white font-bold text-sm">40M ETB</div><div className="text-[10px] text-gray-400">Monthly Cash</div></div>
                <div className="text-center"><div className="text-2xl">📍</div><div className="text-white font-bold text-sm">{uniqueCities.length}+</div><div className="text-[10px] text-gray-400">Cities</div></div>
                <div className="text-center"><div className="text-2xl">🇪🇹</div><div className="text-white font-bold text-sm">All Regions</div><div className="text-[10px] text-gray-400">Nationwide</div></div>
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
                <div className="flex justify-end items-center flex-wrap gap-2 mb-6">
                  <button onClick={() => setRegularPoolFilter('all')} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${regularPoolFilter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>All</button>
                  <button onClick={() => setRegularPoolFilter('lowToHigh')} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${regularPoolFilter === 'lowToHigh' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>Low to High</button>
                  <button onClick={() => setRegularPoolFilter('highToLow')} className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${regularPoolFilter === 'highToLow' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>High to Low</button>
                </div>
                <div className="flex justify-between items-center flex-wrap gap-4 mb-6">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-700">Available Prize Pools</h4>
                    <p className="text-sm text-gray-500">Choose based on your budget and preference</p>
                  </div>
                </div>
                {displayedPools.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <div className="text-5xl mb-3">🏊</div>
                    <p className="text-gray-500">No active pools at the moment</p>
                    <p className="text-sm text-gray-400 mt-2">Check back soon!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedPools.map(pool => <PoolCard key={pool.id} pool={pool} featured={pool.is_featured === true} />)}
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
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .hover\\:animation-pause:hover {
          animation-play-state: paused;
        }
      `}</style>
    </>
  );
}
