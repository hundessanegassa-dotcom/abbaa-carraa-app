import { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';

// Only show logs in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

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

  // Development-only debug logs
  if (isDevelopment) {
    console.log('========== TICKET DEBUG LOGS ==========');
    console.log('1. Received participant data:', participant);
    console.log('2. Received pool data:', pool);
    console.log('3. Pool prize_name:', pool?.prize_name);
    console.log('4. Pool name:', pool?.name);
    console.log('5. Pool created_at:', pool?.created_at);
    console.log('6. Pool end_date:', pool?.end_date);
    console.log('7. isVerified:', isVerified);
    console.log('8. seatNumbers:', seatNumbers);
    console.log('9. ticketNumber prop:', propTicketNumber);
    console.log('10. amount prop:', propAmount);
    console.log('=========================================');
  }

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Get values with proper fallbacks
  const displayTicketNumber = propTicketNumber || participant?.ticket_number || 'PENDING-001';
  
  // PARTICIPANT INFO
  const displayUserName = participant?.user_name || participant?.full_name || participant?.userName || 'N/A';
  const displayUserEmail = participant?.user_email || participant?.email || 'N/A';
  const displayUserPhone = participant?.phone || participant?.user_phone || 'N/A';
  
  // POOL INFO - CRITICAL: These determine what shows on the ticket
  const displayPoolName = pool?.prize_name || pool?.name || 'Prize Pool';
  const displayPrizeName = pool?.prize_name || pool?.name || 'Prize';
  const displayPrizeDescription = pool?.description || '';
  const displayPrizeAmount = pool?.target_amount || pool?.prize_amount || 0;
  const displayEntryFee = pool?.entry_fee || pool?.contribution_amount || 10;
  const displayAmount = propAmount || participant?.amount || displayEntryFee * (seatNumbers?.length || 1);
  const displaySeatNumbers = seatNumbers || participant?.seat_numbers || [];
  
  // DATES - Using real pool dates
  const displayPoolListedDate = pool?.created_at || new Date().toISOString();
  const displayDrawDate = pool?.end_date || pool?.draw_date || pool?.drawTime;
  const displayIssueDate = propCreatedAt || participant?.created_at || new Date().toISOString();

  // Development-only display check
  if (isDevelopment) {
    console.log('========== WHAT WILL BE DISPLAYED ==========');
    console.log('Pool Name on Ticket:', displayPoolName);
    console.log('Prize Name on Ticket:', displayPrizeName);
    console.log('Listed Date on Ticket:', new Date(displayPoolListedDate).toLocaleDateString());
    console.log('Draw Date on Ticket:', displayDrawDate ? new Date(displayDrawDate).toLocaleString() : 'TBD');
    console.log('Participant Name:', displayUserName);
    console.log('Seats:', displaySeatNumbers);
    console.log('============================================');
  }

  const getTicketStatus = () => {
    return isVerified ? '✓ VERIFIED' : '⏳ UNVERIFIED';
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
      participant: {
        name: displayUserName,
        email: displayUserEmail,
        phone: displayUserPhone
      },
      pool: {
        name: displayPoolName,
        prizeName: displayPrizeName,
        listedDate: displayPoolListedDate,
        drawDate: displayDrawDate,
        seats: displaySeatNumbers,
        amount: displayAmount
      },
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
    if (name.includes('car') || name.includes('vehicle') || name.includes('toyota') || name.includes('bmw') || name.includes('v8')) return '🚗';
    if (name.includes('house') || name.includes('home') || name.includes('villa')) return '🏠';
    if (name.includes('phone') || name.includes('iphone') || name.includes('samsung')) return '📱';
    if (name.includes('laptop') || name.includes('computer') || name.includes('macbook')) return '💻';
    if (name.includes('furniture') || name.includes('sofa') || name.includes('bed')) return '🛋️';
    if (name.includes('tv') || name.includes('television')) return '📺';
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
        {/* Header with Abbaa Carraa branding */}
        <div className={`bg-gradient-to-r ${getHeaderGradient()} p-4 text-white text-center relative`}>
          <div className="absolute -top-3 -left-3 w-16 h-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/50">
            <div className="text-center">
              <div className="text-[8px] font-bold">ዕድል</div>
              <div className="text-[6px]">CHANCE</div>
            </div>
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center opacity-15">
            <div className="w-28 h-28 rounded-full border-2 border-white flex items-center justify-center rotate-[-10deg]">
              <div className="text-center">
                <div className="text-[8px] font-bold">ABBA CARRAA</div>
                <div className="text-[6px]">ዕድል • CHANCE</div>
              </div>
            </div>
          </div>
          
          <div className="text-center relative z-10">
            <div className="text-3xl mb-1">🎫</div>
            <h3 className="font-bold text-lg tracking-wide">ABBA CARRAA</h3>
            <p className="text-[10px] opacity-80">የኢትዮጵያ ዲጂታል እጣ | Ethiopian Digital Ticket</p>
          </div>
        </div>
        
        <div className="p-5">
          {/* Status Badge */}
          <div className="text-center mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border ${getStatusBadgeClass()}`}>
              {getTicketStatus()}
            </span>
            <div className="text-[8px] text-gray-400 mt-1 flex justify-center gap-2">
              <span>{isVerified ? 'የተረጋገጠ' : 'በመጠባበቅ ላይ'}</span>
              <span>•</span>
              <span>{isVerified ? 'Mirkanaa\'e' : 'Kan hin mirkanoofnee / Eegi'}</span>
            </div>
          </div>
          
          {/* Ticket Number */}
          <div className="text-center mb-4 pb-3 border-b border-gray-200">
            <p className="text-[9px] text-gray-500">TICKET NUMBER | የቲኬት ቁጥር | Lakkoofsa Tiketii</p>
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
          
          {/* POOL NAME - Shows real name */}
          <div className="bg-blue-50 rounded-lg p-3 mb-3 text-center border border-blue-200">
            <p className="text-[8px] font-semibold text-blue-600 mb-1">🏊 POOL NAME | የፑል ስም | Maqaa Paawulii</p>
            <p className="text-sm font-bold text-gray-800">{displayPoolName}</p>
            {/* Development-only debug indicator - remove in production if desired */}
            {isDevelopment && (
              <p className="text-[6px] text-blue-400 mt-1">Pool ID: {pool?.id?.slice(-8) || 'N/A'}</p>
            )}
          </div>
          
          {/* PRIZE NAME - Shows real prize */}
          <div className={`${getInfoBgClass()} rounded-lg p-3 mb-3 text-center`}>
            <p className="text-[8px] font-semibold mb-1">🏆 PRIZE | ሽልማት | Badhaasa</p>
            <p className="text-base font-bold">{getPrizeIcon()} {displayPrizeName}</p>
            {displayPrizeDescription && (
              <p className="text-[9px] text-gray-500 mt-1">{displayPrizeDescription.substring(0, 60)}</p>
            )}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-[9px] text-green-600 font-semibold">ETB {formatNumber(displayPrizeAmount)}</p>
            </div>
          </div>
          
          {/* PARTICIPANT INFO */}
          <div className="bg-indigo-50 rounded-lg p-3 mb-4 border border-indigo-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">👤</span>
              <p className="text-[9px] font-semibold text-indigo-700">PARTICIPANT | ተሳታፊ | Hirmaataa</p>
            </div>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between items-center border-b border-indigo-100 pb-1">
                <span className="text-gray-600">Name | ስም | Maqaa:</span>
                <span className="font-semibold text-gray-800">{displayUserName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-indigo-100 pb-1">
                <span className="text-gray-600">Email | ኢሜይል | Imeeli:</span>
                <span className="font-medium text-gray-700 text-[9px]">{displayUserEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Phone | ስልክ | Bilbilaa:</span>
                <span className="font-semibold text-gray-800">{displayUserPhone}</span>
              </div>
            </div>
          </div>
          
          {/* Seats & Amount */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <p className="text-[8px] font-semibold text-gray-500 mb-2">💺 SEATS | መቀመጫዎች | Iddoowwan</p>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between">
                <span className="text-gray-600">Selected | የተመረጡ | Filataman:</span>
                <span className="font-mono font-bold">{displaySeatNumbers.length > 0 ? displaySeatNumbers.sort((a,b)=>a-b).join(', ') : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entry Fee | ክፍያ | Kaffaltii:</span>
                <span className="font-semibold">ETB {formatNumber(displayEntryFee)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className="text-gray-600">Total Paid | የተከፈለ | Kaffaltii Waliigalaa:</span>
                <span className="font-bold text-green-600">ETB {formatNumber(displayAmount)}</span>
              </div>
            </div>
          </div>
          
          {/* POOL LISTED DATE - Shows real creation date */}
          <div className="text-center mb-3">
            <p className="text-[8px] text-gray-400">📅 LISTED DATE | የተዘረዘረበት ቀን | Guyyaa Itti Baafame</p>
            <p className="text-[10px] font-medium">{new Date(displayPoolListedDate).toLocaleDateString()}</p>
          </div>
          
          {/* DRAW DATE */}
          <div className="text-center mb-3">
            <p className="text-[8px] text-gray-400">🎲 DRAW DATE | የእጣ ቀን | GUYYAA CARRAAN BAHU</p>
            <p className="text-[10px] font-medium">{displayDrawDate ? new Date(displayDrawDate).toLocaleString() : 'TBD'}</p>
          </div>
          
          {/* Issue Date */}
          <div className="text-center text-[8px] text-gray-400 mb-3">
            ISSUED | የተሰጠበት ቀን | Guyyaa Kennametti: {new Date(displayIssueDate).toLocaleString()}
          </div>
          
          {/* Verification Note */}
          {!isVerified && (
            <div className="bg-yellow-50 rounded-lg p-2 mb-3 text-center">
              <p className="text-[8px] text-yellow-700 font-semibold">⏳ PENDING VERIFICATION</p>
              <p className="text-[7px] text-yellow-600">በመጠባበቅ ላይ | Kan hin mirkanoofnee / Eegi</p>
              <p className="text-[7px] text-yellow-500 mt-0.5">Seats confirmed after payment verification</p>
            </div>
          )}
          
          {/* Verified Stamp */}
          {isVerified && (
            <div className="bg-green-50 rounded-lg p-2 mb-3 text-center">
              <p className="text-[8px] text-green-700 font-semibold flex items-center justify-center gap-1">
                <span>✓</span> VERIFIED | የተረጋገጠ | Mirkanaa'e
              </p>
            </div>
          )}
          
          {/* Charity Note */}
          <div className="text-center text-[7px] text-gray-400 pt-2 border-t border-gray-200">
            <p>💚 2% supports kidney & heart disease patients | 2% የልብ እና የኩላሊት ህሙማን ይደገፋል | 2% dhukkuba onnee fi kalteetti gargaara</p>
          </div>
          
          {/* Circular Stamp */}
          <div className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-green-100 border border-green-400 flex items-center justify-center opacity-50">
            <span className="text-[5px] text-green-700 font-bold text-center leading-tight">
              አባ ካራ
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
            <>📥 DOWNLOAD | አውርድ | Buufadhu</>
          )}
        </button>
      </div>
    </div>
  );
}
