import { supabase } from '../../lib/supabase';
import { verifyPayment } from '../../lib/chapa';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { tx_ref, status } = req.body;
  
  console.log('Chapa callback received:', { tx_ref, status });
  
  if (status === 'success' && tx_ref) {
    // Verify the payment with Chapa
    const verification = await verifyPayment(tx_ref);
    
    if (verification.success && verification.status === 'success') {
      // Get transaction from database
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('tx_ref', tx_ref)
        .single();
      
      if (transaction && transaction.status === 'pending') {
        // Update transaction status
        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            payment_data: verification.data
          })
          .eq('tx_ref', tx_ref);
        
        // Create contribution record
        const { error: contributionError } = await supabase
          .from('contributions')
          .insert({
            user_id: transaction.user_id,
            pool_id: transaction.pool_id,
            amount: transaction.amount,
            status: 'completed',
            transaction_ref: tx_ref,
            created_at: new Date().toISOString()
          });
        
        if (contributionError) {
          console.error('Contribution error:', contributionError);
        } else {
          // Update pool current amount
          const { data: pool } = await supabase
            .from('pools')
            .select('current_amount')
            .eq('id', transaction.pool_id)
            .single();
          
          await supabase
            .from('pools')
            .update({
              current_amount: (pool.current_amount || 0) + transaction.amount
            })
            .eq('id', transaction.pool_id);
          
          // Send notification to user
          console.log(`Payment confirmed for user ${transaction.user_id}: ETB ${transaction.amount}`);
        }
      }
    }
  }
  
  res.status(200).json({ received: true });
}
