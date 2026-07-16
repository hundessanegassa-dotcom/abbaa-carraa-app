// components/CityTicket.js - COMPLETE WITH 5 TIERS SUPPORT
import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { TIERS, getDrawScheduleText, getTierLabel } from './SeatSelector';

export default function CityTicket({ 
  participant, 
  pool, 
  cityInfo, 
  type = 'unverified',
  tierId,
  language = 'am',
  onDownload 
}) {
  const ticketRef = useRef();
  const [isDownloading, setIsDownloading] = useState(false);

  const formatNumber = (num) => {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    
    setIsDownloading(true);
    
    try {
      toast.loading(language === 'am' ? 'PDF በማዘጋጀት ላይ...' : 'Generating PDF...', { id: 'pdf-gen' });
      
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2.5,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        windowWidth: ticketRef.current.scrollWidth,
        windowHeight: ticketRef.current.scrollHeight
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save(`ticket-${participant.ticket_number || 'unknown'}.pdf`);
      
      toast.success(language === 'am' ? 'ቲኬት ተወርዷል!' : 'Ticket downloaded!', { id: 'pdf-gen' });
      
      if (onDownload) onDownload();
      
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error(language === 'am' ? 'ቲኬት ማውረድ አልተቻለም' : 'Failed to download ticket');
    } finally {
      setIsDownloading(false);
    }
  };

  // Get tier info - supports 5 tiers
  const tier = tierId ? TIERS[tierId] : null;
  const seatNumbers = participant?.seat_numbers || [];
  const contributionAmount = participant?.contribution_amount || 0;
  const prizeAmount = participant?.prize_amount || (tier?.prize || 0);
  const entryFee = tier?.contribution || 0;
  
  // Get status config
  const getStatusConfig = () => {
    if (type === 'verified' || participant?.payment_status === 'verified') {
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-600',
        badgeBg: 'bg-gray-700',
        badgeText: language === 'am' ? 'የተረጋገጠ' : 'VERIFIED',
        textColor: 'text-gray-800',
        icon: '✅'
      };
    }
    return {
      bg: 'bg-gray-50',
      border: 'border-gray-400',
      badgeBg: 'bg-gray-500',
      badgeText: language === 'am' ? 'ያልተረጋገጠ' : 'UNVERIFIED',
      textColor: 'text-gray-600',
      icon: '⏳'
    };
  };

  const statusConfig = getStatusConfig();
  const cityName = participant?.city || cityInfo?.name?.split('|')[0] || 'Ethiopian City';
  const poolType = participant?.pool_type || 'daily';
  const ticketNumber = participant?.ticket_number || `TICKET-${Date.now()}`;
  const participantName = participant?.user_name || 'Guest';
  const participantEmail = participant?.user_email || 'N/A';
  const createdAt = participant?.created_at ? new Date(participant.created_at) : new Date();

  // Get pool display info
  const getPoolDisplayInfo = () => {
    if (tier) {
      const drawText = getDrawScheduleText(tierId, language);
      return {
        frequency: drawText,
        drawDate: drawText,
        icon: tier.icon || '🎁',
        tierLabel: getTierLabel(tierId, language)
      };
    }
    return {
      frequency: poolType === 'daily' ? (language === 'am' ? 'ዕለታዊ' : 'Daily') :
                   poolType === 'weekly' ? (language === 'am' ? 'ሳምንታዊ' : 'Weekly') :
                   (language === 'am' ? 'ወርሃዊ' : 'Monthly'),
      drawDate: poolType === 'daily' ? (language === 'am' ? 'የዕለት ተዕለት እጣ' : 'Daily Draw') :
                   poolType === 'weekly' ? (language === 'am' ? 'ሳምንታዊ እጣ' : 'Weekly Draw') :
                   (language === 'am' ? 'ወርሃዊ እጣ' : 'Monthly Draw'),
      icon: '🎁',
      tierLabel: poolType
    };
  };

  const poolDisplay = getPoolDisplayInfo();

  // QR Code data
  const getQRCodeData = () => {
    return JSON.stringify({
      ticketNumber: ticketNumber,
      participant: {
        name: participantName,
        email: participantEmail,
        city: cityName
      },
      pool: {
        type: poolType,
        tier: tierId,
        seats: seatNumbers,
        amount: contributionAmount,
        prize: prizeAmount
      },
      verified: type === 'verified' || participant?.payment_status === 'verified',
      issuedAt: createdAt.toISOString()
    });
  };

  return (
    <div className="space-y-4">
      <div 
        ref={ticketRef}
        className={`${statusConfig.bg} border-2 ${statusConfig.border} rounded-2xl p-6 max-w-2xl mx-auto shadow-xl relative`}
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Ticket Header */}
        <div className="text-center border-b pb-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <div className="text-xs text-gray-500 font-mono">{language === 'am' ? 'ቲኬት ቁጥር' : 'Ticket #'}: {ticketNumber}</div>
              <div className="text-sm font-semibold text-gray-700">
                {createdAt.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            <div className={`${statusConfig.badgeBg} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1`}>
              <span>{statusConfig.icon}</span>
              <span>{statusConfig.badgeText}</span>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mt-2">
            {poolDisplay.icon} {cityName} VIP
          </h2>
          <p className="text-sm text-gray-600">
            {language === 'am' ? 'የሚሊየነር ቲኬት' : 'Millionaire Ticket'}
            {tier && ` - ${poolDisplay.tierLabel}`}
          </p>
        </div>

        {/* Ticket Body */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-[10px] text-gray-500">{language === 'am' ? 'ተሳታፊ' : 'Participant'}</p>
            <p className="font-semibold text-sm text-gray-800 truncate">{participantName}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-[10px] text-gray-500">Email</p>
            <p className="font-semibold text-sm text-gray-800 truncate">{participantEmail}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-[10px] text-gray-500">{language === 'am' ? 'ከተማ' : 'City'}</p>
            <p className="font-semibold text-sm text-gray-800">{cityName}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-[10px] text-gray-500">{language === 'am' ? 'ደረጃ' : 'Tier'}</p>
            <p className="font-semibold text-sm text-gray-800">{poolDisplay.tierLabel}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-[10px] text-gray-500">{language === 'am' ? 'መቀመጫዎች' : 'Seats'}</p>
            <p className="font-semibold text-sm text-gray-800">{seatNumbers.length > 0 ? seatNumbers.sort((a,b) => a-b).join(', ') : 'N/A'}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-[10px] text-gray-500">{language === 'am' ? 'የእጣ ድግግሞሽ' : 'Draw Frequency'}</p>
            <p className="font-semibold text-sm text-gray-800">{poolDisplay.frequency}</p>
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">{language === 'am' ? 'የእያንዳንዱ መቀመጫ ክፍያ' : 'Entry Fee per Seat'}:</span>
            <span className="font-semibold">ETB {formatNumber(entryFee || (contributionAmount / (seatNumbers.length || 1)))}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">{language === 'am' ? 'የመቀመጫዎች ብዛት' : 'Number of Seats'}:</span>
            <span className="font-semibold">{seatNumbers.length}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-700">{language === 'am' ? 'ጠቅላላ ክፍያ' : 'Total Paid'}:</span>
            <span className="font-bold text-xl text-green-600">ETB {formatNumber(contributionAmount)}</span>
          </div>
        </div>

        {/* Prize Section */}
        <div className="bg-purple-50 rounded-lg p-3 mb-4 text-center border border-purple-200">
          <p className="text-xs text-purple-600 font-semibold">🏆 {language === 'am' ? 'የተረጋገጠ ሽልማት' : 'GUARANTEED PRIZE'}</p>
          <p className="text-xl font-bold text-purple-700">ETB {formatNumber(prizeAmount)}</p>
          <p className="text-xs text-purple-500 mt-1">{language === 'am' ? 'እጣ:' : 'Draw:'} {poolDisplay.drawDate}</p>
        </div>

        {/* QR Code Section */}
        <div className="flex justify-center py-4 border-t border-b border-dashed">
          <div className="bg-white p-3 rounded-xl shadow-md">
            <QRCodeSVG 
              value={getQRCodeData()}
              size={120}
              level="H"
            />
          </div>
        </div>

        {/* Verification Status Message */}
        {type === 'verified' && participant?.verified_at && (
          <div className="bg-green-100 rounded-lg p-3 mt-4 text-center">
            <p className="text-green-800 text-sm font-semibold">
              ✓ {language === 'am' ? 'የተረጋገጠ' : 'Verified'} {new Date(participant.verified_at).toLocaleString()}
            </p>
            <p className="text-green-600 text-xs">{language === 'am' ? 'ይህ ቲኬት ለሚቀጥለው እጣ ትክክለኛ ነው' : 'This ticket is VALID for the upcoming draw'}</p>
          </div>
        )}

        {type === 'unverified' && (
          <div className="bg-gray-100 rounded-lg p-3 mt-4 text-center">
            <p className="text-gray-800 text-sm font-semibold">
              ⏳ {language === 'am' ? 'በአስተዳዳሪ ማረጋገጫ ላይ' : 'Awaiting Admin Verification'}
            </p>
            <p className="text-gray-600 text-xs">{language === 'am' ? 'ክፍያዎ ከተረጋገጠ በኋላ ቲኬትዎ ይነቃል' : 'Your ticket will be activated once payment is confirmed'}</p>
          </div>
        )}

        {/* Charity Note */}
        <div className="text-center text-xs text-gray-400 mt-4 pt-4 border-t">
          <p>Abbaa Carraa • {cityName} {language === 'am' ? 'ቪአይፒ ፕሮግራም' : 'VIP Program'}</p>
          <p className="mt-1">💚 {language === 'am' ? '2% በኢትዮጵያ ውስጥ የኩላሊት እና የልብ ህሙማንን ይደግፋል' : '2% supports kidney & heart disease patients in Ethiopia'}</p>
          <p className="text-[10px] mt-1">{language === 'am' ? 'ውሎች እና ሁኔታዎች ይሠራሉ • ለሽልማት ይህን ቲኬት ያስቀምጡ' : 'Terms & Conditions Apply • Keep this ticket safe for prize claims'}</p>
        </div>
      </div>

      {/* Download Button */}
      <div className="text-center">
        <button
          onClick={downloadTicket}
          disabled={isDownloading}
          className={`${type === 'verified' ? 'bg-gray-700 hover:bg-gray-800' : 'bg-gray-600 hover:bg-gray-700'} text-white px-6 py-2 rounded-lg font-semibold transition flex items-center gap-2 mx-auto disabled:opacity-50 shadow-md`}
        >
          {isDownloading ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {language === 'am' ? 'PDF በማዘጋጀት ላይ...' : 'Generating PDF...'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {language === 'am' ? 'ቲኬት አውርድ (PDF)' : 'Download Ticket (PDF)'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
