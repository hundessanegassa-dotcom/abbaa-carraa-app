import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';
import BankTransferUpload from '../../components/BankTransferUpload';
import Ticket from '../../components/Ticket';

export default function MerkatoPayment() {
  const router = useRouter();
  const isMounted = useRef(true);
  const { type, participant, seats, amount } = router.query;
  const [user, setUser] = useState(null);
  const [participantData, setParticipantData] = useState(null);
  const [poolInfo, setPoolInfo] = useState(null);
  const [showPayment, setShowPayment] = useState(true);
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);

  const vipPools = {
    daily: { name: "Daily Millionaire", entryFee: 500, prize: 1000000, totalSeats: 2400 },
    weekly: { name: "Weekly Mega Winner", entryFee: 2500, prize: 10000000, totalSeats: 4800 },
    monthly: { name: "Monthly Winner", entryFee: 5000, prize: 40000000, totalSeats: 9600 }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    checkUser();
    if (type && vipPools[type]) {
      if (isMounted.current) setPoolInfo(vipPools[type]);
    }
    if (participant) {
      fetchParticipantData();
    }
  }, [type, participant]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      if (isMounted.current) setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
      router.push('/login');
    }
  };

  const fetchParticipantData = async () => {
    try {
      const { data, error } = await supabase
        .from('merkato_vip_participants')
        .select('*')
        .eq('id', participant)
        .single();
      
      if (!error && data && isMounted.current) {
        setParticipantData(data);
      }
    } catch (error) {
      console.error('Error fetching participant:', error);
    }
  };

  const handlePaymentSuccess = async () => {
    if (isMounted.current) {
      setPaymentSubmitted(true);
      setShowPayment(false);
      setTicketGenerated(true);
    }
    
    // Parse seat numbers into array
    const seatNumbersArray = seats ? (typeof seats === 'string' ? seats.split(',') : seats) : [];
    
    try {
      // Update participant status with seat numbers
      await supabase
        .from('merkato_vip_participants')
        .update({ 
          payment_status: 'pending_verification',
          payment_submitted_at: new Date().toISOString(),
          seat_numbers: seatNumbersArray
        })
        .eq('id', participant);
      
      toast.success('Payment submitted! Your unverified ticket is ready.');
    } catch (error) {
      console.error('Error updating participant:', error);
      toast.error('Failed to update payment status');
    }
  };

  // Parse seat numbers for Ticket component
  const getSeatNumbersArray = () => {
    if (!seats) return [];
    return typeof seats === 'string' ? seats.split(',') : seats;
  };

  if (!poolInfo) return null;

  return (
    <>
      <Head>
        <title>Payment - {poolInfo.name} | Abbaa Carraa</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <button 
            onClick={() => router.back()} 
            className="text-gray-600 hover:text-gray-800 mb-4 inline-flex items-center gap-1"
          >
            ← Back
          </button>

          {showPayment && (
            <BankTransferUpload
              poolId={`merkato_${type}`}
              amount={parseInt(amount) || poolInfo.entryFee}
              seatNumbers={getSeatNumbersArray()}
              onSuccess={handlePaymentSuccess}
              onClose={() => router.push('/merkato-vip')}
            />
          )}

          {ticketGenerated && participantData && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-center mb-6">🎫 Your Merkato VIP Ticket</h2>
              <Ticket
                participant={participantData}
                pool={poolInfo}
                isVerified={false}
                seatNumbers={getSeatNumbersArray()}
              />
              <div className="text-center mt-6">
                <p className="text-sm text-yellow-600">
                  ⏳ This is an UNVERIFIED ticket. Your seats will be confirmed after admin verifies your payment.
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mt-4 bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
