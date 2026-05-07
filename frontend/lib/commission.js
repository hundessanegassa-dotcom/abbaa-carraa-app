export function calculateCommission(targetAmount, isAdmin = false) {
  const commissionRate = isAdmin ? 0.20 : 0.20; // 20% total commission
  const totalCommission = targetAmount * commissionRate;
  
  if (isAdmin) {
    // Admin gets full 20%
    return {
      targetAmount: targetAmount,
      totalCommission: totalCommission,
      creatorCommission: totalCommission, // 100% of commission
      platformCommission: 0,
      totalCollection: targetAmount + totalCommission,
      creatorRate: 20,
      platformRate: 0
    };
  } else {
    // Regular creator gets 10%, platform gets 10%
    return {
      targetAmount: targetAmount,
      totalCommission: totalCommission,
      creatorCommission: targetAmount * 0.10, // 10% of target
      platformCommission: targetAmount * 0.10, // 10% of target
      totalCollection: targetAmount + totalCommission,
      creatorRate: 10,
      platformRate: 10
    };
  }
}

export function formatCommission(targetAmount, isAdmin = false) {
  const calc = calculateCommission(targetAmount, isAdmin);
  return {
    winnerGets: `${calc.targetAmount.toLocaleString()} ETB`,
    creatorGets: `${calc.creatorCommission.toLocaleString()} ETB (${calc.creatorRate}%)`,
    platformGets: `${calc.platformCommission.toLocaleString()} ETB (${calc.platformRate}%)`,
    totalCollection: `${calc.totalCollection.toLocaleString()} ETB`
  };
}
