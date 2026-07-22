// components/admin/AdminLayout.js - FIXED with proper subscription
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function AdminLayout({
  children,
  title,
  subtitle,
  icon,
  user,
  profile,
  activeTab = 'overview',
  language = 'am',
  toggleLanguage,
  show3D = true,
  onTabChange
}) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [is3D, setIs3D] = useState(show3D);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingCreatorApps, setPendingCreatorApps] = useState(0);
  const animationRef = useRef(null);
  const channelRef = useRef(null);
  const isMounted = useRef(true);

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D) {
      const animate = () => {
        setRotation(prev => (prev + 0.1) % 360);
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchPendingCreatorApps();
    }
  }, [user]);

  // ✅ FIXED: Only create subscription once with correct order
  useEffect(() => {
    if (!user || !isMounted.current) return;

    // Clean up previous subscription
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // Create new channel with listeners FIRST, then subscribe
    const channel = supabase.channel('admin_notifications_channel');
    
    channel
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'admin_notifications'
      }, (payload) => {
        if (!isMounted.current) return;
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast.info(`🔔 ${payload.new.title}`);
      })
      .subscribe((status) => {
        console.log('Admin notification subscription status:', status);
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [user]);

  const toggle3D = () => {
    setIs3D(!is3D);
  };

  const get3DTransform = () => {
    if (!is3D) return 'none';
    if (isHovered) {
      return `perspective(800px) rotateY(${rotation}deg) scale(1.01)`;
    }
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await supabase
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (isMounted.current) {
        setNotifications(data || []);
        setUnreadCount(data?.filter(n => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchPendingCreatorApps = async () => {
    try {
      const { count, error } = await supabase
        .from('pool_creators')
        .select('*', { count: 'exact', head: true })
        .eq('verification_status', 'pending');

      if (!error && isMounted.current) {
        setPendingCreatorApps(count || 0);
      }
    } catch (error) {
      console.error('Error fetching pending creator apps:', error);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id);

      if (isMounted.current) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      await supabase
        .from('admin_notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (isMounted.current) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all read:', error);
      toast.error('Failed to mark all as read');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const menuItems = [
    { id: 'overview', label: '📊 Overview', icon: '📊', href: '/admin/dashboard' },
    { id: 'creator-applications', label: '👑 Creator Apps', icon: '👑', href: '/admin/creator-applications', badge: pendingCreatorApps },
    { id: 'draw', label: '🎲 Draw Management', icon: '🎲', href: '/admin/draw' },
    { id: 'analytics', label: '📈 Analytics', icon: '📈', href: '/admin/analytics' },
    { id: 'users', label: '👥 Users', icon: '👥', href: '/admin/users' },
    { id: 'pools', label: '🏊 Pools', icon: '🏊', href: '/admin/pools' },
    { id: 'approvals', label: '📝 Approvals', icon: '📝', href: '/admin/approvals' },
    { id: 'withdrawals', label: '💰 Withdrawals', icon: '💰', href: '/admin/withdrawals' },
    { id: 'bank-transfers', label: '🏦 Bank Transfers', icon: '🏦', href: '/admin/bank-transfers' },
    { id: 'disputes', label: '⚖️ Disputes', icon: '⚖️', href: '/admin/disputes' },
    { id: 'settings', label: '⚙️ Settings', icon: '⚙️', href: '/admin/settings' },
  ];

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'Admin';
  const userInitial = userName?.[0]?.toUpperCase() || 'A';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link href="/admin/dashboard" className="flex items-center gap-2 group">
                <span className="text-2xl group-hover:scale-110 transition-transform">👑</span>
                <span className="font-bold text-white text-lg">Admin Panel</span>
              </Link>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* 3D Toggle */}
              <button
                onClick={toggle3D}
                className={`hidden sm:block px-2 py-1 rounded-lg text-xs font-medium transition ${is3D
                    ? 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/40'
                    : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/40'
                }`}
                title={is3D ? '3D ON' : '3D OFF'}
              >
                {is3D ? '🔄 3D' : '📐 2D'}
              </button>

              {/* Language Toggle */}
              {toggleLanguage && (
                <button
                  onClick={toggleLanguage}
                  className="bg-gray-700/50 hover:bg-gray-700 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition"
                >
                  {language === 'am' ? '🇬🇧 EN' : '🇪🇹 አማ'}
                </button>
              )}

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-full hover:bg-gray-800 transition"
                >
                  <span className="text-xl">🔔</span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 z-50 max-h-96 overflow-y-auto">
                    <div className="p-3 border-b border-gray-700 flex justify-between items-center">
                      <span className="font-bold text-white text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 text-sm">
                        No notifications
                      </div>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div
                          key={n.id}
                          className={`p-3 border-b border-gray-700 cursor-pointer hover:bg-gray-700 transition ${!n.read ? 'bg-gray-700/50 border-l-4 border-l-blue-500' : ''
                            }`}
                          onClick={() => markNotificationRead(n.id)}
                        >
                          <p className="font-medium text-white text-sm">{n.title}</p>
                          <p className="text-xs text-gray-400">{n.message}</p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className="hidden md:flex items-center gap-3">
                <Link href="/dashboard" className="text-sm text-gray-300 hover:text-white transition">
                  🏠 Home
                </Link>
                <button onClick={handleLogout} className="bg-red-600/20 hover:bg-red-600/30 text-white px-3 py-1.5 rounded-full text-sm transition">
                  Logout
                </button>
              </div>

              {/* User Avatar */}
              <div className="hidden md:flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                  {userInitial}
                </div>
                <span className="text-sm text-gray-300 hidden lg:inline">{userName}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 lg:static lg:inset-auto`}>
          <div className="h-full overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <span className="text-white font-bold text-lg">Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${activeTab === item.id
                      ? 'bg-red-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  onClick={() => {
                    setSidebarOpen(false);
                    if (onTabChange) onTabChange(item.id);
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-700">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition"
              >
                <span className="text-lg">🏠</span>
                <span>Back to Site</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-gray-800 hover:text-red-300 transition w-full"
              >
                <span className="text-lg">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content with 3D Effect */}
        <main
          className="flex-1 min-h-screen transition-all duration-500"
          style={{
            transform: get3DTransform(),
            transformStyle: 'preserve-3d',
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Header */}
          <div className={`bg-gradient-to-r from-red-600 to-rose-600 text-white py-6`}>
            <div className="container mx-auto px-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{icon || '👑'}</span>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{title || 'Admin Dashboard'}</h1>
                  {subtitle && <p className="text-sm opacity-90">{subtitle}</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="container mx-auto px-4 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
