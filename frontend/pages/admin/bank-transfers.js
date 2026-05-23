export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function AdminBankTransfers() {
  const router = useRouter();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/');
      return;
    }

    setIsAdmin(true);
    await fetchTransfers();
  }

  async function fetchTransfers() {
    try {
      const { data, error } = await supabase
        .from('bank_transfers')
        .select(`
          *,
          profiles!user_id (id, full_name, email, phone),
          pools!pool_id (id, prize_name, target_amount, current_amount)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  }

  async function verifyTransfer(transferId, userId, poolId, amount, seatNumbers) {
    setProcessing(true);
    toast.loading('Verifying payment...', { id: 'verify' });

    try {
      // 1. Check if seats are still available
      if (seatNumbers && seatNumbers.length > 0) {
        const { data: seats, error: seatCheckError } = await supabase
          .from('pool_seats')
          .select('seat_number, status')
          .in('seat_number', seatNumbers)
          .eq('pool_id', poolId);

        if (seatCheckError) throw seatCheckError;

        const unavailableSeats = seats.filter(s => s.status !== 'available');
        if (unavailableSeats.length > 0) {
          toast.error(`Seats ${unavailableSeats.map(s => s.seat_number).join(', ')} are no longer available`, { id: 'verify' });
          setProcessing(false);
          return;
        }
      }

      // 2. Update transfer status
      const { error: updateError } = await supabase
        .from('bank_transfers')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', transferId);

      if (updateError) throw updateError;

      // 3. Mark seats as taken
      if (seatNumbers && seatNumbers.length > 0) {
        const { error: seatError } = await supabase
          .from('pool_seats')
          .update({ 
            status: 'taken', 
            user_id: userId,
            taken_at: new Date().toISOString()
          })
          .in('seat_number', seatNumbers)
          .eq('pool_id', poolId);

        if (seatError) throw seatError;
      }

      // 4. Create contribution record
      const { error: contribError } = await supabase
        .from('contributions')
        .insert({
          user_id: userId,
          pool_id: poolId,
          amount: amount,
          status: 'completed',
          payment_method: 'bank_transfer',
          seat_numbers: seatNumbers,
          created_at: new Date().toISOString()
        });

      if (contribError) throw contribError;

      // 5. Update pool current amount
      const { data: pool } = await supabase
        .from('pools')
        .select('current_amount')
        .eq('id', poolId)
        .single();

      await supabase
        .from('pools')
        .update({ 
          current_amount: (pool?.current_amount || 0) + amount
        })
        .eq('id', poolId);

      // 6. Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'payment_verified',
          title: '✅ Payment Verified!',
          message: `Your payment of ETB ${amount.toLocaleString()} has been verified. Seats ${seatNumbers?.join(', ')} are now confirmed!`,
          metadata: { pool_id: poolId, seat_numbers: seatNumbers }
        });

      toast.success('Payment verified! User seats confirmed.', { id: 'verify' });
      await fetchTransfers();
      setSelectedTransfer(null);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify payment', { id: 'verify' });
    } finally {
      setProcessing(false);
    }
  }

  async function rejectTransfer(transferId, userId, poolId, seatNumbers) {
    setProcessing(true);
    toast.loading('Rejecting payment...', { id: 'reject' });

    try {
      // 1. Update transfer status
      const { error } = await supabase
        .from('bank_transfers')
        .update({ 
          status: 'rejected',
          rejected_at: new Date().toISOString()
        })
        .eq('id', transferId);

      if (error) throw error;

      // 2. Release seats back to available
      if (seatNumbers && seatNumbers.length > 0) {
        await supabase
          .from('pool_seats')
          .update({ 
            status: 'available',
            user_id: null,
            reserved_by: null,
            reserved_until: null
          })
          .in('seat_number', seatNumbers)
          .eq('pool_id', poolId);
      }

      // 3. Send notification to user
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'payment_rejected',
          title: '❌ Payment Rejected',
          message: `Your payment of ETB ${seatNumbers?.length * 100} could not be verified. Please contact support or try again.`,
        });

      toast.success('Payment rejected', { id: 'reject' });
      await fetchTransfers();
      setSelectedTransfer(null);
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject payment', { id: 'reject' });
    } finally {
      setProcessing(false);
    }
  }

  if (!isAdmin) return null;
  if (loading) return <div className="text-center py-12">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">🏦 Bank Transfer Verification</h1>

        {transfers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-gray-500">No pending bank transfers to verify</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{transfer.pools?.prize_name}</h3>
                    <p className="text-gray-600 text-sm">
                      👤 {transfer.profiles?.full_name} ({transfer.profiles?.email})
                    </p>
                    <p className="text-gray-500 text-sm">📞 {transfer.profiles?.phone || 'No phone'}</p>
                    <p className="text-gray-500 text-sm">💰 Amount: ETB {transfer.amount?.toLocaleString()}</p>
                    <p className="text-gray-500 text-sm">🔖 Reference: {transfer.reference}</p>
                    <p className="text-gray-500 text-sm">🎟️ Seats: {transfer.seat_numbers?.join(', ') || 'N/A'}</p>
                    <p className="text-gray-400 text-xs">
                      📅 Submitted: {new Date(transfer.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedTransfer(transfer)}
                      disabled={processing}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      View Proof
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Proof Modal */}
        {selectedTransfer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">📸 Payment Proof</h2>
                
                {selectedTransfer.proof_image && (
                  <div className="mb-4">
                    <img
                      src={selectedTransfer.proof_image}
                      alt="Payment Proof"
                      className="w-full rounded-lg border"
                    />
                  </div>
                )}

                <div className="space-y-2 mb-6">
                  <p><strong>👤 User:</strong> {selectedTransfer.profiles?.full_name}</p>
                  <p><strong>📞 Phone:</strong> {selectedTransfer.profiles?.phone || 'N/A'}</p>
                  <p><strong>💰 Amount:</strong> ETB {selectedTransfer.amount?.toLocaleString()}</p>
                  <p><strong>🔖 Reference:</strong> {selectedTransfer.reference}</p>
                  <p><strong>🎯 Pool:</strong> {selectedTransfer.pools?.prize_name}</p>
                  <p><strong>🎟️ Seats:</strong> {selectedTransfer.seat_numbers?.join(', ') || 'N/A'}</p>
                  <p><strong>📅 Submitted:</strong> {new Date(selectedTransfer.created_at).toLocaleString()}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => verifyTransfer(
                      selectedTransfer.id,
                      selectedTransfer.user_id,
                      selectedTransfer.pool_id,
                      selectedTransfer.amount,
                      selectedTransfer.seat_numbers
                    )}
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : '✅ Verify & Confirm Seats'}
                  </button>
                  <button
                    onClick={() => rejectTransfer(
                      selectedTransfer.id,
                      selectedTransfer.user_id,
                      selectedTransfer.pool_id,
                      selectedTransfer.seat_numbers
                    )}
                    disabled={processing}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    ❌ Reject
                  </button>
                  <button
                    onClick={() => setSelectedTransfer(null)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
