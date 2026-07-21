// pages/admin/users.js - COMPLETE with creator role and enhanced features
import AdminLayout from '../../components/admin/AdminLayout';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    individual: 0,
    agent: 0,
    vendor: 0,
    organization: 0,
    admin: 0,
    creator: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }
      setUser(user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profile);
      
      // Check if user is admin
      const { data: adminRecord } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (profile?.role !== 'admin' && !adminRecord) {
        toast.error('Admin access required');
        return;
      }
      
      setIsAdmin(true);
      await fetchUsers();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      // Fetch all users
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get creator status for each user
      const usersWithCreatorStatus = await Promise.all(
        (profiles || []).map(async (user) => {
          const { data: creator } = await supabase
            .from('pool_creators')
            .select('id, verification_status, total_pools_created')
            .eq('user_id', user.id)
            .maybeSingle();
          
          return {
            ...user,
            is_creator: !!creator,
            creator_status: creator?.verification_status || null,
            creator_pools: creator?.total_pools_created || 0
          };
        })
      );
      
      setUsers(usersWithCreatorStatus);
      
      // Calculate stats
      const stats = {
        total: usersWithCreatorStatus.length,
        individual: usersWithCreatorStatus.filter(u => !u.role || u.role === 'individual').length,
        agent: usersWithCreatorStatus.filter(u => u.role === 'agent').length,
        vendor: usersWithCreatorStatus.filter(u => u.role === 'vendor').length,
        organization: usersWithCreatorStatus.filter(u => u.role === 'organization').length,
        admin: usersWithCreatorStatus.filter(u => u.role === 'admin').length,
        creator: usersWithCreatorStatus.filter(u => u.is_creator).length
      };
      setStats(stats);
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.phone?.includes(searchTerm);
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role, isCreator, creatorStatus) => {
    if (role === 'admin') {
      return <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Admin</span>;
    }
    if (role === 'agent') {
      return <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Agent</span>;
    }
    if (role === 'vendor') {
      return <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">Vendor</span>;
    }
    if (role === 'organization') {
      return <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-700">Organization</span>;
    }
    if (isCreator) {
      const statusColors = {
        pending: 'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700'
      };
      const statusLabels = {
        pending: '⏳ Creator (Pending)',
        approved: '✅ Creator',
        rejected: '❌ Creator (Rejected)'
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[creatorStatus] || 'bg-blue-100 text-blue-700'}`}>
          {statusLabels[creatorStatus] || '👑 Creator'}
        </span>
      );
    }
    return <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">Individual</span>;
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  if (loading) {
    return (
      <AdminLayout title="Users" subtitle="Manage platform users" icon="👥" user={user} profile={profile} activeTab="users">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout title="Users" subtitle="Access Denied" icon="👥" user={user} profile={profile} activeTab="users">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600 font-semibold">⚠️ Admin access required</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout 
      title="Users" 
      subtitle={`${users.length} total users • ${stats.creator} creators`} 
      icon="👥" 
      user={user} 
      profile={profile} 
      activeTab="users"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mb-6">
        <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
          <p className="text-xl font-bold text-blue-600">{stats.total}</p>
          <p className="text-[10px] text-gray-500">Total</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
          <p className="text-xl font-bold text-gray-600">{stats.individual}</p>
          <p className="text-[10px] text-gray-500">Individual</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
          <p className="text-xl font-bold text-yellow-600">{stats.agent}</p>
          <p className="text-[10px] text-gray-500">Agents</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-3 text-center border border-purple-200">
          <p className="text-xl font-bold text-purple-600">{stats.vendor}</p>
          <p className="text-[10px] text-gray-500">Vendors</p>
        </div>
        <div className="bg-cyan-50 rounded-xl p-3 text-center border border-cyan-200">
          <p className="text-xl font-bold text-cyan-600">{stats.organization}</p>
          <p className="text-[10px] text-gray-500">Orgs</p>
        </div>
        <div className="bg-pink-50 rounded-xl p-3 text-center border border-pink-200">
          <p className="text-xl font-bold text-pink-600">{stats.creator}</p>
          <p className="text-[10px] text-gray-500">Creators</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-200">
          <p className="text-xl font-bold text-red-600">{stats.admin}</p>
          <p className="text-[10px] text-gray-500">Admins</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="🔍 Search users by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="individual">Individual</option>
          <option value="agent">Agent</option>
          <option value="vendor">Vendor</option>
          <option value="organization">Organization</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={fetchUsers}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creator Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                    No users found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {(u.full_name || u.email || 'U')[0].toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">{u.full_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{u.email}</td>
                    <td className="px-4 py-3">
                      {getRoleBadge(u.role, u.is_creator, u.creator_status)}
                    </td>
                    <td className="px-4 py-3">
                      {u.is_creator ? (
                        <span className="text-sm text-green-600">
                          ✅ {u.creator_pools || 0} pools
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Not a creator</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openUserDetails(u)}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredUsers.length > 0 && (
          <div className="px-4 py-3 bg-gray-50 border-t text-sm text-gray-500">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
              <h2 className="text-xl font-bold">👤 User Details</h2>
              <button 
                onClick={() => setShowUserModal(false)} 
                className="text-gray-500 hover:text-gray-700 text-2xl transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                  {(selectedUser.full_name || selectedUser.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-xl font-bold">{selectedUser.full_name || 'N/A'}</p>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {getRoleBadge(selectedUser.role, selectedUser.is_creator, selectedUser.creator_status)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">City</p>
                  <p className="font-medium">{selectedUser.city || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Joined</p>
                  <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="font-medium">{selectedUser.is_banned ? '🚫 Banned' : '✅ Active'}</p>
                </div>
              </div>

              {selectedUser.is_creator && (
                <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-bold text-blue-800 mb-2">👑 Creator Information</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Status</p>
                      <p className="font-medium">
                        {selectedUser.creator_status === 'approved' ? '✅ Approved' :
                         selectedUser.creator_status === 'pending' ? '⏳ Pending' :
                         selectedUser.creator_status === 'rejected' ? '❌ Rejected' : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Pools</p>
                      <p className="font-medium">{selectedUser.creator_pools || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowUserModal(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
