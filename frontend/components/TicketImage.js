// components/TicketImage.js - Complete Redesigned Ticket (No 3D, Unified Design)
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export default function TicketImage({
  participant,
  pool,
  isVerified = false,
  seatNumbers,
  ticketNumber,
  amount,
  createdAt,
  poolType = 'regular',
  onClose
}) {
  const ticketRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Get program-specific colors
  const getProgramColors = () => {
    if (poolType === 'merkato') {
      return {
        primary: 'from-yellow-500 to-orange-600',
        secondary: 'bg-yellow-50 border-yellow-200',
        accent: 'text-yellow-700',
        light: 'bg-yellow-50/30'
      };
    } else if (poolType === 'city') {
      return {
        primary: 'from-blue-600 to-indigo-600',
        secondary: 'bg-blue-50 border-blue-200',
        accent: 'text-blue-700',
        light: 'bg-blue-50/30'
      };
    } else {
      return {
        primary: 'from-emerald-600 to-teal-600',
        secondary: 'bg-emerald-50 border-emerald-200',
        accent: 'text-emerald-700',
        light: 'bg-emerald-50/30'
      };
    }
  };

  const colors = getProgramColors();

  const handleDownloadImage = async (format = 'png') => {
    if (!ticketRef.current) return;

    setIsDownloading(true);
    const loadingToast = toast.loading(`Generating ${format.toUpperCase()} image...`);

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: false,
      });

      const link = document.createElement('a');

      if (format === 'png') {
        link.download = `ticket-${ticketNumber}.png`;
        link.href = canvas.toDataURL('image/png');
      } else {
        link.download = `ticket-${ticketNumber}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95);
      }

      link.click();
      toast.success(`Ticket downloaded as ${format.toUpperCase()}!`, { id: loadingToast });

    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate ticket image', { id: loadingToast });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareTicket = async () => {
    if (!ticketRef.current) return;

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `ticket-${ticketNumber}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: 'My Abbaa Carraa Ticket',
          text: `🎫 Check out my ticket #${ticketNumber}!`,
          files: [file],
        });
      } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ticket-${ticketNumber}.png`;
        link.click();
        toast.success('Ticket downloaded! Share it manually.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to share ticket');
      }
    }
  };

  const getStatusBadge = () => {
    if (isVerified) {
      return (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-2 text-center mb-3 shadow-md">
          <span className="text-white text-sm font-bold flex items-center justify-center gap-2">
            <span className="text-lg">✅</span> VERIFIED TICKET
          </span>
          <p className="text-green-100 text-xs mt-1">Eligible for prize draw</p>
        </div>
      );
    }
    return (
      <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg p-2 text-center mb-3 shadow-md">
        <span className="text-white text-sm font-bold flex items-center justify-center gap-2">
          <span className="text-lg">⏳</span> UNVERIFIED TICKET
        </span>
        <p className="text-yellow-100 text-xs mt-1">Pending payment verification</p>
      </div>
    );
  };

  const getProgramName = () => {
    if (poolType === 'merkato') return 'Merkato VIP Program';
    if (poolType === 'city') return `${participant?.city || 'City'} VIP Program`;
    return 'Regular Prize Pool';
  };

  const getProgramIcon = () => {
    if (poolType === 'merkato') return '🏪';
    if (poolType === 'city') return '🏙️';
    return '🎯';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPrizeAmount = () => {
    return (pool?.prize_amount || pool?.target_amount || pool?.prize || 0);
  };

  const getPoolName = () => {
    return pool?.prize_name || pool?.name || 'Prize Pool';
  };

  const getDrawDate = () => {
    return pool?.drawDate || pool?.draw_time || pool?.end_date || 'TBD';
  };

  // Generate a random pattern for background (consistent per ticket)
  const getPatternStyle = () => {
    const patterns = [
      'linear-gradient(135deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent)',
      'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 0%, transparent 50%)',
      'linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.03) 75%, transparent 75%, transparent)'
    ];
    // Use ticket number to pick consistent pattern
    const index = (ticketNumber?.length || 0) % patterns.length;
    return patterns[index];
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => handleDownloadImage('png')}
          disabled={isDownloading}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <span>📸</span> Download PNG
        </button>
        <button
          onClick={() => handleDownloadImage('jpg')}
          disabled={isDownloading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <span>🖼️</span> Download JPEG
        </button>
        <button
          onClick={handleShareTicket}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition flex items-center gap-2"
        >
          <span>📤</span> Share
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition flex items-center gap-2"
          >
            <span>✕</span> Close
          </button>
        )}
      </div>

      {/* Ticket */}
      <div
        ref={ticketRef}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 max-w-md mx-auto"
      >
        {/* Header with Program-Specific Color */}
        <div className={`bg-gradient-to-r ${colors.primary} text-white p-5 text-center relative overflow-hidden`}>
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: getPatternStyle(),
              backgroundSize: '20px 20px'
            }}
          />
          <div className="relative z-10">
            <div className="text-5xl mb-2">{getProgramIcon()}</div>
            <h2 className="text-2xl font-bold tracking-wider">ABBAA CARRAA</h2>
            <p className="text-sm opacity-90 mt-1 font-medium">{getProgramName()}</p>
            <div className="mt-2 flex justify-center gap-2">
              <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold">
                {poolType === 'merkato' ? '⭐ MERKATO' :
                 poolType === 'city' ? '🏙️ CITY' :
                 '🎯 REGULAR'}
              </span>
              <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold">
                {isVerified ? '✅ VERIFIED' : '⏳ PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        {getStatusBadge()}

        <div className="p-5 space-y-4">
          {/* Ticket Number */}
          <div className="text-center border-b border-dashed border-gray-200 pb-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Ticket Number</p>
            <p className="font-mono font-bold text-xl tracking-wider text-gray-800">{ticketNumber || 'N/A'}</p>
            <p className="text-xs text-gray-400 mt-1">Issued: {formatDate(createdAt)}</p>
          </div>

          {/* Prize Amount */}
          <div className={`bg-gradient-to-r ${colors.secondary} rounded-xl p-4 text-center border ${colors.secondary}`}>
            <p className={`text-xs font-medium uppercase tracking-wider ${colors.accent}`}>🏆 You Could Win</p>
            <p className="font-bold text-3xl text-gray-800">
              ETB {getPrizeAmount().toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">{getPoolName()}</p>
          </div>

          {/* Participant & Draw Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">👤 Participant</p>
              <p className="font-semibold text-gray-800 text-sm truncate">
                {participant?.user_name || 'N/A'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{participant?.user_email || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">📍 Draw Date</p>
              <p className="font-semibold text-gray-800 text-sm">
                {getDrawDate()}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {poolType === 'merkato' ? 'Merkato VIP' :
                 poolType === 'city' ? `${participant?.city || 'City'} VIP` :
                 'Regular Pool'}
              </p>
            </div>
          </div>

          {/* Seat Numbers & Amount Paid */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`bg-gradient-to-r ${colors.light} rounded-lg p-3 text-center border ${colors.secondary}`}>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">💺 Seats</p>
              <p className="font-bold text-lg text-gray-800">
                {seatNumbers?.sort((a, b) => a - b).join(', ') || 'N/A'}
              </p>
              <p className="text-xs text-gray-400 mt-1">{seatNumbers?.length || 0} seat(s)</p>
            </div>
            <div className={`bg-gradient-to-r ${colors.light} rounded-lg p-3 text-center border ${colors.secondary}`}>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">💰 Amount Paid</p>
              <p className="font-bold text-lg text-gray-800">ETB {amount?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-400 mt-1">Paid</p>
            </div>
          </div>

          {/* Prize Listed Date */}
          <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">📅 Prize Listed Date</p>
            <p className="text-sm font-medium text-gray-700">
              {formatDate(createdAt)}
            </p>
          </div>

          {/* Footer with QR Placeholder */}
          <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3">
            <div className="text-[10px] text-gray-400">
              <span className="block">🎫 Abbaa Carraa</span>
              <span className="block mt-0.5">Terms & conditions apply</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs font-mono border border-gray-300">
                QR
              </div>
              <span className="text-[8px] text-gray-400 mt-1">Scan to verify</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`bg-gradient-to-r ${colors.primary} p-3 text-center text-white text-[10px] opacity-90`}>
          <span className="font-medium">✓ This ticket is proof of participation</span>
          <span className="block mt-0.5">Abbaa Carraa • {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Info */}
      <div className="text-center text-xs text-gray-400">
        <span>📌 Download or share your ticket</span>
      </div>
    </div>
  );
}
