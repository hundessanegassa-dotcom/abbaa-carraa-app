import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
    subscribeToNotifications();
  }, []);

  async function fetchNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
  }

  function subscribeToNotifications() {
    supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
  }

  async function markAsRead(id, link) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);
    
    setUnreadCount(prev => Math.max(0, prev - 1));
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    
    if (link) {
      window.location.href = link;
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) fetchNotifications();
        }}
        className="relative p-2 text-gray-600 hover:text-green-600 transition rounded-full hover:bg-gray-100"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b bg-gray-50 rounded-t-lg">
            <h3 className="font-bold text-gray-700">Notifications</h3>
          </div>
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              <span className="text-3xl">🔔</span>
              <p className="mt-2 text-sm">No notifications yet</p>
            </div>
          ) : (
            notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id, notif.link_url)}
                className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition ${!notif.is_read ? 'bg-blue-50' : ''}`}
              >
                <p className="font-medium text-sm text-gray-800">{notif.title}</p>
                <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(notif.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
