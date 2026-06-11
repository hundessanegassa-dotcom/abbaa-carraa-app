// pages/admin/newsletter.js - View and manage subscribers
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import BackButton from '../../components/BackButton';
import toast from 'react-hot-toast';

export default function AdminNewsletter() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, thisMonth: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadSubscribers();
  }, []);

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
        active: data?.filter(s => s.is_active).length || 0,
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
        .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
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
        s.is_active ? 'Active' : 'Unsubscribed',
        s.source || 'website'
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <BackButton />
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">📧 Newsletter Subscribers</h1>
          <button onClick={exportCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            📥 Export CSV
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Total Subscribers</p>
            <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 text-sm">Active Subscribers</p>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <p className="text-gray-500 text-sm">New This Month</p>
            <p className="text-3xl font-bold text-purple-600">{stats.thisMonth}</p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        {/* Subscribers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                {loading ? (
                  <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">Loading...</td></tr>
                ) : filteredSubscribers.length === 0 ? (
                  <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-400">No subscribers found</td></tr>
                ) : (
                  filteredSubscribers.map(sub => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{sub.email}</td>
                      <td className="px-4 py-3 text-sm">{sub.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{new Date(sub.subscribed_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {sub.is_active ? (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Unsubscribed</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{sub.source || 'website'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {sub.is_active && (
                            <button onClick={() => unsubscribe(sub.email, sub.id)} className="text-yellow-600 hover:text-yellow-800 text-sm">Unsubscribe</button>
                          )}
                          <button onClick={() => deleteSubscriber(sub.id, sub.email)} className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
