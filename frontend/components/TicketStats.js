// components/TicketStats.js - Complete Ticket Statistics with Charts & Analytics
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function TicketStats({ 
  userId,
  timeRange = 'all', // 'day', 'week', 'month', 'year', 'all'
  showCharts = true,
  showBreakdown = true,
  compact = false
}) {
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    rejected: 0,
    totalAmount: 0,
    averageAmount: 0,
    maxAmount: 0,
    minAmount: 0,
    byType: {
      regular: 0,
      merkato: 0,
      city: 0
    },
    byStatus: {
      verified: 0,
      pending_verification: 0,
      pending: 0,
      rejected: 0
    },
    byDate: [],
    recentTickets: [],
    topPools: [],
    monthlyTrend: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(timeRange);
  const [chartView, setChartView] = useState('bar'); // 'bar', 'pie', 'line'
  const chartRef = useRef(null);

  useEffect(() => {
    if (userId) {
      fetchTicketStats();
    }
  }, [userId, selectedPeriod]);

  const fetchTicketStats = async () => {
    setLoading(true);
    try {
      let allTickets = [];
      let dateFilter = getDateFilter(selectedPeriod);

      // Fetch from all ticket tables
      const tables = [
        { name: 'regular_pool_participants', type: 'regular' },
        { name: 'merkato_vip_participants', type: 'merkato' },
        { name: 'city_vip_participants', type: 'city' }
      ];

      for (const table of tables) {
        let query = supabase
          .from(table.name)
          .select('*')
          .eq('user_id', userId);

        if (dateFilter) {
          query = query.gte('created_at', dateFilter);
        }

        const { data, error } = await query;
        if (!error && data) {
          allTickets = [...allTickets, ...data.map(t => ({ ...t, type: table.type }))];
        }
      }

      // Calculate stats
      const stats = calculateStats(allTickets);
      setStats(stats);

    } catch (error) {
      console.error('Error fetching ticket stats:', error);
      toast.error('Failed to load ticket statistics');
    } finally {
      setLoading(false);
    }
  };

  const getDateFilter = (period) => {
    const now = new Date();
    switch (period) {
      case 'day':
        return new Date(now.setHours(0, 0, 0, 0)).toISOString();
      case 'week':
        return new Date(now.setDate(now.getDate() - 7)).toISOString();
      case 'month':
        return new Date(now.setMonth(now.getMonth() - 1)).toISOString();
      case 'year':
        return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString();
      default:
        return null;
    }
  };

  const calculateStats = (tickets) => {
    const total = tickets.length;
    const verified = tickets.filter(t => t.payment_status === 'verified').length;
    const pendingVerification = tickets.filter(t => t.payment_status === 'pending_verification').length;
    const pending = tickets.filter(t => t.payment_status === 'pending').length;
    const rejected = tickets.filter(t => t.payment_status === 'rejected').length;

    const amounts = tickets.map(t => t.contribution_amount || 0);
    const totalAmount = amounts.reduce((sum, a) => sum + a, 0);
    const averageAmount = total > 0 ? totalAmount / total : 0;
    const maxAmount = amounts.length > 0 ? Math.max(...amounts) : 0;
    const minAmount = amounts.length > 0 ? Math.min(...amounts) : 0;

    // By type
    const byType = {
      regular: tickets.filter(t => t.type === 'regular').length,
      merkato: tickets.filter(t => t.type === 'merkato').length,
      city: tickets.filter(t => t.type === 'city').length
    };

    // By status
    const byStatus = {
      verified,
      pending_verification: pendingVerification,
      pending,
      rejected
    };

    // By date (last 30 days)
    const byDate = getTicketsByDate(tickets);

    // Recent tickets (last 10)
    const recentTickets = tickets
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    // Top pools
    const topPools = getTopPools(tickets);

    // Monthly trend
    const monthlyTrend = getMonthlyTrend(tickets);

    return {
      total,
      verified,
      pending: pending + pendingVerification,
      pendingVerification,
      rejected,
      totalAmount,
      averageAmount,
      maxAmount,
      minAmount,
      byType,
      byStatus,
      byDate,
      recentTickets,
      topPools,
      monthlyTrend
    };
  };

  const getTicketsByDate = (tickets) => {
    const dateMap = {};
    const last30Days = [];

    // Create last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      dateMap[key] = { date: key, count: 0, amount: 0 };
      last30Days.push(key);
    }

    // Count tickets by date
    tickets.forEach(ticket => {
      const date = new Date(ticket.created_at).toISOString().split('T')[0];
      if (dateMap[date]) {
        dateMap[date].count++;
        dateMap[date].amount += (ticket.contribution_amount || 0);
      }
    });

    return last30Days.map(key => dateMap[key]);
  };

  const getTopPools = (tickets) => {
    const poolMap = {};
    tickets.forEach(ticket => {
      const poolName = ticket.pool_name || ticket.prize_name || `${ticket.type} Pool`;
      if (!poolMap[poolName]) {
        poolMap[poolName] = { name: poolName, count: 0, amount: 0, type: ticket.type };
      }
      poolMap[poolName].count++;
      poolMap[poolName].amount += (ticket.contribution_amount || 0);
    });

    return Object.values(poolMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  };

  const getMonthlyTrend = (tickets) => {
    const monthMap = {};
    const last12Months = [];

    // Create last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthMap[key] = { month: key, count: 0, amount: 0, label: date.toLocaleString('default', { month: 'short', year: 'numeric' }) };
      last12Months.push(key);
    }

    // Count tickets by month
    tickets.forEach(ticket => {
      const date = new Date(ticket.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthMap[key]) {
        monthMap[key].count++;
        monthMap[key].amount += (ticket.contribution_amount || 0);
      }
    });

    return last12Months.map(key => monthMap[key]);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'verified': return '✅';
      case 'pending_verification': return '⏳';
      case 'pending': return '🔄';
      case 'rejected': return '❌';
      default: return '❓';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return 'text-green-600';
      case 'pending_verification': return 'text-yellow-600';
      case 'pending': return 'text-gray-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'regular': return '🎯';
      case 'merkato': return '🏪';
      case 'city': return '🏙️';
      default: return '🎫';
    }
  };

  const formatCurrency = (amount) => {
    return `ETB ${amount.toLocaleString()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWinRate = () => {
    if (stats.total === 0) return 0;
    return (stats.verified / stats.total) * 100;
  };

  const getSuccessRate = () => {
    const completed = stats.verified + stats.rejected;
    if (completed === 0) return 0;
    return (stats.verified / completed) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (stats.total === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-xl font-bold text-gray-700">No Ticket Data</h3>
        <p className="text-gray-500 mt-2">Start purchasing tickets to see your statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Filter */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedPeriod === 'all' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setSelectedPeriod('year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedPeriod === 'year' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Year
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedPeriod === 'month' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedPeriod === 'week' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedPeriod('day')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              selectedPeriod === 'day' 
                ? 'bg-emerald-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Today
          </button>
        </div>
        <button
          onClick={fetchTicketStats}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          🔄 Refresh
        </button>
      </div>

      {!compact ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎫</span>
                <div>
                  <p className="text-xs text-gray-500">Total Tickets</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-xs text-green-600">Verified</p>
                  <p className="text-2xl font-bold text-green-700">{stats.verified}</p>
                </div>
              </div>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="text-xs text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-700">{stats.pending}</p>
                </div>
              </div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">❌</span>
                <div>
                  <p className="text-xs text-red-600">Rejected</p>
                  <p className="text-2xl font-bold text-red-700">{stats.rejected}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-xs text-blue-600">Total Spent</p>
                  <p className="text-2xl font-bold text-blue-700">{formatCurrency(stats.totalAmount)}</p>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4 shadow-sm border border-purple-200">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="text-xs text-purple-600">Win Rate</p>
                  <p className="text-2xl font-bold text-purple-700">{getWinRate().toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4">📊 Status Distribution</h4>
                <div className="space-y-3">
                  {Object.entries(stats.byStatus).map(([status, count]) => (
                    <div key={status}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{status.replace('_', ' ')}</span>
                        <span className="font-medium">{count} ({((count / stats.total) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            status === 'verified' ? 'bg-green-500' :
                            status === 'pending_verification' ? 'bg-yellow-500' :
                            status === 'pending' ? 'bg-gray-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Type Distribution */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-4">📱 Program Distribution</h4>
                <div className="space-y-3">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize flex items-center gap-2">
                          {getTypeIcon(type)} {type}
                        </span>
                        <span className="font-medium">{count} ({((count / stats.total) * 100).toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            type === 'regular' ? 'bg-blue-500' :
                            type === 'merkato' ? 'bg-emerald-500' :
                            'bg-purple-500'
                          }`}
                          style={{ width: `${(count / stats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Monthly Trend */}
          {showCharts && stats.monthlyTrend.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-4">📈 Monthly Trend</h4>
              <div className="overflow-x-auto">
                <div className="flex items-end gap-2 min-w-[300px] h-40">
                  {stats.monthlyTrend.map((item, index) => {
                    const maxCount = Math.max(...stats.monthlyTrend.map(i => i.count), 1);
                    const height = (item.count / maxCount) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-full bg-emerald-500 rounded-t transition-all duration-500 hover:bg-emerald-600 cursor-pointer"
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${item.label}: ${item.count} tickets, ${formatCurrency(item.amount)}`}
                        />
                        <span className="text-[10px] text-gray-500 mt-1 rotate-45 origin-top-left">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2">
                <span>Total: {stats.monthlyTrend.reduce((sum, i) => sum + i.count, 0)} tickets</span>
                <span>Total Amount: {formatCurrency(stats.monthlyTrend.reduce((sum, i) => sum + i.amount, 0))}</span>
              </div>
            </div>
          )}

          {/* Top Pools */}
          {showBreakdown && stats.topPools.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-4">🏆 Top Pools</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.topPools.map((pool, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800">{pool.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          {getTypeIcon(pool.type)} {pool.type}
                        </p>
                      </div>
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2 text-sm">
                      <span className="text-gray-500">Tickets: {pool.count}</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(pool.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Tickets */}
          {showBreakdown && stats.recentTickets.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h4 className="font-bold text-gray-800 mb-4">🕐 Recent Tickets</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b">
                      <th className="pb-2">Ticket #</th>
                      <th className="pb-2">Program</th>
                      <th className="pb-2">Seats</th>
                      <th className="pb-2">Amount</th>
                      <th className="pb-2">Status</th>
                      <th className="pb-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentTickets.map((ticket, index) => (
                      <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-2 font-mono text-xs">{ticket.ticket_number || 'N/A'}</td>
                        <td className="py-2 flex items-center gap-1">
                          {getTypeIcon(ticket.type)} {ticket.type}
                        </td>
                        <td className="py-2">{ticket.seat_numbers?.sort((a,b)=>a-b).join(', ') || 'N/A'}</td>
                        <td className="py-2 font-bold text-emerald-600">{formatCurrency(ticket.contribution_amount || 0)}</td>
                        <td className="py-2">
                          <span className={`${getStatusColor(ticket.payment_status)}`}>
                            {getStatusIcon(ticket.payment_status)} {ticket.payment_status?.replace('_', ' ') || 'N/A'}
                          </span>
                        </td>
                        <td className="py-2 text-gray-500 text-xs">{formatDate(ticket.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
              <p className="text-xs text-gray-500">Average Amount</p>
              <p className="text-lg font-bold text-gray-800">{formatCurrency(stats.averageAmount)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
              <p className="text-xs text-gray-500">Highest Amount</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(stats.maxAmount)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
              <p className="text-xs text-gray-500">Lowest Amount</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.minAmount)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
              <p className="text-xs text-gray-500">Success Rate</p>
              <p className="text-lg font-bold text-purple-600">{getSuccessRate().toFixed(1)}%</p>
            </div>
          </div>
        </>
      ) : (
        // Compact View
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-200">
            <p className="text-xs text-green-600">Verified</p>
            <p className="text-xl font-bold text-green-700">{stats.verified}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-200">
            <p className="text-xs text-yellow-600">Pending</p>
            <p className="text-xl font-bold text-yellow-700">{stats.pending}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-200">
            <p className="text-xs text-blue-600">Total Spent</p>
            <p className="text-xl font-bold text-blue-700">{formatCurrency(stats.totalAmount)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
