// pages/notifications.js - Complete Notification Center with 3D Effects & Advanced Features
import BackButton from '../components/BackButton';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';

export async function getServerSideProps() {
  return { props: {} };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [is3D, setIs3D] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const animationRef = useRef(null);
  const subscriptionRef = useRef(null);

  // Notification types with icons and colors
  const notificationTypes = {
    winner: { icon: '🏆', color: 'bg-yellow-100 text-yellow-800', label: 'Winner' },
    draw: { icon: '🎲', color: 'bg-purple-100 text-purple-800', label: 'Draw' },
    pool: { icon: '🎁', color: 'bg-blue-100 text-blue-800', label: 'Pool' },
    payment: { icon: '💰', color: 'bg-green-100 text-green-800', label: 'Payment' },
    commission: { icon: '💎', color: 'bg-orange-100 text-orange-800', label: 'Commission' },
    charity: { icon: '💚', color: 'bg-red-100 text-red-800', label: 'Charity' },
    reminder: { icon: '⏰', color: 'bg-amber-100 text-amber-800', label: 'Reminder' },
    system: { icon: '📢', color: 'bg-gray-100 text-gray-800', label: 'System' },
    ticket: { icon: '🎫', color: 'bg-emerald-100 text-emerald-800', label: 'Ticket' },
    promotion: { icon: '🎉', color: 'bg-pink-100 text-pink-800', label: 'Promotion' },
    message: { icon: '💬', color: 'bg-indigo-100 text-indigo-800', label: 'Message' },
    alert: { icon: '⚠️', color: 'bg-red-100 text-red-800', label: 'Alert' }
  };

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D) {
      const animate = () => {
        setRotation(prev => (prev + 0.15) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [is3D]);

  useEffect(() => {
    checkUser();
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  async function checkUser() {
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
      
      await fetchNotifications(user.id);
      setupRealtimeSubscription(user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('Failed to load notifications');
    }
  }

  async function fetchNotifications(userId) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
      // Use mock data if available
      setNotifications(getMockNotifications(userId));
    } finally {
      setLoading(false);
    }
  }

  function setupRealtimeSubscription(userId) {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    subscriptionRef.current = supabase
      .channel('notifications_channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const newNotification = payload.new;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.custom((t) => (
          <div 
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            onClick={() => router.push('/notifications')}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="text-2xl">{getNotificationIcon(newNotification.type)}</div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {newNotification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {newNotification.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  markAsRead(newNotification.id);
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-emerald-600 hover:text-emerald-500 focus:outline-none"
              >
                Mark Read
              </button>
            </div>
          </div>
        ), {
          duration: 5000,
          position: 'top-right',
        });
      })
      .subscribe();
  }

  function getMockNotifications(userId) {
    return [
      {
        id: 'mock-1',
        user_id: userId,
        type: 'winner',
        title: '🏆 Congratulations! You won!',
        message: 'You have been selected as a winner in the Addis Ababa VIP Pool!',
        is_read: false,
        created_at: new Date().toISOString(),
        link_url: '/dashboard/winner'
      },
      {
        id: 'mock-2',
        user_id: userId,
        type: 'payment',
        title: '💰 Payment Verified',
        message: 'Your payment of ETB 1,500 has been verified successfully.',
        is_read: true,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        link_url: '/dashboard/payments'
      },
      {
        id: 'mock-3',
        user_id: userId,
        type: 'pool',
        title: '🎁 New Pool Available',
        message: 'A new pool "Mega Car Prize" is now available! Join now.',
        is_read: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
        link_url: '/pools/new'
      }
    ];
  }

  async function markAsRead(id) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      setNotifications(prev => prev.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
      toast.error('Failed to mark as read');
    }
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) {
      toast('No unread notifications', { icon: '🔔' });
      return;
    }
    
    setIsMarkingAll(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);
      
      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success(`✅ Marked ${unreadIds.length} notifications as read`);
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setIsMarkingAll(false);
    }
  }

  async function deleteNotification(id) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification removed');
      setShowDeleteModal(false);
      setNotificationToDelete(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }

  async function clearAllNotifications() {
    if (!confirm('Are you sure you want to clear all notifications?')) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNotifications(user.id);
    setIsRefreshing(false);
    toast.success('Notifications refreshed');
  };

  const toggle3D = () => {
    setIs3D(!is3D);
  };

  const get3DTransform = () => {
    if (!is3D) return 'none';
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  const getNotificationIcon = (type) => {
    return notificationTypes[type]?.icon || '🔔';
  };

  const getNotificationColor = (type) => {
    return notificationTypes[type]?.color || 'bg-gray-100 text-gray-800';
  };

  const getNotificationLabel = (type) => {
    return notificationTypes[type]?.label || type || 'General';
  };

  const filteredNotifications = notifications.filter(n => {
    // Filter by read status
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  }).filter(n => {
    // Filter by type
    if (typeFilter !== 'all') return n.type === typeFilter;
    return true;
  }).filter(n => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return n.title?.toLowerCase().includes(search) || 
             n.message?.toLowerCase().includes(search);
    }
    return true;
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
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
      <div className="container mx-auto px-4 mt-4">
        <BackButton />
      </div>

      {/* 3D Notifications Container */}
      <div 
        className="container mx-auto px-4 mt-4 transition-all duration-500"
        style={{
          transform: get3DTransform(),
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Header with filters and settings */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔔</span>
              <h2 className="text-lg font-bold text-gray-800">
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                    {unreadCount} new
                  </span>
                )}
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggle3D}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition ${
                  is3D 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {is3D ? '🔄 3D' : '📐 2D'}
              </button>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium transition disabled:opacity-50 flex items-center gap-1"
              >
                {isRefreshing ? '🔄' : '🔄'} Refresh
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filter === 'unread' ? 'bg-yellow-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              📫 Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('read')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filter === 'read' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              ✅ Read
            </button>

            {/* Type Filter Dropdown */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-gray-300 bg-white focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              {Object.entries(notificationTypes).map(([key, value]) => (
                <option key={key} value={key}>
                  {value.icon} {value.label}
                </option>
              ))}
            </select>

            {/* Actions */}
            <div className="flex gap-2 ml-auto">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={isMarkingAll}
                  className="text-green-600 text-xs hover:underline disabled:opacity-50"
                >
                  {isMarkingAll ? '⏳' : '📫'} Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-red-500 text-xs hover:underline"
                >
                  🗑️ Clear all
                </button>
              )}
              <Link href="/settings" className="text-blue-600 text-xs hover:underline">
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
              <p className="text-gray-400 mt-2">
                {searchTerm || filter !== 'all' || typeFilter !== 'all'
                  ? 'No notifications match your filters.'
                  : "You're all caught up!"}
              </p>
              {(searchTerm || filter !== 'all' || typeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('all');
                    setTypeFilter('all');
                  }}
                  className="mt-4 text-purple-600 text-sm hover:underline"
                >
                  Clear all filters
                </button>
              )}
              <Link href="/dashboard" className="inline-block mt-4 text-purple-600 hover:underline">
                ← Back to Dashboard
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-gray-50 transition cursor-pointer ${
                    !notif.is_read ? 'bg-purple-50/30 border-l-4 border-l-purple-500' : ''
                  }`}
                  onClick={() => {
                    if (!notif.is_read) markAsRead(notif.id);
                    if (notif.link_url) router.push(notif.link_url);
                  }}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full ${getNotificationColor(notif.type)} flex items-center justify-center text-xl flex-shrink-0`}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h3 className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {notif.title}
                          </h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${getNotificationColor(notif.type)}`}>
                            {getNotificationLabel(notif.type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">{formatTime(notif.created_at)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotificationToDelete(notif.id);
                              setShowDeleteModal(true);
                            }}
                            className="text-gray-300 hover:text-red-500 transition text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {!notif.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notif.id);
                            }}
                            className="text-xs text-purple-600 hover:underline"
                          >
                            Mark as read
                          </button>
                        )}
                        {notif.link_url && (
                          <span className="text-xs text-blue-500">→ Click to view</span>
                        )}
                        {!notif.is_read && (
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Results Info */}
        {filteredNotifications.length > 0 && (
          <div className="text-center text-xs text-gray-400 mt-4">
            Showing {filteredNotifications.length} of {notifications.length} notifications
            {searchTerm && ` • Search: "${searchTerm}"`}
            {typeFilter !== 'all' && ` • Type: ${getNotificationLabel(typeFilter)}`}
            {filter !== 'all' && ` • ${filter === 'unread' ? 'Unread' : 'Read'}`}
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-gray-500 text-sm hover:text-gray-700">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🗑️</div>
              <h3 className="text-xl font-bold text-gray-800">Delete Notification</h3>
              <p className="text-gray-500 mt-2 text-sm">Are you sure you want to delete this notification? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteNotification(notificationToDelete)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
