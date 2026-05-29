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

  // Get values - FIXED: Use actual pool name, not generic
  const displayTicketNumber = propTicketNumber || participant?.ticket_number || 'PENDING-001';
  const displayUserName = participant?.user_name || participant?.full_name || participant?.userName || 'N/A';
  const displayUserEmail = participant?.user_email || participant?.email || 'N/A';
  const displayUserPhone = participant?.phone || participant?.user_phone || 'N/A';
  
  // FIXED: Use actual pool name from the pool data
  const displayPoolName = pool?.prize_name || pool?.name || participant?.pool_name || 'Prize Pool';
  const displayPrizeName = pool?.prize_name || pool?.name || participant?.prize_name || 'Prize';
  const displayPrizeDescription = pool?.description || '';
  const displayPrizeAmount = pool?.prize || pool?.prize_amount || participant?.prize_amount || 0;
  const displayEntryFee = pool?.entryFee || pool?.contribution_amount || participant?.contribution_amount || 0;
  const displayAmount = propAmount || participant?.amount || participant?.contribution_amount || 0;
  const displaySeatNumbers = seatNumbers || participant?.seat_numbers || [];
  
  // FIXED: Pool creation/listed date
  const displayPoolListedDate = pool?.created_at || participant?.pool_created_at || new Date().toISOString();
  const displayDrawDate = pool?.drawTime || pool?.draw_time;
  const displayIssueDate = propCreatedAt || participant?.created_at || new Date().toISOString();

  const getTicketStatus = () => {
    return isVerified ? '✓ VERIFIED TICKET' : '⏳ UNVERIFIED - PENDING VERIFICATION';
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
      participant: { name: displayUserName, email: displayUserEmail, phone: displayUserPhone },
      pool: {
        name: displayPoolName,
        prizeName: displayPrizeName,
        listedDate: displayPoolListedDate,
        seats: displaySeatNumbers
      },
      amount: displayAmount,
      verified: isVerified,
      issuedAt: displayIssueDate
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
    if (name.includes('car') || name.includes('vehicle') || name.includes('toyota') || name.includes('bmw')) return '🚗';
    if (name.includes('house') || name.includes('home') || name.includes('villa')) return '🏠';
    if (name.includes('phone') || name.includes('iphone') || name.includes('samsung')) return '📱';
    if (name.includes('laptop') || name.includes('computer') || name.includes('macbook')) return '💻';
    if (name.includes('furniture') || name.includes('sofa') || name.includes('bed')) return '🛋️';
    if (name.includes('tv') || name.includes('television') || name.includes('samsung')) return '📺';
    if (name.includes('watch') || name.includes('rolex')) return '⌚';
    return '🎁';
  };

  return (
    <div className="space-y-4">
      <div 
        ref={ticketRef}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-dashed border-gray-300 max-w-md mx-auto relative"
        style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${getHeaderGradient()} p-4 text-white text-center relative`}>
          {/* Circular Digital Stamp - Top Left */}
          <div className="absolute -top-3 -left-3 w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/50">
            <div className="text-center">
              <div className="text-[8px] font-bold">DIGITAL</div>
              <div className="text-[6px]">TICKET</div>
            </div>
          </div>
          
          {/* Circular Digital Stamp - Center */}
          <div className="absolute inset-0 flex items-center justify-center opacity-15">
            <div className="w-28 h-28 rounded-full border-2 border-white flex items-center justify-center rotate-[-10deg]">
              <div className="text-center">
                <div className="text-[8px] font-bold">ABBA CARRAA</div>
                <div className="text-[6px]">DIGITAL</div>
              </div>
            </div>
          </div>
          
          <div className="text-center relative z-10">
            <div className="text-3xl mb-1">🎫</div>
            <h3 className="font-bold text-lg tracking-wide">ABBA CARRAA</h3>
            <p className="text-[10px] opacity-80">DIGITAL TICKET</p>
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
          
          {/* Pool Name - Shows actual pool name like "Toyota V8 Car" */}
          <div className="bg-blue-50 rounded-lg p-2 mb-3 text-center border border-blue-100">
            <p className="text-[8px] font-semibold text-blue-600 mb-1">🏊 POOL NAME</p>
            <p className="text-xs font-bold text-gray-800">{displayPoolName}</p>
          </div>
          
          {/* Prize Name */}
          <div className={`${getInfoBgClass()} rounded-lg p-3 mb-3 text-center`}>
            <p className="text-[8px] font-semibold mb-1">🏆 PRIZE</p>
            <p className="text-sm font-bold">{getPrizeIcon()} {displayPrizeName}</p>
            {displayPrizeDescription && (
              <p className="text-[9px] text-gray-500 mt-1">{displayPrizeDescription.substring(0, 50)}</p>
            )}
          </div>
          
          {/* Pool Listed Date - NEW */}
          <div className="text-center mb-3">
            <p className="text-[8px] text-gray-400">📅 POOL LISTED DATE</p>
            <p className="text-[10px] font-medium">{new Date(displayPoolListedDate).toLocaleDateString()}</p>
          </div>
          
          {/* Participant Info */}
          <div className="bg-gray-50 rounded-lg p-2 mb-3">
            <div className="grid grid-cols-3 gap-1 text-[9px]">
              <div className="text-gray-500">Name:</div>
              <div className="col-span-2 font-medium truncate">{displayUserName}</div>
              <div className="text-gray-500">Email:</div>
              <div className="col-span-2 font-medium truncate text-[8px]">{displayUserEmail}</div>
              <div className="text-gray-500">Phone:</div>
              <div className="col-span-2 font-medium">{displayUserPhone}</div>
            </div>
          </div>
          
          {/* Seats and Amount */}
          <div className="bg-gray-50 rounded-lg p-2 mb-3">
            <div className="flex justify-between text-[9px]">
              <span className="text-gray-500">Seats:</span>
              <span className="font-mono font-bold">{displaySeatNumbers.length > 0 ? displaySeatNumbers.sort((a,b)=>a-b).join(', ') : 'N/A'}</span>
            </div>
            <div className="flex justify-between text-[9px] mt-1">
              <span className="text-gray-500">Entry Fee:</span>
              <span className="font-semibold">ETB {formatNumber(displayEntryFee)}</span>
            </div>
            <div className="flex justify-between text-[9px] mt-1">
              <span className="text-gray-500">Total Paid:</span>
              <span className="font-bold text-green-600">ETB {formatNumber(displayAmount)}</span>
            </div>
          </div>
          
          {/* Draw Date */}
          <div className="text-center text-[9px] text-gray-500 mb-2">
            🎲 Draw Date: {displayDrawDate ? new Date(displayDrawDate).toLocaleString() : 'TBD'}
          </div>
          
          {/* Ticket Issue Date */}
          <div className="text-center text-[7px] text-gray-400 mb-3">
            Ticket Issued: {new Date(displayIssueDate).toLocaleString()}
          </div>
          
          {/* Verification Note */}
          {!isVerified && (
            <div className="bg-yellow-50 rounded-lg p-2 mb-3 text-center">
              <p className="text-[8px] text-yellow-700">⏳ PENDING VERIFICATION</p>
              <p className="text-[7px] text-yellow-600 mt-0.5">Seats confirmed after payment verification</p>
            </div>
          )}
          
          {isVerified && (
            <div className="bg-green-50 rounded-lg p-2 mb-3 text-center">
              <p className="text-[8px] text-green-700 flex items-center justify-center gap-1">
                <span>✓</span> VERIFIED TICKET
              </p>
            </div>
          )}
          
          {/* Charity Note */}
          <div className="text-center text-[7px] text-gray-400 pt-2 border-t border-gray-200">
            <p>💚 2% supports kidney & heart disease patients</p>
          </div>
          
          {/* Circular Stamp at Bottom Right */}
          <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-green-100 border border-green-400 flex items-center justify-center opacity-50">
            <span className="text-[5px] text-green-700 font-bold text-center leading-tight">
              DIGITAL
            </span>
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
