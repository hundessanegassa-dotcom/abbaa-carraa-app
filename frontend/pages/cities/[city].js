// pages/cities/[city].js - SIMPLIFIED CITY VIP LANDING PAGE
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import NoSSR from '../../components/NoSSR';
import TopCitySelector from '../../components/TopCitySelector';
import UnifiedAgentApplication from '../../components/UnifiedAgentApplication';
import TicketImage from '../../components/TicketImage';

// Helper function for next draw dates
const getNextSunday = () => {
  const today = new Date();
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
  return nextSunday.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const getNextMonthEnd = () => {
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return lastDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

// ============================================
// COMPLETE CITY DATA - ALL 94 ETHIOPIAN CITIES
// ============================================
const cityData = {
  'addis-ababa': { name: 'አዲስ አበባ | Addis Ababa', slogan: 'የኢትዮጵያ የንግድ እና የዲፕሎማሲ ልብ', businesses: '50,000+', workers: '200,000+', color: 'from-gray-700 to-gray-900', icon: '🏙️', product: 'ዘመናዊ አገልግሎቶች, ቴክኖሎጂ', description: 'የኢትዮጵያ ዋና ከተማ እና የንግድ ማዕከል', population: '5M+', region: 'Central' },
  'shaggar': { name: 'ሸገር | Shaggar City', slogan: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል', businesses: '25,000+', workers: '100,000+', color: 'from-gray-700 to-gray-900', icon: '🏗️', product: 'ቴክኖሎጂ, ዘመናዊ አገልግሎቶች', description: 'ብልህ ከተማ እና የኢንቨስትመንት ማዕከል', population: '3M+', region: 'Oromia' },
  'dire-dawa': { name: 'ድሬ ዳዋ | Dire Dawa', slogan: 'የሎጂስቲክስ እና የማኑፋክቸሪንግ በር', businesses: '15,000+', workers: '60,000+', color: 'from-gray-700 to-gray-900', icon: '🚂', product: 'ጨርቃጨርቅ, ሎጂስቲክስ', description: 'ሁለተኛዋ ትልቋ ከተማ', population: '535K+', region: 'Dire Dawa' },
  'mekelle': { name: 'መቀሌ | Mekelle', slogan: 'የሰሜኑ የኢንዱስትሪ እና የትምህርት ማዕከል', businesses: '18,000+', workers: '70,000+', color: 'from-gray-700 to-gray-900', icon: '🏭', product: 'ሲሚንቶ, ፋርማሲዩቲካልስ', description: 'የሰሜን ኢትዮጵያ የንግድ ማዕከል', population: '500K+', region: 'Tigray' },
  'axum': { name: 'አክሱም | Axum', slogan: 'የታላቁ የአክሱም መንግስት ዋና ከተማ', businesses: '5,000+', workers: '20,000+', color: 'from-gray-700 to-gray-900', icon: '🏛️', product: 'ቱሪዝም, ቅርስ', description: 'የታሪካዊ ቅርስ ከተማ', population: '70K+', region: 'Tigray' },
  'adigrat': { name: 'አዲግራት | Adigrat', slogan: 'የሰሜን ትግራይ የንግድ ማዕከል', businesses: '4,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የሰሜን ትግራይ የንግድ ማዕከል', population: '80K+', region: 'Tigray' },
  'shire': { name: 'ሽሬ | Shire', slogan: 'የምዕራብ ትግራይ ዋና ከተማ', businesses: '6,000+', workers: '25,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ንግድ, ግብርና', description: 'የምዕራብ ትግራይ የንግድ ማዕከል', population: '100K+', region: 'Tigray' },
  'gondar': { name: 'ጎንደር | Gondar', slogan: 'የባህል ቅርስ እና የቱሪዝም ከተማ', businesses: '10,000+', workers: '40,000+', color: 'from-gray-700 to-gray-900', icon: '🏰', product: 'ቱሪዝም, ጨርቃጨርቅ', description: 'የባህል ቅርስ ከተማ', population: '350K+', region: 'Amhara' },
  'bahir-dar': { name: 'ባህር ዳር | Bahir Dar', slogan: 'የሀይቆች እና የጨርቃጨርቅ ከተማ', businesses: '12,000+', workers: '50,000+', color: 'from-gray-700 to-gray-900', icon: '🏞️', product: 'ጨርቃጨርቅ, ቱሪዝም', description: 'የታና ሀይቅ ዳርቻ', population: '350K+', region: 'Amhara' },
  'dessie': { name: 'ደሴ | Dessie', slogan: 'የንግድ እና የእርሻ ከተማ', businesses: '7,000+', workers: '25,000+', color: 'from-gray-700 to-gray-900', icon: '🏔️', product: 'ግብርና, ንግድ', description: 'የንግድ እና የእርሻ ከተማ', population: '229K+', region: 'Amhara' },
  'adama': { name: 'አዳማ | Adama', slogan: 'የመኪና እና የኢንዱስትሪ ከተማ', businesses: '20,000+', workers: '80,000+', color: 'from-gray-700 to-gray-900', icon: '🏭', product: 'የመኪና መሰብሰቢያ, ጨርቃጨርቅ', description: 'የኢንዱስትሪ ከተማ', population: '500K+', region: 'Oromia' },
  'jimma': { name: 'ጅማ | Jimma', slogan: 'የቡና እና የንግድ ከተማ', businesses: '8,000+', workers: '30,000+', color: 'from-gray-700 to-gray-900', icon: '☕', product: 'ቡና, ማር', description: 'የቡና ከተማ', population: '250K+', region: 'Oromia' },
  'bishoftu': { name: 'ቢሾፍቱ | Bishoftu', slogan: 'የሀይቆች እና የአየር ሃይል ከተማ', businesses: '12,000+', workers: '45,000+', color: 'from-gray-700 to-gray-900', icon: '✈️', product: 'ቱሪዝም, አቪዬሽን', description: 'የሀይቆች ከተማ', population: '150K+', region: 'Oromia' },
  'hawassa': { name: 'ሀዋሳ | Hawassa', slogan: 'የኢንዱስትሪ ፓርክ እና የሀይቅ ከተማ', businesses: '12,000+', workers: '50,000+', color: 'from-gray-700 to-gray-900', icon: '🏞️', product: 'ጨርቃጨርቅ, አሳ', description: 'የሲዳማ ክልል ዋና ከተማ', population: '387K+', region: 'Sidama' },
  'arba-minch': { name: 'አርባ ምንጭ | Arba Minch', slogan: 'የቱሪዝም እና የግብርና ከተማ', businesses: '5,000+', workers: '20,000+', color: 'from-gray-700 to-gray-900', icon: '🏞️', product: 'ቱሪዝም, ግብርና', description: 'የአርባ ምንጭ ዩኒቨርሲቲ ከተማ', population: '150K+', region: 'South' },
  'jijiga': { name: 'ጅጅጋ | Jijiga', slogan: 'የንግድ እና የእንስሳት ከተማ', businesses: '6,000+', workers: '20,000+', color: 'from-gray-700 to-gray-900', icon: '🐪', product: 'ንግድ, እንስሳት', description: 'የሶማሌ ክልል ዋና ከተማ', population: '200K+', region: 'Somali' },
  'harar': { name: 'ሀረር | Harar', slogan: 'የባህል ቅርስ እና የእስላም ቅድስት ከተማ', businesses: '5,000+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🏛️', product: 'ቱሪዝም, ባህል', description: 'የባህል ቅርስ ከተማ', population: '150K+', region: 'Harari' },
  'assosa': { name: 'አሶሳ | Assosa', slogan: 'የንግድ እና የግብርና ከተማ', businesses: '3,000+', workers: '12,000+', color: 'from-gray-700 to-gray-900', icon: '🌿', product: 'ንግድ, ግብርና', description: 'የቤንሻንጉል ክልል ዋና ከተማ', population: '100K+', region: 'Benishangul' },
  'gambella': { name: 'ጋምቤላ | Gambella', slogan: 'የጋምቤላ ክልል ዋና ከተማ', businesses: '3,500+', workers: '15,000+', color: 'from-gray-700 to-gray-900', icon: '🏞️', product: 'ንግድ, ግብርና', description: 'የጋምቤላ ክልል ዋና ከተማ', population: '80K+', region: 'Gambella' },
  'semera': { name: 'ሰሜራ | Semera', slogan: 'የአፋር ክልል ዋና ከተማ', businesses: '2,000+', workers: '8,000+', color: 'from-gray-700 to-gray-900', icon: '🐪', product: 'ንግድ, እንስሳት', description: 'የአፋር ክልል ዋና ከተማ', population: '50K+', region: 'Afar' },
};

const cityList = Object.keys(cityData).map(key => ({
  id: key,
  name: cityData[key].name.split('|')[0].trim(),
  nameEn: cityData[key].name.split('|')[1]?.trim() || key,
  icon: cityData[key].icon
}));

const compressImage = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const MAX_WIDTH = 1024, MAX_HEIGHT = 1024;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.7);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

const validateFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) throw new Error('Please upload a valid image file');
  if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB');
  return true;
};

// VIP Pools with 3 different colors
const vipPools = {
  daily: { name: "ዕለታዊ ሚሊየነር | Daily Millionaire", tier: "ለሁሉም ኢትዮጵያዊ", frequency: "Daily", contribution: "500", contributionFormatted: "500 ETB", prize: "1,000,000 ETB", prizeNumber: 1000000, winnerCount: 1, totalSeats: 2400, seatsPerRow: 20, rows: 120, time: "Every Day at 8:00 PM", color: "from-gray-700 to-gray-900", icon: "⭐", slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው", description: "Start your day with a chance to become an instant millionaire!", listedDate: "January 1, 2024", drawDate: "Every Day at 8:00 PM", nextDraw: "Today at 8:00 PM", buttonColor: "from-blue-500 to-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-500", textColor: "text-blue-600" },
  weekly: { name: "ሳምንታዊ ግዙፍ አሸናፊ | Weekly Mega Winner", tier: "VIP 2", frequency: "Weekly", contribution: "2500", contributionFormatted: "2,500 ETB", prize: "10,000,000 ETB", prizeNumber: 10000000, winnerCount: 1, totalSeats: 4800, seatsPerRow: 20, rows: 240, time: "Every Sunday at 6:00 PM", color: "from-gray-700 to-gray-900", icon: "🏆", slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው", description: "Ten MILLION Birr changes everything!", listedDate: "January 1, 2024", drawDate: "Every Sunday at 6:00 PM", nextDraw: getNextSunday(), buttonColor: "from-green-500 to-green-600", bgColor: "bg-green-50", borderColor: "border-green-500", textColor: "text-green-600" },
  monthly: { name: "ወርሃዊ አሸናፊ | Monthly Winner", tier: "VIP 1", frequency: "Monthly", contribution: "5000", contributionFormatted: "5,000 ETB", prize: "40,000,000 ETB", prizeNumber: 40000000, winnerCount: 1, totalSeats: 9600, seatsPerRow: 20, rows: 480, time: "Last Day of Month at 8:00 PM", color: "from-gray-700 to-gray-900", icon: "👑", slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው", description: "The ULTIMATE nationwide prize pool!", listedDate: "January 1, 2024", drawDate: "Last Day of Month at 8:00 PM", nextDraw: getNextMonthEnd(), buttonColor: "from-orange-500 to-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-500", textColor: "text-orange-600" }
};

export default function CityVip() {
  const router = useRouter();
  const { city } = router.query;
  const [activeTab, setActiveTab] = useState('daily');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cityInfo, setCityInfo] = useState(null);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAgentApplication, setShowAgentApplication] = useState(false);
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedPoolType, setSelectedPoolType] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [maxSeats, setMaxSeats] = useState(5);
  const [takenSeats, setTakenSeats] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const [ticketType, setTicketType] = useState('unverified');
  const [currentRow, setCurrentRow] = useState(0);
  const seatGridRef = useRef(null);

  useEffect(() => {
    if (city) {
      const data = cityData[city];
      if (data) setCityInfo(data);
      else setCityInfo({ name: city.replace(/-/g, ' '), slogan: 'አንድ ብሔር አንድ እድል', businesses: '1,000+', workers: '5,000+', color: 'from-gray-700 to-gray-900', icon: '🇪🇹', product: 'ማህበረሰብ እና ንግድ', description: 'የኢትዮጵያ ከተማ', population: 'N/A', region: 'Ethiopia' });
    }
    checkUser();
  }, [city]);

  useEffect(() => {
    const { type, showSeats } = router.query;
    if (type && showSeats === 'true' && city && !showSeatSelector && !showPayment && !showTicket) {
      setSelectedPoolType(type);
      setSelectedSeats([]);
      fetchTakenSeats(city, type);
      setShowSeatSelector(true);
      router.replace(`/cities/${city}`, undefined, { shallow: true });
    }
  }, [router.query, city, showSeatSelector, showPayment, showTicket]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const fetchTakenSeats = async (cityName, poolType) => {
    if (!cityName || !poolType) return;
    try {
      const { data } = await supabase.from('city_vip_participants').select('seat_numbers').eq('city', cityName).eq('pool_type', poolType).eq('payment_status', 'verified');
      if (data) setTakenSeats(data.flatMap(p => p.seat_numbers || []));
    } catch (error) { console.error('Error fetching taken seats:', error); }
  };

  const handleJoinPool = async (poolType) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const redirectUrl = `/cities/${city}?type=${poolType}&showSeats=true`;
      localStorage.setItem('abbaa_redirect_after_login', redirectUrl);
      sessionStorage.setItem('redirectAfterLogin', redirectUrl);
      localStorage.setItem('pendingRole', 'individual');
      localStorage.setItem('pendingCity', city);
      sessionStorage.setItem('pendingRole', 'individual');
      sessionStorage.setItem('pendingCity', city);
      toast.loading('Please login to join City VIP...');
      router.push('/login');
      return;
    }
    setSelectedPoolType(poolType);
    setSelectedSeats([]);
    await fetchTakenSeats(city, poolType);
    setShowSeatSelector(true);
  };

  const submitPayment = async (participantId, file) => {
    const loadingToast = toast.loading('Uploading payment screenshot...');
    try {
      const optimizedFile = await compressImage(file);
      const fileName = `city-payments/${participantId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, optimizedFile);
      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);
      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
      await supabase.from('city_vip_participants').update({ payment_status: 'pending_verification', payment_proof_url: publicUrl, payment_submitted_at: new Date().toISOString() }).eq('id', participantId);
      const { data: updatedParticipant } = await supabase.from('city_vip_participants').select('*').eq('id', participantId).single();
      setParticipantData(updatedParticipant);
      setTicketType('unverified');
      setShowTicket(true);
      setShowPayment(false);
      setShowSeatSelector(false);
      toast.success('Payment submitted! Your unverified ticket is ready', { id: loadingToast });
    } catch (error) {
      toast.error(error.message || 'Failed to submit payment', { id: loadingToast });
      throw error;
    }
  };

  const renderSeatSelector = () => {
    if (!selectedPoolType) return null;
    const pool = vipPools[selectedPoolType];
    const entryFeeAmount = parseInt(pool.contribution);
    const totalSeatsCount = pool.totalSeats;
    const seatsPerRow = pool.seatsPerRow;
    const rows = Math.ceil(totalSeatsCount / seatsPerRow);
    const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const toggleSeat = (seatNum) => {
      if (takenSeats.includes(seatNum)) { toast.error(`Seat ${seatNum} is already taken`); return; }
      if (selectedSeats.includes(seatNum)) setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      else if (selectedSeats.length < maxSeats) setSelectedSeats([...selectedSeats, seatNum]);
      else toast.error(`You can only select up to ${maxSeats} seats`);
    };
    const totalAmount = selectedSeats.length * entryFeeAmount;
    const confirmSeats = async () => {
      if (selectedSeats.length === 0) { toast.error('Please select at least one seat'); return; }
      setLoading(true);
      try {
        const ticketNumber = `CITY-${selectedPoolType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const { data: participant, error } = await supabase.from('city_vip_participants').insert({
          user_id: user.id, user_email: user.email, user_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          pool_type: selectedPoolType, city: city, seat_numbers: selectedSeats, contribution_amount: totalAmount,
          prize_amount: parseInt(pool.prize.replace(/[^0-9]/g, '')), payment_status: 'pending', ticket_number: ticketNumber,
          status: 'active', created_at: new Date().toISOString()
        }).select().single();
        if (error) throw error;
        setParticipantId(participant.id);
        setShowSeatSelector(false);
        setShowPayment(true);
      } catch (error) { toast.error('Failed to create participant record: ' + error.message); }
      finally { setLoading(false); }
    };
    const seatRows = [];
    for (let row = 0; row < rows; row++) {
      const startSeat = row * seatsPerRow + 1;
      const endSeat = Math.min(startSeat + seatsPerRow - 1, totalSeatsCount);
      const rowSeats = [];
      for (let seat = startSeat; seat <= endSeat; seat++) rowSeats.push(seat);
      seatRows.push(rowSeats);
    }
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-2">
        <div className="bg-gray-100 rounded-2xl shadow-xl max-w-full w-full max-h-[98vh] overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-gray-100 border-b border-gray-200 p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">Select Your Seats (Max {maxSeats})</h2>
              <button onClick={() => { setShowSeatSelector(false); setSelectedPoolType(null); setSelectedSeats([]); }} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-wrap justify-center gap-4 mb-4 pb-3 border-b">
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-[10px] font-bold">✓</div><span className="text-xs">Selected by You</span></div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gray-200 border border-gray-400 rounded"></div><span className="text-xs">Available</span></div>
              <div className="flex items-center gap-2"><div className="w-6 h-6 bg-gray-400 rounded"></div><span className="text-xs">Taken</span></div>
            </div>
            <div className="text-center mb-4"><div className="inline-block bg-gray-600 text-white text-[10px] px-4 py-1 rounded-full">🎬 SCREEN</div><div className="w-full h-px bg-gray-300 mt-2"></div></div>
            <div ref={seatGridRef} className="space-y-2">
              {seatRows.slice(0, 25).map((rowSeats, rowIndex) => (
                <div key={rowIndex} className="flex flex-wrap items-center gap-1">
                  <div className="w-8 text-[11px] font-mono font-semibold text-gray-500">{rowLetters[rowIndex] || (rowIndex + 1)}</div>
                  <div className="flex flex-wrap gap-1 flex-1">
                    {rowSeats.map(seatNum => {
                      const isTaken = takenSeats.includes(seatNum);
                      const isSelected = selectedSeats.includes(seatNum);
                      let bgColor = 'bg-gray-200 border border-gray-400', textColor = 'text-gray-700';
                      if (isSelected) { bgColor = 'bg-green-600 border-green-700'; textColor = 'text-white'; }
                      if (isTaken) { bgColor = 'bg-gray-400 border-gray-500'; textColor = 'text-gray-600'; }
                      return (
                        <button key={seatNum} onClick={() => !isTaken && toggleSeat(seatNum)} disabled={isTaken}
                          className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${bgColor} ${textColor} ${isTaken ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-green-100'}`}
                          title={isTaken ? `Seat ${seatNum} is taken` : `Select Seat ${seatNum}`}>{seatNum}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {rows > 25 && <p className="text-xs text-gray-400 text-center mt-4">Showing first 25 rows of {totalSeatsCount.toLocaleString()} seats</p>}
          </div>
          {selectedSeats.length > 0 && (
            <div className="sticky bottom-0 bg-gray-100 border-t border-gray-200 p-4">
              <div className="flex justify-between items-center mb-3">
                <div><p className="text-xs text-gray-500">Selected Seats</p><p className="font-bold">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p></div>
                <div className="text-right"><p className="text-xs text-gray-500">Total Amount</p><p className="font-bold text-xl text-green-600">ETB {totalAmount.toLocaleString()}</p></div>
              </div>
              <button onClick={confirmSeats} disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50">
                {loading ? 'Processing...' : 'Confirm & Proceed to Payment'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPayment = () => {
    if (!showPayment || !participantId || !selectedPoolType) return null;
    const pool = vipPools[selectedPoolType];
    const totalAmount = selectedSeats.length * parseInt(pool.contribution);
    const handleFileSelect = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try { validateFile(file); setPreviewUrl(URL.createObjectURL(file)); setSelectedFile(file); toast.success('File selected'); }
      catch (error) { toast.error(error.message); e.target.value = ''; }
    };
    const handlePaymentSubmit = async () => {
      if (!selectedFile) { toast.error('Please upload payment screenshot'); return; }
      setIsSubmitting(true);
      try { await submitPayment(participantId, selectedFile); }
      catch (error) { console.error('Payment error:', error); }
      finally { setIsSubmitting(false); }
    };
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between">
            <h2 className="text-xl font-bold">Complete Payment</h2>
            <button onClick={() => { setShowPayment(false); setSelectedPoolType(null); setParticipantId(null); }} className="text-2xl">×</button>
          </div>
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <p>City: {cityInfo?.name?.split('|')[0] || city}</p>
              <p>Seats: {selectedSeats.join(', ')}</p>
              <p className="text-xl font-bold text-green-600">ETB {totalAmount.toLocaleString()}</p>
            </div>
            <p className="text-sm text-gray-600 mb-2">Send payment to:</p>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="font-semibold">📱 TeleBirr: 0913277922</p>
              <p className="font-semibold">🏦 CBE Bank: 1000601091686</p>
              <p className="text-sm text-gray-600">Account: Negassa Hundessa</p>
            </div>
            <div className="border-2 border-dashed rounded-lg p-4 text-center mb-4">
              <input type="file" accept="image/*" className="hidden" id="paymentScreenshot" onChange={handleFileSelect} />
              <label htmlFor="paymentScreenshot" className="cursor-pointer">
                {previewUrl ? <div><img src={previewUrl} className="max-h-32 mx-auto mb-2 rounded" /><p className="text-green-600">✓ Screenshot selected</p></div> :
                <div><svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p className="text-gray-500 mt-2">Upload payment screenshot</p></div>}
              </label>
            </div>
            <button onClick={handlePaymentSubmit} disabled={isSubmitting} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold mt-4 disabled:opacity-50">
              {isSubmitting ? 'Processing...' : 'Submit Payment & Get Ticket'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTicket = () => {
    if (!showTicket || !participantData) return null;
    const pool = vipPools[participantData.pool_type];
    return (
      <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl max-w-md w-full">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex justify-between rounded-t-2xl">
            <h3 className="text-white font-bold">Your Ticket</h3>
            <button onClick={() => { setShowTicket(false); router.push('/dashboard'); }} className="text-white text-2xl">×</button>
          </div>
          <div className="p-6">
            <TicketImage participant={participantData} pool={pool} isVerified={false} seatNumbers={selectedSeats} ticketNumber={participantData.ticket_number} amount={participantData.contribution_amount} createdAt={participantData.created_at} poolType="city" />
            <button onClick={() => router.push('/dashboard')} className="mt-6 w-full bg-gray-600 text-white py-2 rounded-lg">Go to Dashboard</button>
          </div>
        </div>
      </div>
    );
  };

  const PoolCard = ({ type, pool }) => {
    const isActive = activeTab === type;
    return (
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition hover:scale-105">
        <div className={`bg-gradient-to-r ${pool.color} p-6 text-white`}>
          <div className="flex justify-between items-start">
            <div><p className="text-xs opacity-80">{pool.tier}</p><h3 className="text-2xl font-bold">{pool.name}</h3></div>
            <div className="text-5xl animate-bounce">{pool.icon}</div>
          </div>
          <div className="mt-3 bg-white/20 rounded-lg p-2 text-center"><p className="text-sm font-bold">{pool.slogan}</p></div>
          <div className="mt-4 flex justify-between">
            <div><p className="text-sm opacity-80">Entry Fee</p><p className="text-2xl font-bold">{pool.contributionFormatted}</p></div>
            <div className="text-right"><p className="text-sm opacity-80">Prize</p><p className="text-2xl font-bold">{pool.prize}</p></div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-gray-600 text-sm">📅 Draw: {pool.drawDate}</div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">⏰ Next: {pool.nextDraw}</div>
            <div className="flex items-center gap-2 text-gray-600 text-sm">💺 Seats: {pool.totalSeats.toLocaleString()}</div>
          </div>
          <button onClick={() => handleJoinPool(type)} className={`w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2`}>🎯 Select Seat & Join →</button>
        </div>
      </div>
    );
  };

  if (!cityInfo) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div></div>;

  return (
    <NoSSR>
      <>
        <Head><title>{cityInfo.name.split('|')[0]} VIP - Win 1M Daily, 10M Weekly, 40M Monthly | Abbaa Carraa</title></Head>
        <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2"><span className="text-2xl">🎫</span><span className="font-bold text-white text-lg">Abbaa Carraa</span></Link>
              <TopCitySelector />
            </div>
          </div>
        </nav>
        <div className="min-h-screen bg-gray-100">
          {/* City Selector */}
          <div className="container mx-auto px-4 pt-6">
            <div className="relative">
              <button onClick={() => setShowCityDropdown(!showCityDropdown)} className="w-full md:w-auto bg-white border rounded-xl px-5 py-3 flex items-center gap-3">
                <span className="text-2xl">{cityInfo.icon}</span>
                <div><div className="font-semibold">{cityInfo.name.split('|')[0]}</div><div className="text-xs text-gray-500">{cityInfo.name.split('|')[1]}</div></div>
                <svg className="w-5 h-5 text-gray-400">...</svg>
              </button>
              {showCityDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full md:w-96 bg-white rounded-2xl shadow-2xl border z-50 max-h-96 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-3 border-b"><input type="text" id="citySearch" placeholder="Search city..." className="w-full border rounded-lg px-4 py-2" /></div>
                  {cityList.map(c => (
                    <a key={c.id} href={`/cities/${c.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b cursor-pointer">
                      <span className="text-2xl">{c.icon}</span><div><div className="font-medium">{c.name}</div><div className="text-xs text-gray-500">{c.nameEn}</div></div>
                      {city === c.id && <span className="ml-auto text-green-600 text-sm">✓</span>}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Hero Section - SIMPLIFIED */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12 text-center mt-4 mx-4 rounded-2xl">
            <div className="text-6xl mb-3">{cityInfo.icon}</div>
            <h1 className="text-3xl md:text-4xl font-bold">{cityInfo.name.split('|')[0]} VIP</h1>
            <p className="text-gray-200 mt-2">Select your seat to win up to 40 Million ETB</p>
          </div>

          {/* 3 COLORED TABS */}
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <button onClick={() => setActiveTab('daily')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'daily' ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>⭐ Daily (1M)</button>
              <button onClick={() => setActiveTab('weekly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'weekly' ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>🏆 Weekly (10M)</button>
              <button onClick={() => setActiveTab('monthly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'monthly' ? 'bg-orange-600 text-white shadow-lg' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>👑 Monthly (40M)</button>
            </div>
            <div className="max-w-4xl mx-auto"><PoolCard type={activeTab} pool={vipPools[activeTab]} /></div>
          </div>

          {/* Become an Agent */}
          <div className="container mx-auto px-4 py-12">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-5xl">🤝</span>
                  <div>
                    <h3 className="text-2xl font-bold">Become an Agent for {cityInfo.name.split('|')[0]}</h3>
                    <p className="text-gray-300">Earn 10% commission on every successful contribution!</p>
                    <div className="flex gap-2 mt-2"><span className="text-xs bg-green-600/30 rounded-full px-2 py-1">✓ Regular Pools</span><span className="text-xs bg-purple-600/30 rounded-full px-2 py-1">✓ City VIP</span><span className="text-xs bg-yellow-600/30 rounded-full px-2 py-1">✓ Merkato VIP</span></div>
                  </div>
                </div>
                <button onClick={() => setShowAgentApplication(true)} className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-xl font-semibold flex items-center gap-2">Apply as Agent →</button>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div><div className="text-2xl">💰</div><p className="font-semibold">10% Commission</p></div>
                <div><div className="text-2xl">🔗</div><p className="font-semibold">Referral Link</p></div>
                <div><div className="text-2xl">💳</div><p className="font-semibold">Easy Withdrawal</p></div>
              </div>
            </div>
          </div>
        </div>
        {renderSeatSelector()}
        {renderPayment()}
        {renderTicket()}
        {showAgentApplication && <UnifiedAgentApplication onClose={() => setShowAgentApplication(false)} preSelectedCity={city} preSelectedProgram="city_vip" />}
      </>
    </NoSSR>
  );
}
