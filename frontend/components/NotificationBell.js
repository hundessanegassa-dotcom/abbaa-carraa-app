import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function NotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const dropdownRef = useRef(null);

  // Only run on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    fetchNotifications();
    subscribeToNotifications();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClient]);

  async function fetchNotifications() {
    if (!isClient) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToNotifications() {
    if (!isClient) return;
    
    try {
      const { data: { user } } = supabase.auth.getUser();
      if (!user) return;

      supabase
        .channel('notifications')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            const newNotification = payload.new;
            setNotifications(prev => [newNotification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                <div className="flex-1 w-0 p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 pt-0.5">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        {getNotificationIcon(newNotification.type)}
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{newNotification.title}</p>
                      <p className="mt-1 text-sm text-gray-500">{newNotification.message}</p>
                    </div>
                  </div>
                </div>
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => {
                      toast.dismiss(t.id);
                      markAsRead(newNotification.id, newNotification.link_url);
                    }}
                    className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-green-600 hover:text-green-500 focus:outline-none"
                  >
                    View
                  </button>
                </div>
              </div>
            ), { duration: 5000 });
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error subscribing to notifications:', error);
    }
  }

  function getNotificationIcon(type) {
    const icons = {
      winner: '🏆', draw: '🎲', pool: '🎁', payment: '💰',
      commission: '💎', charity: '💚', reminder: '⏰', system: '📢',
      default: '🔔'
    };
    return icons[type] || icons.default;
  }

  async function markAsRead(id, link) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', id);
      
      if (error) throw error;
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      
      if (link) {
        setTimeout(() => {
          router.push(link);
          setShowDropdown(false);
        }, 100);
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length === 0) {
        toast('No unread notifications', { icon: '🔔' });
        return;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);
      
      if (error) throw error;
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      toast.success(`Marked ${unreadIds.length} notifications as read`);
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
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
      if (!notifications.find(n => n.id === id)?.is_read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      toast.success('Notification removed');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  }

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
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

  // Don't render anything during SSR
  if (!isClient) {
    return <div className="relative w-8 h-8"></div>;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) fetchNotifications();
        }}
        className="relative p-2 text-gray-600 hover:text-green-600 transition rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-bold px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border z-50 overflow-hidden animate-slide-down">
          <div className="flex justify-between items-center p-3 border-b bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <h3 className="font-bold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-green-600 hover:text-green-700 font-medium">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-xs text-gray-400 mt-2">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3">🔔</div>
                <p className="text-gray-400 text-sm">No notifications yet</p>
                <p className="text-xs text-gray-300 mt-1">Check back later!</p>
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map(notif => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id, notif.link_url)}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-all duration-150 ${!notif.is_read ? 'bg-green-50/30 border-l-4 border-l-green-500' : ''}`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.is_read ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <span className="text-lg">{getNotificationIcon(notif.type)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>{notif.title}</p>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                            className="text-gray-300 hover:text-red-500 transition flex-shrink-0"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className="text-[10px] text-gray-400">{formatTime(notif.created_at)}</p>
                          {!notif.is_read && <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-2 border-t bg-gray-50 text-center">
              <Link href="/notifications" className="text-xs text-green-600 hover:text-green-700">
                View all →
              </Link>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-down { animation: slideDown 0.2s ease-out; }
      `}</style>
    </div>
  );
}
