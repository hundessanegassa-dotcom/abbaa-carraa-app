// pages/telegram-app.js - COMPLETE WITH ALL 94 CITIES + ADD NEW CITY
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import NoSSR from '../components/NoSSR';
import TelegramBotClient, { useTelegram } from '../components/TelegramBotClient';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import PoolCard from '../components/PoolCard';

// ============================================
// ALL 94 ETHIOPIAN CITIES - COMPLETE LIST
// ============================================
const allCityVipPrograms = [
  // ===================== CENTRAL & MAJOR CITIES =====================
  { id: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa', region: 'Central', icon: '🏙️', prize: '40M ETB' },
  { id: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City', region: 'Oromia', icon: '🏗️', prize: '40M ETB' },
  { id: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa', region: 'Dire Dawa', icon: '🚂', prize: '40M ETB' },
  
  // ===================== TIGRAY REGION =====================
  { id: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle', region: 'Tigray', icon: '🏭', prize: '40M ETB' },
  { id: 'axum', name: 'አክሱም', nameEn: 'Axum', region: 'Tigray', icon: '🏛️', prize: '40M ETB' },
  { id: 'adigrat', name: 'አዲግራት', nameEn: 'Adigrat', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
  { id: 'shire', name: 'ሽሬ', nameEn: 'Shire', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
  { id: 'mekoni', name: 'መቆኒ', nameEn: 'Mekoni', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
  { id: 'maychew', name: 'ማይጨው', nameEn: 'Maychew', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
  { id: 'abiy-addi', name: 'አቢይ አዲ', nameEn: 'Abiy Addi', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
  { id: 'wukro', name: 'ውቅሮ', nameEn: 'Wukro', region: 'Tigray', icon: '🏔️', prize: '40M ETB' },
  
  // ===================== AMHARA REGION =====================
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
  
  // ===================== OROMIA REGION =====================
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
  
  // ===================== SOMALI REGION =====================
  { id: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga', region: 'Somali', icon: '🐪', prize: '40M ETB' },
  { id: 'degehabur', name: 'ደገሃቡር', nameEn: 'Degehabur', region: 'Somali', icon: '🏔️', prize: '40M ETB' },
  { id: 'kebri-dehar', name: 'ቀብሪ ደሃር', nameEn: 'Kebri Dehar', region: 'Somali', icon: '🏔️', prize: '40M ETB' },
  { id: 'gode', name: 'ጎዴ', nameEn: 'Gode', region: 'Somali', icon: '🏔️', prize: '40M ETB' },
  { id: 'warder', name: 'ዋርደር', nameEn: 'Warder', region: 'Somali', icon: '🐪', prize: '40M ETB' },
  { id: 'shilabo', name: 'ሺላቦ', nameEn: 'Shilabo', region: 'Somali', icon: '🐪', prize: '40M ETB' },
  { id: 'kelafo', name: 'ከላፎ', nameEn: 'Kelafo', region: 'Somali', icon: '🏔️', prize: '40M ETB' },
  { id: 'mustahil', name: 'ሙስታሂል', nameEn: 'Mustahil', region: 'Somali', icon: '🏔️', prize: '40M ETB' },
  { id: 'ferfer', name: 'ፌርፌር', nameEn: 'Ferfer', region: 'Somali', icon: '🛣️', prize: '40M ETB' },
  
  // ===================== HARARI REGION =====================
  { id: 'harar', name: 'ሀረር', nameEn: 'Harar', region: 'Harari', icon: '🏛️', prize: '40M ETB' },
  
  // ===================== SIDAMA REGION =====================
  { id: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa', region: 'Sidama', icon: '🏞️', prize: '40M ETB' },
  { id: 'yirgalem', name: 'ይርጋለም', nameEn: 'Yirgalem', region: 'Sidama', icon: '☕', prize: '40M ETB' },
  
  // ===================== SOUTH ETHIOPIA REGION =====================
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
  
  // ===================== BENISHANGUL-GUMUZ REGION =====================
  { id: 'assosa', name: 'አሶሳ', nameEn: 'Assosa', region: 'Benishangul', icon: '🌿', prize: '40M ETB' },
  { id: 'gilgel-beles', name: 'ግልገል በለስ', nameEn: 'Gilgel Beles', region: 'Benishangul', icon: '💧', prize: '40M ETB' },
  { id: 'kamashi', name: 'ካማሺ', nameEn: 'Kamashi', region: 'Benishangul', icon: '🏔️', prize: '40M ETB' },
  { id: 'metekel', name: 'ሜተከል', nameEn: 'Metekel', region: 'Benishangul', icon: '🏔️', prize: '40M ETB' },
  { id: 'dibate', name: 'ዲባቴ', nameEn: 'Dibate', region: 'Benishangul', icon: '🏔️', prize: '40M ETB' },
  
  // ===================== GAMBELLA REGION =====================
  { id: 'gambella', name: 'ጋምቤላ', nameEn: 'Gambella', region: 'Gambella', icon: '🏞️', prize: '40M ETB' },
  { id: 'meti', name: 'ሜቲ', nameEn: 'Meti', region: 'Gambella', icon: '🏔️', prize: '40M ETB' },
  { id: 'fugnido', name: 'ፉኝዶ', nameEn: 'Fugnido', region: 'Gambella', icon: '🏞️', prize: '40M ETB' },
  { id: 'itur', name: 'ኢቱር', nameEn: 'Itur', region: 'Gambella', icon: '🏔️', prize: '40M ETB' },
  
  // ===================== AFAR REGION =====================
  { id: 'semera', name: 'ሰሜራ', nameEn: 'Semera', region: 'Afar', icon: '🐪', prize: '40M ETB' },
  { id: 'asaita', name: 'አሳይታ', nameEn: 'Asaita', region: 'Afar', icon: '🏔️', prize: '40M ETB' },
  { id: 'logiya', name: 'ሎጊያ', nameEn: 'Logiya', region: 'Afar', icon: '🛣️', prize: '40M ETB' },
  { id: 'abila', name: 'አቢላ', nameEn: 'Abila', region: 'Afar', icon: '🐪', prize: '40M ETB' },
  { id: 'dubti', name: 'ዱብቲ', nameEn: 'Dubti', region: 'Afar', icon: '🏔️', prize: '40M ETB' },
  { id: 'elidar', name: 'ኤልዳር', nameEn: 'Elidar', region: 'Afar', icon: '🏔️', prize: '40M ETB' },
  { id: 'chifra', name: 'ቺፍራ', nameEn: 'Chifra', region: 'Afar', icon: '🏔️', prize: '40M ETB' }
];

export default function TelegramApp() {
  const router = useRouter();
  const { user: tgUser, isReady } = useTelegram();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pools, setPools] = useState([]);
  const [featuredPools, setFeaturedPools] = useState([]);
  const [language, setLanguage] = useState('am');
  const [showAddCity, setShowAddCity] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityNameEn, setNewCityNameEn] = useState('');
  const [newCityRegion, setNewCityRegion] = useState('');
  const [cities, setCities] = useState(allCityVipPrograms);
  const [searchTerm, setSearchTerm] = useState('');

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
    // Load custom cities from localStorage
    loadCustomCities();
  }, []);

  // Authenticate user when Telegram user is available
  useEffect(() => {
    if (isReady && tgUser) {
      authenticateUser(tgUser);
    } else if (isReady && !tgUser) {
      router.push('/');
    }
  }, [isReady, tgUser]);

  // Load pools after authentication
  useEffect(() => {
    if (user) {
      loadPools();
    }
  }, [user]);

  const loadCustomCities = () => {
    try {
      const saved = localStorage.getItem('customCities');
      if (saved) {
        const customCities = JSON.parse(saved);
        setCities([...allCityVipPrograms, ...customCities]);
      }
    } catch (error) {
      console.error('Error loading custom cities:', error);
    }
  };

  const saveCustomCity = (city) => {
    try {
      const saved = localStorage.getItem('customCities');
      let customCities = saved ? JSON.parse(saved) : [];
      customCities.push(city);
      localStorage.setItem('customCities', JSON.stringify(customCities));
      setCities([...allCityVipPrograms, ...customCities]);
    } catch (error) {
      console.error('Error saving custom city:', error);
    }
  };

  const authenticateUser = async (tgUser) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          telegram_id: tgUser.id,
          telegram_username: tgUser.username,
          full_name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
          email: `${tgUser.username || tgUser.id}@telegram.user`,
          updated_at: new Date().toISOString()
        }, { onConflict: 'telegram_id' })
        .select()
        .single();

      if (error) throw error;
      setUser(data);
      
      const { tier, program } = router.query;
      if (tier && program) {
        router.push(`/${program}?tier=${tier}`);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Failed to authenticate with Telegram');
    } finally {
      setLoading(false);
    }
  };

  const loadPools = async () => {
    try {
      const { data, error } = await supabase
        .from('pools')
        .select('*')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPools(data || []);
      setFeaturedPools(data?.filter(p => p.is_featured) || []);
    } catch (error) {
      console.error('Error loading pools:', error);
    }
  };

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const handleAddCity = () => {
    if (!newCityName.trim()) {
      toast.error(language === 'am' ? 'እባክዎ የከተማ ስም ያስገቡ' : 'Please enter city name');
      return;
    }

    const cityId = newCityName.toLowerCase().replace(/\s+/g, '-');
    const newCity = {
      id: cityId,
      name: newCityName.trim(),
      nameEn: newCityNameEn.trim() || newCityName.trim(),
      region: newCityRegion.trim() || 'Ethiopia',
      icon: '🏙️',
      prize: '40M ETB',
      isCustom: true
    };

    saveCustomCity(newCity);
    setShowAddCity(false);
    setNewCityName('');
    setNewCityNameEn('');
    setNewCityRegion('');
    toast.success(language === 'am' ? 'አዲስ ከተማ ተጨምሯል! ✅' : 'New city added! ✅');
  };

  const filteredCities = cities.filter(city =>
    city.name.includes(searchTerm) || 
    city.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Connecting...</p>
        </div>
      </div>
    );
  }

  return (
    <NoSSR>
      <Head>
        <title>Abbaa Carraa - Telegram Mini App</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#16a34a" />
      </Head>
      
      <TelegramBotClient>
        <div className="min-h-screen bg-gray-50 pb-20">
          {/* Top Bar */}
          <header className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-100 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎫</span>
                <span className="font-bold text-lg text-gray-800">Abbaa Carraa</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={toggleLanguage}
                  className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-xs font-medium transition"
                >
                  {language === 'am' ? '🇬🇧 EN' : '🇪🇹 አማ'}
                </button>
                <Link href="/dashboard" className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                  {user?.full_name?.[0]?.toUpperCase() || tgUser?.first_name?.[0]?.toUpperCase() || 'U'}
                </Link>
              </div>
            </div>
          </header>

          {/* Welcome */}
          <div className="px-4 py-4 bg-white border-b border-gray-100">
            <p className="text-sm text-gray-500">Welcome back,</p>
            <p className="text-xl font-bold text-gray-800">
              {user?.full_name || tgUser?.first_name || 'Guest'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3 px-4 py-4">
            <Link href="/merkato-vip" className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 hover:shadow-md transition">
              <span className="text-3xl block mb-1">🏪</span>
              <span className="text-xs font-bold text-gray-700">Merkato VIP</span>
            </Link>
            <button 
              onClick={() => setShowAddCity(!showAddCity)}
              className="bg-white rounded-xl shadow-sm p-4 text-center border-2 border-green-500 hover:shadow-md transition"
            >
              <span className="text-3xl block mb-1">🏙️</span>
              <span className="text-xs font-bold text-green-600">City VIP</span>
            </button>
            <Link href="/listings" className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 hover:shadow-md transition">
              <span className="text-3xl block mb-1">🏊</span>
              <span className="text-xs font-bold text-gray-700">Regular Pools</span>
            </Link>
            <Link href="/dashboard" className="bg-white rounded-xl shadow-sm p-4 text-center border border-gray-100 hover:shadow-md transition">
              <span className="text-3xl block mb-1">📊</span>
              <span className="text-xs font-bold text-gray-700">My Tickets</span>
            </Link>
          </div>

          {/* Add City Modal */}
          {showAddCity && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-800">
                    {language === 'am' ? 'አዲስ ከተማ ያስገቡ' : 'Add New City'}
                  </h2>
                  <button onClick={() => setShowAddCity(false)} className="text-gray-500 text-2xl">×</button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'am' ? 'የከተማ ስም (አማርኛ)' : 'City Name (Amharic)'}
                    </label>
                    <input
                      type="text"
                      value={newCityName}
                      onChange={(e) => setNewCityName(e.target.value)}
                      placeholder={language === 'am' ? 'ለምሳሌ: ባህር ዳር' : 'e.g., Bahir Dar'}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'am' ? 'የከተማ ስም (እንግሊዝኛ)' : 'City Name (English)'}
                    </label>
                    <input
                      type="text"
                      value={newCityNameEn}
                      onChange={(e) => setNewCityNameEn(e.target.value)}
                      placeholder={language === 'am' ? 'ለምሳሌ: Bahir Dar' : 'e.g., Bahir Dar'}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'am' ? 'ክልል' : 'Region'}
                    </label>
                    <input
                      type="text"
                      value={newCityRegion}
                      onChange={(e) => setNewCityRegion(e.target.value)}
                      placeholder={language === 'am' ? 'ለምሳሌ: አማራ' : 'e.g., Amhara'}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <button
                    onClick={handleAddCity}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition"
                  >
                    {language === 'am' ? 'ከተማ ያስገቡ →' : 'Add City →'}
                  </button>
                  
                  <p className="text-xs text-gray-400 text-center">
                    {language === 'am' 
                      ? '💡 ከተማዎ ከላይ ካልተዘረዘረ እዚህ ያስገቡት' 
                      : '💡 If your city is not listed above, add it here'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* City VIP Section */}
          <div className="px-4 py-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">🏙️ City VIP Programs</h2>
              <span className="text-xs text-green-600 font-medium">{cities.length} Cities</span>
            </div>
            
            {/* Search */}
            <div className="mb-3">
              <input
                type="text"
                placeholder={language === 'am' ? '🔍 ከተማ ፈልግ...' : '🔍 Search city...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            {/* Cities Grid */}
            <div className="grid grid-cols-2 gap-3">
              {filteredCities.map((city) => (
                <Link key={city.id} href={`/cities/${city.id}`}>
                  <div className={`bg-white rounded-xl p-3 shadow-sm border hover:shadow-md transition ${city.isCustom ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-100'}`}>
                    <div className="text-3xl mb-0.5">{city.icon}</div>
                    <h3 className="font-bold text-gray-800 text-sm">{city.name}</h3>
                    <p className="text-xs text-gray-500">{city.nameEn}</p>
                    <p className="text-xs text-green-600 mt-1">🏆 {city.prize}</p>
                    {city.isCustom && (
                      <span className="text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full mt-1 inline-block">⭐ New</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            
            {filteredCities.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">{language === 'am' ? 'ምንም ከተማ አልተገኘም' : 'No cities found'}</p>
                <button 
                  onClick={() => setShowAddCity(true)}
                  className="mt-3 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-semibold transition"
                >
                  {language === 'am' ? '➕ አዲስ ከተማ ያስገቡ' : '➕ Add New City'}
                </button>
              </div>
            )}
          </div>

          {/* Featured Pools */}
          {featuredPools.length > 0 && (
            <div className="px-4 py-2">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">⭐ Featured Pools</h2>
              <div className="flex overflow-x-auto gap-4 pb-3 snap-x snap-mandatory scrollbar-hide">
                {featuredPools.map((pool) => (
                  <div key={pool.id} className="min-w-[250px] max-w-[250px] snap-start flex-shrink-0">
                    <PoolCard pool={pool} featured={true} language={language} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Regular Pools */}
          <div className="px-4 py-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">🏊 Regular Pools</h2>
            {pools.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <div className="text-4xl mb-2">🏊</div>
                <p className="text-gray-500 text-sm">No active pools at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pools.slice(0, 3).map((pool) => (
                  <PoolCard key={pool.id} pool={pool} featured={false} language={language} />
                ))}
              </div>
            )}
          </div>

          {/* Bottom Nav */}
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-4 z-40 shadow-lg">
            <Link href="/telegram-app" className="flex flex-col items-center text-green-600">
              <span className="text-2xl">🏠</span>
              <span className="text-[10px] font-bold">Home</span>
            </Link>
            <Link href="/listings" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-2xl">🎁</span>
              <span className="text-[10px] font-bold">Pools</span>
            </Link>
            <Link href="/winners" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-2xl">🏆</span>
              <span className="text-[10px] font-bold">Winners</span>
            </Link>
            <Link href="/dashboard" className="flex flex-col items-center text-gray-400 hover:text-gray-600">
              <span className="text-2xl">👤</span>
              <span className="text-[10px] font-bold">Profile</span>
            </Link>
          </nav>

          <style jsx>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
            .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
        </div>
      </TelegramBotClient>
    </NoSSR>
  );
}
