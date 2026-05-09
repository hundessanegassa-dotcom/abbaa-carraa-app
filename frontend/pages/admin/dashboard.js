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
  const [isAuthorized, setIsAuthorized] = useState(false);
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
  const [adminRecord, setAdminRecord] = useState(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    setUser(user);
    
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    setProfile(profile);
    
    // SECURITY: Verify admin status from admins table
    const { data: adminRecord, error: adminError } = await supabase
      .from('admins')
      .select('id, role, is_active, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();
    
    // Log the access attempt for security
    await supabase
      .from('admin_logs')
      .insert({
        admin_id: adminRecord?.id,
        action: adminRecord ? 'ADMIN_ACCESS_ATTEMPT' : 'UNAUTHORIZED_ACCESS_ATTEMPT',
        details: { 
          email: user.email,
          ip: await getClientIp(),
          timestamp: new Date().toISOString()
        },
        ip_address: await getClientIp()
      })
      .catch(console.error);
    
    if (!adminRecord || adminError) {
      // Unauthorized access
      console.error('Unauthorized admin access attempt from:', user.email);
      toast.error('Access denied. Admin privileges required.');
      router.push('/dashboard');
      return;
    }
    
    setAdminRecord(adminRecord);
    
    // Update last login
    await supabase
      .from('admins')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminRecord.id);
    
    // Fix profile inconsistency if needed
    if (profile?.role !== 'admin') {
      await supabase
        .from('profiles')
        .update({ role: 'admin', user_type: 'admin' })
        .eq('id', user.id);
    }
    
    setIsAuthorized(true);
    await loadData();
    setLoading(false);
  }

  async function getClientIp() {
    try {
      const res = await fetch('https://api.ipify.org?format=json');
      const data = await res.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
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
      
      // Log admin action
      await supabase.from('admin_logs').insert({
        admin_id: adminRecord?.id,
        action: verified ? 'AGENT_APPROVED' : 'AGENT_REJECTED',
        details: { agent_id: agentId },
        ip_address: await getClientIp()
      });
      
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
      
      await supabase.from('admin_logs').insert({
        admin_id: adminRecord?.id,
        action: verified ? 'VENDOR_APPROVED' : 'VENDOR_REJECTED',
        details: { vendor_id: vendorId },
        ip_address: await getClientIp()
      });
      
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
      
      await supabase.from('admin_logs').insert({
        admin_id: adminRecord?.id,
        action: 'USER_ROLE_CHANGED',
        details: { user_id: userId, new_role: newRole },
        ip_address: await getClientIp()
      });
      
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
      
      await supabase.from('admin_logs').insert({
        admin_id: adminRecord?.id,
        action: !isFeatured ? 'POOL_FEATURED' : 'POOL_UNFEATURED',
        details: { pool_id: poolId, pool_name: allPools.find(p => p.id === poolId)?.prize_name },
        ip_address: await getClientIp()
      });
      
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

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Security Badge */}
      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <span className="bg-red-800 text-white text-xs px-3 py-1 rounded-full">🔒 Secure Area</span>
              </div>
              <p className="text-red-100 mt-1">Welcome, {profile?.full_name || 'Admin'}</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-red-700/50 rounded-lg px-3 py-1 text-xs">
                <span>🛡️ Admin ID: {adminRecord?.role}</span>
              </div>
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
        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
          <p className="text-green-800 text-sm flex items-center gap-2">
            <span>✅</span> You are logged in as an authorized administrator. All actions are logged for security.
          </p>
        </div>

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

        {/* All Pools Tab - Keep existing */}
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

        {/* Approvals Tab - Keep existing */}
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

        {/* Users Tab - Keep existing */}
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
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Target</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Featured</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {allPools.map(pool => (
                    <tr key={pool.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{pool.prize_name}</td>
                      <td className="px-4 py-3">{pool.created_by === user?.id ? 'Admin' : 'User'}</td>
                      <td className="px-4 py-3">ETB {pool.target_amount?.toLocaleString()}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${pool.status === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}>{pool.status}</span></td>
                      <td className="px-4 py-3">{pool.is_featured ? '⭐ Featured' : 'Not featured'}</td>
                      <td className="px-4 py-3"><button onClick={() => toggleFeaturedPool(pool.id, pool.is_featured)} className={`px-3 py-1 rounded text-sm ${pool.is_featured ? 'bg-gray-300' : 'bg-yellow-500 text-white'}`}>{pool.is_featured ? 'Remove' : 'Feature'}</button></td>
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
            <h2 className="text-3xl font-bold mb-4">💚 2% for Health</h2>
            <p className="text-xl">Total Raised for Charity: ETB {Math.floor(stats.charity_total).toLocaleString()}</p>
            <p className="text-lg mt-2">Lives Impacted: {stats.lives_impacted}</p>
            <p className="text-sm mt-4">Supporting Ethiopians fighting kidney disease and heart disease</p>
            <div className="mt-6 bg-white/20 rounded-lg p-4 inline-block">
              <p className="font-semibold">Commercial Bank of Ethiopia</p>
              <p>Abbaa Carraa Health Foundation</p>
              <p className="text-sm">Reference: "Health Support"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
    
