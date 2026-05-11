import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import DashboardLayout from '../../components/DashboardLayout';

export default function OrganizationAnalytics() {
  const [organization, setOrganization] = useState(null);
  const [members, setMembers] = useState([]);
  const [pools, setPools] = useState([]);
  const [totalRaised, setTotalRaised] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: org } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setOrganization(org);
      
      if (org) {
        const { data: membersData } = await supabase
          .from('organization_members')
          .select('*, profiles(full_name, email)')
          .eq('organization_id', org.id)
          .eq('status', 'approved');
        setMembers(membersData || []);
        
        const { data: poolsData } = await supabase
          .from('pools')
          .select('*')
          .eq('organization_id', org.id);
        setPools(poolsData || []);
        
        const raised = poolsData?.reduce((sum, p) => sum + (p.current_amount || 0), 0) || 0;
        setTotalRaised(raised);
        
        const { data: commissions } = await supabase
          .from('commissions')
          .select('amount')
          .eq('organization_id', org.id);
        setTotalCommission(commissions?.reduce((sum, c) => sum + c.amount, 0) || 0);
      }
    }
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  const activeMembers = members.length;
  const activePools = pools.filter(p => p.status === 'active').length;
  const completedPools = pools.filter(p => p.status === 'completed').length;
  const avgContributionPerMember = members.length > 0 ? totalRaised / members.length : 0;

  return (
    <DashboardLayout title="Organization Analytics" subtitle="Track your organization's performance" icon="📊" bgGradient="from-blue-500 to-cyan-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-blue-600">{activeMembers}</p><p className="text-gray-500 text-sm">Active Members</p></div>
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-green-600">{activePools}</p><p className="text-gray-500 text-sm">Active Pools</p></div>
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-yellow-600">{completedPools}</p><p className="text-gray-500 text-sm">Completed Pools</p></div>
        <div className="bg-white rounded-2xl p-5 text-center shadow-md"><p className="text-3xl font-bold text-purple-600">ETB {Math.floor(totalRaised / 1000)}K</p><p className="text-gray-500 text-sm">Total Raised</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-5 shadow-md"><h3 className="font-bold mb-4">📊 Organization Stats</h3><div className="space-y-3"><div className="flex justify-between"><span>Total Commission Earned:</span><span className="font-bold text-yellow-600">ETB {totalCommission.toLocaleString()}</span></div><div className="flex justify-between"><span>Avg Contribution/Member:</span><span className="font-bold">ETB {avgContributionPerMember.toFixed(0)}</span></div><div className="flex justify-between"><span>Member Participation:</span><span className="font-bold">{members.length > 0 ? Math.round((pools.length / members.length) * 100) : 0}%</span></div></div></div>
        <div className="bg-white rounded-2xl p-5 shadow-md"><h3 className="font-bold mb-4">👥 Recent Members</h3>{members.slice(0, 5).map(m => (<div key={m.id} className="py-2 border-b"><p className="font-medium">{m.profiles?.full_name}</p><p className="text-xs text-gray-500">{m.profiles?.email}</p></div>))}{members.length === 0 && <p className="text-gray-400 text-center py-4">No members yet</p>}</div>
      </div>
      <div className="bg-white rounded-2xl p-5 shadow-md"><h3 className="font-bold mb-4">🏊 Your Private Pools</h3>{pools.length === 0 ? <p className="text-center py-8 text-gray-400">No private pools created yet</p> : <div className="divide-y">{pools.map(p => (<div key={p.id} className="py-3 flex justify-between items-center"><div><p className="font-medium">{p.prize_name}</p><p className="text-sm text-gray-500">Target: ETB {p.target_amount?.toLocaleString()}</p></div><span className={`px-2 py-1 rounded-full text-xs ${p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>{p.status}</span></div>))}</div>}</div>
    </DashboardLayout>
  );
}
