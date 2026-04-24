import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AdminAnnouncements() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'info',
    link_url: '',
    link_text: '',
    expires_at: ''
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      toast.error('Admin access required');
      router.push('/dashboard');
      return;
    }

    setIsAdmin(true);
    await fetchAnnouncements();
    setLoading(false);
  }

  async function fetchAnnouncements() {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setAnnouncements(data || []);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      if (editing) {
        const { error } = await supabase
          .from('announcements')
          .update({
            title: formData.title,
            message: formData.message,
            type: formData.type,
            link_url: formData.link_url,
            link_text: formData.link_text,
            expires_at: formData.expires_at || null
          })
          .eq('id', editing.id);

        if (error) throw error;
        toast.success('Announcement updated!');
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert([{
            title: formData.title,
            message: formData.message,
            type: formData.type,
            link_url: formData.link_url,
            link_text: formData.link_text,
            expires_at: formData.expires_at || null,
            is_active: true
          }]);

        if (error) throw error;
        toast.success('Announcement created!');
      }

      resetForm();
      await fetchAnnouncements();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(announcement) {
    const { error } = await supabase
      .from('announcements')
      .update({ is_active: !announcement.is_active })
      .eq('id', announcement.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Announcement ${!announcement.is_active ? 'activated' : 'deactivated'}`);
      await fetchAnnouncements();
    }
  }

  async function deleteAnnouncement(id) {
    if (!confirm('Are you sure? This action cannot be undone.')) return;

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Announcement deleted');
      await fetchAnnouncements();
    }
  }

  function editAnnouncement(announcement) {
    setEditing(announcement);
    setFormData({
      title: announcement.title,
      message: announcement.message,
      type: announcement.type,
      link_url: announcement.link_url || '',
      link_text: announcement.link_text || '',
      expires_at: announcement.expires_at ? announcement.expires_at.split('T')[0] : ''
    });
  }

  function resetForm() {
    setEditing(null);
    setFormData({
      title: '',
      message: '',
      type: 'info',
      link_url: '',
      link_text: '',
      expires_at: ''
    });
  }

  if (!isAdmin) return null;
  if (loading && announcements.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Announcement Manager</h1>
          <Link href="/admin" className="text-green-600 hover:text-green-700">
            Back to Admin →
          </Link>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">
            {editing ? 'Edit Announcement' : 'Create New Announcement'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="e.g., Cash Equivalent Notice"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Message *</label>
              <textarea
                required
                rows={3}
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="Your announcement message here..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="info">ℹ️ Info (Blue)</option>
                  <option value="warning">⚠️ Warning (Yellow)</option>
                  <option value="success">✅ Success (Green)</option>
                  <option value="alert">🔴 Alert (Red)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Expires On (Optional)</label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Link URL (Optional)</label>
                <input
                  type="text"
                  value={formData.link_url}
                  onChange={(e) => setFormData({...formData, link_url: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="/pools/sino-truck"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Link Text</label>
                <input
                  type="text"
                  value={formData.link_text}
                  onChange={(e) => setFormData({...formData, link_text: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Learn More"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
              >
                {editing ? 'Update Announcement' : 'Create Announcement'}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Announcements List */}
        <h2 className="text-xl font-bold mb-4">Existing Announcements</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {announcements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No announcements yet. Create your first announcement above.
                  </td>
                </tr>
              ) : (
                announcements.map((ann) => (
                  <tr key={ann.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium">{ann.title}</td>
                    <td className="px-6 py-4 text-sm">{ann.message.substring(0, 60)}...</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ann.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                        ann.type === 'alert' ? 'bg-red-100 text-red-800' :
                        ann.type === 'success' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {ann.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${ann.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {ann.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => toggleActive(ann)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {ann.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => editAnnouncement(ann)}
                        className="text-green-600 hover:text-green-800 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sample Cash Equivalent Notice Suggestion */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800 mb-2">💡 Sample Cash Equivalent Notice</h3>
          <p className="text-sm text-gray-700 mb-3">
            When a pool reaches its target, the winner can choose to receive the current market value in cash instead of the physical prize.
          </p>
          <div className="bg-yellow-100 p-3 rounded font-mono text-sm">
            Title: Cash Equivalent Policy<br />
            Message: Due to market price fluctuations, winners may receive the CASH EQUIVALENT of the prize at the time the pool reaches its target.<br />
            Type: Warning<br />
            Link: /terms<br />
            Link Text: View Policy
          </div>
        </div>
      </div>
    </div>
  );
}
