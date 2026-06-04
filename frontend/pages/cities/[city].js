import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';

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

// City-specific data - Complete with all Ethiopian cities
const cityData = {
  // ================= MAJOR & METROPOLITAN CITIES =================
  'addis-ababa': {
    name: 'አዲስ አበባ | Addis Ababa',
    slogan: 'የኢትዮጵያ የንግድ እና የዲፕሎማሲ ልብ | Heart of Ethiopian Commerce & Diplomacy',
    businesses: '50,000+',
    workers: '200,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏙️',
    product: 'ዘመናዊ አገልግሎቶች, ቴክኖሎጂ | Modern Services, Technology',
    description: 'የኢትዮጵያ ዋና ከተማ እና የንግድ ማዕከል | Capital & Business Hub'
  },
  'dire-dawa': {
    name: 'ድሬ ዳዋ | Dire Dawa',
    slogan: 'የሎጂስቲክስ እና የማኑፋክቸሪንግ በር | Logistics & Manufacturing Gateway',
    businesses: '15,000+',
    workers: '60,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🚂',
    product: 'ጨርቃጨርቅ, ሎጂስቲክስ | Textiles, Logistics',
    description: 'ሁለተኛዋ ትልቋ ከተማ | Second Largest City'
  },
  'mekelle': {
    name: 'መቀሌ | Mekelle',
    slogan: 'የሰሜኑ የኢንዱስትሪ እና የትምህርት ማዕከል | Industrial & Educational Hub of the North',
    businesses: '18,000+',
    workers: '70,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏭',
    product: 'ሲሚንቶ, ፋርማሲዩቲካልስ | Cement, Pharmaceuticals',
    description: 'የሰሜን ኢትዮጵያ የንግድ ማዕከል | Northern Trade Hub'
  },
  'adama': {
    name: 'አዳማ | Adama',
    slogan: 'የመኪና እና የኢንዱስትሪ ከተማ | Automotive & Industrial City',
    businesses: '20,000+',
    workers: '80,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏭',
    product: 'የመኪና መሰብሰቢያ, ጨርቃጨርቅ | Vehicle Assembly, Textiles',
    description: 'የኢንዱስትሪ ከተማ | Industrial City'
  },
  'hawassa': {
    name: 'ሀዋሳ | Hawassa',
    slogan: 'የኢንዱስትሪ ፓርክ እና የሀይቅ ከተማ | Industrial Park & Lake City',
    businesses: '12,000+',
    workers: '50,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏞️',
    product: 'ጨርቃጨርቅ, አሳ | Textiles, Fish',
    description: 'የኢንዱስትሪ ፓርክ ከተማ | Industrial Park City'
  },
  'gondar': {
    name: 'ጎንደር | Gondar',
    slogan: 'የባህል ቅርስ እና የቱሪዝም ከተማ | Heritage & Tourism City',
    businesses: '10,000+',
    workers: '40,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏰',
    product: 'ቱሪዝም, ጨርቃጨርቅ | Tourism, Textiles',
    description: 'የባህል ቅርስ ከተማ | Heritage City'
  },
  'bahir-dar': {
    name: 'ባህር ዳር | Bahir Dar',
    slogan: 'የሀይቆች እና የጨርቃጨርቅ ከተማ | Lakes & Textile City',
    businesses: '12,000+',
    workers: '50,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '🏞️',
    product: 'ጨርቃጨርቅ, ቱሪዝም | Textiles, Tourism',
    description: 'የታና ሀይቅ ዳርቻ | Shores of Lake Tana'
  },
  'jimma': {
    name: 'ጅማ | Jimma',
    slogan: 'የቡና እና የንግድ ከተማ | Coffee & Trade City',
    businesses: '8,000+',
    workers: '30,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '☕',
    product: 'ቡና, ማር | Coffee, Honey',
    description: 'የቡና ከተማ | Coffee City'
  },
  'bishoftu': {
    name: 'ቢሾፍቱ | Bishoftu (Debre Zeyit)',
    slogan: 'የሀይቆች እና የአየር ሃይል ከተማ | City of Lakes & Air Force Base',
    businesses: '12,000+',
    workers: '45,000+',
    color: 'from-gray-700 to-gray-900',
    icon: '✈️',
    product: 'ቱሪዝም, አቪዬሽን | Tourism, Aviation',
    description: 'የሀይቆች ከተማ | City of Lakes'
  }
  // ... add more cities as needed
};

export default function CityVip() {
  const router = useRouter();
  const { city, name } = router.query;
  const [activeTab, setActiveTab] = useState('daily');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cityInfo, setCityInfo] = useState(null);
  
  // Seat selection states
  const [showSeatSelector, setShowSeatSelector] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedPoolType, setSelectedPoolType] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [maxSeats, setMaxSeats] = useState(5);

  useEffect(() => {
    if (city) {
      const data = cityData[city];
      if (data) {
        setCityInfo(data);
      } else {
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
      color: "from-gray-600 to-gray-800",
      icon: "⭐",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      description: "Start your day with a chance to become an instant millionaire!",
      listedDate: "January 1, 2024",
      drawDate: "Every Day at 8:00 PM",
      nextDraw: "Today at 8:00 PM"
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
      color: "from-gray-600 to-gray-800",
      icon: "🏆",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      description: "Ten MILLION Birr changes everything!",
      listedDate: "January 1, 2024",
      drawDate: "Every Sunday at 6:00 PM",
      nextDraw: getNextSunday()
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
      color: "from-gray-600 to-gray-800",
      icon: "👑",
      slogan: "ዛሬ፣ በዚህ ሳምንት እና በዚህ ወር አንድ ተሳታፊ ሚሊየነር እናድርገው",
      description: "The ULTIMATE nationwide prize pool!",
      listedDate: "January 1, 2024",
      drawDate: "Last Day of Month at 8:00 PM",
      nextDraw: getNextMonthEnd()
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
    setSelectedPoolType(poolType);
    setSelectedSeats([]);
    setShowSeatSelector(true);
  };

  // Render seat selection modal
  const renderSeatSelector = () => {
    if (!selectedPoolType) return null;
    
    const pool = vipPools[selectedPoolType];
    const entryFeeAmount = parseInt(pool.contribution);
    const totalSeatsCount = pool.totalSeats;
    const seatNumbers = Array.from({ length: Math.min(totalSeatsCount, 100) }, (_, i) => i + 1);
    
    const toggleSeat = (seatNum) => {
      if (selectedSeats.includes(seatNum)) {
        setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      } else if (selectedSeats.length < maxSeats) {
        setSelectedSeats([...selectedSeats, seatNum]);
      } else {
        toast.error(`You can only select up to ${maxSeats} seats`);
      }
    };
    
    const totalAmount = selectedSeats.length * entryFeeAmount;
    
    const confirmSeats = async () => {
      if (selectedSeats.length === 0) {
        toast.error('Please select at least one seat');
        return;
      }
      
      setLoading(true);
      
      try {
        const ticketNumber = `CITY-${selectedPoolType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        
        const { data: participant, error } = await supabase
          .from('merkato_vip_participants')
          .insert({
            user_id: user.id,
            user_email: user.email,
            user_name: user.user_metadata?.full_name || user.email.split('@')[0],
            pool_type: selectedPoolType,
            seat_numbers: selectedSeats,
            contribution_amount: totalAmount,
            prize_amount: parseInt(pool.prize),
            payment_status: 'pending',
            ticket_number: ticketNumber,
            city: city,
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        
        setParticipantId(participant.id);
        setShowSeatSelector(false);
        setShowPayment(true);
        
      } catch (error) {
        console.error('Error creating participant:', error);
        toast.error('Failed to create participant record');
      } finally {
        setLoading(false);
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Select Your Seats</h2>
              <p className="text-sm text-gray-500">{pool.name} • Max {maxSeats} seats</p>
            </div>
            <button 
              onClick={() => {
                setShowSeatSelector(false);
                setSelectedPoolType(null);
                setSelectedSeats([]);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-gray-600">Entry Fee: {pool.contribution} per seat</p>
              <p className="text-xs text-gray-400">Total Seats Available: {totalSeatsCount.toLocaleString()}</p>
            </div>
            
            <div className="grid grid-cols-8 md:grid-cols-10 gap-2 mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl">
              {seatNumbers.map(seatNum => (
                <button
                  key={seatNum}
                  onClick={() => toggleSeat(seatNum)}
                  className={`w-10 h-10 rounded-lg font-semibold transition ${
                    selectedSeats.includes(seatNum)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  {seatNum}
                </button>
              ))}
            </div>
            
            {selectedSeats.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Selected Seats</p>
                    <p className="font-bold text-lg">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="font-bold text-2xl text-green-600">ETB {totalAmount.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">({selectedSeats.length} seats × {pool.contribution})</p>
                  </div>
                </div>
                <button
                  onClick={confirmSeats}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Confirm & Proceed to Payment'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render payment modal
  const renderPayment = () => {
    if (!showPayment || !participantId || !selectedPoolType) return null;
    
    const pool = vipPools[selectedPoolType];
    const totalAmount = selectedSeats.length * parseInt(pool.contribution);
    
    const handlePaymentSubmit = async () => {
      const reference = document.getElementById('referenceNumber')?.value;
      const file = document.getElementById('paymentScreenshot')?.files[0];
      
      if (!file) {
        toast.error('Please upload payment screenshot');
        return;
      }
      
      toast.loading('Uploading...');
      
      try {
        const fileName = `${user.id}_${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(`bank-transfers/${fileName}`, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(`bank-transfers/${fileName}`);
        
        await supabase
          .from('merkato_vip_participants')
          .update({
            payment_status: 'pending_verification',
            payment_proof_url: publicUrl,
            reference: reference,
            updated_at: new Date().toISOString()
          })
          .eq('id', participantId);
        
        toast.success('Payment submitted! You will receive a ticket shortly.');
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
        
      } catch (error) {
        console.error('Payment error:', error);
        toast.error('Failed to submit payment');
      }
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
          <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
            <h2 className="text-xl font-bold">Complete Payment</h2>
            <button 
              onClick={() => {
                setShowPayment(false);
                setSelectedPoolType(null);
                setParticipantId(null);
              }}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          <div className="p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-gray-600">Pool: {pool.name}</p>
              <p className="text-sm text-gray-600">Seats: {selectedSeats.join(', ')}</p>
              <p className="text-xl font-bold text-green-600 mt-2">ETB {totalAmount.toLocaleString()}</p>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">Please send payment to:</p>
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <p className="font-semibold">📱 TeleBirr: 0913277922</p>
              <p className="font-semibold mt-2">🏦 CBE Bank: 1000601091686</p>
              <p className="text-sm text-gray-600 mt-2">Account Name: Negassa Hundessa</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Reference Number</label>
                <input
                  type="text"
                  id="referenceNumber"
                  placeholder="Enter transaction ID"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upload Screenshot</label>
                <input
                  type="file"
                  id="paymentScreenshot"
                  accept="image/*"
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <button
              onClick={handlePaymentSubmit}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition mt-4"
            >
              Submit Payment
            </button>
          </div>
        </div>
      </div>
    );
  };

  const PoolCard = ({ type, pool }) => (
    <div className="group relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
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
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span>📅 Listed: {pool.listedDate}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg><span>🎲 Draw: {pool.drawDate}</span></div>
          <div className="flex items-center gap-3 text-gray-600"><span className="text-yellow-500">⏰</span><span>Next Draw: {pool.nextDraw}</span></div>
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
              <span className="bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">VIP</span>
            </h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">{cityInfo.slogan}</p>
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
                <p className="text-gray-600 leading-relaxed mb-4">{cityInfo.description}</p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="border-l-4 border-gray-500 pl-3"><p className="font-semibold">የእምነት ንግድ | Trust-Based Commerce</p></div>
                  <div className="border-l-4 border-gray-500 pl-3"><p className="font-semibold">ዘመናዊ እኩብ | Modern Equb</p></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">💎 ዋና ምርቶች | Main Products</h3>
                <p className="text-gray-700 text-sm mb-4">{cityInfo.product}</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየቀኑ አንድ ሚሊየነር | One Millionaire Every Day</div>
                  <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየሳምንቱ አንድ ሚሊየነር | One Millionaire Every Week</div>
                  <div className="flex items-center gap-2 text-sm"><span className="text-green-600">✓</span> በየወሩ አንድ ሚሊየነር | One Millionaire Every Month</div>
                </div>
                <div className="mt-4 p-3 bg-gray-200 rounded-lg">
                  <p className="text-xs font-semibold text-gray-800 text-center">✨ ሁሉም በአንድ ላይ | All Together Now!</p>
                  <p className="text-xs text-center mt-1">በመላው ኢትዮጵያ ያሉ ነጋዴዎች እንኳን ደህና መጡ!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VIP Tabs */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <button onClick={() => setActiveTab('daily')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'daily' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>⭐ ዕለታዊ | Daily (1M)</button>
            <button onClick={() => setActiveTab('weekly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'weekly' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>🏆 ሳምንታዊ | Weekly (10M)</button>
            <button onClick={() => setActiveTab('monthly')} className={`px-6 py-3 rounded-full font-bold transition transform hover:scale-105 ${activeTab === 'monthly' ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-lg' : 'bg-gray-200 text-gray-600'}`}>👑 ወርሃዊ | Monthly (40M)</button>
          </div>
          <div className="max-w-4xl mx-auto"><PoolCard type={activeTab} pool={vipPools[activeTab]} /></div>
        </div>

        {/* Seat Selection Modal */}
        {renderSeatSelector()}
        
        {/* Payment Modal */}
        {renderPayment()}

        {/* CTA Banner */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">ዛሬውኑ ይቀላቀሉ!</h2>
            <p className="text-xl mb-6">Join Today and Become {cityInfo.name.split('|')[0]}'s Next Millionaire!</p>
            <Link href="/" className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-xl">🎯 Back to Cities →</Link>
          </div>
        </div>
      </div>
    </>
  );
}
