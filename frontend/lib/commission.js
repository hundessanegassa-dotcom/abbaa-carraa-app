/**
 * Commission Calculation & Verification Rules for PrizeHub Ethiopia
 * 
 * Standard Commission Structure (Non-Admin):
 * - Winner gets 100% of target amount
 * - Pool Creator/Vendor/Organizer earns 10% of target amount
 * - Platform earns 10% of target amount
 * - Total collected = target + 20% (120% of target)
 * 
 * VIP Programs (Merkato VIP & City VIP) Commission Structure:
 * - We need Agents that bring clients to the system and earn commission
 *   that is half of total commission that the system generates.
 * - Total Platform Commission generated = 20% of target amount.
 * - Agents earn exactly half of that generated commission, which is 10% (0.50 * 20%) of the target amount.
 *
 * Regular Pools Commission Structure:
 * - We need Agents, Vendors, and Organization Organizers.
 * - Vendors list their products (houses/cars/machinery/etc.) under PrizeHub.
 *   After pool target is reached, they share commission that is half percent of what the platform generates.
 *   Let's check code deeply: Total commission rate is 20%. Platform keeps half, vendor gets half.
 * - Organization organizers create internal pools for members and earn commission, under platform bank/Telebirr details.
 */

/**
 * Calculate commission for a pool
 * @param {number} targetAmount - The amount winner receives (in ETB)
 * @param {boolean} isAdmin - Whether the pool creator is an admin
 * @param {string} programType - 'regular' | 'merkato_vip' | 'city_vip'
 * @param {string} partnerRole - 'agent' | 'vendor' | 'organization' | 'none'
 * @returns {Object} Commission details
 */
export function calculateCommission(targetAmount, isAdmin = false, programType = 'regular', partnerRole = 'none') {
  const totalCommissionRate = 0.20; // 20% total added to target
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
      totalCommissionRate: 20,
      winnerPercentage: 100,
      creatorPercentage: 20,
      platformPercentage: 0
    };
  }

  // VIP programs (Merkato VIP / City VIP) with Agents:
  if ((programType === 'merkato_vip' || programType === 'city_vip') && partnerRole === 'agent') {
    // Agents earn half of the total commission that the system generates (half of 20% is 10%)
    const agentCommission = totalCommission * 0.50; // 10% of target amount
    const platformCommission = totalCommission * 0.50; // 10% of target amount
    
    return {
      targetAmount: targetAmount,
      totalCommission: totalCommission,
      creatorCommission: agentCommission, // Agent commission is half of total commission
      platformCommission: platformCommission,
      totalCollection: targetAmount + totalCommission,
      creatorRate: 10,
      platformRate: 10,
      totalCommissionRate: 20,
      winnerPercentage: 100,
      creatorPercentage: 10,
      platformPercentage: 10
    };
  }

  // Regular pools with vendors/agents/organizers
  if (programType === 'regular') {
    if (partnerRole === 'vendor') {
      // Vendors list their property and earn half of what the platform generates (10% of target amount)
      const vendorCommission = totalCommission * 0.50;
      const platformCommission = totalCommission * 0.50;
      return {
        targetAmount: targetAmount,
        totalCommission: totalCommission,
        creatorCommission: vendorCommission,
        platformCommission: platformCommission,
        totalCollection: targetAmount + totalCommission,
        creatorRate: 10,
        platformRate: 10,
        totalCommissionRate: 20,
        winnerPercentage: 100,
        creatorPercentage: 10,
        platformPercentage: 10
      };
    } else if (partnerRole === 'agent') {
      // Regular pool agents also earn half of total commission
      const agentCommission = totalCommission * 0.50;
      const platformCommission = totalCommission * 0.50;
      return {
        targetAmount: targetAmount,
        totalCommission: totalCommission,
        creatorCommission: agentCommission,
        platformCommission: platformCommission,
        totalCollection: targetAmount + totalCommission,
        creatorRate: 10,
        platformRate: 10,
        totalCommissionRate: 20,
        winnerPercentage: 100,
        creatorPercentage: 10,
        platformPercentage: 10
      };
    } else if (partnerRole === 'organization') {
      // Organization organizers create internal pools and earn commission (10% of target)
      const orgCommission = targetAmount * 0.10;
      const platformCommission = targetAmount * 0.10;
      return {
        targetAmount: targetAmount,
        totalCommission: totalCommission,
        creatorCommission: orgCommission,
        platformCommission: platformCommission,
        totalCollection: targetAmount + totalCommission,
        creatorRate: 10,
        platformRate: 10,
        totalCommissionRate: 20,
        winnerPercentage: 100,
        creatorPercentage: 10,
        platformPercentage: 10
      };
    }
  }

  // Fallback / Standard structure:
  const creatorCommission = targetAmount * 0.10; // 10%
  const platformCommission = targetAmount * 0.10; // 10%

  return {
    targetAmount: targetAmount,
    totalCommission: totalCommission,
    creatorCommission: creatorCommission,
    platformCommission: platformCommission,
    totalCollection: targetAmount + totalCommission,
    creatorRate: 10,
    platformRate: 10,
    totalCommissionRate: 20,
    winnerPercentage: 100,
    creatorPercentage: 10,
    platformPercentage: 10
  };
}

/**
 * Format commission for display
 * @param {number} targetAmount - The amount winner receives (in ETB)
 * @param {boolean} isAdmin - Whether the pool creator is an admin
 * @param {string} programType - 'regular' | 'merkato_vip' | 'city_vip'
 * @param {string} partnerRole - 'agent' | 'vendor' | 'organization' | 'none'
 * @returns {Object} Formatted commission strings
 */
export function formatCommission(targetAmount, isAdmin = false, programType = 'regular', partnerRole = 'none') {
  const calc = calculateCommission(targetAmount, isAdmin, programType, partnerRole);
  
  return {
    winnerGets: `ETB ${calc.targetAmount.toLocaleString()}`,
    creatorGets: `ETB ${calc.creatorCommission.toLocaleString()} (${calc.creatorRate}%)`,
    platformGets: `ETB ${calc.platformCommission.toLocaleString()} (${calc.platformRate}%)`,
    totalCollection: `ETB ${calc.totalCollection.toLocaleString()}`,
    summary: `${calc.creatorRate}% commission for partner, ${calc.platformRate}% for platform`,
    shortSummary: isAdmin ? 'Platform collects 20%' : `Partner earns half of generated platform commission (${calc.creatorRate}%)!`
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
      description: 'Create pools and earn half of platform-generated commission (10% of total target value).'
    },
    vendor: {
      asCreator: 10,
      asParticipant: 0,
      description: 'List products and earn half of generated platform commission (10% of total target value) once pool target is reached.'
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
