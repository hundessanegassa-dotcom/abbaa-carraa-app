/**
 * Commission Calculation for Abbaa Carraa Ethio
 * 
 * Standard Commission Structure (Non-Admin):
 * - Winner gets 100% of target amount
 * - Pool Creator earns 10% of target amount
 * - Platform earns 10% of target amount
 * - Total collected = target + 20% (120% of target)
 * 
 * Admin Commission Structure:
 * - Winner gets 100% of target amount
 * - Admin Creator earns 20% of target amount (full commission)
 * - Platform earns 0%
 * - Total collected = target + 20% (120% of target)
 */

/**
 * Calculate commission for a pool
 * @param {number} targetAmount - The amount winner receives (in ETB)
 * @param {boolean} isAdmin - Whether the pool creator is an admin
 * @returns {Object} Commission details
 */
export function calculateCommission(targetAmount, isAdmin = false) {
  const totalCommissionRate = 0.20; // 20% total added
  const totalCommission = targetAmount * totalCommissionRate;
  
  if (isAdmin) {
    // Admin gets full 20% commission
    return {
      targetAmount: targetAmount,
      totalCommission: totalCommission,
      creatorCommission: totalCommission, // Admin gets all 20%
      platformCommission: 0,
      totalCollection: targetAmount + totalCommission,
      creatorRate: 20,
      platformRate: 0,
      // Additional helpful fields
      totalCommissionRate: 20,
      winnerPercentage: 100,
      creatorPercentage: 20,
      platformPercentage: 0
    };
  } else {
    // Regular user gets 10%, platform gets 10%
    const creatorCommission = targetAmount * 0.10; // 10% of target
    const platformCommission = targetAmount * 0.10; // 10% of target
    
    return {
      targetAmount: targetAmount,
      totalCommission: totalCommission,
      creatorCommission: creatorCommission,
      platformCommission: platformCommission,
      totalCollection: targetAmount + totalCommission,
      creatorRate: 10,
      platformRate: 10,
      // Additional helpful fields
      totalCommissionRate: 20,
      winnerPercentage: 100,
      creatorPercentage: 10,
      platformPercentage: 10
    };
  }
}

/**
 * Format commission for display
 * @param {number} targetAmount - The amount winner receives (in ETB)
 * @param {boolean} isAdmin - Whether the pool creator is an admin
 * @returns {Object} Formatted commission strings
 */
export function formatCommission(targetAmount, isAdmin = false) {
  const calc = calculateCommission(targetAmount, isAdmin);
  
  return {
    winnerGets: `ETB ${calc.targetAmount.toLocaleString()}`,
    creatorGets: `ETB ${calc.creatorCommission.toLocaleString()} (${calc.creatorRate}%)`,
    platformGets: `ETB ${calc.platformCommission.toLocaleString()} (${calc.platformRate}%)`,
    totalCollection: `ETB ${calc.totalCollection.toLocaleString()}`,
    // Additional helpful formats
    summary: `${calc.creatorRate}% commission for you, ${calc.platformRate}% for platform`,
    shortSummary: isAdmin ? 'You earn 20% commission!' : 'You earn 10% commission!'
  };
}

/**
 * Calculate number of seats/contributions needed
 * @param {number} targetAmount - Total target amount
 * @param {number} contributionAmount - Amount per seat/ticket
 * @returns {Object} Seat calculation
 */
export function calculateSeats(targetAmount, contributionAmount) {
  if (!contributionAmount || contributionAmount <= 0) {
    return { seats: 0, total: targetAmount, remaining: targetAmount };
  }
  
  const seats = Math.ceil(targetAmount / contributionAmount);
  const total = seats * contributionAmount;
  const remaining = total - targetAmount;
  const overage = remaining > 0 ? remaining : 0;
  
  return {
    seats: seats,
    totalCollection: total,
    targetAmount: targetAmount,
    overage: overage,
    contributionAmount: contributionAmount,
    // For display
    formattedSeats: `${seats} seat${seats !== 1 ? 's' : ''}`,
    formattedOverage: overage > 0 ? `ETB ${overage.toLocaleString()} extra` : 'Exact match'
  };
}

/**
 * Calculate what a winner actually gets after deductions
 * @param {number} targetAmount - Prize value
 * @returns {Object} Winner payout details
 */
export function calculateWinnerPayout(targetAmount) {
  const charityDeduction = targetAmount * 0.02; // 2% for charity
  const netToWinner = targetAmount - charityDeduction;
  
  return {
    grossAmount: targetAmount,
    charityContribution: charityDeduction,
    netAmount: netToWinner,
    charityPercentage: 2,
    // For display
    formattedGross: `ETB ${targetAmount.toLocaleString()}`,
    formattedCharity: `ETB ${charityDeduction.toLocaleString()}`,
    formattedNet: `ETB ${netToWinner.toLocaleString()}`
  };
}

/**
 * Calculate referral bonus for referred users
 * @param {number} contributionAmount - Amount the referred user contributed
 * @returns {Object} Bonus calculation
 */
export function calculateReferralBonus(contributionAmount) {
  const bonusRate = 0.05; // 5% bonus for referrer
  const discountRate = 0.10; // 10% discount for new user
  const referrerBonus = contributionAmount * bonusRate;
  const newUserDiscount = contributionAmount * discountRate;
  
  return {
    referrerBonus: referrerBonus,
    newUserDiscount: newUserDiscount,
    referrerBonusRate: 5,
    newUserDiscountRate: 10,
    formattedReferrerBonus: `ETB ${referrerBonus.toLocaleString()}`,
    formattedNewUserDiscount: `ETB ${newUserDiscount.toLocaleString()}`
  };
}

/**
 * Calculate platform earnings breakdown
 * @param {number} totalVolume - Total platform transaction volume
 * @returns {Object} Platform earnings
 */
export function calculatePlatformEarnings(totalVolume) {
  const platformCommissionRate = 0.10; // 10% from non-admin pools
  const charityRate = 0.02; // 2% for charity
  const platformRevenue = totalVolume * platformCommissionRate;
  const charityFund = totalVolume * charityRate;
  
  return {
    totalVolume: totalVolume,
    platformRevenue: platformRevenue,
    charityFund: charityFund,
    platformRate: 10,
    charityRate: 2,
    formattedPlatformRevenue: `ETB ${platformRevenue.toLocaleString()}`,
    formattedCharityFund: `ETB ${charityFund.toLocaleString()}`
  };
}

/**
 * Get commission summary by role
 * @param {string} role - User role (individual, agent, vendor, organization, admin)
 * @returns {Object} Role-specific commission info
 */
export function getRoleCommission(role) {
  const commissionMap = {
    individual: {
      asCreator: 10,
      asParticipant: 0,
      description: 'Earn 10% when you create a pool. No commission for joining pools.'
    },
    agent: {
      asCreator: 10,
      asParticipant: 0,
      description: 'Create pools and earn 10% commission on each pool!'
    },
    vendor: {
      asCreator: 10,
      asParticipant: 0,
      description: 'List products, earn 10% commission when pools are created from your products.'
    },
    organization: {
      asCreator: 10,
      asParticipant: 0,
      description: 'Create private pools for members and earn 10% commission.'
    },
    admin: {
      asCreator: 20,
      asParticipant: 0,
      description: 'Admins earn 20% commission on pools they create.'
    }
  };
  
  return commissionMap[role] || commissionMap.individual;
}

// Example usage and test
if (typeof window !== 'undefined') {
  // For debugging in browser console
  window.commissionUtils = {
    calculateCommission,
    formatCommission,
    calculateSeats,
    calculateWinnerPayout,
    calculateReferralBonus,
    getRoleCommission
  };
}

export default {
  calculateCommission,
  formatCommission,
  calculateSeats,
  calculateWinnerPayout,
  calculateReferralBonus,
  calculatePlatformEarnings,
  getRoleCommission
};
