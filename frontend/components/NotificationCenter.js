// components/NotificationCenter.js - FIXED Realtime Subscription
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function NotificationCenter({
  userId,
  maxDisplay = 50,
  showSounds = true,
  autoHide = true,
  autoHideDuration = 5000,
  onNotificationClick,
  onNotificationRead
}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(showSounds);
  const dropdownRef = useRef(null);
  const subscriptionRef = useRef(null);
  const channelRef = useRef(null);
  const [notificationSound, setNotificationSound] = useState(null);

  // Load notification sound
  useEffect(() => {
    try {
      const audio = new Audio();
      audio.src = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0Y...';
      audio.volume = 0.3;
      setNotificationSound(audio);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(maxDisplay);

      if (error) throw error;

      setNotifications(data || []);
      const unread = (data || []).filter(n => !n.is_read).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  }, [userId, maxDisplay]);

  // ✅ FIXED: Subscribe to real-time notifications with proper pattern
  useEffect(() => {
    if (!userId) return;

    fetchNotifications();

    // ✅ Create channel first
    const channel = supabase.channel('notifications_channel');

    // ✅ Add the callback BEFORE subscribing
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const newNotification = payload.new;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        if (soundEnabled && notificationSound) {
          try {
            notificationSound.play();
          } catch (e) {
            console.log('Sound play failed');
          }
        }

        toast.custom((t) => (
          <div 
            className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
            onClick={() => handleNotificationClick(newNotification)}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="text-2xl">{getTypeIcon(newNotification.type)}</div>
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
          duration: autoHide ? autoHideDuration : Infinity,
          position: 'top-right',
        });

        if (onNotificationRead) {
          onNotificationRead(newNotification);
        }
      })
      // ✅ Now subscribe
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [userId, soundEnabled, notificationSound, autoHide, autoHideDuration]);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    
    if (notification.link_url) {
      window.location.href = notification.link_url;
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) return;

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);

      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      toast.success('All notifications marked as read');

    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const wasUnread = notifications.find(n => n.id === notificationId && !n.is_read);
        return wasUnread ? prev - 1 : prev;
      });

      await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      toast.success('Notification deleted');

    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    if (!confirm('Are you sure you want to clear all notifications?')) return;

    try {
      setNotifications([]);
      setUnreadCount(0);

      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      toast.success('All notifications cleared');

    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    setIsRefreshing(true);
    await fetchNotifications();
    setIsRefreshing(false);
  };

  // Get filtered notifications
  const getFilteredNotifications = () => {
    let filtered = notifications;

    if (filter === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (filter === 'read') {
      filtered = filtered.filter(n => n.is_read);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(n => n.type === typeFilter);
    }

    return filtered;
  };

  // Get notification type icon
  const getTypeIcon = (type) => {
    switch (type) {
      case 'ticket': return '🎫';
      case 'payment': return '💰';
      case 'pool': return '🏊';
      case 'system': return '⚙️';
      case 'promotion': return '🎉';
      case 'winner': return '🏆';
      case 'message': return '💬';
      case 'alert': return '⚠️';
      default: return '📢';
    }
  };

  // Get notification type color
  const getTypeColor = (type) => {
    switch (type) {
      case 'ticket': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'payment': return 'bg-green-100 text-green-800 border-green-300';
      case 'pool': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'system': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'promotion': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'winner': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'message': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'alert': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Format time
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  // Mock notifications for fallback
  const getMockNotifications = () => {
    return [
      {
        id: '1',
        user_id: userId,
        type: 'ticket',
        title: 'Ticket Purchase Successful',
        message: 'You have successfully purchased 3 seats in Addis Ababa VIP Pool.',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        link_url: '/dashboard/tickets'
      },
      {
        id: '2',
        user_id: userId,
        type: 'payment',
        title: 'Payment Verified',
        message: 'Your payment of ETB 1,500 has been verified successfully.',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        link_url: '/dashboard/payments'
      },
      {
        id: '3',
        user_id: userId,
        type: 'pool',
        title: 'Pool Update',
        message: 'The Merkato VIP Weekly pool is now 75% full. Join now!',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        link_url: '/merkato-seat?type=weekly'
      },
      {
        id: '4',
        user_id: userId,
        type: 'winner',
        title: '🎉 Congratulations!',
        message: 'You have been selected as a winner in the Adama Daily Pool!',
        is_read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        link_url: '/dashboard/winner'
      },
      {
        id: '5',
        user_id: userId,
        type: 'promotion',
        title: 'Special Promotion',
        message: '50% off on all entry fees this weekend! Use code: VIP50',
        is_read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        link_url: '/promotions'
      }
    ];
  };

  const filteredNotifications = getFilteredNotifications();
  const hasUnread = unreadCount > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <span className="text-2xl">🔔</span>
        {hasUnread && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white rounded-t-2xl border-b p-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Notifications
                  {hasUnread && (
                    <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </h3>
              </div>
              <div className="flex gap-1">
                {hasUnread && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium px-2 py-1 rounded hover:bg-emerald-50"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={refreshNotifications}
                  disabled={isRefreshing}
                  className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100"
                >
                  {isRefreshing ? '🔄' : '🔄'}
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-1 mt-3">
              <button
                onClick={() => setFilter('all')}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  filter === 'all' 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  filter === 'unread' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Unread {hasUnread && `(${unreadCount})`}
              </button>
              <button
                onClick={() => setFilter('read')}
                className={`text-xs px-3 py-1 rounded-full transition ${
                  filter === 'read' 
                    ? 'bg-gray-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Read
              </button>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 border-0 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All Types</option>
                <option value="ticket">🎫 Tickets</option>
                <option value="payment">💰 Payments</option>
                <option value="pool">🏊 Pools</option>
                <option value="winner">🏆 Winners</option>
                <option value="promotion">🎉 Promotions</option>
                <option value="system">⚙️ System</option>
                <option value="message">💬 Messages</option>
                <option value="alert">⚠️ Alerts</option>
              </select>

              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`text-xs px-2 py-1 rounded-full transition ${
                  soundEnabled 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {soundEnabled ? '🔊' : '🔇'}
              </button>
            </div>
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500">No notifications</p>
                <p className="text-xs text-gray-400">Stay tuned for updates!</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-xl cursor-pointer transition-all hover:shadow-md ${
                    !notification.is_read 
                      ? 'bg-blue-50 border-l-4 border-blue-500' 
                      : 'bg-white hover:bg-gray-50'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-2xl">{getTypeIcon(notification.type)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
                          {notification.title}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-500 text-xs flex-shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getTypeColor(notification.type)}`}>
                          {notification.type}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                      {!notification.is_read && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="sticky bottom-0 bg-white rounded-b-2xl border-t p-3 flex justify-between items-center">
              <span className="text-xs text-gray-400">
                {filteredNotifications.length} of {notifications.length} shown
              </span>
              <div className="flex gap-2">
                <button
                  onClick={clearAll}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
