// pages/admin/logs.js - COMPLETE with creator logs
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
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

      const { data: adminRecord } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (profile?.role !== 'admin' && !adminRecord) {
        toast.error('Admin access required');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      await loadLogs();
    } catch (error) {
      console.error('Admin check error:', error);
      toast.error('Failed to verify admin access');
      router.push('/dashboard');
    }
  }

  async function loadLogs() {
    setLoading(true);
    try {
      // Fetch various log sources
      const [
        { data: notifications },
        { data: payments },
        { data: draws },
        { data: userActions },
        { data: creatorApplications },
        { data: creatorApprovals }
      ] = await Promise.all([
        supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('city_vip_participants').select('*').eq('payment_status', 'verified').order('verified_at', { ascending: false }).limit(50),
        supabase.from('merkato_vip_draws').select('*').order('drawn_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }).limit(50),
        supabase.from('pool_creators').select('*').eq('verification_status', 'pending').order('created_at', { ascending: false }).limit(50),
        supabase.from('pool_creators').select('*').in('verification_status', ['approved', 'rejected']).order('updated_at', { ascending: false }).limit(50)
      ]);

      const formattedLogs = [];

      // Add notifications as logs
      (notifications || []).forEach(n => {
        formattedLogs.push({
          id: n.id,
          type: 'notification',
          action: n.title,
          details: n.message,
          user: 'System',
          timestamp: n.created_at,
          icon: '🔔'
        });
      });

      // Add payment verifications as logs
      (payments || []).forEach(p => {
        formattedLogs.push({
          id: p.id,
          type: 'payment',
          action: 'Payment Verified',
          details: `${p.user_name} paid ETB ${p.contribution_amount?.toLocaleString()} for ${p.city || 'Merkato'} ${p.pool_type}`,
          user: p.user_name,
          timestamp: p.verified_at || p.created_at,
          icon: '💰'
        });
      });

      // Add draws as logs
      (draws || []).forEach(d => {
        formattedLogs.push({
          id: d.id,
          type: 'draw',
          action: 'Winner Drawn',
          details: `${d.winner_name} won ETB ${d.prize_amount?.toLocaleString()} in ${d.city || 'Merkato'} pool`,
          user: d.winner_name,
          timestamp: d.drawn_at,
          icon: '🏆'
        });
      });

      // Add new users as logs
      (userActions || []).forEach(u => {
        formattedLogs.push({
          id: u.id,
          type: 'user',
          action: 'New User Registered',
          details: `${u.full_name || u.email} joined the platform`,
          user: u.full_name || u.email,
          timestamp: u.created_at,
          icon: '👤'
        });
      });

      // Add creator applications as logs
      (creatorApplications || []).forEach(c => {
        formattedLogs.push({
          id: c.id,
          type: 'creator',
          action: 'Creator Application Submitted',
          details: `${c.business_name || c.full_name} applied to become a creator`,
          user: c.full_name || c.email,
          timestamp: c.created_at,
          icon: '👑'
        });
      });

      // Add creator approvals/rejections as logs
      (creatorApprovals || []).forEach(c => {
        const action = c.verification_status === 'approved' ? 'Creator Application Approved' : 'Creator Application Rejected';
        formattedLogs.push({
          id: c.id,
          type: 'creator',
          action: action,
          details: `${c.business_name || c.full_name} ${c.verification_status === 'approved' ? 'approved' : 'rejected'}${c.rejection_reason ? ` (Reason: ${c.rejection_reason})` : ''}`,
          user: c.full_name || c.email,
          timestamp: c.updated_at || c.created_at,
          icon: c.verification_status === 'approved' ? '✅' : '❌'
        });
      });

      // Sort by timestamp descending
      formattedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setLogs(formattedLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
      toast.error('Failed to load logs');
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.type !== filter) return false;
    if (search && !log.action.toLowerCase().includes(search.toLowerCase()) && !log.details.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getTypeColor = (type) => {
    switch(type) {
      case 'notification': return 'bg-blue-100 text-blue-800';
      case 'payment': return 'bg-green-100 text-green-800';
      case 'draw': return 'bg-purple-100 text-purple-800';
      case 'user': return 'bg-yellow-100 text-yellow-800';
      case 'creator': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'notification': return '🔔';
      case 'payment': return '💰';
      case 'draw': return '🏆';
      case 'user': return '👤';
      case 'creator': return '👑';
      default: return '📌';
    }
  };

  if (!isAdmin) return null;
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <AdminLayout
      title="System Logs"
      subtitle={`${filteredLogs.length} logs found`}
      icon="📜"
      user={user}
      profile={profile}
      activeTab="logs"
    >
      {/* Filters */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilter('all')} 
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('notification')} 
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                filter === 'notification' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🔔 Notifications
            </button>
            <button 
              onClick={() => setFilter('payment')} 
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                filter === 'payment' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              💰 Payments
            </button>
            <button 
              onClick={() => setFilter('draw')} 
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                filter === 'draw' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🏆 Draws
            </button>
            <button 
              onClick={() => setFilter('user')} 
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                filter === 'user' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              👤 Users
            </button>
            <button 
              onClick={() => setFilter('creator')} 
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1 ${
                filter === 'creator' ? 'bg-pink-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              👑 Creators
            </button>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search logs..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="w-full border rounded-lg px-4 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={loadLogs} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-12 text-center text-gray-400">
                    <div className="text-4xl mb-2">📭</div>
                    <p>No logs found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or refresh</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={`${log.id}-${log.timestamp}`} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                        {getTypeIcon(log.type)} {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-sm">{log.action}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.user}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-200">
          <p className="text-2xl font-bold text-blue-600">{logs.filter(l => l.type === 'notification').length}</p>
          <p className="text-xs text-gray-500">🔔 Notifications</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-200">
          <p className="text-2xl font-bold text-green-600">{logs.filter(l => l.type === 'payment').length}</p>
          <p className="text-xs text-gray-500">💰 Payments</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-200">
          <p className="text-2xl font-bold text-purple-600">{logs.filter(l => l.type === 'draw').length}</p>
          <p className="text-xs text-gray-500">🏆 Draws</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-200">
          <p className="text-2xl font-bold text-yellow-600">{logs.filter(l => l.type === 'user').length}</p>
          <p className="text-xs text-gray-500">👤 Users</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-200">
          <p className="text-2xl font-bold text-pink-600">{logs.filter(l => l.type === 'creator').length}</p>
          <p className="text-xs text-gray-500">👑 Creators</p>
        </div>
      </div>
    </AdminLayout>
  );
}
