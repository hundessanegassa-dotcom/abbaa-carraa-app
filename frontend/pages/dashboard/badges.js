import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/DashboardLayout';

export default function BadgesPage() {
  const [badges, setBadges] = useState([]);
  const [points, setPoints] = useState(0);

  useEffect(() => {
    fetchBadges();
  }, []);

  async function fetchBadges() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id);
      setBadges(data || []);
      
      const { data: contributions } = await supabase
        .from('contributions')
        .select('amount')
        .eq('user_id', user.id);
      
      const total = contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
      setPoints(Math.floor(total / 100));
    }
  }

  const allBadges = [
    { name: 'First Step', icon: '🌟', requirement: 'Make first contribution', color: 'bg-blue-100' },
    { name: 'Winner!', icon: '🏆', requirement: 'Win a prize', color: 'bg-yellow-100' },
    { name: 'Top Contributor', icon: '👑', requirement: 'Contribute 10,000+ ETB', color: 'bg-purple-100' },
    { name: 'Loyal Member', icon: '💎', requirement: 'Participate in 5+ pools', color: 'bg-indigo-100' },
    { name: 'Charity Champion', icon: '💚', requirement: '2% of your contributions', color: 'bg-red-100' }
  ];

  return (
    <DashboardLayout title="My Badges & Rewards" subtitle="Track your achievements" icon="⭐" bgGradient="from-yellow-500 to-orange-500">
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 mb-8 text-center">
        <div className="text-4xl mb-2">⭐</div>
        <h2 className="text-2xl font-bold">Your Points: {points}</h2>
        <p className="text-gray-600">Earn 1 point for every 100 ETB contributed</p>
      </div>
      
      <h2 className="text-xl font-bold mb-4">🏅 Available Badges</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allBadges.map((badge, i) => {
          const earned = badges.some(b => b.badge_type === badge.name.toLowerCase().replace(/\s/g, '_'));
          return (
            <div key={i} className={`${badge.color} rounded-xl p-4 ${earned ? 'opacity-100' : 'opacity-50'}`}>
              <div className="text-3xl mb-2">{badge.icon}</div>
              <h3 className="font-bold">{badge.name}</h3>
              <p className="text-sm">{badge.requirement}</p>
              {earned && <span className="text-xs text-green-600 mt-1 inline-block">✓ Earned</span>}
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
