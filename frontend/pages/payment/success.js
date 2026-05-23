import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import ParticipationCard from '../../components/ParticipationCard';

export default function PaymentSuccess() {
  const router = useRouter();
  const { tx_ref, pool_id, contribution_id, seats, demo } = router.query;
  const [status, setStatus] = useState('verifying');
  const [contribution, setContribution] = useState(null);
  const [pool, setPool] = useState(null);
  const [user, setUser] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState([]);

  useEffect(() => {
    if (tx_ref || contribution_id) {
      verifyTransaction();
    }
  }, [tx_ref, contribution_id]);

  async function verifyTransaction() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Get contribution details
      let contributionData = null;
      
      if (contribution_id) {
        const { data } = await supabase
          .from('contributions')
          .select('*')
          .eq('id', contribution_id)
          .single();
        contributionData = data;
      } else if (tx_ref) {
        const { data } = await supabase
          .from('contributions')
          .select('*')
          .eq('tx_ref', tx_ref)
          .single();
        contributionData = data;
      }

      if (contributionData) {
        setContribution(contributionData);
        
        // Parse seat numbers from contribution or query
        let seatNumbers = [];
        if (contributionData.seat_numbers) {
          seatNumbers = contributionData.seat_numbers;
        } else if (seats) {
          seatNumbers = seats.split(',').map(Number);
        }
        setSelectedSeats(seatNumbers);

        // Get pool details
        const { data: poolData } = await supabase
          .from('pools')
          .select('*')
          .eq('id', contributionData.pool_id)
          .single();
        setPool(poolData);

        // If payment is confirmed, mark seats as taken
        if (contributionData.status !== 'completed') {
          // Mark seats as taken
          if (seatNumbers.length > 0) {
            const { error: seatError } = await supabase
              .from('pool_seats')
              .update({
                status: 'taken',
                user_id: user.id,
                contribution_id: contributionData.id,
                updated_at: new Date().toISOString()
              })
              .in('seat_number', seatNumbers)
              .eq('pool_id', poolData.id);

            if (seatError) {
              console.error('Error marking seats:', seatError);
            }
          }

          // Update contribution status
          await supabase
            .from('contributions')
            .update({ 
              status: 'completed',
              completed_at: new Date().toISOString()
            })
            .eq('id', contributionData.id);

          // Update pool current amount
          await supabase
            .from('pools')
            .update({ 
              current_amount: (poolData.current_amount || 0) + contributionData.amount
            })
            .eq('id', poolData.id);
        }

        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setStatus('error');
    }
  }

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying your payment...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait while we confirm your transaction</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-20 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
          <p className="text-gray-500 mb-6">
            We couldn't verify your payment. Please contact support.
          </p>
          <Link href="/support" className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition inline-block">
            Contact Support
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      {/* Confetti Animation */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'][Math.floor(Math.random() * 5)],
              width: '8px',
              height: '8px',
              borderRadius: '2px'
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center transform transition-all duration-500 animate-slideUp">
          {/* Success Animation */}
          <div className="relative">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-ping opacity-75"></div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🎉 Payment Successful!</h1>
          <p className="text-gray-500 mb-6">
            You have successfully joined <strong className="text-green-600">{pool?.prize_name}</strong>
          </p>

          {/* Seat Information */}
          {selectedSeats.length > 0 && (
            <div className="bg-blue-50 rounded-2xl p-4 mb-6 text-left">
              <p className="text-sm text-blue-800 font-semibold mb-2">🎟️ Your Seats</p>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.sort((a,b) => a-b).map(seat => (
                  <span key={seat} className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-mono">
                    Seat #{seat}
                  </span>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Total: ETB {contribution?.amount?.toLocaleString()} ({selectedSeats.length} seats)
              </p>
            </div>
          )}

          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800 flex items-center justify-center gap-2">
              <span>💚</span>
              <span>2% of your contribution supports kidney and heart disease treatment</span>
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowCard(true)}
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white py-3.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Get My Participation Card
            </button>
            
            <div className="flex gap-3">
              <Link href="/dashboard" className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 transition text-center">
                Go to Dashboard
              </Link>
              <Link href="/listings" className="flex-1 border border-green-600 text-green-600 py-2.5 rounded-xl font-semibold hover:bg-green-50 transition text-center">
                Browse More
              </Link>
            </div>
          </div>
        </div>
      </div>

      {showCard && contribution && pool && user && (
        <ParticipationCard
          contribution={contribution}
          pool={pool}
          user={user}
          selectedSeats={selectedSeats}
          onClose={() => setShowCard(false)}
        />
      )}

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes confetti {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
        .animate-bounce { animation: bounce 0.5s ease-out; }
        .animate-ping { animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-confetti { animation: confetti 4s ease-out forwards; position: absolute; top: 0; }
      `}</style>
    </div>
  );
}
