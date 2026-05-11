import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/DashboardLayout';

export default function AgentAnalytics() {
  const [pools, setPools] = useState([]);
  const [totalViews, setTotalViews] = useState(0);

  useEffect(() => {
    fetchPools();
  }, []);

  async function fetchPools() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('pools')
        .select('*')
        .eq('created_by', user.id);
      setPools(data || []);
      setTotalViews((data?.length || 0) * 100); // Simulated views
    }
  }

  return (
    <DashboardLayout title="Pool Analytics" subtitle="Track your pool performance" icon="📊" bgGradient="from-blue-500 to-indigo-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 text-center"><p className="text-3xl font-bold text-blue-600">{pools.length}</p><p className="text-gray-500">Total Pools</p></div>
        <div className="bg-white rounded-2xl p-6 text-center"><p className="text-3xl font-bold text-green-600">{totalViews}</p><p className="text-gray-500">Estimated Views</p></div>
        <div className="bg-white rounded-2xl p-6 text-center"><p className="text-3xl font-bold text-yellow-600">{pools.filter(p => p.status === 'completed').length}</p><p className="text-gray-500">Completed</p></div>
      </div>
      <div className="bg-white rounded-2xl p-6"><h3 className="font-bold mb-4">Your Pools</h3>{pools.map(p => (<div key={p.id} className="border-b py-3 flex justify-between"><span>{p.prize_name}</span><span className={`text-xs px-2 py-1 rounded ${p.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>{p.status}</span></div>))}</div>
    </DashboardLayout>
  );
}
