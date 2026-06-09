// pages/admin/logs.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    try {
      // Fetch various log sources
      const [
        { data: notifications },
        { data: payments },
        { data: draws },
        { data: userActions }
      ] = await Promise.all([
        supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('city_vip_participants').select('*').eq('payment_status', 'verified').order('verified_at', { ascending: false }).limit(50),
        supabase.from('merkato_vip_draws').select('*').order('drawn_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false }).limit(50)
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
          timestamp: p.verified_at,
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <BackButton />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <BackButton />
      <h1 className="text-3xl font-bold mb-6">📜 System Logs</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-sm ${filter === 'all' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>All</button>
          <button onClick={() => setFilter('notification')} className={`px-3 py-1 rounded-full text-sm ${filter === 'notification' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}>🔔 Notifications</button>
          <button onClick={() => setFilter('payment')} className={`px-3 py-1 rounded-full text-sm ${filter === 'payment' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}>💰 Payments</button>
          <button onClick={() => setFilter('draw')} className={`px-3 py-1 rounded-full text-sm ${filter === 'draw' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>🏆 Draws</button>
          <button onClick={() => setFilter('user')} className={`px-3 py-1 rounded-full text-sm ${filter === 'user' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700'}`}>👤 Users</button>
        </div>
        <div className="flex-1">
          <input type="text" placeholder="Search logs..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-64 border rounded-lg px-3 py-1 text-sm" />
        </div>
        <button onClick={loadLogs} className="bg-blue-600 text-white px-4 py-1 rounded-lg text-sm hover:bg-blue-700">Refresh</button>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
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
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-400">No logs found</td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(log.type)}`}>
                        {log.icon} {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-sm">{log.action}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{log.details}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.user}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{new Date(log.timestamp).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
