// components/TicketGallery.js - COMPLETE PRODUCTION CODE
import { useState, useEffect } from 'react';
import TicketImage from './TicketImage';
import toast from 'react-hot-toast';

export default function TicketGallery({
  tickets = [],
  language = 'am',
  onTicketClick,
  showStatus = true,
  maxDisplay = 10,
  showDownload = true
}) {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'verified', 'unverified'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'

  useEffect(() => {
    let filtered = [...tickets];
    
    if (filter === 'verified') {
      filtered = filtered.filter(t => t.verified === true);
    } else if (filter === 'unverified') {
      filtered = filtered.filter(t => t.verified !== true);
    }
    
    setFilteredTickets(filtered.slice(0, maxDisplay));
  }, [tickets, filter, maxDisplay]);

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    if (onTicketClick) onTicketClick(ticket);
  };

  const getStatusBadge = (ticket) => {
    if (ticket.verified) {
      return (
        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          ✅ {language === 'am' ? 'የተረጋገጠ' : 'Verified'}
        </span>
      );
    }
    return (
      <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
        ⏳ {language === 'am' ? 'ያልተረጋገጠ' : 'Unverified'}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    const icons = {
      regular: '🎁',
      merkato: '🏪',
      city: '🏙️'
    };
    return icons[type] || '🎫';
  };

  const getTypeLabel = (type) => {
    const labels = {
      regular: language === 'am' ? 'መደበኛ' : 'Regular',
      merkato: 'Merkato VIP',
      city: language === 'am' ? 'ከተማ' : 'City VIP'
    };
    return labels[type] || type;
  };

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
        <div className="text-5xl mb-3">🎫</div>
        <p className="text-gray-500">
          {language === 'am' ? 'ምንም ቲኬቶች የሉም' : 'No tickets found'}
        </p>
        <p className="text-sm text-gray-400 mt-1">
          {language === 'am' 
            ? 'ከፑል ጋር በመቀላቀል ቲኬትዎን ያግኙ' 
            : 'Join a pool to get your ticket'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === 'all' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {language === 'am' ? 'ሁሉም' : 'All'} ({tickets.length})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === 'verified' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            ✅ {language === 'am' ? 'የተረጋገጠ' : 'Verified'} ({tickets.filter(t => t.verified).length})
          </button>
          <button
            onClick={() => setFilter('unverified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filter === 'unverified' 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            ⏳ {language === 'am' ? 'ያልተረጋገጠ' : 'Unverified'} ({tickets.filter(t => !t.verified).length})
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs transition ${
              viewMode === 'grid' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={language === 'am' ? 'ፍርግም' : 'Grid'}
          >
            📱
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg text-xs transition ${
              viewMode === 'list' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
            title={language === 'am' ? 'ዝርዝር' : 'List'}
          >
            📋
          </button>
        </div>
      </div>

      {/* Ticket Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTickets.map((ticket, index) => (
            <div
              key={ticket.id || index}
              onClick={() => handleTicketClick(ticket)}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-green-300 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getTypeIcon(ticket.type)}</span>
                    <div>
                      <p className="font-semibold text-sm text-gray-800 line-clamp-1">
                        {ticket.displayName || ticket.prize_name || 'Ticket'}
                      </p>
                      <p className="text-xs text-gray-500">
                        #{ticket.ticket_number || ticket.id?.slice(-8)}
                      </p>
                    </div>
                  </div>
                  {showStatus && getStatusBadge(ticket)}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">{language === 'am' ? 'መቀመጫዎች' : 'Seats'}</p>
                    <p className="font-medium text-gray-700">
                      {ticket.seat_numbers?.length > 0 ? ticket.seat_numbers.join(', ') : 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-400">{language === 'am' ? 'ክፍያ' : 'Amount'}</p>
                    <p className="font-bold text-green-600">
                      ETB {ticket.contribution_amount?.toLocaleString() || ticket.amount?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {getTypeLabel(ticket.type)}
                  </span>
                  {ticket.tier && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      {ticket.tier}
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs text-gray-400">
                  {new Date(ticket.created_at || ticket.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div className="border-t px-4 py-2 bg-gray-50 flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  {ticket.verified 
                    ? '✅ ' + (language === 'am' ? 'የተረጋገጠ' : 'Verified')
                    : '⏳ ' + (language === 'am' ? 'በመጠበቅ ላይ' : 'Pending')}
                </span>
                <button className="text-green-600 hover:text-green-700 text-xs font-medium">
                  {language === 'am' ? 'ዝርዝር አሳይ →' : 'View Details →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTickets.map((ticket, index) => (
            <div
              key={ticket.id || index}
              onClick={() => handleTicketClick(ticket)}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 hover:border-green-300 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getTypeIcon(ticket.type)}</span>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {ticket.displayName || ticket.prize_name || 'Ticket'}
                    </p>
                    <p className="text-xs text-gray-500">
                      #{ticket.ticket_number || ticket.id?.slice(-8)}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {getTypeLabel(ticket.type)}
                      </span>
                      {ticket.tier && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                          {ticket.tier}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {showStatus && getStatusBadge(ticket)}
              </div>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">{language === 'am' ? 'መቀመጫዎች' : 'Seats'}</p>
                  <p className="font-medium">{ticket.seat_numbers?.join(', ') || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{language === 'am' ? 'ክፍያ' : 'Amount'}</p>
                  <p className="font-bold text-green-600">
                    ETB {ticket.contribution_amount?.toLocaleString() || ticket.amount?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{language === 'am' ? 'ሽልማት' : 'Prize'}</p>
                  <p className="font-medium text-orange-600">
                    ETB {ticket.prize_amount?.toLocaleString() || ticket.target_amount?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{language === 'am' ? 'ቀን' : 'Date'}</p>
                  <p className="text-xs">{new Date(ticket.created_at || ticket.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-2 text-right">
                <button className="text-green-600 hover:text-green-700 text-xs font-medium">
                  {language === 'am' ? 'ዝርዝር አሳይ →' : 'View Details →'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Show More */}
      {tickets.length > maxDisplay && filteredTickets.length === maxDisplay && (
        <div className="text-center mt-4">
          <button 
            onClick={() => setFilter('all')}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            {language === 'am' 
              ? `ሁሉንም ${tickets.length} ቲኬቶች አሳይ` 
              : `View all ${tickets.length} tickets`}
          </button>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center rounded-t-2xl">
              <h2 className="text-xl font-bold">
                {language === 'am' ? '🎫 ቲኬት ዝርዝር' : '🎫 Ticket Details'}
              </h2>
              <button 
                onClick={() => setSelectedTicket(null)} 
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <TicketImage
                participant={selectedTicket}
                pool={selectedTicket.poolInfo || selectedTicket}
                isVerified={selectedTicket.verified}
                seatNumbers={selectedTicket.seat_numbers || []}
                ticketNumber={selectedTicket.ticket_number}
                amount={selectedTicket.contribution_amount || selectedTicket.amount}
                createdAt={selectedTicket.created_at || selectedTicket.createdAt}
                poolType={selectedTicket.type || 'regular'}
                show3D={false}
                language={language}
                onDownload={() => {
                  toast.success(language === 'am' ? 'ቲኬት እየተወረደ ነው...' : 'Downloading ticket...');
                }}
                onClose={() => setSelectedTicket(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
