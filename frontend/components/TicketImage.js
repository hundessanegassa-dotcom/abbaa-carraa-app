// components/TicketImage.js - MERGED (Complete)
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import QRCode from 'qrcode.react';

export default function TicketImage({
  participant,
  pool,
  isVerified = false,
  seatNumbers,
  ticketNumber,
  amount,
  createdAt,
  poolType = 'regular',
  onClose,
  language = 'am',
  cityInfo
}) {
  const ticketRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // ============================================
  // LANGUAGE TRANSLATIONS
  // ============================================
  const translations = {
    am: {
      verified: 'የተረጋገጠ',
      unverified: 'ያልተረጋገጠ',
      verifiedDesc: 'ለሽልማት እጣ ብቁ',
      unverifiedDesc: 'ክፍያ በማረጋገጥ ላይ',
      ticketNo: 'የቲኬት ቁጥር',
      issued: 'የተሰጠ',
      youCouldWin: 'ሊያሸንፉት ይችላሉ',
      participant: 'ተሳታፊ',
      drawDate: 'የእጣ ቀን',
      seats: 'መቀመጫዎች',
      amountPaid: 'የክፍያ መጠን',
      prizeListed: 'የሽልማት ቀን',
      terms: 'ውሎች እና ሁኔታዎች ይሠራሉ',
      scanToVerify: 'ለማረጋገጥ ይስካኑ',
      proofParticipation: 'ይህ ቲኬት የተሳትፎ ማስረጃ ነው',
      downloadPNG: 'PNG አውርድ',
      downloadJPEG: 'JPEG አውርድ',
      share: 'አጋራ',
      close: 'ዝጋ',
      pendingVerification: 'ክፍያ በማረጋገጥ ላይ',
      charity: '2% የኩላሊት እና የልብ ህሙማንን ይደግፋል',
    },
    en: {
      verified: 'VERIFIED',
      unverified: 'UNVERIFIED',
      verifiedDesc: 'Eligible for prize draw',
      unverifiedDesc: 'Pending payment verification',
      ticketNo: 'Ticket Number',
      issued: 'Issued',
      youCouldWin: 'You Could Win',
      participant: 'Participant',
      drawDate: 'Draw Date',
      seats: 'Seats',
      amountPaid: 'Amount Paid',
      prizeListed: 'Prize Listed Date',
      terms: 'Terms & conditions apply',
      scanToVerify: 'Scan to verify',
      proofParticipation: 'This ticket is proof of participation',
      downloadPNG: 'Download PNG',
      downloadJPEG: 'Download JPEG',
      share: 'Share',
      close: 'Close',
      pendingVerification: 'Pending payment verification',
      charity: '2% supports kidney & heart disease patients',
    },
    om: {
      verified: 'MIRKANEEFFAME',
      unverified: 'HIN MIRKANEEFFANNE',
      verifiedDesc: 'Buzuuraaf malu',
      unverifiedDesc: 'Kaffaltii eegaa',
      ticketNo: 'Lakkoofsa Tikkeettii',
      issued: 'Kenname',
      youCouldWin: 'Mo\'achuu Dandeessu',
      participant: 'Abba\'aa',
      drawDate: 'Guyyaa Buzuuraa',
      seats: 'Barcuma',
      amountPaid: 'Kaffaltii',
      prizeListed: 'Guyyaa Badhaasaa',
      terms: 'Shartiiwwan fi haalotni ni hojiiru',
      scanToVerify: 'Mirkaneessuu qabdu',
      proofParticipation: 'Kun ragaa hirmaachuu',
      downloadPNG: 'PNG Buufadhu',
      downloadJPEG: 'JPEG Buufadhu',
      share: 'Hirmaachisi',
      close: 'Cufi',
      pendingVerification: 'Kaffaltii eegamaa jira',
      charity: 'Sassabii hunda keessaa %2 dhukkubsatoota kalee fi onneef oola',
    }
  };

  const t = translations[language] || translations.en;

  // ============================================
  // PROGRAM COLORS
  // ============================================
  const getProgramColors = () => {
    if (poolType === 'merkato') {
      return {
        primary: 'from-yellow-500 to-orange-600',
        secondary: 'bg-yellow-50 border-yellow-200',
        accent: 'text-yellow-700',
        light: 'bg-yellow-50/30',
        label: 'MERKATO VIP',
        icon: '🏪'
      };
    } else if (poolType === 'city') {
      return {
        primary: 'from-blue-600 to-indigo-600',
        secondary: 'bg-blue-50 border-blue-200',
        accent: 'text-blue-700',
        light: 'bg-blue-50/30',
        label: 'CITY VIP',
        icon: '🏙️'
      };
    } else {
      return {
        primary: 'from-emerald-600 to-teal-600',
        secondary: 'bg-emerald-50 border-emerald-200',
        accent: 'text-emerald-700',
        light: 'bg-emerald-50/30',
        label: 'REGULAR POOL',
        icon: '🎯'
      };
    }
  };

  const colors = getProgramColors();

  // ============================================
  // DOWNLOAD FUNCTIONS
  // ============================================
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

  // ============================================
  // SHARE FUNCTION
  // ============================================
  const handleShareTicket = async () => {
    if (!ticketRef.current) return;

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `ticket-${ticketNumber}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          title: 'My Abbaa Carraa Ticket',
          text: `🎫 Check out my ticket #${ticketNumber}!`,
          files: [file],
        });
      } else {
        // Fallback: Share via Telegram
        const message = `🎫 *My Abbaa Carraa Ticket*\n\n🏆 Pool: ${getProgramName()}\n💺 Seats: ${seatNumbers?.join(', ') || 'N/A'}\n💰 Amount: ETB ${amount?.toLocaleString()}\n📅 Date: ${formatDate(createdAt)}`;
        window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to share ticket');
      }
    }
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getProgramName = () => {
    if (poolType === 'merkato') return 'Merkato VIP Program';
    if (poolType === 'city') return `${participant?.city || cityInfo?.name?.split('|')[0] || 'City'} VIP Program`;
    return 'Regular Prize Pool';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPrizeAmount = () => {
    return (pool?.prize_amount || pool?.target_amount || pool?.prize || 0);
  };

  const getPoolName = () => {
    return pool?.prize_name || pool?.name || 'Prize Pool';
  };

  const getDrawDate = () => {
    return pool?.drawDate || pool?.draw_time || pool?.end_date || 'TBD';
  };

  const getPatternStyle = () => {
    const patterns = [
      'linear-gradient(135deg, rgba(255,255,255,0.05) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.05) 75%, transparent 75%, transparent)',
      'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05) 0%, transparent 50%)',
      'linear-gradient(45deg, rgba(255,255,255,0.03) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.03) 75%, transparent 75%, transparent)'
    ];
    const index = (ticketNumber?.length || 0) % patterns.length;
    return patterns[index];
  };

  // QR Code data
  const getQRData = () => {
    return JSON.stringify({
      ticketNumber: ticketNumber,
      participant: participant?.user_email || 'N/A',
      program: poolType,
      tier: participant?.tier || pool?.tier || 'N/A',
      seats: seatNumbers || [],
      status: isVerified ? 'verified' : 'unverified',
      issuedAt: createdAt || new Date().toISOString()
    });
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => handleDownloadImage('png')}
          disabled={isDownloading}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <span>📸</span> {t.downloadPNG}
        </button>
        <button
          onClick={() => handleDownloadImage('jpg')}
          disabled={isDownloading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <span>🖼️</span> {t.downloadJPEG}
        </button>
        <button
          onClick={handleShareTicket}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-purple-700 transition flex items-center gap-2"
        >
          <span>📤</span> {t.share}
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition flex items-center gap-2"
          >
            <span>✕</span> {t.close}
          </button>
        )}
      </div>

      {/* Ticket */}
      <div
        ref={ticketRef}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 max-w-md mx-auto"
      >
        {/* Header */}
        <div className={`bg-gradient-to-r ${colors.primary} text-white p-5 text-center relative overflow-hidden`}>
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: getPatternStyle(),
              backgroundSize: '20px 20px'
            }}
          />
          <div className="relative z-10">
            <div className="text-5xl mb-2">{colors.icon}</div>
            <h2 className="text-2xl font-bold tracking-wider">ABBAA CARRAA</h2>
            <p className="text-sm opacity-90 mt-1 font-medium">{getProgramName()}</p>
            <div className="mt-2 flex justify-center gap-2 flex-wrap">
              <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold">
                {colors.label}
              </span>
              <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${
                isVerified ? 'bg-green-500/30 text-green-100' : 'bg-yellow-500/30 text-yellow-100'
              }`}>
                {isVerified ? '✅ ' + t.verified : '⏳ ' + t.unverified}
              </span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`${isVerified ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gradient-to-r from-yellow-500 to-amber-500'} rounded-lg p-2 text-center mx-4 mt-3 shadow-md`}>
          <span className="text-white text-sm font-bold flex items-center justify-center gap-2">
            <span className="text-lg">{isVerified ? '✅' : '⏳'}</span>
            {isVerified ? t.verified : t.unverified} {ticketNumber ? `#${ticketNumber}` : ''}
          </span>
          <p className={`text-xs mt-1 ${isVerified ? 'text-green-100' : 'text-yellow-100'}`}>
            {isVerified ? t.verifiedDesc : t.unverifiedDesc}
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Ticket Number & Date */}
          <div className="text-center border-b border-dashed border-gray-200 pb-3">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t.ticketNo}</p>
            <p className="font-mono font-bold text-xl tracking-wider text-gray-800">{ticketNumber || 'N/A'}</p>
            <p className="text-xs text-gray-400 mt-1">{t.issued}: {formatDate(createdAt)}</p>
          </div>

          {/* Prize Amount */}
          <div className={`bg-gradient-to-r ${colors.secondary} rounded-xl p-4 text-center border ${colors.secondary}`}>
            <p className={`text-xs font-medium uppercase tracking-wider ${colors.accent}`}>🏆 {t.youCouldWin}</p>
            <p className="font-bold text-3xl text-gray-800">
              ETB {getPrizeAmount().toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">{getPoolName()}</p>
          </div>

          {/* Participant & Draw Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">👤 {t.participant}</p>
              <p className="font-semibold text-gray-800 text-sm truncate">
                {participant?.user_name || participant?.full_name || 'N/A'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{participant?.user_email || 'N/A'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">📍 {t.drawDate}</p>
              <p className="font-semibold text-gray-800 text-sm">
                {getDrawDate()}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {poolType === 'merkato' ? 'Merkato VIP' :
                 poolType === 'city' ? `${participant?.city || cityInfo?.name?.split('|')[0] || 'City'} VIP` :
                 'Regular Pool'}
              </p>
            </div>
          </div>

          {/* Seats & Amount */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`bg-gradient-to-r ${colors.light} rounded-lg p-3 text-center border ${colors.secondary}`}>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">💺 {t.seats}</p>
              <p className="font-bold text-lg text-gray-800">
                {seatNumbers?.sort((a, b) => a - b).join(', ') || 'N/A'}
              </p>
              <p className="text-xs text-gray-400 mt-1">{seatNumbers?.length || 0} seat(s)</p>
            </div>
            <div className={`bg-gradient-to-r ${colors.light} rounded-lg p-3 text-center border ${colors.secondary}`}>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">💰 {t.amountPaid}</p>
              <p className="font-bold text-lg text-gray-800">ETB {amount?.toLocaleString() || 0}</p>
              <p className="text-xs text-gray-400 mt-1">{isVerified ? t.verified : t.pendingVerification}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center py-2 border-t border-b border-gray-200">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <QRCode 
                value={getQRData()} 
                size={100} 
                level="H"
                renderAs="svg"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3">
            <div className="text-[10px] text-gray-400">
              <span className="block">🎫 Abbaa Carraa</span>
              <span className="block mt-0.5">{t.terms}</span>
            </div>
            <div className="text-[8px] text-gray-400 text-right">
              <span className="block">{t.scanToVerify}</span>
              <span className="block mt-0.5">v1.0</span>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className={`bg-gradient-to-r ${colors.primary} p-3 text-center text-white text-[10px] opacity-90`}>
          <span className="font-medium">✓ {t.proofParticipation}</span>
          <span className="block mt-0.5">Abbaa Carraa • {new Date().getFullYear()}</span>
        </div>
      </div>

      {/* Info */}
      <div className="text-center text-xs text-gray-400">
        <span>💚 {t.charity}</span>
      </div>
    </div>
  );
}
