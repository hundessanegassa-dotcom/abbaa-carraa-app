// components/TicketStats.js - COMPLETE PRODUCTION CODE
import { useState, useEffect } from 'react';

export default function TicketStats({
  tickets = [],
  userId = null,
  timeRange = 'all',
  showCharts = true,
  showBreakdown = true,
  compact = false,
  language = 'am'
}) {
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    unverified: 0,
    totalSpent: 0,
    totalPrize: 0,
    byType: {},
    byStatus: {},
    byTier: {}
  });

  useEffect(() => {
    calculateStats();
  }, [tickets, timeRange]);

  const calculateStats = () => {
    let filtered = [...tickets];
    
    // Filter by time range
    if (timeRange === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filtered = filtered.filter(t => new Date(t.created_at) > weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filtered = filtered.filter(t => new Date(t.created_at) > monthAgo);
    }

    const total = filtered.length;
    const verified = filtered.filter(t => t.verified).length;
    const unverified = total - verified;
    const totalSpent = filtered.reduce((sum, t) => sum + (t.contribution_amount || t.amount || 0), 0);
    const totalPrize = filtered.reduce((sum, t) => sum + (t.prize_amount || t.target_amount || 0), 0);

    // By type
    const byType = {};
    filtered.forEach(t => {
      const type = t.type || 'regular';
      byType[type] = (byType[type] || 0) + 1;
    });

    // By tier
    const byTier = {};
    filtered.forEach(t => {
      if (t.tier) {
        byTier[t.tier] = (byTier[t.tier] || 0) + 1;
      }
    });

    // By status
    const byStatus = {
      verified: verified,
      unverified: unverified
    };

    setStats({
      total,
      verified,
      unverified,
      totalSpent,
      totalPrize,
      byType,
      byStatus,
      byTier
    });
  };

  const getTypeLabel = (type) => {
    const labels = {
      regular: language === 'am' ? 'መደበኛ' : 'Regular',
      merkato: 'Merkato VIP',
      city: language === 'am' ? 'ከተማ' : 'City VIP'
    };
    return labels[type] || type;
  };

  const getTierLabel = (tier) => {
    const labels = {
      silver: language === 'am' ? 'ብር' : 'Silver',
      gold: language === 'am' ? 'ወርቅ' : 'Gold',
      platinum: language === 'am' ? 'ፕላቲኒየም' : 'Platinum',
      diamond: language === 'am' ? 'አልማዝ' : 'Diamond',
      royal: language === 'am' ? 'ንጉሣዊ' : 'Royal'
    };
    return labels[tier] || tier;
  };

  if (compact) {
    return (
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-3 shadow-sm border">
          <p className="text-[10px] text-gray-500">{language === 'am' ? 'ጠቅላላ' : 'Total'}</p>
          <p className="text-lg font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-green-200">
          <p className="text-[10px] text-gray-500">{language === 'am' ? 'የተረጋገጠ' : 'Verified'}</p>
          <p className="text-lg font-bold text-green-600">{stats.verified}</p>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm border border-yellow-200">
          <p className="text-[10px] text-gray-500">{language === 'am' ? 'ያልተረጋገጠ' : 'Unverified'}</p>
          <p className="text-lg font-bold text-yellow-600">{stats.unverified}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500">{language === 'am' ? 'ጠቅላላ ቲኬቶች' : 'Total Tickets'}</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-green-200">
          <p className="text-xs text-gray-500">{language === 'am' ? 'የተረጋገጠ' : 'Verified'}</p>
          <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
          <p className="text-xs text-gray-400">
            {stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-yellow-200">
          <p className="text-xs text-gray-500">{language === 'am' ? 'ያልተረጋገጠ' : 'Unverified'}</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.unverified}</p>
          <p className="text-xs text-gray-400">
            {stats.total > 0 ? Math.round((stats.unverified / stats.total) * 100) : 0}%
          </p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border">
          <p className="text-xs text-gray-500">{language === 'am' ? 'ጠቅላላ ክፍያ' : 'Total Spent'}</p>
          <p className="text-2xl font-bold text-blue-600">ETB {stats.totalSpent.toLocaleString()}</p>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* By Type */}
          {Object.keys(stats.byType).length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <h4 className="font-semibold text-gray-700 mb-3">
                {language === 'am' ? 'በፕሮግራም' : 'By Program'}
              </h4>
              <div className="space-y-2">
                {Object.entries(stats.byType).map(([type, count]) => {
                  const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={type} className="flex items-center gap-2">
                      <span className="text-sm flex-1">{getTypeLabel(type)}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By Tier */}
          {Object.keys(stats.byTier).length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border">
              <h4 className="font-semibold text-gray-700 mb-3">
                {language === 'am' ? 'በደረጃ' : 'By Tier'}
              </h4>
              <div className="space-y-2">
                {Object.entries(stats.byTier).map(([tier, count]) => {
                  const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={tier} className="flex items-center gap-2">
                      <span className="text-sm flex-1">{getTierLabel(tier)}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* By Status */}
          {showCharts && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border md:col-span-2">
              <h4 className="font-semibold text-gray-700 mb-3">
                {language === 'am' ? 'ሁኔታ' : 'Status'}
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm flex-1">
                      {language === 'am' ? '✅ የተረጋገጠ' : '✅ Verified'}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.verified / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{stats.verified}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm flex-1">
                      {language === 'am' ? '⏳ ያልተረጋገጠ' : '⏳ Unverified'}
                    </span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-600 h-2 rounded-full transition-all"
                        style={{ width: `${stats.total > 0 ? (stats.unverified / stats.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-600">{stats.unverified}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'ጠቅላላ ቲኬቶች' : 'Total Tickets'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
