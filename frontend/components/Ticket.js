import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

export default function Ticket({ 
  participant, 
  pool, 
  isVerified = false,
  seatNumbers = [],
  onDownload 
}) {
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getTicketStatus = () => {
    return isVerified ? '✓ VERIFIED TICKET' : '⏳ UNVERIFIED - PENDING VERIFICATION';
  };

  const getStatusColor = () => {
    return isVerified ? 'text-green-600 border-green-600' : 'text-yellow-600 border-yellow-600';
  };

  // Generate QR code data
  const getQRCodeData = () => {
    const ticketData = {
      ticketNumber: participant?.ticket_number || 'PENDING',
      participantName: participant?.user_name || 'N/A',
      participantEmail: participant?.user_email || 'N/A',
      poolName: pool?.name || 'Merkato VIP Pool',
      seats: seatNumbers || [],
      prize: pool?.prize || 0,
      verified: isVerified,
      issuedAt: new Date().toISOString()
    };
    return JSON.stringify(ticketData);
  };

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `AbbaaCarraa_Ticket_${participant?.ticket_number || 'pending'}.png`;
      link.href = image;
      link.click();
      if (onDownload) onDownload();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Ticket Card */}
      <div 
        ref={ticketRef}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-dashed border-gray-300 max-w-md mx-auto relative"
      >
        {/* Header with Digital Stamp */}
        <div className={`bg-gradient-to-r ${isVerified ? 'from-green-700 to-teal-700' : 'from-gray-700 to-gray-800'} p-4 text-white text-center relative`}>
          {/* Circular Digital Stamp - Top Left */}
          <div className="absolute -top-3 -left-3 w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/50">
            <div className="text-center">
              <div className="text-xs font-bold">አባ ካራ</div>
              <div className="text-[8px]">Abbaa Carraa</div>
              <div className="text-[8px] mt-0.5">ዲጂታል እጣ</div>
              <div className="text-[8px]">Digital Ticket</div>
            </div>
          </div>
          
          {/* Circular Digital Stamp - Center */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <div className="w-32 h-32 rounded-full border-4 border-white flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs font-bold">አባ ካራ</div>
                <div className="text-[8px]">Abbaa Carraa</div>
                <div className="text-[8px]">Ethiopian</div>
                <div className="text-[8px]">Digital እጣ</div>
              </div>
            </div>
          </div>
          
          <div className="text-center relative z-10">
            <div className="text-3xl mb-1">🎫</div>
            <h3 className="font-bold text-lg">Abbaa Carraa</h3>
            <p className="text-xs opacity-90">Ethiopian Digital Ticket</p>
          </div>
        </div>
        
        <div className="p-5">
          {/* Status Badge */}
          <div className="text-center mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor()} bg-white`}>
              {getTicketStatus()}
            </span>
          </div>
          
          {/* Ticket Number */}
          <div className="text-center mb-4 pb-3 border-b border-gray-200">
            <p className="text-xs text-gray-500">Ticket Number</p>
            <p className="text-xl font-mono font-bold tracking-wider">
              {participant?.ticket_number || 'PENDING-001'}
            </p>
          </div>
          
          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <QRCodeSVG 
              value={getQRCodeData()} 
              size={100}
              bgColor="#ffffff"
              fgColor="#000000"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Participant Info */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Participant:</span>
              <span className="font-medium">{participant?.user_name || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium">{participant?.user_email || 'N/A'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Phone:</span>
              <span className="font-medium">{participant?.phone || 'N/A'}</span>
            </div>
          </div>
          
          {/* Seat Info */}
          {seatNumbers && seatNumbers.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500">Selected Seats:</span>
                <span className="font-mono font-bold">{Array.isArray(seatNumbers) ? seatNumbers.sort((a,b)=>a-b).join(', ') : seatNumbers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Number of Seats:</span>
                <span className="font-semibold">{Array.isArray(seatNumbers) ? seatNumbers.length : 1}</span>
              </div>
            </div>
          )}
          
          {/* Pool Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Pool:</span>
              <span className="font-semibold">{pool?.name || 'Merkato VIP Pool'}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Prize:</span>
              <span className="font-bold text-green-600">{formatNumber(pool?.prize)} ETB</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Entry Fee:</span>
              <span className="font-semibold">{formatNumber(pool?.entryFee)} ETB</span>
            </div>
          </div>
          
          {/* Verification Note */}
          {!isVerified && (
            <div className="bg-yellow-50 rounded-lg p-2 mb-4 text-center">
              <p className="text-xs text-yellow-700">
                ⏳ This ticket is pending verification. 
                Your seats will be confirmed once payment is verified by admin.
              </p>
            </div>
          )}
          
          {/* Verified Stamp */}
          {isVerified && (
            <div className="bg-green-50 rounded-lg p-2 mb-4 text-center">
              <p className="text-xs text-green-700">
                ✓ VERIFIED TICKET - Your seats are confirmed!
              </p>
            </div>
          )}
          
          {/* Draw Info */}
          <div className="text-center text-xs text-gray-400 pt-3 border-t border-gray-200">
            <p>Draw Date: {pool?.drawTime || 'TBD'}</p>
            <p className="mt-1">💚 2% supports kidney & heart disease patients</p>
          </div>
          
          {/* Circular Stamp at Bottom Right */}
          <div className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center opacity-60">
            <span className="text-[8px] text-green-700 font-bold text-center leading-tight">
              አባ ካራ<br/>ዲጂታል
            </span>
          </div>
        </div>
        
        {/* Perforated line effect */}
        <div className="h-2 bg-gradient-to-r from-transparent via-gray-300 to-transparent bg-repeat-x" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 1px, gray 1px, transparent 1px)', backgroundSize: '8px 4px' }} />
      </div>
      
      {/* Download Button */}
      <div className="text-center">
        <button
          onClick={downloadTicket}
          disabled={downloading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
        >
          {downloading ? 'Downloading...' : '📥 Download Ticket'}
        </button>
      </div>
    </div>
  );
}
