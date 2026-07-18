// pages/payment/merkato.js - Fixed with proper ticket generation
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';
import BankTransferUpload from '../../components/BankTransferUpload';
import { generateTicketImage } from '../../lib/ticketGenerator'; // ✅ FIXED: Using ticketGenerator function

export default function MerkatoPayment() {
  const router = useRouter();
  const isMounted = useRef(true);
  const { type, participant, seats, amount } = router.query;
  const [user, setUser] = useState(null);
  const [participantData, setParticipantData] = useState(null);
  const [poolInfo, setPoolInfo] = useState(null);
  const [showPayment, setShowPayment] = useState(true);
  const [ticketGenerated, setTicketGenerated] = useState(false);
  const [ticketImageUrl, setTicketImageUrl] = useState(null);

  const vipPools = {
    daily: { name: "Daily Millionaire", entryFee: 500, prize: 1000000, totalSeats: 2400, drawDate: "Every Day at 8:00 PM" },
    weekly: { name: "Weekly Mega Winner", entryFee: 2500, prize: 10000000, totalSeats: 4800, drawDate: "Every Sunday at 6:00 PM" },
    monthly: { name: "Monthly Winner", entryFee: 5000, prize: 40000000, totalSeats: 9600, drawDate: "Last Day of Month at 8:00 PM" }
  };

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

  const handlePaymentSuccess = async (paymentProofUrl, reference) => {
    if (isMounted.current) {
      setShowPayment(false);
      // Generate ticket image
      try {
        const ticketUrl = await generateTicketImage({
          participant: participantData,
          programType: 'merkato',
          tier: type,
          seatNumbers: getSeatNumbersArray(),
          ticketNumber: participantData?.ticket_number || `MK-${Date.now()}`,
          amount: parseInt(amount) || poolInfo.entryFee,
          prize: poolInfo.name,
          language: 'am',
          isVerified: false
        });
        setTicketImageUrl(ticketUrl);
      } catch (error) {
        console.error('Error generating ticket:', error);
        toast.error('Failed to generate ticket image');
      }
      setTicketGenerated(true);
    }
    
    const seatNumbersArray = seats ? (typeof seats === 'string' ? seats.split(',') : seats) : [];
    
    try {
      // Update participant status with payment info
      await supabase
        .from('merkato_vip_participants')
        .update({ 
          payment_status: 'pending_verification',
          payment_submitted_at: new Date().toISOString(),
          seat_numbers: seatNumbersArray,
          payment_proof_url: paymentProofUrl,
          reference: reference
        })
        .eq('id', participant);
      
      // Clear seat reservations
      await supabase
        .from('vip_seat_reservations')
        .delete()
        .eq('user_id', user?.id);
      
      toast.success('Payment submitted! Your unverified ticket is ready.');
    } catch (error) {
      console.error('Error updating participant:', error);
      toast.error('Failed to update payment status');
    }
  };

  const getSeatNumbersArray = () => {
    if (!seats) return [];
    return typeof seats === 'string' ? seats.split(',').map(Number) : seats;
  };

  if (!poolInfo) return null;

  const seatNumbersArray = getSeatNumbersArray();
  const totalAmount = parseInt(amount) || poolInfo.entryFee * (seatNumbersArray.length || 1);

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

          {showPayment && participantData && (
            <BankTransferUpload
              poolId={`merkato_${type}`}
              amount={totalAmount}
              seatNumbers={seatNumbersArray}
              onSuccess={handlePaymentSuccess}
              onClose={() => router.push('/merkato-vip')}
            />
          )}

          {ticketGenerated && participantData && (
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-bold text-center mb-6">🎫 Your Merkato VIP Ticket</h2>
              {ticketImageUrl ? (
                <div className="text-center">
                  <img src={ticketImageUrl} alt="Merkato VIP Ticket" className="mx-auto rounded-lg shadow-md mb-4" />
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-gray-500">Generating your ticket...</p>
                </div>
              )}
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
