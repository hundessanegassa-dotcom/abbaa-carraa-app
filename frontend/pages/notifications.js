import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
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
    
    await fetchNotifications(user.id);
  }

  async function fetchNotifications(userId) {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    setNotifications(data || []);
    setLoading(false);
  }

  async function markAsRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) {
      toast('No unread notifications', { icon: '🔔' });
      return;
    }
    
    const { error } = await supabase
      .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);
    
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      toast.success(`Marked ${unreadIds.length} notifications as read`);
    }
  }

  async function deleteNotification(id) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification removed');
    }
  }

  const getNotificationIcon = (type) => {
    const icons = {
      winner: '🏆', draw: '🎲', pool: '🎁', payment: '💰',
      commission: '💎', charity: '💚', reminder: '⏰', system: '📢'
    };
    return icons[type] || '🔔';
  };

  const getNotificationColor = (type) => {
    const colors = {
      winner: 'bg-yellow-100', draw: 'bg-purple-100', pool: 'bg-blue-100',
      payment: 'bg-green-100', commission: 'bg-orange-100', charity: 'bg-red-100'
    };
    return colors[type] || 'bg-gray-100';
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="All Notifications" 
      subtitle="Stay updated with your activity" 
      icon="🔔" 
      bgGradient="from-purple-500 to-pink-500"
      user={user}
      profile={profile}
    >
      {/* Header with filters and settings link */}
      <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
        <div className="flex flex-wrap justify-between items-center gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filter === 'unread' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                filter === 'read' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Read
            </button>
          </div>
          <div className="flex gap-3">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-green-600 text-sm hover:underline"
              >
                Mark all as read
              </button>
            )}
            <Link href="/settings" className="text-blue-600 text-sm hover:underline">
              ⚙️ Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-xl font-semibold text-gray-700">No notifications</h3>
            <p className="text-gray-400 mt-2">You're all caught up!</p>
            <Link href="/dashboard" className="inline-block mt-4 text-purple-600 hover:underline">
              ← Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="divide-y">
            {filteredNotifications.map(notif => (
              <div
                key={notif.id}
                className={`p-4 hover:bg-gray-50 transition cursor-pointer ${!notif.is_read ? 'bg-purple-50/30 border-l-4 border-l-purple-500' : ''}`}
                onClick={() => {
                  if (!notif.is_read) markAsRead(notif.id);
                  if (notif.link_url) router.push(notif.link_url);
                }}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full ${getNotificationColor(notif.type)} flex items-center justify-center text-xl flex-shrink-0`}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                        {notif.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="text-gray-300 hover:text-red-500 transition text-xs flex-shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-xs text-gray-400">{formatTime(notif.created_at)}</p>
                      {!notif.is_read && <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Back to Dashboard */}
      <div className="mt-6 text-center">
        <Link href="/dashboard" className="text-gray-500 text-sm hover:text-gray-700">
          ← Back to Dashboard
        </Link>
      </div>
    </DashboardLayout>
  );
}
