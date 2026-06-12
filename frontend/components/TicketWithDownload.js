// frontend/components/TicketDownload.js - PNG/JPEG Ticket Download
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export default function TicketDownload({ 
  participant, 
  pool, 
  isVerified = false,
  seatNumbers,
  ticketNumber,
  amount,
  createdAt,
  poolType = 'regular'
}) {
  const ticketRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

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
        windowWidth: ticketRef.current.scrollWidth,
        windowHeight: ticketRef.current.scrollHeight
      });
      
      const link = document.createElement('a');
      
      if (format === 'png') {
        const image = canvas.toDataURL('image/png');
        link.download = `ticket-${ticketNumber}.png`;
        link.href = image;
      } else {
        const image = canvas.toDataURL('image/jpeg', 0.95);
        link.download = `ticket-${ticketNumber}.jpg`;
        link.href = image;
      }
      
      link.click();
      toast.success(`Ticket downloaded as ${format.toUpperCase()}!`, { id: loadingToast });
      
    } catch (error) {
      console.error('Image generation error:', error);
      toast.error('Failed to generate ticket image', { id: loadingToast });
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = () => {
    if (isVerified) {
      return (
        <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center mb-3">
          <span className="text-green-700 text-sm font-semibold">✅ VERIFIED TICKET</span>
          <p className="text-green-600 text-xs mt-1">Eligible for prize draw</p>
        </div>
      );
    }
    return (
      <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-center mb-3">
        <span className="text-yellow-700 text-sm font-semibold">⏳ UNVERIFIED TICKET</span>
        <p className="text-yellow-600 text-xs mt-1">Pending payment verification</p>
      </div>
    );
  };

  const getProgramName = () => {
    if (poolType === 'merkato') return 'MERKATO VIP PROGRAM';
    if (poolType === 'city') return `${participant?.city || 'CITY'} VIP PROGRAM`;
    return 'REGULAR PRIZE POOL';
  };

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleString();
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Ticket Content */}
      <div 
        ref={ticketRef}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: '100%', maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header with Gradient */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 text-center">
          <div className="text-5xl mb-2">🎫</div>
          <h2 className="text-2xl font-bold tracking-wide">ABBAA CARRAA</h2>
          <p className="text-sm opacity-90 mt-1">{getProgramName()}</p>
          <div className="mt-2 flex justify-center gap-2">
            <div className="bg-white/20 rounded-full px-2 py-0.5 text-xs">🏆</div>
            <div className="bg-white/20 rounded-full px-2 py-0.5 text-xs">💰</div>
            <div className="bg-white/20 rounded-full px-2 py-0.5 text-xs">✅</div>
          </div>
        </div>
        
        {/* Status Section */}
        {getStatusBadge()}
        
        {/* Main Ticket Body */}
        <div className="p-5 space-y-4">
          {/* Ticket Number - Prominent */}
          <div className="text-center border-b border-dashed border-gray-200 pb-3">
            <p className="text-xs text-gray-400 tracking-wide">TICKET NUMBER</p>
            <p className="font-mono font-bold text-xl text-gray-800 tracking-wider">{ticketNumber}</p>
          </div>
          
          {/* Prize Info */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 text-center border border-amber-200">
            <p className="text-xs text-amber-600 font-semibold">🏆 YOU COULD WIN</p>
            <p className="font-bold text-2xl text-amber-700">
              ETB {(pool?.prize_amount || pool?.target_amount || 0).toLocaleString()}
            </p>
          </div>
          
          {/* Two Column Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-400">Pool Name</p>
              <p className="font-semibold text-sm text-gray-800 truncate">
                {pool?.prize_name || pool?.name || 'Prize Pool'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-400">Seat Numbers</p>
              <p className="font-bold text-base text-emerald-600">
                {seatNumbers?.sort((a,b)=>a-b).join(', ') || 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Amount Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-lg p-2 text-center border border-emerald-200">
              <p className="text-xs text-emerald-600">Contribution Amount</p>
              <p className="font-bold text-lg text-emerald-700">
                ETB {amount?.toLocaleString() || 0}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-2 text-center border border-purple-200">
              <p className="text-xs text-purple-600">Per Seat</p>
              <p className="font-bold text-lg text-purple-700">
                ETB {Math.round((amount || 0) / (seatNumbers?.length || 1)).toLocaleString()}
              </p>
            </div>
          </div>
          
          {/* User Info */}
          <div className="border-t border-gray-100 pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Participant</span>
              <span className="text-sm font-medium text-gray-800">{participant?.user_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Email</span>
              <span className="text-xs text-gray-600">{participant?.user_email || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">Purchase Date</span>
              <span className="text-xs text-gray-500">{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>
        
        {/* Footer with QR Code Placeholder */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-200">
          <div className="flex justify-center gap-4 mb-2">
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm mx-auto">📱</div>
              <span className="text-[8px] text-gray-400">Telebirr</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm mx-auto">🏦</div>
              <span className="text-[8px] text-gray-400">CBE</span>
            </div>
            <div className="text-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm mx-auto">✅</div>
              <span className="text-[8px] text-gray-400">Verified</span>
            </div>
          </div>
          <p className="text-[9px] text-gray-400">
            This ticket is proof of participation. Keep it for your records.
          </p>
          <div className="mt-2 flex justify-center gap-1">
            <div className="w-16 h-0.5 bg-gray-300 rounded"></div>
            <div className="w-16 h-0.5 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
      
      {/* Download Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => handleDownloadImage('png')}
          disabled={isDownloading}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download as PNG
        </button>
        <button
          onClick={() => handleDownloadImage('jpg')}
          disabled={isDownloading}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download as JPEG
        </button>
      </div>
    </div>
  );
}
