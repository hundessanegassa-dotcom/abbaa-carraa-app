// pages/admin/bank-transfers.js - FIXED with AdminLayout
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout'; // ✅ ADDED

export default function AdminBankTransfers() {
  const router = useRouter();
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profile);

      const { data: adminRecord } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (profile?.role !== 'admin' && !adminRecord) {
        toast.error('Admin access required');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      await fetchTransfers();
    } catch (error) {
      console.error('Admin check error:', error);
      toast.error('Failed to verify admin access');
      router.push('/dashboard');
    }
  }

  async function fetchTransfers() {
    setLoading(true);
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
    const toastId = toast.loading('Verifying payment...');

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
          toast.error(`Seats ${unavailableSeats.map(s => s.seat_number).join(', ')} are no longer available`, { id: toastId });
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
          verified_by: user?.id
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
          message: `Your payment of ETB ${amount.toLocaleString()} has been verified. Seats ${seatNumbers?.join(', ') || 'N/A'} are now confirmed!`,
          metadata: { pool_id: poolId, seat_numbers: seatNumbers }
        });

      toast.success('Payment verified! User seats confirmed.', { id: toastId });
      await fetchTransfers();
      setSelectedTransfer(null);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify payment', { id: toastId });
    } finally {
      setProcessing(false);
    }
  }

  async function rejectTransfer(transferId, userId, poolId, seatNumbers) {
    setProcessing(true);
    const toastId = toast.loading('Rejecting payment...');

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
          message: `Your payment of ETB ${seatNumbers?.length * 100 || 'N/A'} could not be verified. Please contact support or try again.`,
        });

      toast.success('Payment rejected', { id: toastId });
      await fetchTransfers();
      setSelectedTransfer(null);
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject payment', { id: toastId });
    } finally {
      setProcessing(false);
    }
  }

  if (!isAdmin) return null;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="Bank Transfer Verification"
      subtitle={`${transfers.length} pending transfers to verify`}
      icon="🏦"
      user={user}
      profile={profile}
      activeTab="bank-transfers"
    >
      {transfers.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-12 text-center border border-gray-200">
          <div className="text-5xl mb-3">✅</div>
          <p className="text-gray-500 text-lg">No pending bank transfers to verify</p>
          <p className="text-sm text-gray-400 mt-2">All transfers have been processed</p>
          <button
            onClick={fetchTransfers}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
          >
            🔄 Refresh
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <h2 className="font-bold text-lg">Pending Transfers ({transfers.length})</h2>
              <button
                onClick={fetchTransfers}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
              >
                🔄 Refresh
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {transfers.map((transfer) => (
                <div key={transfer.id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg">{transfer.pools?.prize_name}</h3>
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm flex items-center gap-1">
                        👤 {transfer.profiles?.full_name} 
                        <span className="text-gray-400">({transfer.profiles?.email})</span>
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1 text-sm">
                        <p className="text-gray-500">📞 {transfer.profiles?.phone || 'No phone'}</p>
                        <p className="text-gray-500">💰 ETB {transfer.amount?.toLocaleString()}</p>
                        <p className="text-gray-500">🔖 {transfer.reference}</p>
                        <p className="text-gray-500">🎟️ Seats: {transfer.seat_numbers?.join(', ') || 'N/A'}</p>
                        <p className="text-gray-400 text-xs col-span-full">
                          📅 Submitted: {new Date(transfer.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedTransfer(transfer)}
                      disabled={processing}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 flex items-center gap-1"
                    >
                      📸 View Proof
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Proof Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => !processing && setSelectedTransfer(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">📸 Payment Proof</h2>
              <button 
                onClick={() => setSelectedTransfer(null)} 
                className="text-gray-500 hover:text-gray-700 text-2xl transition"
                disabled={processing}
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              {selectedTransfer.proof_image && (
                <div className="mb-4 border rounded-lg overflow-hidden">
                  <img
                    src={selectedTransfer.proof_image}
                    alt="Payment Proof"
                    className="w-full h-auto"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4 mb-6">
                <p><strong>👤 User:</strong> {selectedTransfer.profiles?.full_name}</p>
                <p><strong>📞 Phone:</strong> {selectedTransfer.profiles?.phone || 'N/A'}</p>
                <p><strong>💰 Amount:</strong> ETB {selectedTransfer.amount?.toLocaleString()}</p>
                <p><strong>🔖 Reference:</strong> {selectedTransfer.reference}</p>
                <p><strong>🎯 Pool:</strong> {selectedTransfer.pools?.prize_name}</p>
                <p><strong>🎟️ Seats:</strong> {selectedTransfer.seat_numbers?.join(', ') || 'N/A'}</p>
                <p className="col-span-full"><strong>📅 Submitted:</strong> {new Date(selectedTransfer.created_at).toLocaleString()}</p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => verifyTransfer(
                    selectedTransfer.id,
                    selectedTransfer.user_id,
                    selectedTransfer.pool_id,
                    selectedTransfer.amount,
                    selectedTransfer.seat_numbers
                  )}
                  disabled={processing}
                  className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {processing ? '⏳ Processing...' : '✅ Verify & Confirm'}
                </button>
                <button
                  onClick={() => rejectTransfer(
                    selectedTransfer.id,
                    selectedTransfer.user_id,
                    selectedTransfer.pool_id,
                    selectedTransfer.seat_numbers
                  )}
                  disabled={processing}
                  className="flex-1 min-w-[120px] bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  ❌ Reject
                </button>
                <button
                  onClick={() => setSelectedTransfer(null)}
                  className="flex-1 min-w-[120px] bg-gray-300 hover:bg-gray-400 text-gray-700 py-2.5 rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
