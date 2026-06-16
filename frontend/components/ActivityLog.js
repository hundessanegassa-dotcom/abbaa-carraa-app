// components/ActivityLog.js - Complete User Activity Log with Filters & Analytics
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function ActivityLog({
  userId,
  maxDisplay = 50,
  showFilters = true,
  showStats = true,
  autoRefresh = true,
  refreshInterval = 30000,
  onActivityClick,
  compact = false
}) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, login, ticket, payment, pool, profile, system
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [stats, setStats] = useState({
    total: 0,
    byType: {},
    byDay: {},
    recentActivity: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const refreshTimerRef = useRef(null);

  // Activity type icons and colors
  const activityTypes = {
    login: { icon: '🔑', color: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Login' },
    logout: { icon: '🚪', color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Logout' },
    ticket_purchase: { icon: '🎫', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', label: 'Ticket Purchase' },
    ticket_verified: { icon: '✅', color: 'bg-green-100 text-green-800 border-green-300', label: 'Ticket Verified' },
    payment_submitted: { icon: '💰', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Payment Submitted' },
    payment_verified: { icon: '💳', color: 'bg-green-100 text-green-800 border-green-300', label: 'Payment Verified' },
    pool_joined: { icon: '🏊', color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Pool Joined' },
    profile_updated: { icon: '👤', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', label: 'Profile Updated' },
    password_changed: { icon: '🔒', color: 'bg-red-100 text-red-800 border-red-300', label: 'Password Changed' },
    settings_updated: { icon: '⚙️', color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Settings Updated' },
    winner_announced: { icon: '🏆', color: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Winner Announced' },
    referral_used: { icon: '🤝', color: 'bg-teal-100 text-teal-800 border-teal-300', label: 'Referral Used' },
    reward_claimed: { icon: '🎁', color: 'bg-pink-100 text-pink-800 border-pink-300', label: 'Reward Claimed' },
    system: { icon: '⚡', color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'System' }
  };

  useEffect(() => {
    if (userId) {
      fetchActivities();
      
      // Auto-refresh
      if (autoRefresh) {
        refreshTimerRef.current = setInterval(() => {
          fetchActivities(true);
        }, refreshInterval);
      }
    }
    
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, [userId, filter, dateRange]);

  async function fetchActivities(silent = false) {
    if (!userId) return;
    
    if (!silent) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(maxDisplay);

      // Apply type filter
      if (filter !== 'all') {
        query = query.eq('activity_type', filter);
      }

      // Apply date range filter
      if (dateRange.start) {
        query = query.gte('created_at', dateRange.start);
      }
      if (dateRange.end) {
        query = query.lte('created_at', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If no data in database, use mock data
      const activitiesData = data && data.length > 0 ? data : generateMockActivities();
      setActivities(activitiesData);
      
      // Calculate stats
      calculateStats(activitiesData);
      
      if (!silent) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      if (!silent) {
        // Use mock data as fallback
        const mockData = generateMockActivities();
        setActivities(mockData);
        calculateStats(mockData);
        setLoading(false);
      }
    } finally {
      if (silent) {
        setIsRefreshing(false);
      }
    }
  }

  function generateMockActivities() {
    const types = ['login', 'ticket_purchase', 'payment_submitted', 'pool_joined', 'profile_updated', 'settings_updated', 'winner_announced'];
    const messages = {
      login: 'User logged in successfully',
      logout: 'User logged out',
      ticket_purchase: 'Purchased 3 seats in Addis Ababa VIP Pool',
      payment_submitted: 'Submitted payment of ETB 1,500',
      payment_verified: 'Payment of ETB 1,500 verified',
      pool_joined: 'Joined Merkato Weekly Pool',
      profile_updated: 'Updated profile information',
      settings_updated: 'Updated notification preferences',
      winner_announced: 'Won ETB 10,000 in Weekly Pool!',
      password_changed: 'Changed password',
      referral_used: 'Referred a new user',
      reward_claimed: 'Claimed reward of ETB 500'
    };

    const activities = [];
    const now = new Date();
    
    for (let i = 0; i < 25; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const date = new Date(now);
      date.setMinutes(date.getMinutes() - i * 15 - Math.floor(Math.random() * 10));
      
      activities.push({
        id: `mock-${i}`,
        user_id: userId,
        activity_type: type,
        message: messages[type] || `${type} activity`,
        metadata: {
          ip: '192.168.1.' + Math.floor(Math.random() * 255),
          device: ['Chrome', 'Firefox', 'Safari', 'Mobile'][Math.floor(Math.random() * 4)],
          location: ['Addis Ababa', 'Adama', 'Bahir Dar', 'Dire Dawa'][Math.floor(Math.random() * 4)]
        },
        created_at: date.toISOString()
      });
    }
    
    return activities;
  }

  function calculateStats(activities) {
    const byType = {};
    const byDay = {};
    let recentActivity = null;

    activities.forEach(activity => {
      // Count by type
      const type = activity.activity_type || 'system';
      byType[type] = (byType[type] || 0) + 1;

      // Count by day
      const day = new Date(activity.created_at).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    if (activities.length > 0) {
      recentActivity = activities[0];
    }

    setStats({
      total: activities.length,
      byType,
      byDay,
      recentActivity
    });
  }

  const handleRefresh = () => {
    fetchActivities(true);
  };

  const handleActivityClick = (activity) => {
    if (onActivityClick) {
      onActivityClick(activity);
    }
  };

  const getFilteredActivities = () => {
    let filtered = activities;

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(a => 
        a.message?.toLowerCase().includes(search) ||
        a.activity_type?.toLowerCase().includes(search) ||
        a.metadata?.device?.toLowerCase().includes(search) ||
        a.metadata?.location?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const getActivityIcon = (type) => {
    return activityTypes[type]?.icon || '📌';
  };

  const getActivityColor = (type) => {
    return activityTypes[type]?.color || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getActivityLabel = (type) => {
    return activityTypes[type]?.label || type?.replace('_', ' ') || 'Activity';
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredActivities = getFilteredActivities();
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">📋</div>
        <h3 className="text-xl font-bold text-gray-700">No Activity Found</h3>
        <p className="text-gray-500 mt-2">Your activity log will appear here as you use the platform.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Section */}
      {showStats && !compact && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-xs text-gray-500">Total Activities</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-xs text-gray-500">Today</p>
                <p className="text-2xl font-bold">
                  {Object.entries(stats.byDay)
                    .filter(([date]) => date === new Date().toISOString().split('T')[0])
                    .reduce((sum, [_, count]) => sum + count, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="text-xs text-gray-500">Most Common</p>
                <p className="text-lg font-bold truncate">
                  {Object.entries(stats.byType)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 1)
                    .map(([type, count]) => `${getActivityLabel(type)} (${count})`)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🕐</span>
              <div>
                <p className="text-xs text-gray-500">Latest Activity</p>
                <p className="text-sm font-medium truncate">
                  {stats.recentActivity ? formatTime(stats.recentActivity.created_at) : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && !compact && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>

            {/* Type Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="all">All Types</option>
              {Object.keys(activityTypes).map(type => (
                <option key={type} value={type}>
                  {activityTypes[type].icon} {activityTypes[type].label}
                </option>
              ))}
            </select>

            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-gray-400 self-center">→</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 flex items-center gap-1"
            >
              {isRefreshing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Refreshing...
                </>
              ) : (
                '🔄 Refresh'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Activity List */}
      <div className="space-y-3">
        {paginatedActivities.map((activity) => (
          <div
            key={activity.id}
            className={`bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition cursor-pointer ${
              compact ? 'p-3' : ''
            }`}
            onClick={() => handleActivityClick(activity)}
          >
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                getActivityColor(activity.activity_type).split(' ')[0]
              }`}>
                <span className="text-lg">{getActivityIcon(activity.activity_type)}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap justify-between items-start gap-2">
                  <div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getActivityColor(activity.activity_type)}`}>
                      {getActivityLabel(activity.activity_type)}
                    </span>
                    <p className="text-sm text-gray-800 mt-1">{activity.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatTime(activity.created_at)}
                  </span>
                </div>

                {/* Metadata */}
                {!compact && activity.metadata && (
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
                    {activity.metadata.ip && (
                      <span className="flex items-center gap-1">
                        <span>🌐</span> {activity.metadata.ip}
                      </span>
                    )}
                    {activity.metadata.device && (
                      <span className="flex items-center gap-1">
                        <span>💻</span> {activity.metadata.device}
                      </span>
                    )}
                    {activity.metadata.location && (
                      <span className="flex items-center gap-1">
                        <span>📍</span> {activity.metadata.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <span>🕐</span> {formatDate(activity.created_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 rounded-lg transition ${
                  currentPage === pageNum
                    ? 'bg-emerald-600 text-white'
                    : 'border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <span className="px-2 py-2 text-gray-400">...</span>
          )}
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="text-center text-sm text-gray-400">
        Showing {paginatedActivities.length} of {filteredActivities.length} activities
        {searchTerm && ` (filtered from ${activities.length})`}
      </div>
    </div>
  );
}
