import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    total_users: 0,
    total_agents: 0,
    total_vendors: 0,
    total_organizations: 0,
    total_pools: 0,
    active_pools: 0,
    total_volume: 0,
    charity_total: 0,
    lives_impacted: 0
  });
  const [myPools, setMyPools] = useState([]);
  const [allPools, setAllPools] = useState([]);
  const [pendingAgents, setPendingAgents] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [users, setUsers] = useState([]);

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
      .maybeSingle();
    
    setProfile(profile);
    
    if (profile?.role !== 'admin') {
      router.push('/dashboard');
      return;
    }
    
    await loadData();
    setLoading(false);
  }

  async function loadData() {
    const { count: total_users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: total_agents } = await supabase.from('agents').select('*', { count: 'exact', head: true });
    const { count: total_vendors } = await supabase.from('vendors').select('*', { count: 'exact', head: true });
    const { count: total_organizations } = await supabase.from('organizations').select('*', { count: 'exact', head: true });
    const { data: pools } = await supabase.from('pools').select('*');
    const { data: contributions } = await supabase.from('contributions').select('amount').eq('status', 'completed');
    
    const total_pools = pools?.length || 0;
    const active_pools = pools?.filter(p => p.status === 'active')?.length || 0;
    const total_volume = contributions?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const charity_total = total_volume * 0.02;
    
    setStats({
      total_users: total_users || 0,
      total_agents: total_agents || 0,
      total_vendors: total_vendors || 0,
      total_organizations: total_organizations || 0,
      total_pools: total_pools,
      active_pools: active_pools,
      total_volume: total_volume,
      charity_total: charity_total,
      lives_impacted: Math.floor(charity_total / 100)
    });
    
    setMyPools(pools?.filter(p => p.created_by === user?.id) || []);
    setAllPools(pools || []);
    
    const { data: agents } = await supabase
      .from('agents')
      .select('*, profiles!user_id(full_name, email)')
      .eq('verified', false);
    setPendingAgents(agents || []);
    
    const { data: vendors } = await supabase
      .from('vendors')
      .select('*, profiles!user_id(full_name, email)')
      .eq('verified', false);
    setPendingVendors(vendors || []);
    
    const { data: usersData } = await supabase.from('profiles').select('*').limit(50);
    setUsers(usersData || []);
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
      loadData();
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
      loadData();
    }
  }

  async function updateUserRole(userId, newRole) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole, user_type: newRole })
      .eq('id', userId);
    if (error) {
      toast.error('Failed to update user role');
    } else {
      toast.success('User role updated');
      loadData();
    }
  }

  async function toggleFeaturedPool(poolId, isFeatured) {
    const { error } = await supabase
      .from('pools')
      .update({ is_featured: !isFeatured })
      .eq('id', poolId);
    if (error) {
      toast.error('Failed to update featured status');
    } else {
      toast.success(`Pool ${!isFeatured ? 'featured' : 'removed'}`);
      loadData();
    }
  }

  const createPool = () => {
    router.push('/create-pool');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-red-100 mt-1">Welcome, {profile?.full_name || 'Admin'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={createPool} className="bg-white text-red-600 px-6 py-2 rounded-full font-semibold hover:bg-gray-100 transition">
                + Create My Pool (20%)
              </button>
              <Link href="/dashboard" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition">
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b bg-white sticky top-0 z-10 overflow-x-auto">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 min-w-max">
            <button onClick={() => setActiveTab('overview')} className={`px-4 py-3 font-semibold transition ${activeTab === 'overview' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>📊 Overview</button>
            <button onClick={() => setActiveTab('my-pools')} className={`px-4 py-3 font-semibold transition ${activeTab === 'my-pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>🎯 My Pools (20%)</button>
            <button onClick={() => setActiveTab('all-pools')} className={`px-4 py-3 font-semibold transition ${activeTab === 'all-pools' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>🌊 All Pools</button>
            <button onClick={() => setActiveTab('approvals')} className={`px-4 py-3 font-semibold transition ${activeTab === 'approvals' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>📝 Approvals ({pendingAgents.length + pendingVendors.length})</button>
            <button onClick={() => setActiveTab('users')} className={`px-4 py-3 font-semibold transition ${activeTab === 'users' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>👥 Users</button>
            <button onClick={() => setActiveTab('featured')} className={`px-4 py-3 font-semibold transition ${activeTab === 'featured' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>⭐ Featured</button>
            <button onClick={() => setActiveTab('charity')} className={`px-4 py-3 font-semibold transition ${activeTab === 'charity' ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>💚 Charity</button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><p className="text-2xl font-bold text-blue-600">{stats.total_users}</p><p className="text-xs text-gray-500">Users</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{stats.total_agents}</p><p className="text-xs text-gray-500">Agents</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><p className="text-2xl font-bold text-purple-600">{stats.total_vendors}</p><p className="text-xs text-gray-500">Vendors</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><p className="text-2xl font-bold text-cyan-600">{stats.total_organizations}</p><p className="text-xs text-gray-500">Organizations</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><p className="text-2xl font-bold text-green-600">{stats.total_pools}</p><p className="text-xs text-gray-500">Total Pools</p></div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center"><p className="text-2xl font-bold text-emerald-600">{stats.active_pools}</p><p className="text-xs text-gray-500">Active Pools</p></div>
              <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-4 text-center text-white"><p className="text-2xl font-bold">{stats.lives_impacted}</p><p className="text-xs opacity-90">Lives Impacted</p></div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-700 mb-4">💰 Financial Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-600">Total Volume:</span>
                    <span className="font-bold text-green-600">ETB {stats.total_volume.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="text-gray-600">Charity Fund (2%):</span>
                    <span className="font-bold text-pink-600">ETB {Math.floor(stats.charity_total).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-bold text-gray-700 mb-4">👑 Admin's Personal Stats (20% Commission)</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-red-600">{myPools.length}</p>
                    <p className="text-xs text-gray-500">My Pools</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{myPools.filter(p => p.status === 'active').length}</p>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-600">ETB {myPools.reduce((sum, p) => sum + ((p.target_amount || 0) * 0.20), 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Commission Earned</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Pools Tab */}
        {activeTab === 'my-pools' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="font-bold text-gray-800">💰 My Personal Pools (20% Commission)</h2>
            </div>
            <div className="p-6">
              {myPools.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No pools created yet</p>
                  <button onClick={createPool} className="mt-3 text-red-600 hover:underline">Create your first pool →</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Prize</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Target</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Raised</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Your 20%</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myPools.map(pool => (
                        <tr key={pool.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{pool.prize_name}</td>
                          <td className="px-4 py-3">ETB {pool.target_amount?.toLocaleString()}</td>
                          <td className="px-4 py-3">ETB {pool.current_amount?.toLocaleString()}</td>
                          <td className="px-4 py-3 font-semibold text-green-600">ETB {((pool.target_amount || 0) * 0.20).toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {pool.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link href={`/pools/${pool.id}`} className="text-red-600 text-sm hover:underline">View →</Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <button onClick={createPool} className="mt-6 bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition">
                + Create New Pool
              </button>
            </div>
          </div>
        )}

        {/* All Pools Tab */}
        {activeTab === 'all-pools' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h2 className="font-bold text-gray-800 mb-4">🌊 All Platform Pools</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Prize</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Created By</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Target</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allPools.map(pool => (
                    <tr key={pool.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{pool.prize_name}</td>
                      <td className="px-4 py-3">{pool.created_by === user?.id ? 'Admin' : pool.created_by}</td>
                      <td className="px-4 py-3">ETB {pool.target_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {pool.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/pools/${pool.id}`} className="text-red-600 text-sm hover:underline">View →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approvals Tab */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-yellow-800 mb-4">🤝 Pending Agents ({pendingAgents.length})</h3>
              {pendingAgents.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No pending agents</p>
              ) : (
                <div className="space-y-3">
                  {pendingAgents.map(agent => (
                    <div key={agent.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-medium">{agent.business_name}</p>
                        <p className="text-sm text-gray-500">{agent.profiles?.email}</p>
                      </div>
                      <div>
                        <button onClick={() => verifyAgent(agent.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2 hover:bg-green-700">Approve</button>
                        <button onClick={() => verifyAgent(agent.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <h3 className="font-bold text-purple-800 mb-4">🏭 Pending Vendors ({pendingVendors.length})</h3>
              {pendingVendors.length === 0 ? (
                <p className="text-gray-400 text-center py-4">No pending vendors</p>
              ) : (
                <div className="space-y-3">
                  {pendingVendors.map(vendor => (
                    <div key={vendor.id} className="flex justify-between items-center border-b pb-3">
                      <div>
                        <p className="font-medium">{vendor.business_name}</p>
                        <p className="text-sm text-gray-500">{vendor.profiles?.email}</p>
                      </div>
                      <div>
                        <button onClick={() => verifyVendor(vendor.id, true)} className="bg-green-600 text-white px-3 py-1 rounded text-sm mr-2 hover:bg-green-700">Approve</button>
                        <button onClick={() => verifyVendor(vendor.id, false)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h2 className="font-bold text-gray-800 mb-4">👥 Platform Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">User Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{u.full_name || 'N/A'}</td>
                      <td className="px-4 py-3">{u.email || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{u.user_type || 'individual'}</td>
                      <td className="px-4 py-3">
                        {u.role !== 'admin' && (
                          <select 
                            onChange={(e) => updateUserRole(u.id, e.target.value)} 
                            className="border rounded px-2 py-1 text-sm focus:ring-red-500 focus:border-red-500"
                            defaultValue={u.role || 'user'}
                          >
                            <option value="user">User</option>
                            <option value="agent">Agent</option>
                            <option value="vendor">Vendor</option>
                            <option value="organization">Organization</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Featured Tab */}
        {activeTab === 'featured' && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h2 className="font-bold text-gray-800 mb-4">⭐ Featured Listings Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Prize Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Created By</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Featured Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allPools.map(pool => (
                    <tr key={pool.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{pool.prize_name}</td>
                      <td className="px-4 py-3">{pool.created_by === user?.id ? 'Admin' : pool.created_by}</td>
                      <td className="px-4 py-3">{pool.is_featured ? '⭐ Featured' : 'Not featured'}</td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => toggleFeaturedPool(pool.id, pool.is_featured)} 
                          className={`px-3 py-1 rounded text-sm ${pool.is_featured ? 'bg-gray-300 text-gray-700 hover:bg-gray-400' : 'bg-yellow-500 text-white hover:bg-yellow-600'}`}
                        >
                          {pool.is_featured ? 'Remove' : 'Feature'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Charity Tab */}
        {activeTab === 'charity' && (
          <div className="bg-gradient-to-r from-red-500 to-pink-500 rounded-xl p-8 text-white text-center">
            <div className="mb-6">
              <span className="text-6xl">💚</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">2% for Health</h2>
            <p className="text-xl mb-2">Total Raised for Charity: <strong>ETB {Math.floor(stats.charity_total).toLocaleString()}</strong></p>
            <p className="text-lg mb-6">Lives Impacted: <strong>{stats.lives_impacted}</strong></p>
            <p className="text-base mb-4">Supporting Ethiopians fighting <strong>kidney disease</strong> and <strong>heart disease</strong></p>
            <div className="mt-6 bg-white/20 rounded-lg p-4 inline-block text-left">
              <p className="font-semibold mb-1">🏦 Direct Donation Information:</p>
              <p className="text-sm">Commercial Bank of Ethiopia</p>
              <p className="text-sm">Account Name: Abbaa Carraa Health Foundation</p>
              <p className="text-sm font-mono">Account Number: 1000XXXXXX</p>
              <p className="text-sm">Reference: "Health Support - [Your Name]"</p>
            </div>
            <p className="text-sm mt-6 opacity-80">💚 Every contribution saves a life</p>
          </div>
        )}
      </div>
    </div>
  );
}
