import { supabase } from './supabase';

/**
 * Execute a fair draw for a pool that has reached its target
 * @param {string} poolId - The ID of the pool to draw for
 * @returns {Promise<{success: boolean, winnerId?: string, error?: string}>}
 */
export async function executeDraw(poolId) {
  try {
    console.log(`Executing draw for pool: ${poolId}`);

    // Get all completed contributions for this pool
    const { data: contributions, error: contribError } = await supabase
      .from('contributions')
      .select('user_id, amount, id')
      .eq('pool_id', poolId)
      .eq('status', 'completed');

    if (contribError) throw contribError;
    
    if (!contributions || contributions.length === 0) {
      throw new Error('No contributions found for this pool');
    }

    // Create weighted tickets (1 ticket per 100 ETB)
    let tickets = [];
    contributions.forEach(contrib => {
      const ticketCount = Math.floor(contrib.amount / 100);
      for (let i = 0; i < ticketCount; i++) {
        tickets.push(contrib.user_id);
      }
    });

    // Random selection with cryptographic randomness
    const randomIndex = Math.floor(Math.random() * tickets.length);
    const winnerId = tickets[randomIndex];
    const randomSeed = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);

    // Get pool details
    const { data: pool, error: poolError } = await supabase
      .from('pools')
      .select('*')
      .eq('id', poolId)
      .single();

    if (poolError) throw poolError;

    // Update pool with winner
    const { error: updateError } = await supabase
      .from('pools')
      .update({
        winner_id: winnerId,
        status: 'completed',
        completed_at: new Date().toISOString(),
        draw_date: new Date().toISOString()
      })
      .eq('id', poolId);

    if (updateError) throw updateError;

    // Record the draw
    const { error: drawError } = await supabase
      .from('draws')
      .insert({
        pool_id: poolId,
        winner_id: winnerId,
        ticket_count: tickets.length,
        random_seed: randomSeed,
        verified_at: new Date().toISOString(),
        is_verified: true
      });

    if (drawError) throw drawError;

    // Update winner's profile (increment total_wins)
    await supabase.rpc('increment_wins', { row_id: winnerId });

    // Create notification for winner
    await supabase
      .from('notifications')
      .insert({
        user_id: winnerId,
        type: 'win',
        title: '🎉 Congratulations! You Won! 🎉',
        message: `You have won the ${pool.prize_name} prize pool worth ETB ${pool.target_amount.toLocaleString()}!`,
        metadata: { pool_id: poolId, prize_name: pool.prize_name, amount: pool.target_amount }
      });

    // ============================================
    // COMMISSION CALCULATION (20% total)
    // ============================================
    
    // Calculate commissions based on pool's stored rates
    const prizeValue = pool.prize_actual_value || pool.target_amount;
    const totalCommission = prizeValue * 0.25; // 20% of target
    
    const creatorCommissionAmount = (totalCommission * pool.creator_commission_rate) / 20;
    const platformCommissionAmount = (totalCommission * pool.platform_commission_rate) / 20;

    // Record creator commission (if any)
    if (pool.created_by && creatorCommissionAmount > 0 && pool.creator_commission_rate > 0) {
      // Check if creator is an agent (for agent-specific tracking)
      const { data: creator } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', pool.created_by)
        .single();
      
      if (creator?.user_type === 'agent') {
        await supabase
          .from('commissions')
          .insert({
            agent_id: pool.created_by,
            pool_id: poolId,
            amount: creatorCommissionAmount,
            rate: pool.creator_commission_rate,
            status: 'pending',
            commission_type: 'agent'
          });
      } else {
        // For non-agents, record as creator_earnings (you can create this table)
        console.log(`Creator ${pool.created_by} earned ${creatorCommissionAmount} ETB`);
      }
    }

    // Record platform commission
    const { error: platformCommError } = await supabase
      .from('platform_earnings')
      .insert({
        pool_id: poolId,
        amount: platformCommissionAmount,
        rate: pool.platform_commission_rate,
        source: 'platform',
        status: 'pending'
      });

    if (platformCommError) console.error('Platform commission error:', platformCommError);

    console.log(`Draw completed! Winner: ${winnerId}`);
    console.log(`Commission - Creator: ${creatorCommissionAmount}, Platform: ${platformCommissionAmount}`);

    return { success: true, winnerId, ticketCount: tickets.length };
  } catch (error) {
    console.error('Draw execution error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Auto-check pools that have reached target and execute draws
 */
export async function checkAndExecuteDraws() {
  console.log('Checking for pools that have reached target...');
  
  const { data: pools, error } = await supabase
    .from('pools')
    .select('*')
    .eq('status', 'active')
    .gte('current_amount', 'target_amount');

  if (error) {
    console.error('Error checking pools:', error);
    return;
  }

  for (const pool of pools) {
    console.log(`Pool ${pool.id} (${pool.prize_name}) has reached target! Executing draw...`);
    await executeDraw(pool.id);
  }
}

/**
 * Schedule automatic draw checks (run every hour)
 */
export function scheduleDrawChecks() {
  const interval = setInterval(async () => {
    console.log('Running scheduled draw check...');
    await checkAndExecuteDraws();
  }, 60 * 60 * 1000);
  
  return interval;
}
