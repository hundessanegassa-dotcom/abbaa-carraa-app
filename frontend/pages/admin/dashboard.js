import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { calculateCommission, formatCommission } from '../../lib/commission';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Admin Stats
  const [stats, setStats] = useState({
    total_users: 0,
    total_agents: 0,
    total_vendors: 0,
    total_organizations: 0,
    total_pools: 0,
    active_pools: 0,
    completed_pools: 0,
    total_volume: 0,
    total_commission_paid: 0,
    pending_commission: 0
  });
  
  // Admin's Personal Pools
  const [myPools, setMyPools] = useState([]);
  const [myStats, setMyStats] = useState({
    total_pools: 0,
    active_pools: 0,
    completed_pools: 0,
    total_raised: 0,
    total_commission: 0,
    pending_commission: 0
  });
  
  // Pending Approvals
  const [pendingAgents, setPendingAgents] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [pendingOrganizations, setPendingOrganizations] = useState([]);
  
  // Users List
  const [users, setUsers] = useState([]);
  const [allPools, setAllPools] = useState([]);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    setProfile(profile);
    
    await loadAllData();
    setLoading(false);
  }

  async function loadAllData() {
    await Promise.all([
      loadStats(),
      loadMyPools(),
      loadPendingApprovals(),
      loadUsers(),
      loadAllPools()
    ]);
  }

  async function loadStats() {
    // Platform-wide stats
    const [
      { count: total_users },
      { count: total_agents },
      { count: total_vendors },
      { count: total_organizations },
      { data: pools },
      { data: contributions },
      { data: commissions }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('agents').select('*', { count: 'exact', head: true }),
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('organizations').select('*', { count: 'exact', head: true }),
      supabase.from('pools').select('*'),
      supabase.from('contributions').select('amount').eq('status', 'completed'),
      supabase.from('commissions').select('amount, status')
    ]);

    const total_pools = pools?.length || 0;
    const active_pools = pools?.filter(p => p.status === 'active').length || 0;
    const completed_pools = pools?.filter(p => p.status === 'completed').length || 0;
    const total_volume = contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const total_commission_paid = commissions?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
    const pending_commission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;

    setStats({
      total_users: total_users || 0,
      total_agents: total_agents || 0,
      total_vendors: total_vendors || 0,
      total_organizations: total_organizations || 0,
      total_pools,
      active_pools,
      completed_pools,
      total_volume,
      total_commission_paid,
      pending_commission
    });
  }

  async function loadMyPools() {
    // Admin's personal pools (created by admin)
    const { data: pools } = await supabase
      .from('pools')
      .select('*')
      .eq('created_by', user?.id)
      .order('created_at', { ascending: false });

    setMyPools(pools || []);
    
    const activePools = pools?.filter(p => p.status === 'active') || [];
    const completedPools = pools?.filter(p => p.status === 'completed') || [];
    const totalRaised = pools?.reduce((sum, p) => sum + p.current_amount, 0) || 0;
    
    const { data: commissions } = await supabase
      .from('commissions')
      .select('amount, status')
      .eq('user_id', user?.id);

    const totalCommission = commissions?.reduce((sum, c) => sum + c.amount, 0) || 0;
    const pendingCommission = commissions?.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0) || 0;

    setMyStats({
      total_pools: pools?.length || 0,
      active_pools: activePools.length,
      completed_pools: completedPools.length,
      total_raised: totalRaised,
      total_commission: totalCommission,
      pending_commission: pendingCommission
    });
  }

  async function loadPendingApprovals() {
    const [{ data: agents }, { data: vendors }, { data: organizations }] = await Promise.all([
      supabase.from('agents').select('*').eq('verified', false),
      supabase.from('vendors').select('*').eq('verified', false),
      supabase.from('organizations').select('*').eq('verified', false)
    ]);
    
    setPendingAgents(agents || []);
    setPendingVendors(vendors || []);
    setPendingOrganizations(organizations || []);
  }

  async function loadUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setUsers(data || []);
  }

  async function loadAllPools() {
    const { data } = await supabase
      .from('pools')
      .select('*, profiles!created_by(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(50);
    setAllPools(data || []);
  }

  async function verifyAgent(agentId, verified) {
    const { error } = await supabase
      .from('agents')
      .update({ verified: verified, verified_at: new Date().toISOString() })
      .eq('id', agentId);
    
    if (error) {
      toast.error('Failed to update agent');
    } else {
      toast.success(`Agent ${verified ? 'approved' : 'rejected'}`);
      loadPendingApprovals();
    }
  }

  async function verifyVendor(vendorId, verified) {
    const { error } = await supabase
      .from('vendors')
      .update({ verified: verified, verified_at: new Date().toISOString() })
      .eq('id', vendorId);
    
    if (error) {
      toast.error('Failed to update vendor');
    } else {
      toast.success(`Vendor ${verified ? 'approved' : 'rejected'}`);
      loadPendingApprovals();
    }
  }

  async function updateUserRole(userId, newRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (error) {
      toast.error('Failed to update user role');
    } else {
      toast.success('User role updated');
      loadUsers();
    }
  }

  const createPool = () => {
    router.push('/create-pool');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-red-100 mt-1">Welcome, {profile?.full_name || 'Admin'}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={createPool}
                className="bg-white text-red-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition shadow-lg"
              >
                + Create My Pool
              </button>
              <Link href="/dashboard" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition">
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 font-semibold transition ${activeTab === 'overview' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('my-pools')}
              className={`px-6 py-3 font-semibold transition ${activeTab === 'my-pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🎯 My Pools (20% Commission)
            </button>
            <button
              onClick={() => setActiveTab('approvals')}
              className={`px-6 py-3 font-semibold transition relative ${activeTab === 'approvals' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              📝 Pending Approvals
              {(pendingAgents.length + pendingVendors.length + pendingOrganizations.length) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingAgents.length + pendingVendors.length + pendingOrganizations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-semibold transition ${activeTab === 'users' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              👥 Users
            </button>
            <button
              onClick={() => setActiveTab('all-pools')}
              className={`px-6 py-3 font-semibold transition ${activeTab === 'all-pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              🌊 All Pools
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Platform Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="text-2xl mb-2">👥</div>
                <p className="text-2xl font-bold text-blue-600">{stats.total_users}</p>
                <p className="text-xs text-gray-500">Total Users</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="text-2xl mb-2">🤝</div>
                <p className="text-2xl font-bold text-yellow-600">{stats.total_agents}</p>
                <p className="text-xs text-gray-500">Agents</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="text-2xl mb-2">🏭</div>
                <p className="text-2xl font-bold text-purple-600">{stats.total_vendors}</p>
                <p className="text-xs text-gray-500">Vendors</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="text-2xl mb-2">🏢</div>
                <p className="text-2xl font-bold text-cyan-600">{stats.total_organizations}</p>
                <p className="text-xs text-gray-500">Organizations</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="text-2xl mb-2">💰</div>
                <p className="text-2xl font-bold text-green-600">ETB {Math.floor(stats.total_volume / 1000)}K</p>
                <p className="text-xs text-gray-500">Total Volume</p>
              </div>
            </div>

            {/* Pool Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-500 mb-2">Prize Pools</h3>
                <p className="text-3xl font-bold text-green-600">{stats.total_pools}</p>
                <p className="text-sm text-gray-400 mt-1">{stats.active_pools} active | {stats.completed_pools} completed</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-500 mb-2">Commission Paid</h3>
                <p className="text-3xl font-bold text-yellow-600">ETB {stats.total_commission_paid.toLocaleString()}</p>
                <p className="text-sm text-gray-400 mt-1">{stats.pending_commission.toLocaleString()} ETB pending</p>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-500 mb-2">Admin Earnings</h3>
                <p className="text-3xl font-bold text-red-600">ETB {myStats.total_commission.toLocaleString()}</p>
                <p className="text-sm text-gray-400 mt-1">From your personal pools (20% commission)</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/admin/draw" className="bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-4 text-white text-center hover:shadow-lg transition">
                <div className="text-2xl mb-1">🎲</div>
                <p className="font-semibold">Run Draws</p>
                <p className="text-xs opacity-90">Manage prize draws</p>
              </Link>
              <Link href="/admin/analytics" className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-4 text-white text-center hover:shadow-lg transition">
                <div className="text-2xl mb-1">📊</div>
                <p className="font-semibold">Analytics</p>
                <p className="text-xs opacity-90">View platform insights</p>
              </Link>
              <Link href="/admin/bank-transfers" className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-4 text-white text-center hover:shadow-lg transition">
                <div className="text-2xl mb-1">🏦</div>
                <p className="font-semibold">Bank Transfers</p>
                <p className="text-xs opacity-90">Verify payments</p>
              </Link>
              <button onClick={createPool} className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 text-white text-center hover:shadow-lg transition">
                <div className="text-2xl mb-1">➕</div>
                <p className="font-semibold">Create My Pool</p>
                <p className="text-xs opacity-90">Earn 20% commission</p>
              </button>
            </div>
          </div>
        )}

        {/* My Pools Tab (Admin's Personal Pools - 20% Commission) */}
        {activeTab === 'my-pools' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-50 to-rose-50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">💰 My Pools (20% Commission)</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-600">{myStats.total_pools}</p>
                  <p className="text-xs text-gray-500">Total Pools</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{myStats.active_pools}</p>
                  <p className="text-xs text-gray-500">Active</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">ETB {myStats.total_raised.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Total Raised</p>
                </div>
                <div className="bg-white rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-600">ETB {myStats.total_commission.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Commission Earned</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table>
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prize</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raised</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Your Commission</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {myPools.length === 0 ? (
                      <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-400">No pools created yet. <button onClick={createPool} className="text-red-600">Create your first pool →</button></td></tr>
                    ) : (
                      myPools.map(pool => {
                        const commission = pool.target_amount * 0.20;
                        return (
                          <tr key={pool.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium">{pool.prize_name}</td>
                            <td className="px-6 py-4">ETB {pool.target_amount?.toLocaleString()}</td>
                            <td className="px-6 py-4">ETB {pool.current_amount?.toLocaleString()}</td>
                            <td className="px-6 py-4 font-semibold text-green-600">ETB {commission?.toLocaleString()}</td>
                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{pool.status}</span></td>
                            <td className="px-6 py-4"><Link href={`/pools/${pool.id}`} className="text-red-600 text-sm">View →</Link></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            {/* Pending Agents */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-yellow-50 border-b">
                <h2 className="font-bold text-yellow-800">🤝 Pending Agents ({pendingAgents.length})</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Name</th><th className="px-6 py-3 text-left text-xs">Email</th><th className="px-6 py-3 text-left text-xs">Business</th><th className="px-6 py-3 text-left text-xs">Action</th></tr></thead>
                  <tbody>{pendingAgents.map(agent => (<tr key={agent.id}><td className="px-6 py-4">{agent.business_name}</td><td className="px-6 py-4">{agent.email}</td><td className="px-6 py-4">{agent.business_type}</td><td className="px-6 py-4"><button onClick={() => verifyAgent(agent.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2">Approve</button><button onClick={() => verifyAgent(agent.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button></td></tr>))}</tbody>
                </table>
              </div>
            </div>

            {/* Pending Vendors */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-purple-50 border-b"><h2 className="font-bold text-purple-800">🏭 Pending Vendors ({pendingVendors.length})</h2></div>
              <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Name</th><th className="px-6 py-3 text-left text-xs">Email</th><th className="px-6 py-3 text-left text-xs">Action</th></tr></thead><tbody>{pendingVendors.map(vendor => (<tr key={vendor.id}><td className="px-6 py-4">{vendor.business_name}</td><td className="px-6 py-4">{vendor.email}</td><td className="px-6 py-4"><button onClick={() => verifyVendor(vendor.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2">Approve</button><button onClick={() => verifyVendor(vendor.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button></td></tr>))}</tbody></table></div>
            </div>

            {/* Pending Organizations */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 border-b"><h2 className="font-bold text-blue-800">🏢 Pending Organizations ({pendingOrganizations.length})</h2></div>
              <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Name</th><th className="px-6 py-3 text-left text-xs">Email</th><th className="px-6 py-3 text-left text-xs">Action</th></tr></thead><tbody>{pendingOrganizations.map(org => (<tr key={org.id}><td className="px-6 py-4">{org.business_name}</td><td className="px-6 py-4">{org.email}</td><td className="px-6 py-4"><button onClick={() => verifyAgent(org.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2">Approve</button><button onClick={() => verifyAgent(org.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Reject</button></td></tr>))}</tbody></table></div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Name</th><th className="px-6 py-3 text-left text-xs">Email</th><th className="px-6 py-3 text-left text-xs">Role</th><th className="px-6 py-3 text-left text-xs">User Type</th><th className="px-6 py-3 text-left text-xs">Action</th></tr></thead><tbody>{users.map(user => (<tr key={user.id}><td className="px-6 py-4">{user.full_name}</td><td className="px-6 py-4">{user.email}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{user.role || 'user'}</span></td><td className="px-6 py-4">{user.user_type || 'individual'}</td><td className="px-6 py-4">{user.role !== 'admin' && (<select onChange={(e) => updateUserRole(user.id, e.target.value)} className="text-sm border rounded px-2 py-1"><option value="user">User</option><option value="agent">Agent</option><option value="vendor">Vendor</option><option value="organization">Organization</option></select>)}</td></tr>))}</tbody></table></div>
          </div>
        )}

        {/* All Pools Tab */}
        {activeTab === 'all-pools' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs">Prize</th><th className="px-6 py-3 text-left text-xs">Created By</th><th className="px-6 py-3 text-left text-xs">Target</th><th className="px-6 py-3 text-left text-xs">Status</th><th className="px-6 py-3 text-left text-xs">Action</th></tr></thead><tbody>{allPools.map(pool => (<tr key={pool.id}><td className="px-6 py-4 font-medium">{pool.prize_name}</td><td className="px-6 py-4">{pool.profiles?.full_name || 'Admin'}</td><td className="px-6 py-4">ETB {pool.target_amount?.toLocaleString()}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{pool.status}</span></td><td className="px-6 py-4"><Link href={`/pools/${pool.id}`} className="text-red-600 text-sm">View →</Link></td></tr>))}</tbody></table></div>
          </div>
        )}
      </div>
    </div>
  );
}
