// components/TicketImage.js - COMPLETE PRODUCTION CODE
import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export default function TicketImage({ 
  participant, 
  pool, 
  isVerified = false,
  seatNumbers = [],
  ticketNumber = '',
  amount = 0,
  createdAt = null,
  poolType = 'regular',
  show3D = false,
  language = 'am',
  onDownload,
  onClose
}) {
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(true);

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get pool type label
  const getPoolTypeLabel = () => {
    const labels = {
      regular: language === 'am' ? 'መደበኛ የእጣ መደብ' : 'Regular Pool',
      merkato: language === 'am' ? 'መርካቶ ቪአይፒ' : 'Merkato VIP',
      city: language === 'am' ? 'የከተማ ቪአይፒ' : 'City VIP'
    };
    return labels[poolType] || poolType;
  };

  // Get status text
  const getStatusText = () => {
    if (isVerified) {
      return language === 'am' ? '✅ የተረጋገጠ' : '✅ Verified';
    }
    return language === 'am' ? '⏳ ያልተረጋገጠ' : '⏳ Unverified';
  };

  const getStatusSubText = () => {
    if (isVerified) {
      return language === 'am' ? '✅ ክፍያ ተረጋግጧል' : '✅ Payment verified';
    }
    return language === 'am' 
      ? 'ክፍያ እስኪረጋገጥ ድረስ ያልተረጋገጠ ቲኬት'
      : 'Unverified until payment is confirmed';
  };

  const getStatusColor = () => {
    return isVerified ? 'border-green-500' : 'border-yellow-500';
  };

  const getStatusBg = () => {
    return isVerified ? 'bg-green-50' : 'bg-yellow-50';
  };

  const getFooterStamp = () => {
    if (isVerified) {
      return language === 'am' ? '🔒 የተረጋገጠ ቲኬት' : '🔒 Verified Ticket';
    }
    return language === 'am' ? '⏳ እየተጠበቀ ነው' : '⏳ Pending Verification';
  };

  const getFooterStampColor = () => {
    return isVerified ? 'text-green-600' : 'text-yellow-600';
  };

  // Get prize display
  const getPrizeDisplay = () => {
    if (pool?.prize_name) return pool.prize_name;
    if (pool?.name) return pool.name;
    if (pool?.labelEn && pool?.labelAm) {
      return language === 'am' ? pool.labelAm : pool.labelEn;
    }
    return language === 'am' ? 'ሽልማት' : 'Prize';
  };

  const getPrizeAmount = () => {
    return pool?.target_amount || pool?.prize || 0;
  };

  // Get ticket number
  const getTicketNumber = () => {
    return ticketNumber || participant?.ticket_number || 'N/A';
  };

  // Get participant name
  const getParticipantName = () => {
    return participant?.user_name || participant?.full_name || 'N/A';
  };

  // Get seat numbers
  const getSeatNumbers = () => {
    const seats = seatNumbers?.length > 0 ? seatNumbers : participant?.seat_numbers || [];
    return seats.length > 0 ? seats.join(', ') : 'N/A';
  };

  // Get amount
  const getAmount = () => {
    return amount || participant?.contribution_amount || participant?.amount || 0;
  };

  // Get created date
  const getCreatedDate = () => {
    return createdAt || participant?.created_at || participant?.createdAt || null;
  };

  // Download ticket as PNG
  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
        width: 800,
        height: 600,
        onclone: (clonedDoc) => {
          // Ensure all images are loaded
          const images = clonedDoc.querySelectorAll('img');
          return Promise.all(Array.from(images).map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          }));
        }
      });
      
      const link = document.createElement('a');
      const ticketId = getTicketNumber();
      const status = isVerified ? 'verified' : 'unverified';
      link.download = `Abbaa-Carraa-Ticket-${status}-${ticketId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success(
        language === 'am' ? '✅ ቲኬት ተወርዷል!' : '✅ Ticket downloaded!'
      );
      
      if (onDownload) onDownload();
    } catch (error) {
      console.error('Download error:', error);
      toast.error(
        language === 'am' ? '❌ ቲኬት ማውረድ አልተቻለም' : '❌ Failed to download ticket'
      );
    } finally {
      setDownloading(false);
    }
  };

  // Get 3D transform
  const get3DTransform = () => {
    if (!show3D) return 'none';
    return 'perspective(800px) rotateY(3deg) scale(1.01)';
  };

  return (
    <div className="space-y-4">
      {/* Ticket Display */}
      <div 
        ref={ticketRef}
        className={`border-4 ${getStatusColor()} rounded-2xl p-8 bg-white shadow-xl relative`}
        style={{
          transform: get3DTransform(),
          transformStyle: 'preserve-3d',
          width: '100%',
          maxWidth: '800px',
          minHeight: '500px',
          margin: '0 auto'
        }}
      >
        {/* Watermark */}
        <div className="absolute bottom-20 right-8 text-8xl opacity-5 pointer-events-none font-black select-none">
          {isVerified ? '✅' : '🎫'}
        </div>

        {/* QR Code Placeholder */}
        <div className="absolute bottom-6 right-6 w-16 h-16 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-[10px] text-gray-400 select-none">
          QR
        </div>

        {/* Ticket Header */}
        <div className="text-center border-b-2 border-gray-200 pb-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-3xl">🎫</span>
            <span className="text-3xl">{isVerified ? '✅' : '🎫'}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mt-1">Abbaa Carraa</h3>
          <p className="text-sm text-gray-500">
            {getPoolTypeLabel()}
            {poolType === 'merkato' && participant?.tier && (
              <span className="ml-2 inline-block bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {language === 'am' ? participant.tier : participant.tier}
              </span>
            )}
          </p>
        </div>

        {/* Status Badge */}
        <div className={`${getStatusBg()} rounded-lg p-3 mb-4 text-center border-2 ${getStatusColor()}`}>
          <span className={`font-bold text-sm ${isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
            {getStatusText()}
          </span>
          <p className={`text-xs mt-1 ${isVerified ? 'text-green-600' : 'text-gray-500'}`}>
            {getStatusSubText()}
          </p>
        </div>

        {/* Ticket Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500 font-medium">
              {language === 'am' ? '🎯 ሽልማት' : '🎯 Prize'}
            </span>
            <span className="font-bold text-orange-600">
              {getPrizeDisplay()} - ETB {getPrizeAmount().toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500 font-medium">
              {language === 'am' ? '🔢 ቲኬት ቁጥር' : '🔢 Ticket Number'}
            </span>
            <span className="font-mono font-bold text-gray-800 tracking-wider">
              {getTicketNumber()}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500 font-medium">
              {language === 'am' ? '👤 ስም' : '👤 Name'}
            </span>
            <span className="font-semibold text-gray-800">
              {getParticipantName()}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500 font-medium">
              {language === 'am' ? '💺 መቀመጫዎች' : '💺 Seats'}
            </span>
            <span className="font-semibold text-blue-600">
              {getSeatNumbers()}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-500 font-medium">
              {language === 'am' ? '💰 ክፍያ' : '💰 Amount'}
            </span>
            <span className="font-bold text-green-600">
              ETB {getAmount().toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between py-2">
            <span className="text-gray-500 font-medium">
              {language === 'am' ? '📅 ቀን' : '📅 Date'}
            </span>
            <span className="text-gray-600">
              {formatDate(getCreatedDate())}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t-2 border-gray-200 text-center">
          <div className="flex justify-center gap-4 text-xs text-gray-400">
            <span>{formatDate(getCreatedDate())}</span>
            <span>•</span>
            <span>{language === 'am' ? 'አባ ካራ' : 'Abbaa Carraa'}</span>
            <span>•</span>
            <span>{isVerified ? '✅' : '⏳'}</span>
          </div>
          <div className={`mt-1 font-medium text-xs ${getFooterStampColor()}`}>
            {getFooterStamp()}
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="text-center">
        <button
          onClick={downloadTicket}
          disabled={downloading}
          className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg w-full max-w-md"
        >
          {downloading ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {language === 'am' ? 'በማውረድ ላይ...' : 'Downloading...'}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span>📥</span>
              {language === 'am' ? 'ቲኬት አውርድ' : 'Download Ticket'}
            </div>
          )}
        </button>
        
        <p className="text-xs text-gray-400 mt-2">
          {language === 'am' 
            ? 'ቲኬቱን እንደ PNG ምስል ያውርዱ' 
            : 'Download ticket as PNG image'}
        </p>
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="w-full max-w-md mx-auto block mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold transition"
        >
          {language === 'am' ? 'ዝጋ' : 'Close'}
        </button>
      )}
    </div>
  );
}
