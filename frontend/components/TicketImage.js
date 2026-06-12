// components/TicketImage.js - Make sure this file exists and exports properly
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
      <div 
        ref={ticketRef}
        className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}
      >
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 text-center">
          <div className="text-5xl mb-2">🎫</div>
          <h2 className="text-2xl font-bold">ABBAA CARRAA</h2>
          <p className="text-sm opacity-90 mt-1">{getProgramName()}</p>
        </div>
        
        {getStatusBadge()}
        
        <div className="p-5 space-y-4">
          <div className="text-center border-b border-dashed border-gray-200 pb-3">
            <p className="text-xs text-gray-400">TICKET NUMBER</p>
            <p className="font-mono font-bold text-xl">{ticketNumber}</p>
          </div>
          
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-xs text-amber-600">🏆 YOU COULD WIN</p>
            <p className="font-bold text-2xl text-amber-700">
              ETB {(pool?.prize_amount || pool?.target_amount || pool?.prize || 0).toLocaleString()}
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-400">Seat Numbers</p>
              <p className="font-bold text-emerald-600">
                {seatNumbers?.sort((a,b)=>a-b).join(', ') || 'N/A'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-400">Amount</p>
              <p className="font-bold text-emerald-600">ETB {amount?.toLocaleString() || 0}</p>
            </div>
          </div>
          
          <div className="border-t pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Name:</span>
              <span className="font-medium">{participant?.user_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-500">Date:</span>
              <span className="text-gray-600">{formatDate(createdAt)}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-3 text-center text-[10px] text-gray-400 border-t">
          This ticket is proof of participation
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => handleDownloadImage('png')}
          disabled={isDownloading}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
        >
          📸 Download as PNG
        </button>
        <button
          onClick={() => handleDownloadImage('jpg')}
          disabled={isDownloading}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
        >
          🖼️ Download as JPEG
        </button>
      </div>
    </div>
  );
}
