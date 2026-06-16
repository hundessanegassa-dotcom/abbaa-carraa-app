// components/TicketGallery.js - Complete Ticket Gallery with 3D Effects & Management
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import TicketImage from './TicketImage';

export default function TicketGallery({ 
  userId, 
  poolType = 'all', // 'all', 'regular', 'merkato', 'city'
  onTicketClick,
  showFilters = true,
  showStats = true,
  maxDisplay = 50,
  allowDelete = false,
  allowDownload = true
}) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(poolType);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    verified: 0,
    pending: 0,
    totalAmount: 0
  });
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list', 'carousel'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const galleryRef = useRef(null);

  // Load tickets on mount
  useEffect(() => {
    if (userId) {
      fetchTickets();
    }
  }, [userId, filter]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      let allTickets = [];

      // Fetch from different tables based on filter
      if (filter === 'all' || filter === 'regular') {
        const { data: regularTickets, error: regularError } = await supabase
          .from('regular_pool_participants')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (!regularError && regularTickets) {
          allTickets = [...allTickets, ...regularTickets.map(t => ({ ...t, type: 'regular' }))];
        }
      }

      if (filter === 'all' || filter === 'merkato') {
        const { data: merkatoTickets, error: merkatoError } = await supabase
          .from('merkato_vip_participants')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (!merkatoError && merkatoTickets) {
          allTickets = [...allTickets, ...merkatoTickets.map(t => ({ ...t, type: 'merkato' }))];
        }
      }

      if (filter === 'all' || filter === 'city') {
        const { data: cityTickets, error: cityError } = await supabase
          .from('city_vip_participants')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (!cityError && cityTickets) {
          allTickets = [...allTickets, ...cityTickets.map(t => ({ ...t, type: 'city' }))];
        }
      }

      // Sort tickets
      const sortedTickets = sortTickets(allTickets, sortBy);
      setTickets(sortedTickets);

      // Calculate stats
      const verified = sortedTickets.filter(t => t.payment_status === 'verified').length;
      const pending = sortedTickets.filter(t => t.payment_status === 'pending' || t.payment_status === 'pending_verification').length;
      const totalAmount = sortedTickets.reduce((sum, t) => sum + (t.contribution_amount || 0), 0);

      setStats({
        total: sortedTickets.length,
        verified,
        pending,
        totalAmount
      });

    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  const sortTickets = (tickets, sortBy) => {
    const sorted = [...tickets];
    switch (sortBy) {
      case 'date_desc':
        return sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'date_asc':
        return sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'amount_desc':
        return sorted.sort((a, b) => (b.contribution_amount || 0) - (a.contribution_amount || 0));
      case 'amount_asc':
        return sorted.sort((a, b) => (a.contribution_amount || 0) - (b.contribution_amount || 0));
      case 'status':
        return sorted.sort((a, b) => {
          const statusOrder = { 'verified': 0, 'pending_verification': 1, 'pending': 2, 'rejected': 3 };
          return (statusOrder[a.payment_status] || 99) - (statusOrder[b.payment_status] || 99);
        });
      default:
        return sorted;
    }
  };

  const handleDeleteTicket = async (ticketId, type) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
      let tableName;
      switch (type) {
        case 'regular':
          tableName = 'regular_pool_participants';
          break;
        case 'merkato':
          tableName = 'merkato_vip_participants';
          break;
        case 'city':
          tableName = 'city_vip_participants';
          break;
        default:
          return;
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Ticket deleted successfully');
      fetchTickets(); // Refresh
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast.error('Failed to delete ticket');
    }
  };

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
    if (onTicketClick) {
      onTicketClick(ticket);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pending_verification':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'verified':
        return '✅ Verified';
      case 'pending_verification':
        return '⏳ Pending Verification';
      case 'pending':
        return '⏳ Pending';
      case 'rejected':
        return '❌ Rejected';
      default:
        return status || 'Unknown';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'regular':
        return '🎯';
      case 'merkato':
        return '🏪';
      case 'city':
        return '🏙️';
      default:
        return '🎫';
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case 'regular':
        return 'Regular Pool';
      case 'merkato':
        return 'Merkato VIP';
      case 'city':
        return 'City VIP';
      default:
        return 'Unknown';
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const ticketNumber = ticket.ticket_number?.toLowerCase() || '';
      const userName = ticket.user_name?.toLowerCase() || '';
      const city = ticket.city?.toLowerCase() || '';
      const poolName = ticket.pool_name?.toLowerCase() || '';
      
      return ticketNumber.includes(search) || 
             userName.includes(search) || 
             city.includes(search) || 
             poolName.includes(search);
    }
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique pool types for filter
  const availableTypes = ['all', ...new Set(tickets.map(t => t.type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎫</div>
        <h3 className="text-xl font-bold text-gray-700">No Tickets Found</h3>
        <p className="text-gray-500 mt-2">You haven't purchased any tickets yet.</p>
        <button 
          onClick={() => window.location.href = '/listings'}
          className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition"
        >
          Browse Pools
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={galleryRef}>
      {/* Stats Section */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">💰</span>
              <div>
                <p className="text-xs text-blue-600">Total Spent</p>
                <p className="text-2xl font-bold text-blue-700">ETB {stats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="all">All Types</option>
                {availableTypes.filter(t => t !== 'all').map(type => (
                  <option key={type} value={type}>{getTypeName(type)}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setTickets(sortTickets(tickets, e.target.value));
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="date_desc">Newest First</option>
                <option value="date_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
                <option value="status">By Status</option>
              </select>

              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-lg transition ${
                  viewMode === 'grid' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📐 Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 rounded-lg transition ${
                  viewMode === 'list' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📋 List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition cursor-pointer"
              onClick={() => handleTicketClick(ticket)}
            >
              <div className="relative">
                <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-3 text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-2xl">{getTypeIcon(ticket.type)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(ticket.payment_status)}`}>
                      {getStatusText(ticket.payment_status)}
                    </span>
                  </div>
                  <p className="text-sm font-bold mt-1 truncate">
                    {ticket.ticket_number || 'No Ticket #'}
                  </p>
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Seats:</span>
                    <span className="font-medium">
                      {ticket.seat_numbers?.sort((a,b)=>a-b).join(', ') || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-bold text-emerald-600">
                      ETB {ticket.contribution_amount?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{getTypeName(ticket.type)}</span>
                    <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                  </div>
                  {ticket.city && (
                    <div className="text-xs text-gray-500">
                      📍 {ticket.city}
                    </div>
                  )}
                </div>
                {allowDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTicket(ticket.id, ticket.type);
                    }}
                    className="absolute top-2 right-2 text-white bg-red-500/80 hover:bg-red-600 rounded-full w-6 h-6 flex items-center justify-center text-xs transition"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-lg transition cursor-pointer flex flex-wrap items-center justify-between gap-4"
              onClick={() => handleTicketClick(ticket)}
            >
              <div className="flex items-center gap-3 min-w-[200px]">
                <span className="text-3xl">{getTypeIcon(ticket.type)}</span>
                <div>
                  <p className="font-bold text-sm">{ticket.ticket_number || 'No Ticket #'}</p>
                  <p className="text-xs text-gray-500">{getTypeName(ticket.type)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 flex-wrap">
                <div className="text-sm">
                  <span className="text-gray-500">Seats:</span>
                  <span className="font-medium ml-1">
                    {ticket.seat_numbers?.sort((a,b)=>a-b).join(', ') || 'N/A'}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-bold text-emerald-600 ml-1">
                    ETB {ticket.contribution_amount?.toLocaleString() || 0}
                  </span>
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(ticket.payment_status)}`}>
                  {getStatusText(ticket.payment_status)}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </div>
                {ticket.city && (
                  <div className="text-xs text-gray-500">
                    📍 {ticket.city}
                  </div>
                )}
                {allowDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTicket(ticket.id, ticket.type);
                    }}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold"
                  >
                    ✕ Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
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

      {/* Results count */}
      <div className="text-center text-sm text-gray-400">
        Showing {paginatedTickets.length} of {filteredTickets.length} tickets
        {searchTerm && ` (filtered from ${tickets.length})`}
      </div>

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">Ticket Details</h3>
              <button
                onClick={() => {
                  setShowTicketModal(false);
                  setSelectedTicket(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <TicketImage
                participant={selectedTicket}
                pool={{
                  prize_amount: selectedTicket.prize_amount,
                  target_amount: selectedTicket.target_amount,
                  prize_name: selectedTicket.pool_name || selectedTicket.prize_name || 'Prize Pool'
                }}
                isVerified={selectedTicket.payment_status === 'verified'}
                seatNumbers={selectedTicket.seat_numbers}
                ticketNumber={selectedTicket.ticket_number}
                amount={selectedTicket.contribution_amount}
                createdAt={selectedTicket.created_at}
                poolType={selectedTicket.type}
                show3D={true}
                onClose={() => {
                  setShowTicketModal(false);
                  setSelectedTicket(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
