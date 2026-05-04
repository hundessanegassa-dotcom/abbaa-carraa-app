import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function LoyaltyPoints({ userId }) {
  const [points, setPoints] = useState(0);
  const [level, setLevel] = useState('Bronze');
  const [badges, setBadges] = useState([]);

  useEffect(() => {
    if (userId) fetchLoyaltyData();
  }, [userId]);

  async function fetchLoyaltyData() {
    const { data: profile } = await supabase
      .from('profiles')
      .select('loyalty_points, total_contributions, total_wins')
      .eq('id', userId)
      .single();

    const userPoints = profile?.loyalty_points || 0;
    setPoints(userPoints);

    // Determine level
    if (userPoints >= 1000) setLevel('Diamond');
    else if (userPoints >= 500) setLevel('Platinum');
    else if (userPoints >= 200) setLevel('Gold');
    else if (userPoints >= 50) setLevel('Silver');
    else setLevel('Bronze');

    // Calculate badges
    const earnedBadges = [];
    if (profile?.total_contributions >= 10000) earnedBadges.push({ name: 'Big Spender', icon: '💰' });
    if (profile?.total_wins >= 1) earnedBadges.push({ name: 'First Win', icon: '🏆' });
    if (profile?.total_wins >= 5) earnedBadges.push({ name: 'Lucky Streak', icon: '🍀' });
    if (userPoints >= 100) earnedBadges.push({ name: 'Loyal Member', icon: '⭐' });
    setBadges(earnedBadges);
  }

  const levelColors = {
    Bronze: 'from-amber-600 to-amber-800',
    Silver: 'from-gray-400 to-gray-600',
    Gold: 'from-yellow-500 to-yellow-700',
    Platinum: 'from-cyan-500 to-cyan-700',
    Diamond: 'from-blue-500 to-blue-700',
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className={`bg-gradient-to-r ${levelColors[level]} text-white rounded-lg p-4 text-center mb-4`}>
        <p className="text-sm opacity-90">Your Level</p>
        <p className="text-2xl font-bold">{level}</p>
        <p className="text-sm">{points} points</p>
      </div>

      <div className="space-y-2">
        <p className="font-semibold">🏅 Badges</p>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge, i) => (
            <span key={i} className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs flex items-center gap-1">
              {badge.icon} {badge.name}
            </span>
          ))}
          {badges.length === 0 && <p className="text-gray-400 text-sm">No badges yet. Keep participating!</p>}
        </div>
      </div>
    </div>
  );
}
