import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from 'react-i18next';

export default function LoyaltyPoints({ userId }) {
  const { t } = useTranslation();
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState('Bronze');
  const [nextLevelPoints, setNextLevelPoints] = useState(100);
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (userId) {
      fetchLoyaltyData();
    }
  }, [userId]);

  async function fetchLoyaltyData() {
    try {
      // Get user's loyalty points
      const { data: profile } = await supabase
        .from('profiles')
        .select('loyalty_points, total_contributions, total_wins')
        .eq('id', userId)
        .single();

      const userPoints = profile?.loyalty_points || 0;
      const totalContributions = profile?.total_contributions || 0;
      const totalWins = profile?.total_wins || 0;

      setPoints(userPoints);

      // Determine level
      if (userPoints >= 1000) setLevel('Diamond');
      else if (userPoints >= 500) setLevel('Platinum');
      else if (userPoints >= 200) setLevel('Gold');
      else if (userPoints >= 50) setLevel('Silver');
      else setLevel('Bronze');

      setNextLevelPoints(
        userPoints >= 1000 ? 0 :
        userPoints >= 500 ? 1000 :
        userPoints >= 200 ? 500 :
        userPoints >= 50 ? 200 : 50
      );

      // Calculate badges
      const earnedBadges = [];
      if (totalContributions >= 10000) earnedBadges.push({ name: 'Big Spender', icon: '💰', description: 'Contributed over 10,000 ETB' });
      if (totalWins >= 1) earnedBadges.push({ name: 'First Win', icon: '🏆', description: 'Won your first prize' });
      if (totalWins >= 5) earnedBadges.push({ name: 'Lucky Streak', icon: '🍀', description: 'Won 5 prizes' });
      if (userPoints >= 100) earnedBadges.push({ name: 'Loyal Member', icon: '⭐', description: 'Earned 100 loyalty points' });
      
      setBadges(earnedBadges);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    }
  }

  const progress = Math.min((points / nextLevelPoints) * 100, 100);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">🏅 Your Loyalty Status</h3>
      
      {/* Level Badge */}
      <div className="text-center mb-6">
        <div className={`inline-block px-6 py-2 rounded-full text-white font-bold text-lg
          ${level === 'Diamond' ? 'bg-blue-600' : 
            level === 'Platinum' ? 'bg-gray-400' :
            level === 'Gold' ? 'bg-yellow-500' :
            level === 'Silver' ? 'bg-gray-300' : 'bg-orange-600'}`}>
          {level} Member
        </div>
        <p className="text-sm text-gray-500 mt-2">{points} points earned</p>
      </div>

      {/* Progress to next level */}
      {nextLevelPoints > 0 && (
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>{points} points</span>
            <span>{nextLevelPoints} points</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{nextLevelPoints - points} more points to next level</p>
        </div>
      )}

      {/* How to earn points */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-semibold mb-2">📌 How to Earn Points</h4>
        <ul className="text-sm space-y-1 text-gray-600">
          <li>✓ Contribute to any pool → <strong>10 points per 100 ETB</strong></li>
          <li>✓ Refer a friend → <strong>50 points</strong></li>
          <li>✓ Win a prize → <strong>100 points</strong></li>
          <li>✓ Leave a review → <strong>20 points</strong></li>
        </ul>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3">🏅 Your Badges</h4>
          <div className="flex flex-wrap gap-3">
            {badges.map((badge, i) => (
              <div key={i} className="bg-yellow-50 rounded-lg p-2 text-center min-w-[80px]">
                <div className="text-2xl">{badge.icon}</div>
                <p className="text-xs font-semibold">{badge.name}</p>
                <p className="text-xs text-gray-500">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="mt-4 text-xs text-gray-400 text-center">
        Higher levels get better rewards and exclusive pool access!
      </div>
    </div>
  );
}
