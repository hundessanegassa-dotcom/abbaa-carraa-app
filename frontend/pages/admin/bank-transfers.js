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
          profiles!user_id (full_name, email, phone),
          pools!pool_id (prize_name, target_amount)
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

  async function verifyTransfer(transferId, userId, poolId, amount) {
    try {
      // Update transfer status
      const { error: updateError } = await supabase
        .from('bank_transfers')
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', transferId);

      if (updateError) throw updateError;

      // Create contribution record
      const { error: contribError } = await supabase
        .from('contributions')
        .insert({
          user_id: userId,
          pool_id: poolId,
          amount: amount,
          status: 'completed',
          payment_method: 'bank_transfer',
          created_at: new Date().toISOString()
        });

      if (contribError) throw contribError;

      // Update pool current amount
      await supabase.rpc('increment_pool_amount', {
        pool_id: poolId,
        amount: amount
      });

      toast.success('Payment verified! User entry added to pool.');
      fetchTransfers();
      setSelectedTransfer(null);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Failed to verify payment');
    }
  }

  async function rejectTransfer(transferId) {
    try {
      const { error } = await supabase
        .from('bank_transfers')
        .update({ status: 'rejected' })
        .eq('id', transferId);

      if (error) throw error;
      toast.success('Transfer rejected');
      fetchTransfers();
      setSelectedTransfer(null);
    } catch (error) {
      console.error('Rejection error:', error);
      toast.error('Failed to reject transfer');
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
            <p className="text-gray-500">No pending bank transfers to verify</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{transfer.pools?.prize_name}</h3>
                    <p className="text-gray-500 text-sm">
                      User: {transfer.profiles?.full_name} ({transfer.profiles?.email})
                    </p>
                    <p className="text-gray-500 text-sm">Phone: {transfer.profiles?.phone}</p>
                    <p className="text-gray-500 text-sm">Amount: ETB {transfer.amount?.toLocaleString()}</p>
                    <p className="text-gray-500 text-sm">Reference: {transfer.reference}</p>
                    <p className="text-gray-500 text-sm">
                      Date: {new Date(transfer.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedTransfer(transfer)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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
                <h2 className="text-xl font-bold mb-4">Payment Proof</h2>
                
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
                  <p><strong>User:</strong> {selectedTransfer.profiles?.full_name}</p>
                  <p><strong>Amount:</strong> ETB {selectedTransfer.amount?.toLocaleString()}</p>
                  <p><strong>Reference:</strong> {selectedTransfer.reference}</p>
                  <p><strong>Pool:</strong> {selectedTransfer.pools?.prize_name}</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => verifyTransfer(
                      selectedTransfer.id,
                      selectedTransfer.user_id,
                      selectedTransfer.pool_id,
                      selectedTransfer.amount
                    )}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                  >
                    ✅ Verify & Activate
                  </button>
                  <button
                    onClick={() => rejectTransfer(selectedTransfer.id)}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700"
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
