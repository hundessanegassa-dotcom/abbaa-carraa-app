import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { tx_ref, status, transactionId } = req.body;

  // Verify admin authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  // Update transaction
  const { error } = await supabase
    .from('transactions')
    .update({ 
      status: status === 'approved' ? 'completed' : 'failed',
      updated_at: new Date().toISOString(),
      verified_by: user.id,
      verified_at: new Date().toISOString()
    })
    .eq('tx_ref', tx_ref);

  if (error) {
    return res.status(500).json({ error: 'Failed to update transaction' });
  }

  // If approved, mark seats as taken
  if (status === 'approved') {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('tx_ref', tx_ref)
      .single();

    if (transaction && transaction.seat_numbers) {
      await supabase
        .from('pool_seats')
        .update({ status: 'taken', user_id: transaction.user_id })
        .in('seat_number', transaction.seat_numbers)
        .eq('pool_id', transaction.pool_id);

      // Update pool current amount
      await supabase
        .from('pools')
        .update({ 
          current_amount: supabase.raw(`current_amount + ${transaction.amount}`)
        })
        .eq('id', transaction.pool_id);
    }
  }

  res.status(200).json({ success: true });
}
