// components/CityTicket.js
import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

export default function CityTicket({ 
  participant, 
  pool, 
  cityInfo, 
  type = 'unverified',
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
      toast.loading('Generating PDF...', { id: 'pdf-gen' });
      
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
      pdf.save(`city-ticket-${participant.ticket_number || 'unknown'}.pdf`);
      
      toast.success('Ticket downloaded!', { id: 'pdf-gen' });
      
      if (onDownload) onDownload();
      
    } catch (error) {
      console.error('Error downloading ticket:', error);
      toast.error('Failed to download ticket. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const getSeatNumbersArray = () => {
    return participant?.seat_numbers || [];
  };

  const getTicketStatus = () => {
    return type === 'verified' ? '✓ VERIFIED' : '⏳ UNVERIFIED';
  };

  const getStatusConfig = () => {
    if (type === 'verified') {
      return {
        bg: 'bg-gray-50',
        border: 'border-gray-600',
        badgeBg: 'bg-gray-700',
        badgeText: 'VERIFIED',
        textColor: 'text-gray-800',
        icon: '✅'
      };
    }
    return {
      bg: 'bg-gray-50',
      border: 'border-gray-400',
      badgeBg: 'bg-gray-500',
      badgeText: 'UNVERIFIED',
      textColor: 'text-gray-600',
      icon: '⏳'
    };
  };

  const statusConfig = getStatusConfig();
  const seatNumbers = getSeatNumbersArray();
  const cityName = participant?.city || cityInfo?.name?.split('|')[0] || 'Ethiopian City';
  const poolType = participant?.pool_type || 'daily';
  const contributionAmount = participant?.contribution_amount || 0;
  const prizeAmount = participant?.prize_amount || 0;
  const ticketNumber = participant?.ticket_number || `CITY-${Date.now()}`;
  const participantName = participant?.user_name || 'Guest';
  const participantEmail = participant?.user_email || 'N/A';
  const createdAt = participant?.created_at ? new Date(participant.created_at) : new Date();

  // Get pool display info
  const getPoolDisplayInfo = () => {
    switch(poolType) {
      case 'daily':
        return { frequency: 'Daily', drawDate: 'Every Day at 8:00 PM', icon: '⭐' };
      case 'weekly':
        return { frequency: 'Weekly', drawDate: 'Every Sunday at 6:00 PM', icon: '🏆' };
      case 'monthly':
        return { frequency: 'Monthly', drawDate: 'Last Day of Month at 8:00 PM', icon: '👑' };
      default:
        return { frequency: 'Special', drawDate: 'TBA', icon: '🎁' };
    }
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
        seats: seatNumbers,
        amount: contributionAmount,
        prize: prizeAmount
      },
      verified: type === 'verified',
      issuedAt: createdAt.toISOString()
    });
  };

  return (
    <div className="space-y-4">
      <div 
        ref={ticketRef}
        className={`${statusConfig.bg} border-2 ${statusConfig.border} rounded-2xl p-6 max-w-2xl mx-auto shadow-xl`}
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Ticket Header */}
        <div className="text-center border-b pb-4 mb-4">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <div className="text-xs text-gray-500 font-mono">Ticket #{ticketNumber}</div>
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
          <p className="text-sm text-gray-600">የሚሊየነር ቲኬት | Millionaire Ticket</p>
        </div>

        {/* Ticket Body */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-xs text-gray-500">Participant Name</p>
            <p className="font-semibold text-sm text-gray-800">{participantName}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-semibold text-sm text-gray-800 truncate">{participantEmail}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-xs text-gray-500">City</p>
            <p className="font-semibold text-sm text-gray-800">{cityName}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-xs text-gray-500">Pool Type</p>
            <p className="font-semibold text-sm text-gray-800 capitalize">{poolType}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-xs text-gray-500">Seat Numbers</p>
            <p className="font-semibold text-sm text-gray-800">{seatNumbers.length > 0 ? seatNumbers.sort((a,b) => a-b).join(', ') : 'N/A'}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded-lg">
            <p className="text-xs text-gray-500">Draw Frequency</p>
            <p className="font-semibold text-sm text-gray-800">{poolDisplay.frequency}</p>
          </div>
        </div>

        {/* Amount Section */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Entry Fee per Seat:</span>
            <span className="font-semibold">ETB {formatNumber(contributionAmount / (seatNumbers.length || 1))}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Number of Seats:</span>
            <span className="font-semibold">{seatNumbers.length}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Total Paid:</span>
            <span className="font-bold text-xl text-green-600">ETB {formatNumber(contributionAmount)}</span>
          </div>
        </div>

        {/* Prize Section */}
        <div className="bg-purple-50 rounded-lg p-3 mb-4 text-center border border-purple-200">
          <p className="text-xs text-purple-600 font-semibold">🏆 GUARANTEED PRIZE</p>
          <p className="text-xl font-bold text-purple-700">ETB {formatNumber(prizeAmount)}</p>
          <p className="text-xs text-purple-500 mt-1">Draw: {poolDisplay.drawDate}</p>
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
              ✓ Verified on {new Date(participant.verified_at).toLocaleString()}
            </p>
            <p className="text-green-600 text-xs">This ticket is VALID for the upcoming draw</p>
          </div>
        )}

        {type === 'unverified' && (
          <div className="bg-gray-100 rounded-lg p-3 mt-4 text-center">
            <p className="text-gray-800 text-sm font-semibold">
              ⏳ Awaiting Admin Verification
            </p>
            <p className="text-gray-600 text-xs">Your ticket will be activated once payment is confirmed</p>
          </div>
        )}

        {/* Charity Note */}
        <div className="text-center text-xs text-gray-400 mt-4 pt-4 border-t">
          <p>Abbaa Carraa • {cityName} VIP Program</p>
          <p className="mt-1">💚 2% supports kidney & heart disease patients in Ethiopia</p>
          <p className="text-[10px] mt-1">Terms & Conditions Apply • Keep this ticket safe for prize claims</p>
        </div>

        {/* Decorative elements */}
        <div className="absolute bottom-2 right-2 opacity-20">
          <div className="text-4xl">{cityInfo?.icon || '🏙️'}</div>
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
              Generating PDF...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Ticket (PDF)
            </>
          )}
        </button>
      </div>
    </div>
  );
}
