// pages/cities/seat.js - DIRECT SEAT SELECTION WITH AMHARIC SUPPORT
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';
import TicketImage from '../../components/TicketImage';

export default function CitySeat() {
  const router = useRouter();
  const { city, type } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState(type || 'daily');
  const [poolInfo, setPoolInfo] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [reservedSeats, setReservedSeats] = useState([]);
  const [reservationTimer, setReservationTimer] = useState(null);
  const [manualSeatInput, setManualSeatInput] = useState('');
  const [language, setLanguage] = useState('am');

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

  const vipPools = {
    daily: { name: "Daily", nameAm: "ዕለታዊ", entryFee: 500, prize: 1000000, totalSeats: 2400, explanation: "Pay 500 ETB, win 1,000,000 ETB", explanationAm: "500 ብር ከፍለው 1,000,000 ብር ያሸንፉ", buttonColor: "bg-blue-500", activeColor: "border-blue-500 bg-blue-50", textColor: "text-blue-600" },
    weekly: { name: "Weekly", nameAm: "ሳምንታዊ", entryFee: 2500, prize: 10000000, totalSeats: 4800, explanation: "Pay 2,500 ETB, win 10,000,000 ETB", explanationAm: "2,500 ብር ከፍለው 10,000,000 ብር ያሸንፉ", buttonColor: "bg-green-500", activeColor: "border-green-500 bg-green-50", textColor: "text-green-600" },
    monthly: { name: "Monthly", nameAm: "ወርሃዊ", entryFee: 5000, prize: 40000000, totalSeats: 9600, explanation: "Pay 5,000 ETB, win 40,000,000 ETB", explanationAm: "5,000 ብር ከፍለው 40,000,000 ብር ያሸንፉ", buttonColor: "bg-orange-500", activeColor: "border-orange-500 bg-orange-50", textColor: "text-orange-600" }
  };

  const getCityDisplayName = () => {
    if (!city) return 'City';
    return decodeURIComponent(city).replace(/-/g, ' ');
  };

  useEffect(() => {
    return () => {
      if (reservationTimer) clearTimeout(reservationTimer);
      if (reservedSeats.length > 0 && user) releaseSeats(reservedSeats);
    };
  }, [reservedSeats, user]);

  useEffect(() => { if (city) checkUser(); }, [city]);
  useEffect(() => {
    if (selectedType) {
      setPoolInfo(vipPools[selectedType]);
      if (type !== selectedType && city) router.replace(`/cities/seat?city=${city}&type=${selectedType}`, undefined, { shallow: true });
    }
  }, [selectedType, city]);
  useEffect(() => {
    if (user && poolInfo && city) {
      fetchBookedSeats();
      fetchUserReservations();
      const interval = setInterval(() => { fetchBookedSeats(); fetchUserReservations(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, poolInfo, city, selectedType]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        const currentUrl = `/cities/seat?city=${city}&type=${selectedType}`;
        localStorage.setItem('abbaa_redirect_after_login', currentUrl);
        sessionStorage.setItem('redirectAfterLogin', currentUrl);
        localStorage.setItem('pendingRole', 'individual');
        sessionStorage.setItem('pendingRole', 'individual');
        router.push('/login');
        return;
      }
      setUser(user);
      setLoading(false);
    } catch (error) { router.push('/login'); }
  };

  async function fetchBookedSeats() {
    try {
      const { data, error } = await supabase.from('city_vip_participants').select('seat_numbers, payment_status').eq('city', city).eq('pool_type', selectedType).in('payment_status', ['verified', 'pending_verification']);
      if (error) throw error;
      const allBookedSeats = [];
      if (data) data.forEach(p => { if (p.seat_numbers) allBookedSeats.push(...p.seat_numbers); });
      setBookedSeats([...new Set(allBookedSeats)]);
    } catch (err) { console.error(err); }
  }

  async function fetchUserReservations() {
    if (!user) return;
    try {
      const poolId = `city_${city}_${selectedType}`;
      const { data, error } = await supabase.from('vip_seat_reservations').select('seat_number, expires_at').eq('user_id', user.id).eq('pool_id', poolId).gte('expires_at', new Date().toISOString());
      if (!error && data) { setReservedSeats(data.map(r => r.seat_number)); setSelectedSeats(data.map(r => r.seat_number)); }
    } catch (err) { console.error(err); }
  }

  async function reserveSeatsInDB(seatNumbers) {
    if (!user) return false;
    const poolId = `city_${city}_${selectedType}`;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const reservations = seatNumbers.map(seatNumber => ({ pool_id: poolId, seat_number: seatNumber, user_id: user.id, expires_at: expiresAt, created_at: new Date().toISOString() }));
    const { error } = await supabase.from('vip_seat_reservations').upsert(reservations, { onConflict: 'pool_id, seat_number' });
    if (error) return false;
    if (reservationTimer) clearTimeout(reservationTimer);
    const timer = setTimeout(() => { releaseUserReservations(); toast.warning(language === 'am' ? 'የመቀመጫ ማስያዣዎ ጊዜ አልፏል' : 'Your seat reservation has expired'); window.location.reload(); }, 10 * 60 * 1000);
    setReservationTimer(timer);
    return true;
  }

  async function releaseSeats(seatNumbers) {
    if (!seatNumbers || seatNumbers.length === 0 || !user) return;
    const poolId = `city_${city}_${selectedType}`;
    await supabase.from('vip_seat_reservations').delete().eq('user_id', user.id).eq('pool_id', poolId).in('seat_number', seatNumbers);
  }

  async function releaseUserReservations() {
    if (!user) return;
    const poolId = `city_${city}_${selectedType}`;
    await supabase.from('vip_seat_reservations').delete().eq('user_id', user.id).eq('pool_id', poolId);
    setReservedSeats([]); setSelectedSeats([]);
  }

  const handleManualSeatAdd = async () => {
    const seatNum = parseInt(manualSeatInput);
    if (isNaN(seatNum)) { toast.error(language === 'am' ? 'እባክዎ ትክክለኛ የመቀመጫ ቁጥር ያስገቡ' : 'Enter a valid seat number'); return; }
    if (seatNum < 1 || seatNum > 500) { toast.error(language === 'am' ? `የመቀመጫ ቁጥር ከ1 እስከ 500 መሆን አለበት` : `Seat must be between 1 and 500`); return; }
    if (bookedSeats.includes(seatNum)) { toast.error(language === 'am' ? `መቀመጫ ${seatNum} ተይዟል` : `Seat ${seatNum} is taken`); setManualSeatInput(''); return; }
    if (selectedSeats.includes(seatNum)) { toast.error(language === 'am' ? `መቀመጫ ${seatNum} አስቀድሞ ተመርጧል` : `Seat ${seatNum} already selected`); setManualSeatInput(''); return; }
    if (selectedSeats.length >= 5) { toast.error(language === 'am' ? 'እስከ 5 መቀመጫዎች ብቻ መምረጥ ይችላሉ' : 'Max 5 seats'); return; }
    const success = await reserveSeatsInDB([seatNum]);
    if (success) {
      setSelectedSeats([...selectedSeats, seatNum]);
      setReservedSeats([...reservedSeats, seatNum]);
      toast.success(language === 'am' ? `መቀመጫ ${seatNum} ለ10 ደቂቃ ተይዟል` : `Seat ${seatNum} reserved for 10 min`);
      await fetchBookedSeats();
      setManualSeatInput('');
    } else { toast.error(language === 'am' ? `መቀመጫ ${seatNum} አይገኝም` : `Seat ${seatNum} unavailable`); await fetchBookedSeats(); }
  };

  const toggleSeat = async (seatNum) => {
    if (bookedSeats.includes(seatNum)) { toast.error(language === 'am' ? `መቀመጫ ${seatNum} ተይዟል` : `Seat ${seatNum} taken`); return; }
    if (selectedSeats.includes(seatNum)) {
      await releaseSeats([seatNum]);
      setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
      setReservedSeats(reservedSeats.filter(s => s !== seatNum));
      toast.success(language === 'am' ? `መቀመጫ ${seatNum} ተለቋል` : `Seat ${seatNum} released`);
    } else {
      if (selectedSeats.length >= 5) { toast.error(language === 'am' ? 'እስከ 5 መቀመጫዎች ብቻ መምረጥ ይችላሉ' : 'Max 5 seats'); return; }
      const success = await reserveSeatsInDB([seatNum]);
      if (success) {
        setSelectedSeats([...selectedSeats, seatNum]);
        setReservedSeats([...reservedSeats, seatNum]);
        toast.success(language === 'am' ? `መቀመጫ ${seatNum} ለ10 ደቂቃ ተይዟል` : `Seat ${seatNum} reserved for 10 min`);
        await fetchBookedSeats();
      } else { toast.error(language === 'am' ? `መቀመጫ ${seatNum} አይገኝም` : `Seat ${seatNum} unavailable`); await fetchBookedSeats(); }
    }
  };

  const confirmSeats = async () => {
    if (selectedSeats.length === 0) { toast.error(language === 'am' ? 'እባክዎ ቢያንስ አንድ መቀመጫ ይምረጡ' : 'Select at least one seat'); return; }
    setLoading(true);
    try {
      await fetchBookedSeats();
      const stillAvailable = selectedSeats.every(seat => !bookedSeats.includes(seat));
      if (!stillAvailable) { toast.error(language === 'am' ? 'አንዳንድ መቀመጫዎች አይገኙም' : 'Some seats no longer available'); setSelectedSeats([]); setLoading(false); return; }
      const ticketNumber = `CITY-${selectedType.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const totalAmount = selectedSeats.length * poolInfo.entryFee;
      const { data: participant, error } = await supabase.from('city_vip_participants').insert({
        user_id: user.id, user_email: user.email, user_name: user.user_metadata?.full_name || user.email.split('@')[0],
        pool_type: selectedType, city: city, seat_numbers: selectedSeats, contribution_amount: totalAmount,
        prize_amount: poolInfo.prize, payment_status: 'pending', ticket_number: ticketNumber,
        status: 'active', created_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      setParticipantId(participant.id);
      setShowSeatSelector(false);
      setShowPayment(true);
      toast.success(language === 'am' ? 'መቀመጫዎች ተይዘዋል! እባክዎ ክፍያ ይፈጽሙ' : 'Seats reserved! Complete payment.');
    } catch (error) { toast.error(language === 'am' ? 'መቀመጫዎችን ማስያዝ አልተቻለም' : 'Failed to reserve seats'); }
    finally { setLoading(false); }
  };

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) throw new Error(language === 'am' ? 'እባክዎ ትክክለኛ የምስል ፋይል ይምረጡ' : 'Invalid file type');
    if (file.size > 5 * 1024 * 1024) throw new Error(language === 'am' ? 'የፋይል መጠን ከ5MB በታች መሆን አለበት' : 'File too large');
    return true;
  };

  const compressImage = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width, height = img.height;
        const maxSize = 1024;
        if (width > height) { if (width > maxSize) { height = (height * maxSize) / width; width = maxSize; } }
        else { if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; } }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => { resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' })); }, 'image/jpeg', 0.7);
      };
    };
  });

  const handlePaymentSubmit = async () => {
    if (!selectedFile) { toast.error(language === 'am' ? 'እባክዎ የክፍያ ማስረጃ ይስቀሉ' : 'Upload payment screenshot'); return; }
    setUploading(true);
    try {
      const compressedFile = await compressImage(selectedFile);
      const fileName = `${user.id}/${Date.now()}_city_${city}_${selectedType}.jpg`;
      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, compressedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
      await supabase.from('city_vip_participants').update({ payment_status: 'pending_verification', payment_proof_url: publicUrl, payment_submitted_at: new Date().toISOString() }).eq('id', participantId);
      await releaseUserReservations();
      const { data: updatedParticipant } = await supabase.from('city_vip_participants').select('*').eq('id', participantId).single();
      setParticipantData(updatedParticipant);
      setShowPayment(false);
      setShowTicket(true);
      toast.success(language === 'am' ? 'ክፍያ ተልኳል! ቲኬትዎ ዝግጁ ነው' : 'Payment submitted! Ticket ready');
    } catch (error) { toast.error(language === 'am' ? 'ክፍያ መላክ አልተቻለም' : 'Payment failed'); }
    finally { setUploading(false); }
  };

  const [showSeatSelector, setShowSeatSelector] = useState(true);
  const getSeatColor = (seatNum) => {
    if (bookedSeats.includes(seatNum)) return 'bg-red-100 border-red-300 cursor-not-allowed opacity-60';
    if (selectedSeats.includes(seatNum)) return 'bg-emerald-600 text-white shadow-md';
    if (reservedSeats.includes(seatNum)) return 'bg-amber-100 border-amber-300 animate-pulse';
    return 'bg-white hover:bg-gray-50 border-gray-200 cursor-pointer';
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div></div>;
  if (!poolInfo || !city) return null;

  const totalAmount = selectedSeats.length * poolInfo.entryFee;
  const seatNumbers = Array.from({ length: Math.min(500, poolInfo.totalSeats) }, (_, i) => i + 1);
  const availableCount = seatNumbers.filter(s => !bookedSeats.includes(s) && !selectedSeats.includes(s) && !reservedSeats.includes(s)).length;
  const takenCount = bookedSeats.filter(s => s <= 500).length;

  return (
    <>
      <Head><title>{getCityDisplayName()} VIP - Select Seat | Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gray-50 py-6 pb-32">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Language Toggle */}
          <div className="flex justify-end mb-4">
            <button onClick={toggleLanguage} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm font-medium">{language === 'am' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}</button>
          </div>

          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700 mb-5 text-sm">← {language === 'am' ? 'ተመለስ' : 'Back'}</button>
          
          <div className="bg-white rounded-2xl border p-5 mb-6 text-center">
            <div className="text-4xl mb-2">🏙️</div>
            <h1 className="text-2xl font-bold">{getCityDisplayName()} VIP</h1>
            <p className="text-gray-500 text-sm mt-1">{language === 'am' ? 'እስከ 40 ሚሊዮን ብር ለማሸነፍ መቀመጫዎን ይምረጡ' : 'Select your seat to win up to 40 Million ETB'}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <button onClick={() => setSelectedType('daily')} className={`p-5 rounded-2xl border-2 text-left transition-all ${selectedType === 'daily' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
              <div className="text-lg font-bold">⭐ {language === 'am' ? 'ዕለታዊ' : 'Daily'}</div>
              <div className={`text-2xl font-bold ${selectedType === 'daily' ? 'text-blue-600' : 'text-blue-500'}`}>ETB 500</div>
              <div className="text-xs text-gray-500 mt-1">{language === 'am' ? '1,000,000 ብር ያሸንፉ' : 'Win 1,000,000 ETB'}</div>
            </button>
            <button onClick={() => setSelectedType('weekly')} className={`p-5 rounded-2xl border-2 text-left transition-all ${selectedType === 'weekly' ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 bg-white hover:border-green-300'}`}>
              <div className="text-lg font-bold">🏆 {language === 'am' ? 'ሳምንታዊ' : 'Weekly'}</div>
              <div className={`text-2xl font-bold ${selectedType === 'weekly' ? 'text-green-600' : 'text-green-500'}`}>ETB 2,500</div>
              <div className="text-xs text-gray-500 mt-1">{language === 'am' ? '10,000,000 ብር ያሸንፉ' : 'Win 10,000,000 ETB'}</div>
            </button>
            <button onClick={() => setSelectedType('monthly')} className={`p-5 rounded-2xl border-2 text-left transition-all ${selectedType === 'monthly' ? 'border-orange-500 bg-orange-50 shadow-md' : 'border-gray-200 bg-white hover:border-orange-300'}`}>
              <div className="text-lg font-bold">👑 {language === 'am' ? 'ወርሃዊ' : 'Monthly'}</div>
              <div className={`text-2xl font-bold ${selectedType === 'monthly' ? 'text-orange-600' : 'text-orange-500'}`}>ETB 5,000</div>
              <div className="text-xs text-gray-500 mt-1">{language === 'am' ? '40,000,000 ብር ያሸንፉ' : 'Win 40,000,000 ETB'}</div>
            </button>
          </div>

          <div className="bg-white rounded-xl border p-4 mb-6 flex justify-between">
            <div><div className="text-xs text-gray-500">{language === 'am' ? 'የተመረጠ ፑል' : 'Selected Pool'}</div><div className="font-bold text-lg">{language === 'am' ? vipPools[selectedType].nameAm : vipPools[selectedType].name}</div><div className="text-sm text-gray-600">{language === 'am' ? vipPools[selectedType].explanationAm : vipPools[selectedType].explanation}</div></div>
            <div className="text-right"><div className="text-xs text-gray-500">{language === 'am' ? 'የሚታዩ መቀመጫዎች' : 'Showing Seats'}</div><div className="font-bold text-xl">1-500</div><div className="text-xs text-gray-400">of {poolInfo.totalSeats.toLocaleString()}</div></div>
          </div>

          {!showPayment && !showTicket && (
            <div className="bg-white rounded-2xl border p-6">
              <h3 className="text-lg font-bold mb-4">{language === 'am' ? 'መቀመጫዎችን ይምረጡ (ከፍተኛ 5)' : 'Select Seats (Max 5)'}</h3>
              <div className="mb-6 p-4 bg-gray-50 rounded-xl border">
                <p className="text-sm font-medium mb-2">🎯 {language === 'am' ? 'የመቀመጫ ቁጥር በእጅ ያስገቡ:' : 'Enter seat number manually:'}</p>
                <div className="flex gap-3">
                  <input type="number" value={manualSeatInput} onChange={(e) => setManualSeatInput(e.target.value)} placeholder={language === 'am' ? `የመቀመጫ ቁጥር (1-500)` : `Seat number (1-500)`} className="flex-1 px-4 py-2 border rounded-xl text-sm" />
                  <button onClick={handleManualSeatAdd} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-semibold">{language === 'am' ? 'መቀመጫ ጨምር' : 'Add Seat'}</button>
                </div>
                <p className="text-xs text-gray-400 mt-2">⚠️ {language === 'am' ? 'መቀመጫው ተይዞ ከሆነ ይነገርዎታል' : 'If seat is taken, you will be notified'}</p>
              </div>
              <div className="flex flex-wrap gap-4 mb-6 pb-4 border-b">
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-white border border-gray-300 rounded"></div><span className="text-xs">{language === 'am' ? 'ክፍት' : 'Available'}</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-emerald-600 rounded"></div><span className="text-xs">{language === 'am' ? 'የእርስዎ መቀመጫ' : 'Your Seats'}</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-red-100 border border-red-300 rounded"></div><span className="text-xs">{language === 'am' ? 'የተያዙ' : 'Taken'}</span></div>
                <div className="flex items-center gap-2"><div className="w-5 h-5 bg-amber-100 border border-amber-300 rounded animate-pulse"></div><span className="text-xs">{language === 'am' ? 'ተይዘዋል (10 ደቂቃ)' : 'Reserved (10 min)'}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-gray-50 rounded-xl p-3 text-center border"><div className="text-2xl font-bold text-emerald-600">{availableCount}</div><div className="text-xs">{language === 'am' ? 'ክፍት' : 'Available'}</div></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border"><div className="text-2xl font-bold text-amber-600">{selectedSeats.length}</div><div className="text-xs">{language === 'am' ? 'የእርስዎ' : 'Your Seats'}</div></div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border"><div className="text-2xl font-bold text-red-500">{takenCount}</div><div className="text-xs">{language === 'am' ? 'የተያዙ' : 'Taken'}</div></div>
              </div>
              <div className="grid grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-2 mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl border">
                {seatNumbers.map(seatNum => {
                  const isTaken = bookedSeats.includes(seatNum);
                  const isSelected = selectedSeats.includes(seatNum);
                  const isReserved = reservedSeats.includes(seatNum);
                  let bgColor = 'bg-white hover:bg-gray-50 border-gray-200 cursor-pointer';
                  if (isSelected) bgColor = 'bg-emerald-600 text-white shadow-md';
                  if (isTaken) bgColor = 'bg-red-100 border-red-300 cursor-not-allowed opacity-60';
                  if (isReserved && !isSelected) bgColor = 'bg-amber-100 border-amber-300 animate-pulse';
                  return <button key={seatNum} onClick={() => toggleSeat(seatNum)} disabled={isTaken} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold border ${bgColor} ${isSelected ? 'ring-2 ring-emerald-300' : ''}`}>{seatNum}</button>;
                })}
              </div>
              {selectedSeats.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 p-4 shadow-lg z-50">
                  <div className="container mx-auto max-w-6xl flex justify-between items-center flex-wrap gap-3">
                    <div><p className="text-sm text-gray-500">{language === 'am' ? 'የተመረጡ መቀመጫዎች' : 'Selected Seats'}</p><p className="font-bold">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p></div>
                    <div className="text-right"><p className="text-sm text-gray-500">{language === 'am' ? 'ጠቅላላ ክፍያ' : 'Total Amount'}</p><p className="font-bold text-2xl text-emerald-600">ETB {totalAmount.toLocaleString()}</p></div>
                    <button onClick={confirmSeats} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold">{language === 'am' ? 'አረጋግጥ እና ወደ ክፍያ ቀጥል' : 'Confirm & Proceed'}</button>
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">{language === 'am' ? '⏰ የተመረጡት መቀመጫዎች ለ10 ደቂቃ ተይዘዋል' : '⏰ Seats reserved for 10 minutes'}</p>
                </div>
              )}
            </div>
          )}

          {showPayment && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full">
                <div className="sticky top-0 bg-white border-b p-5 flex justify-between"><h2 className="text-xl font-bold">{language === 'am' ? 'ክፍያ ያጠናቅቁ' : 'Complete Payment'}</h2><button onClick={() => { setShowPayment(false); setParticipantId(null); }} className="text-2xl">×</button></div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center"><p>{language === 'am' ? 'ከተማ:' : 'City:'} {getCityDisplayName()}</p><p>{language === 'am' ? 'መቀመጫዎች:' : 'Seats:'} {selectedSeats.join(', ')}</p><p className="text-2xl font-bold text-emerald-600">ETB {totalAmount.toLocaleString()}</p></div>
                  <div className="bg-blue-50 rounded-xl p-4 mb-4"><p className="font-semibold">📱 TeleBirr: 0913277922</p><p className="font-semibold">🏦 CBE Bank: 1000601091686</p><p className="text-sm">{language === 'am' ? 'የሂሳብ ባለቤት:' : 'Account:'} Negassa Hundessa</p></div>
                  <div className="border-2 border-dashed rounded-xl p-4 text-center mb-4">
                    <input type="file" accept="image/*" className="hidden" id="paymentFile" onChange={(e) => { const file = e.target.files[0]; if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); } }} />
                    <label htmlFor="paymentFile" className="cursor-pointer block">
                      {previewUrl ? <div><img src={previewUrl} className="max-h-32 mx-auto mb-2 rounded" /><p className="text-emerald-600">✓ {language === 'am' ? 'ማስረጃ ተመርጧል' : 'Screenshot selected'}</p></div> : <div><svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><p className="text-gray-500 mt-2">{language === 'am' ? 'የክፍያ ማስረጃ ለመጫን ጠቅ ያድርጉ' : 'Upload payment screenshot'}</p></div>}
                    </label>
                  </div>
                  <button onClick={handlePaymentSubmit} disabled={uploading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold">{uploading ? (language === 'am' ? 'በሂደት ላይ...' : 'Processing...') : (language === 'am' ? 'ክፍያ አስገባ እና ቲኬት አግኝ' : 'Submit Payment & Get Ticket')}</button>
                </div>
              </div>
            </div>
          )}

          {showTicket && participantData && (
            <div className="bg-white rounded-2xl border p-6">
              <TicketImage participant={participantData} pool={poolInfo} isVerified={false} seatNumbers={selectedSeats} ticketNumber={participantData.ticket_number} amount={participantData.contribution_amount} createdAt={participantData.created_at} poolType="city" />
              <button onClick={() => router.push('/dashboard')} className="mt-6 w-full bg-gray-600 text-white py-2 rounded-xl">{language === 'am' ? 'ወደ ዳሽቦርድ ሂድ' : 'Go to Dashboard'}</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
