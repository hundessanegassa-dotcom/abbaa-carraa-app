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
  const displayPoolName = pool?.name || pool?.prize_name || pool?.poolName || 'Abbaa Carraa Pool';
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
        description: displayPrizeDescription,
        prizeAmount: displayPrizeAmount,
        entryFee: displayEntryFee,
        seats: displaySeatNumbers
      },
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
    if (name.includes('car') || name.includes('vehicle') || name.includes('ተሽከርካሪ')) return '🚗';
    if (name.includes('house') || name.includes('home') || name.includes('ቤት')) return '🏠';
    if (name.includes('phone') || name.includes('ስልክ')) return '📱';
    if (name.includes('laptop') || name.includes('computer') || name.includes('ኮምፒውተር')) return '💻';
    if (name.includes('furniture') || name.includes('የቤት እቃ')) return '🛋️';
    if (name.includes('tv') || name.includes('television') || name.includes('ቲቪ')) return '📺';
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
          <div className="absolute -top-3 -left-3 w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border-2 border-white/50">
            <div className="text-center">
              <div className="text-xs font-bold">አባ ካራ</div>
              <div className="text-[8px]">Abbaa Carraa</div>
              <div className="text-[8px] mt-0.5">ዲጂታል እጣ</div>
              <div className="text-[8px]">Digital Ticket</div>
            </div>
          </div>
          
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
            <p className="text-xs opacity-90">የኢትዮጵያ ዲጂታል ቲኬት | Tiketii Digitaalaa Itoophiyaa</p>
          </div>
        </div>
        
        <div className="p-5">
          {/* Status Badge */}
          <div className="text-center mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass()}`}>
              {getTicketStatus()}
            </span>
          </div>
          
          {/* Ticket Number */}
          <div className="text-center mb-4 pb-3 border-b border-gray-200">
            <p className="text-[10px] text-gray-500">የቲኬት ቁጥር | Lakkoofsa Tiketii | Ticket Number</p>
            <p className="text-base font-mono font-bold tracking-wider">{displayTicketNumber}</p>
          </div>
          
          {/* QR Code */}
          <div className="flex justify-center mb-4">
            <QRCodeSVG 
              value={getQRCodeData()} 
              size={110}
              bgColor="#ffffff"
              fgColor="#000000"
              level="L"
              includeMargin={false}
            />
          </div>
          
          {/* Participant Info - Trilingual */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-[10px] font-semibold text-gray-500 mb-2">📋 የተሳታፊ መረጃ | Odeeffannoo Hirmaataa | Participant Info</p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">ስም | Maqaa | Name:</span>
                <span className="font-medium">{displayUserName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ኢሜይል | Imeeli | Email:</span>
                <span className="font-medium">{displayUserEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ስልክ | Bilbilaa | Phone:</span>
                <span className="font-medium">{displayUserPhone}</span>
              </div>
            </div>
          </div>
          
          {/* Prize Details - Shows actual prize like "V8 Car" */}
          <div className={`${getInfoBgClass()} rounded-lg p-3 mb-4`}>
            <p className="text-[10px] font-semibold mb-2">🎁 የሽልማት ዝርዝር | Odeeffannoo Badhaasaa | Prize Details</p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">ሽልማት | Badhaasa | Prize:</span>
                <div className="text-right">
                  <span className="font-semibold">{getPrizeIcon()} {displayPrizeName}</span>
                </div>
              </div>
              {displayPrizeDescription && (
                <div className="flex justify-between">
                  <span className="text-gray-500">መግለጫ | Ibsa | Description:</span>
                  <span className="text-right text-[10px] max-w-[60%]">{displayPrizeDescription.substring(0, 60)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">የሽልማት ዋጋ | Gatii Badhaasaa | Prize Value:</span>
                <span className="font-bold text-green-600">ETB {formatNumber(displayPrizeAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">የመግቢያ ክፍያ | Kaffaltii Seensaa | Entry Fee:</span>
                <span className="font-semibold">ETB {formatNumber(displayEntryFee)}</span>
              </div>
            </div>
          </div>
          
          {/* Seat Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-[10px] font-semibold text-gray-500 mb-2">💺 የመቀመጫ መረጃ | Odeeffannoo Iddoo | Seat Information</p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">የተመረጡ መቀመጫዎች | Iddoowwan Filataman | Selected Seats:</span>
                <span className="font-mono font-bold">{displaySeatNumbers.length > 0 ? displaySeatNumbers.sort((a,b)=>a-b).join(', ') : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">የመቀመጫዎች ብዛት | Baay’ina Iddoo | Number of Seats:</span>
                <span className="font-semibold">{displaySeatNumbers.length}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-200">
                <span className="text-gray-500">የተከፈለ ጠቅላላ | Kaffaltii Waliigalaa | Total Paid:</span>
                <span className="font-bold text-green-600">ETB {formatNumber(displayAmount)}</span>
              </div>
            </div>
          </div>
          
          {/* Pool Stats */}
          <div className={`${getInfoBgClass()} rounded-lg p-3 mb-4`}>
            <p className="text-[10px] font-semibold mb-2">📊 የፑል ስታቲስቲክስ | Lakkoofsa Paawulii | Pool Statistics</p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">ጠቅላላ መቀመጫዎች | Iddoowwan Waliigalaa | Total Seats:</span>
                <span className="font-semibold">{formatNumber(displayTotalSeats)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ዒላማ ገንዘብ | Hanga Galma | Target Amount:</span>
                <span className="font-semibold">ETB {formatNumber(displayTargetAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">የተሰበሰበ | Waliitti Qabame | Current Raised:</span>
                <span className="font-semibold">ETB {formatNumber(displayCurrentAmount)}</span>
              </div>
            </div>
          </div>
          
          {/* Draw Information */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-[10px] font-semibold text-gray-500 mb-2">🎲 የእጣ መረጃ | Odeeffannoo Argaa | Draw Information</p>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">የእጣ ቀን | Guyyaa Argaa | Draw Date:</span>
                <span className="font-semibold">{displayDrawDate ? new Date(displayDrawDate).toLocaleString() : 'TBD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ቦታ | Bakka | Location:</span>
                <span className="font-semibold">{displayPoolCity}</span>
              </div>
            </div>
          </div>
          
          {/* Issue Date */}
          <div className="text-center text-[9px] text-gray-400 mb-3">
            ቀን | Guyyaa | Issued: {new Date(displayDate).toLocaleString()}
          </div>
          
          {/* Verification Note */}
          {!isVerified && (
            <div className="bg-yellow-50 rounded-lg p-2 mb-4 text-center">
              <p className="text-[10px] text-yellow-700 font-semibold">⏳ በመጠባበቅ ላይ | Eeggachaa | PENDING VERIFICATION</p>
              <p className="text-[8px] text-yellow-600 mt-0.5">ክፍያዎ ሲረጋገጥ መቀመጫዎችዎ ይረጋገጃሉ</p>
            </div>
          )}
          
          {/* Verified Stamp */}
          {isVerified && (
            <div className="bg-green-50 rounded-lg p-2 mb-4 text-center">
              <p className="text-[10px] text-green-700 font-semibold flex items-center justify-center gap-1">
                <span>✓</span> የተረጋገጠ ቲኬት | Tikettiin Mirkanaa'e | VERIFIED TICKET
              </p>
            </div>
          )}
          
          {/* Charity Note */}
          <div className="text-center text-[8px] text-gray-400 pt-2 border-t border-gray-200">
            <p>💚 2% የልብ እና የኩላሊት ህሙማን ይደገፋል | 2% dhukkuba onnee fi kalteetti gargaara | 2% supports kidney & heart disease patients</p>
          </div>
          
          {/* Circular Stamp at Bottom Right */}
          <div className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center opacity-60">
            <span className="text-[6px] text-green-700 font-bold text-center leading-tight">
              አባ ካራ<br/>ዲጂታል
            </span>
          </div>
        </div>
        
        {/* Perforated line */}
        <div className="h-2 bg-gradient-to-r from-transparent via-gray-300 to-transparent bg-repeat-x" 
             style={{ backgroundImage: 'radial-gradient(circle at 2px 1px, gray 1px, transparent 1px)', backgroundSize: '8px 4px' }} />
      </div>
      
      {/* Download Button - Trilingual */}
      <div className="text-center">
        <button
          onClick={downloadTicket}
          disabled={downloading}
          className={`${isVerified ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 mx-auto disabled:opacity-50 shadow-md text-sm`}
        >
          {downloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              በማውረድ ላይ... | Buufamaa jira... | Downloading...
            </>
          ) : (
            <>📥 አውርድ ቲኬት | Buufadhu Tiketii | Download Ticket</>
          )}
        </button>
      </div>
    </div>
  );
}
