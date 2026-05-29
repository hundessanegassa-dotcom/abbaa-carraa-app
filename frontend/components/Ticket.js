import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

export default function Ticket({ 
  participant, 
  pool, 
  isVerified = false,
  seatNumbers = [],
  onDownload,
  ticketNumber: propTicketNumber,
  amount: propAmount,
  createdAt: propCreatedAt
}) {
  const ticketRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Get values
  const displayTicketNumber = propTicketNumber || participant?.ticket_number || 'PENDING-001';
  const displayUserName = participant?.user_name || participant?.full_name || participant?.userName || 'N/A';
  const displayUserEmail = participant?.user_email || participant?.email || 'N/A';
  const displayUserPhone = participant?.phone || participant?.user_phone || 'N/A';
  const displayPrizeName = pool?.prize_name || pool?.name || 'Prize';
  const displayPrizeDescription = pool?.description || '';
  const displayPrizeAmount = pool?.prize || pool?.prize_amount || participant?.prize_amount || 0;
  const displayEntryFee = pool?.entryFee || pool?.contribution_amount || participant?.contribution_amount || 0;
  const displayTargetAmount = pool?.target_amount || 0;
  const displayCurrentAmount = pool?.current_amount || 0;
  const displayTotalSeats = pool?.totalSeats || Math.floor((displayTargetAmount * 1.2) / displayEntryFee);
  const displayDrawDate = pool?.drawTime || pool?.draw_time;
  const displayPoolCity = pool?.city || 'All Ethiopia';
  const displayAmount = propAmount || participant?.amount || participant?.contribution_amount || 0;
  const displayDate = propCreatedAt || participant?.created_at || new Date().toISOString();
  const displaySeatNumbers = seatNumbers || participant?.seat_numbers || [];
  
  // Generate Prize Code (e.g., SIN-2024-001)
  const prizeCode = `PRIZE-${displayTicketNumber.slice(-6)}`;

  const getTicketStatus = () => {
    return isVerified ? '✓ VERIFIED' : '⏳ UNVERIFIED - PENDING';
  };

  const getHeaderGradient = () => {
    return isVerified ? 'from-green-700 to-teal-700' : 'from-gray-700 to-gray-800';
  };

  const getStatusBadgeClass = () => {
    return isVerified 
      ? 'text-green-600 border-green-600 bg-green-50' 
      : 'text-yellow-600 border-yellow-600 bg-yellow-50';
  };

  const getInfoBgClass = () => {
    return isVerified ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200';
  };

  // Generate QR code data
  const getQRCodeData = () => {
    const ticketData = {
      ticketNumber: displayTicketNumber,
      prizeCode: prizeCode,
      prizeName: displayPrizeName,
      participant: { name: displayUserName, email: displayUserEmail, phone: displayUserPhone },
      seats: displaySeatNumbers,
      amount: displayAmount,
      verified: isVerified,
      issuedAt: displayDate
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
        useCORS: true
      });
      
      if (!isMounted.current) return;
      
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const fileName = `AbbaaCarraa_Ticket_${displayTicketNumber}_${isVerified ? 'VERIFIED' : 'UNVERIFIED'}.png`;
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

  const getPrizeIcon = () => {
    const name = displayPrizeName.toLowerCase();
    if (name.includes('car') || name.includes('vehicle')) return '🚗';
    if (name.includes('house') || name.includes('home')) return '🏠';
    if (name.includes('phone')) return '📱';
    if (name.includes('laptop') || name.includes('computer')) return '💻';
    if (name.includes('furniture')) return '🛋️';
    if (name.includes('tv')) return '📺';
    return '🎁';
  };

  return (
    <div className="space-y-4">
      <div 
        ref={ticketRef}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-dashed border-gray-300 max-w-md mx-auto relative"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header with Real Stamp Effect */}
        <div className={`bg-gradient-to-r ${getHeaderGradient()} p-4 text-white text-center relative`}>
          {/* Top Left Corner Stamp */}
          <div className="absolute -top-2 -left-2 w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/30 rotate-[-15deg]">
            <div className="text-center">
              <div className="text-[8px] font-bold">አባ ካራ</div>
              <div className="text-[6px]">DIGITAL</div>
            </div>
          </div>
          
          {/* Bottom Right Corner Stamp */}
          <div className="absolute -bottom-2 -right-2 w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/30 rotate-[15deg]">
            <div className="text-center">
              <div className="text-[8px] font-bold">አባ ካራ</div>
              <div className="text-[6px]">TICKET</div>
            </div>
          </div>
          
          {/* Center Circular Stamp - Real Stamp Effect */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-28 h-28 rounded-full border-2 border-white/40 flex items-center justify-center bg-white/5 backdrop-blur-sm rotate-[-8deg]">
              <div className="text-center">
                <div className="text-[10px] font-bold tracking-wider">አባ ካራ</div>
                <div className="text-[7px]">Abbaa Carraa</div>
                <div className="w-10 h-px bg-white/40 mx-auto my-1"></div>
                <div className="text-[6px] font-semibold">DIGITAL TICKET</div>
                <div className="text-[5px] mt-0.5">ዲጂታል ቲኬት</div>
              </div>
            </div>
          </div>
          
          <div className="text-center relative z-10">
            <div className="text-3xl mb-1">🎫</div>
            <h3 className="font-bold text-xl tracking-wide">ABBA CARRAA</h3>
            <p className="text-[10px] opacity-80 mt-0.5">DIGITAL TICKET</p>
          </div>
        </div>
        
        <div className="p-5">
          {/* Status Badge */}
          <div className="text-center mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass()}`}>
              {getTicketStatus()}
            </span>
          </div>
          
          {/* Ticket Number */}
          <div className="text-center mb-4 pb-3 border-b border-gray-200">
            <p className="text-[9px] text-gray-500">TICKET NUMBER</p>
            <p className="text-sm font-mono font-bold tracking-wider">{displayTicketNumber}</p>
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
          
          {/* Prize Code */}
          <div className="text-center mb-3">
            <p className="text-[8px] text-gray-400">PRIZE CODE</p>
            <p className="text-xs font-mono font-bold text-gray-700">{prizeCode}</p>
          </div>
          
          {/* Prize Name - Shows actual prize like "Sino Car" */}
          <div className={`${getInfoBgClass()} rounded-lg p-3 mb-4 text-center`}>
            <p className="text-[8px] font-semibold mb-1">🏆 PRIZE</p>
            <p className="text-sm font-bold">{getPrizeIcon()} {displayPrizeName}</p>
            {displayPrizeDescription && (
              <p className="text-[9px] text-gray-500 mt-1">{displayPrizeDescription.substring(0, 50)}</p>
            )}
          </div>
          
          {/* Date Listed */}
          <div className="text-center mb-4">
            <p className="text-[8px] text-gray-400">LISTED DATE</p>
            <p className="text-[10px] font-medium">{new Date(displayDate).toLocaleDateString()}</p>
          </div>
          
          {/* Participant Info - Compact */}
          <div className="bg-gray-50 rounded-lg p-2 mb-4">
            <div className="grid grid-cols-3 gap-1 text-[9px]">
              <div className="text-gray-500">Name:</div>
              <div className="col-span-2 font-medium truncate">{displayUserName}</div>
              <div className="text-gray-500">Email:</div>
              <div className="col-span-2 font-medium truncate text-[8px]">{displayUserEmail}</div>
              <div className="text-gray-500">Phone:</div>
              <div className="col-span-2 font-medium">{displayUserPhone}</div>
            </div>
          </div>
          
          {/* Seats */}
          <div className="bg-gray-50 rounded-lg p-2 mb-4">
            <div className="flex justify-between text-[9px]">
              <span className="text-gray-500">Seats:</span>
              <span className="font-mono font-bold">{displaySeatNumbers.length > 0 ? displaySeatNumbers.sort((a,b)=>a-b).join(', ') : 'N/A'}</span>
            </div>
            <div className="flex justify-between text-[9px] mt-1">
              <span className="text-gray-500">Amount:</span>
              <span className="font-bold text-green-600">ETB {formatNumber(displayAmount)}</span>
            </div>
          </div>
          
          {/* Draw Date */}
          <div className="text-center text-[9px] text-gray-500 mb-3">
            Draw: {displayDrawDate ? new Date(displayDrawDate).toLocaleString() : 'TBD'}
          </div>
          
          {/* Verification Note */}
          {!isVerified && (
            <div className="bg-yellow-50 rounded-lg p-2 mb-3 text-center">
              <p className="text-[8px] text-yellow-700">⏳ PENDING VERIFICATION</p>
            </div>
          )}
          
          {isVerified && (
            <div className="bg-green-50 rounded-lg p-2 mb-3 text-center">
              <p className="text-[8px] text-green-700 flex items-center justify-center gap-1">
                <span>✓</span> VERIFIED
              </p>
            </div>
          )}
          
          {/* Charity Note */}
          <div className="text-center text-[7px] text-gray-400 pt-2 border-t border-gray-200">
            <p>💚 2% supports kidney & heart disease patients</p>
          </div>
        </div>
        
        {/* Perforated line */}
        <div className="h-2 bg-gradient-to-r from-transparent via-gray-300 to-transparent bg-repeat-x" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 1px, gray 1px, transparent 1px)', backgroundSize: '8px 4px' }} />
      </div>
      
      {/* Download Button */}
      <div className="text-center">
        <button
          onClick={downloadTicket}
          disabled={downloading}
          className={`${isVerified ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 mx-auto disabled:opacity-50 shadow-md text-sm`}
        >
          {downloading ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
              Downloading...
            </>
          ) : (
            <>📥 DOWNLOAD TICKET</>
          )}
        </button>
      </div>
    </div>
  );
}
