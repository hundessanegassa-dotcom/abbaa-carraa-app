import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

export default function Ticket({ 
  participant, 
  pool, 
  isVerified = false,
  seatNumbers = [],
  onDownload,
  ticketNumber,
  amount,
  createdAt,
  poolType
}) {
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const isMounted = useRef(true);

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    isMounted.current = false;
  }, []);

  // Set up cleanup on unmount
  useState(() => {
    return cleanup;
  }, [cleanup]);

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const getTicketStatus = () => {
    return isVerified ? '✓ VERIFIED TICKET' : '⏳ UNVERIFIED - PENDING VERIFICATION';
  };

  const getStatusColor = () => {
    return isVerified ? 'from-green-700 to-teal-700' : 'from-gray-700 to-gray-800';
  };

  const getStatusBgColor = () => {
    return isVerified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200';
  };

  // Generate QR code data
  const getQRCodeData = () => {
    const ticketData = {
      ticketNumber: ticketNumber || participant?.ticket_number || 'PENDING',
      participantName: participant?.user_name || participant?.full_name || 'N/A',
      participantEmail: participant?.user_email || participant?.email || 'N/A',
      poolName: pool?.name || pool?.prize_name || 'Abbaa Carraa Pool',
      seats: seatNumbers || [],
      amount: amount || participant?.amount || participant?.contribution_amount || 0,
      verified: isVerified,
      verifiedAt: isVerified ? new Date().toISOString() : null,
      issuedAt: createdAt || new Date().toISOString()
    };
    return JSON.stringify(ticketData);
  };

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    if (!isMounted.current) return;
    
    setDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2.5,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: false
      });
      
      if (!isMounted.current) return;
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const fileName = `AbbaaCarraa_Ticket_${ticketNumber || participant?.ticket_number || 'pending'}_${isVerified ? 'VERIFIED' : 'UNVERIFIED'}.png`;
      link.download = fileName;
      link.href = image;
      link.click();
      
      if (onDownload && isMounted.current) onDownload();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      if (isMounted.current) setDownloading(false);
    }
  };

  // Get display values
  const displayTicketNumber = ticketNumber || participant?.ticket_number || 'PENDING-001';
  const displayUserName = participant?.user_name || participant?.full_name || participant?.userName || 'N/A';
  const displayUserEmail = participant?.user_email || participant?.email || 'N/A';
  const displayUserPhone = participant?.phone || participant?.user_phone || 'N/A';
  const displayPoolName = pool?.name || pool?.prize_name || pool?.poolName || 'Abbaa Carraa Pool';
  const displayPrize = pool?.prize || pool?.prize_amount || participant?.prize_amount || 0;
  const displayEntryFee = pool?.entryFee || pool?.contribution_amount || participant?.contribution_amount || 0;
  const displayAmount = amount || participant?.amount || participant?.contribution_amount || 0;
  const displayDate = createdAt || participant?.created_at || new Date().toISOString();

  return (
    <div className="space-y-4">
      {/* Ticket Card */}
      <div 
        ref={ticketRef}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-dashed border-gray-300 max-w-md mx-auto relative"
      >
        {/* Header with Digital Stamp */}
        <div className={`bg-gradient-to-r ${getStatusColor()} p-4 text-white text-center relative`}>
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
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${isVerified ? 'text-green-600 border-green-600 bg-green-50' : 'text-yellow-600 border-yellow-600 bg-yellow-50'}`}>
              {getTicketStatus()}
            </span>
          </div>
          
          {/* Ticket Number */}
          <div className="text-center mb-4 pb-3 border-b border-gray-200">
            <p className="text-xs text-gray-500">Ticket Number</p>
            <p className="text-xl font-mono font-bold tracking-wider">
              {displayTicketNumber}
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
              <span className="font-medium">{displayUserName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Email:</span>
              <span className="font-medium">{displayUserEmail}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Phone:</span>
              <span className="font-medium">{displayUserPhone}</span>
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
              <div className="flex justify-between text-sm mt-1 pt-1 border-t border-gray-200">
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-bold text-green-600">ETB {formatNumber(displayAmount)}</span>
              </div>
            </div>
          )}
          
          {/* Pool Info */}
          <div className={`${getStatusBgColor()} rounded-lg p-3 mb-4`}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Pool:</span>
              <span className="font-semibold">{displayPoolName}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Prize:</span>
              <span className="font-bold text-green-600">ETB {formatNumber(displayPrize)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Entry Fee:</span>
              <span className="font-semibold">ETB {formatNumber(displayEntryFee)}</span>
            </div>
          </div>
          
          {/* Issue Date */}
          <div className="text-center text-xs text-gray-400 mb-3">
            Issued: {new Date(displayDate).toLocaleString()}
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
              <p className="text-xs text-green-700 flex items-center justify-center gap-2">
                <span className="text-lg">✓</span> VERIFIED TICKET - Your seats are confirmed!
              </p>
            </div>
          )}
          
          {/* Draw Info */}
          <div className="text-center text-xs text-gray-400 pt-3 border-t border-gray-200">
            <p>Draw Date: {pool?.drawTime || pool?.draw_time ? new Date(pool.draw_time).toLocaleString() : 'TBD'}</p>
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
          className={`${isVerified ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 mx-auto disabled:opacity-50`}
        >
          {downloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              Downloading...
            </>
          ) : (
            <>
              📥 Download {isVerified ? 'Verified' : 'Unverified'} Ticket
            </>
          )}
        </button>
        {!isVerified && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            Once admin verifies your payment, you can download a verified ticket.
          </p>
        )}
      </div>
    </div>
  );
}
