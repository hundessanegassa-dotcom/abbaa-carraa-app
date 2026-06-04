// pages/cities/seat.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';
import Ticket from '../../components/Ticket';

export default function CitySeat() {
  const router = useRouter();
  const { city, type } = router.query;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [poolInfo, setPoolInfo] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [participantId, setParticipantId] = useState(null);
  const [showTicket, setShowTicket] = useState(false);
  const [participantData, setParticipantData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [reference, setReference] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [maxSeats] = useState(5);

  const vipPools = {
    daily: { name: "Daily Millionaire", entryFee: 500, prize: 1000000, totalSeats: 2400, drawDate: "Every Day at 8:00 PM", color: "from-gray-700 to-gray-900" },
    weekly: { name: "Weekly Mega Winner", entryFee: 2500, prize: 10000000, totalSeats: 4800, drawDate: "Every Sunday at 6:00 PM", color: "from-gray-700 to-gray-900" },
    monthly: { name: "Monthly Winner", entryFee: 5000, prize: 40000000, totalSeats: 9600, drawDate: "Last Day of Month at 8:00 PM", color: "from-gray-700 to-gray-900" }
  };

  useEffect(() => {
    checkUser();
    if (type && vipPools[type]) setPoolInfo(vipPools[type]);
    else if (type && !vipPools[type]) { toast.error('Invalid pool type'); router.push(`/cities/${city}`); }
  }, [type, city]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      sessionStorage.setItem('redirectAfterLogin', `/cities/seat?city=${city}&type=${type}`);
      router.push('/login');
      return;
    }
    setUser(user);
    setLoading(false);
  };

  const validateFile = (file) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) throw new Error('Please upload a valid image file');
    if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB');
    return true;
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
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
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

  const handlePaymentSubmit = async () => {
    if (!reference.trim()) { toast.error('Please enter reference number'); return; }
    if (!selectedFile) { toast.error('Please upload payment screenshot'); return; }
    
    setUploading(true);
    try {
      validateFile(selectedFile);
      const compressedFile = await compressImage(selectedFile);
      const fileName = `city-payments/${participantId}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('payment-proofs').upload(fileName, compressedFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('payment-proofs').getPublicUrl(fileName);
      
      await supabase.from('city_vip_participants').update({
        payment_status: 'pending_verification',
        payment_proof_url: publicUrl,
        reference: reference,
        payment_submitted_at: new Date().toISOString()
      }).eq('id', participantId);
      
      const { data: updatedParticipant } = await supabase.from('city_vip_participants').select('*').eq('id', participantId).single();
      setParticipantData(updatedParticipant);
      setShowPayment(false);
      setShowTicket(true);
      toast.success('Payment submitted! Your unverified ticket is ready');
    } catch (error) {
      toast.error(error.message || 'Failed to submit payment');
    } finally {
      setUploading(false);
    }
  };

  const toggleSeat = (seatNum) => {
    if (selectedSeats.includes(seatNum)) setSelectedSeats(selectedSeats.filter(s => s !== seatNum));
    else if (selectedSeats.length < maxSeats) setSelectedSeats([...selectedSeats, seatNum]);
    else toast.error(`Max ${maxSeats} seats`);
  };

  const confirmSeats = async () => {
    if (selectedSeats.length === 0) { toast.error('Select at least one seat'); return; }
    setLoading(true);
    try {
      const ticketNumber = `CITY-${type.toUpperCase()}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      const totalAmount = selectedSeats.length * poolInfo.entryFee;
      const { data: participant, error } = await supabase.from('city_vip_participants').insert({
        user_id: user.id, user_email: user.email, user_name: user.user_metadata?.full_name || user.email.split('@')[0],
        pool_type: type, city: city, seat_numbers: selectedSeats,
        contribution_amount: totalAmount, prize_amount: poolInfo.prize, payment_status: 'pending',
        ticket_number: ticketNumber, status: 'active', created_at: new Date().toISOString()
      }).select().single();
      if (error) throw error;
      setParticipantId(participant.id);
      setShowPayment(true);
    } catch (error) { toast.error('Failed: ' + error.message); }
    finally { setLoading(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div></div>;
  if (!poolInfo) return null;

  const totalAmount = selectedSeats.length * poolInfo.entryFee;
  const totalSeatsCount = poolInfo.totalSeats;
  const seatNumbers = Array.from({ length: totalSeatsCount }, (_, i) => i + 1);

  return (
    <>
      <Head><title>Select Seats - {city} {poolInfo.name} | Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <button onClick={() => router.back()} className="text-gray-600 mb-4">← Back to {city} VIP</button>
          
          <div className={`bg-gradient-to-r ${poolInfo.color} rounded-2xl p-6 text-white mb-6`}>
            <h1 className="text-2xl font-bold">{city} - {poolInfo.name}</h1>
            <p>Entry Fee: ETB {poolInfo.entryFee.toLocaleString()} | Prize: ETB {poolInfo.prize.toLocaleString()}</p>
          </div>

          {!showPayment && !showTicket && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Select Your Seats (Max {maxSeats})</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                <p>Entry Fee: ETB {poolInfo.entryFee.toLocaleString()} per seat | Total Seats: {totalSeatsCount.toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-10 md:grid-cols-15 gap-2 mb-6 max-h-96 overflow-y-auto p-4 bg-gray-50 rounded-xl">
                {seatNumbers.map(seatNum => (
                  <button key={seatNum} onClick={() => toggleSeat(seatNum)}
                    className={`w-10 h-10 rounded-lg font-semibold transition ${selectedSeats.includes(seatNum) ? 'bg-green-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>
                    {seatNum}
                  </button>
                ))}
              </div>
              {selectedSeats.length > 0 && (
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-4">
                    <div><p className="text-gray-500">Selected Seats</p><p className="font-bold">{selectedSeats.sort((a,b)=>a-b).join(', ')}</p></div>
                    <div className="text-right"><p className="text-gray-500">Total Amount</p><p className="font-bold text-2xl text-green-600">ETB {totalAmount.toLocaleString()}</p></div>
                  </div>
                  <button onClick={confirmSeats} disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold">Confirm & Proceed to Payment</button>
                </div>
              )}
            </div>
          )}

          {/* Payment Modal */}
          {showPayment && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
                <div className="sticky top-0 bg-white border-b p-5 flex justify-between">
                  <h2 className="text-xl font-bold">Complete Payment</h2>
                  <button onClick={() => { setShowPayment(false); setParticipantId(null); }} className="text-2xl">×</button>
                </div>
                <div className="p-6">
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 text-center">
                    <p>City: {city}</p>
                    <p>Seats: {selectedSeats.join(', ')}</p>
                    <p className="text-2xl font-bold text-green-600">ETB {totalAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <p className="font-semibold">📱 TeleBirr: 0913277922</p>
                    <p className="font-semibold">🏦 CBE Bank: 1000601091686</p>
                    <p className="text-sm">Account Name: Negassa Hundessa</p>
                  </div>
                  <input type="text" placeholder="Reference Number" className="w-full border rounded-lg p-2 mb-3" value={reference} onChange={(e) => setReference(e.target.value)} />
                  <div className="border-2 border-dashed rounded-lg p-4 text-center mb-4">
                    <input type="file" accept="image/*" className="hidden" id="paymentFile" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
                    }} />
                    <label htmlFor="paymentFile" className="cursor-pointer">
                      {previewUrl ? <img src={previewUrl} className="max-h-32 mx-auto" /> : <div>📸 Click to upload screenshot</div>}
                    </label>
                  </div>
                  <button onClick={handlePaymentSubmit} disabled={uploading} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold">{uploading ? 'Submitting...' : 'Submit Payment & Get Ticket'}</button>
                </div>
              </div>
            </div>
          )}

          {/* Unverified Ticket Display */}
          {showTicket && participantData && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <Ticket participant={participantData} pool={poolInfo} isVerified={false} seatNumbers={selectedSeats} />
              <div className="text-center mt-6">
                <button onClick={() => router.push('/dashboard')} className="bg-gray-600 text-white px-6 py-2 rounded-lg">Go to Dashboard</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
