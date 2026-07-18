// pages/admin/newsletter.js - FIXED with AdminLayout and useRouter
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // ✅ FIXED: Added missing import
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';

export default function AdminNewsletter() {
  const router = useRouter(); // ✅ FIXED: Now properly initialized
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, thisMonth: 0 });
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
      await loadSubscribers();
    } catch (error) {
      console.error('Admin check error:', error);
      toast.error('Failed to verify admin access');
      router.push('/dashboard');
    }
  }

  async function loadSubscribers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });
      
      if (error) throw error;
      setSubscribers(data || []);
      
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      setStats({
        total: data?.length || 0,
        active: data?.filter(s => s.is_active !== false).length || 0,
        thisMonth: data?.filter(s => new Date(s.subscribed_at) >= thisMonthStart).length || 0
      });
    } catch (error) {
      console.error('Error loading subscribers:', error);
      toast.error('Failed to load subscribers');
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe(email, id) {
    if (!confirm(`Unsubscribe ${email}?`)) return;
    
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Subscriber unsubscribed');
      loadSubscribers();
    } catch (error) {
      toast.error('Failed to unsubscribe');
    }
  }

  async function deleteSubscriber(id, email) {
    if (!confirm(`Permanently delete ${email}? This cannot be undone.`)) return;
    
    try {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Subscriber deleted');
      loadSubscribers();
    } catch (error) {
      toast.error('Failed to delete');
    }
  }

  async function exportCSV() {
    const csvRows = [
      ['Email', 'Name', 'Subscribed Date', 'Status', 'Source']
    ];
    
    subscribers.forEach(s => {
      csvRows.push([
        s.email,
        s.name || '',
        new Date(s.subscribed_at).toLocaleString(),
        s.is_active !== false ? 'Active' : 'Unsubscribed',
        s.subscribed_from || 'website'
      ]);
    });
    
    const csvContent = csvRows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Export started');
  }

  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.name && s.name.toLowerCase().includes(search.toLowerCase()))
  );

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
      title="Newsletter Subscribers"
      subtitle={`${stats.total} subscribers • ${stats.active} active`}
      icon="📧"
      user={user}
      profile={profile}
      activeTab="newsletter"
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm">Total Subscribers</p>
          <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm">Active Subscribers</p>
          <p className="text-3xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <p className="text-gray-500 text-sm">New This Month</p>
          <p className="text-3xl font-bold text-purple-600">{stats.thisMonth}</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="bg-white rounded-xl shadow p-4 mb-6 border border-gray-200">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
          <div className="flex gap-2">
            <button 
              onClick={loadSubscribers} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
            >
              🔄 Refresh
            </button>
            <button 
              onClick={exportCSV} 
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1"
            >
              📥 Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subscribed</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center text-gray-400">
                    <div className="text-4xl mb-2">📭</div>
                    <p>No subscribers found</p>
                    <p className="text-sm mt-1">Try adjusting your search or refresh</p>
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map(sub => (
                  <tr key={sub.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm">{sub.email}</td>
                    <td className="px-4 py-3 text-sm">{sub.name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{new Date(sub.subscribed_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      {sub.is_active !== false ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">Unsubscribed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs">
                        {sub.subscribed_from || 'website'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {sub.is_active !== false && (
                          <button 
                            onClick={() => unsubscribe(sub.email, sub.id)} 
                            className="text-yellow-600 hover:text-yellow-800 text-sm font-medium transition"
                          >
                            Unsubscribe
                          </button>
                        )}
                        <button 
                          onClick={() => deleteSubscriber(sub.id, sub.email)} 
                          className="text-red-600 hover:text-red-800 text-sm font-medium transition"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-4 text-center text-sm text-gray-400">
        {filteredSubscribers.length} of {subscribers.length} subscribers shown
        {search && ` (filtered by "${search}")`}
      </div>
    </AdminLayout>
  );
}
