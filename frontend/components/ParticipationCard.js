import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode.react';
import toast from 'react-hot-toast';

export default function ParticipationCard({ contribution, pool, user, onClose }) {
  const cardRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [language, setLanguage] = useState('en');

  const translations = {
    en: {
      title: 'Abbaa Carraa',
      subtitle: "Ethiopia's #1 Prize Platform",
      badge: '🏆 VERIFIED PARTICIPANT',
      participant: 'Participant',
      prizePool: 'Prize Pool',
      entryAmount: 'Entry Amount',
      ticketSeat: 'Ticket/Seat',
      winnerGets: 'Winner Gets',
      dateJoined: 'Date Joined',
      verification: 'VERIFICATION',
      scanToVerify: 'Scan to verify your participation',
      charity: '2% supports kidney & heart disease patients',
      footer: 'Abbaa Carraa - Empowering Dreams, Transforming Lives'
    },
    am: {
      title: 'Abbaa Carraa',
      subtitle: 'የኢትዮጵያ ቁጥር 1 የሽልማት መድረክ',
      badge: '🏆 የተረጋገጠ ተሳታፊ',
      participant: 'ተሳታፊ',
      prizePool: 'የሽልማት መደብ',
      entryAmount: 'የመግቢያ ክፍያ',
      ticketSeat: 'ቲኬት / መቀመጫ',
      winnerGets: 'አሸናፊው የሚያገኘው',
      dateJoined: 'የተቀላቀሉበት ቀን',
      verification: 'ማረጋገጫ',
      scanToVerify: 'ተሳትፎዎን ለማረጋገጥ ስካን ያድርጉ',
      charity: '2% የሚሆነው የኩላሊት እና የልብ ህመምተኞችን ለመደገፍ ነው',
      footer: 'አባ ካራ - ህልሞችን ማሳካት፣ ህይወትን መለወጥ'
    },
    om: {
      title: 'Abbaa Carraa',
      subtitle: 'Ityoophiyaatti waaltajjii badhaasaa 1ffaa',
      badge: '🏆 HIRMAATA MIRKANEFFAME',
      participant: 'Hirmaataa',
      prizePool: 'Gosa badhaasaa',
      entryAmount: 'Kaffaltii Seensaa',
      ticketSeat: 'Tiiketti / Teessoo',
      winnerGets: 'Moʼaataan kan argatu',
      dateJoined: 'Guyyaa hirmaannaa',
      verification: 'MIRKANEESSA',
      scanToVerify: 'Hirmaannaa keessan mirkaneessuuf iskaanii godhaa',
      charity: '2% dhukkuba kalee fi onne qabaniif tajaajila',
      footer: 'Abbaa Carraa - Abjuu mirkaneessuu, Jireenya Jijjiiruu'
    }
  };

  const t = translations[language];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString(language === 'en' ? 'en-US' : language === 'am' ? 'am-ET' : 'om-ET', options);
  };

  const generateTicketNumbers = () => {
    const ticketCount = Math.floor(contribution.amount / pool.entry_fee);
    if (ticketCount === 1) {
      return `#${contribution.ticket_number || contribution.id.slice(-6).toUpperCase()}`;
    }
    return `${ticketCount} Tickets (${contribution.ticket_number || contribution.id.slice(-6).toUpperCase()} + ${ticketCount - 1} more)`;
  };

  const getRandomGradient = () => {
    const gradients = [
      'from-purple-600 to-pink-500',
      'from-blue-600 to-cyan-500',
      'from-green-600 to-teal-500',
      'from-orange-500 to-red-500',
      'from-indigo-600 to-purple-500',
      'from-rose-500 to-orange-500',
      'from-teal-500 to-emerald-500'
    ];
    return gradients[Math.floor(Math.random() * gradients.length)];
  };

  const gradient = getRandomGradient();

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: false,
        preserveDrawingBuffer: true
      });
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `AbbaaCarraa_${pool.prize_name.replace(/\s/g, '_')}_${contribution.id.slice(-6)}.png`;
      link.href = image;
      link.click();
      toast.success('🎉 Card saved to your device!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to save card');
    } finally {
      setDownloading(false);
    }
  };

  const shareOnWhatsApp = () => {
    const message = `🎉✨ ${language === 'en' ? 'I just joined the' : language === 'am' ? 'አሁን ተቀላቀልኩ' : 'Ani yeroo ammaa makadhe'} "${pool.prize_name}" ${language === 'en' ? 'pool on Abbaa Carraa' : language === 'am' ? 'በአባ ካራ ላይ' : 'kuusaa Abbaa Carraa irratti'}! ✨🎉\n\n` +
                    `💰 ${t.entryAmount}: ETB ${contribution.amount.toLocaleString()}\n` +
                    `🎟️ ${t.ticketSeat}: ${generateTicketNumbers()}\n\n` +
                    `🏆 ${t.winnerGets}: ETB ${pool.target_amount?.toLocaleString()}!\n\n` +
                    `💚 ${t.charity}\n\n` +
                    `${language === 'en' ? 'Join me' : language === 'am' ? 'ተቀላቀሉኝ' : 'Na makadhu'} 👇\n` +
                    `${window.location.origin}/pools/${pool.id}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareOnTelegram = () => {
    const message = `🎉✨ ${language === 'en' ? 'I just joined the' : language === 'am' ? 'አሁን ተቀላቀልኩ' : 'Ani yeroo ammaa makadhe'} "${pool.prize_name}" ${language === 'en' ? 'pool on Abbaa Carraa' : language === 'am' ? 'በአባ ካራ ላይ' : 'kuusaa Abbaa Carraa irratti'}! ✨🎉\n\n` +
                    `💰 ${t.entryAmount}: ETB ${contribution.amount.toLocaleString()}\n` +
                    `🎟️ ${t.ticketSeat}: ${generateTicketNumbers()}\n\n` +
                    `🏆 ${t.winnerGets}: ETB ${pool.target_amount?.toLocaleString()}!\n\n` +
                    `💚 ${t.charity}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + '/pools/' + pool.id)}&text=${encodeURIComponent(message)}`, '_blank');
  };

  const verificationUrl = `${window.location.origin}/verify/${contribution.id}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl transform transition-all duration-300 scale-100 animate-slideUp">
        
        {/* Language Selector */}
        <div className="flex justify-end gap-1 p-2 bg-gray-50 border-b">
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${language === 'en' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            🇬🇧 English
          </button>
          <button
            onClick={() => setLanguage('am')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${language === 'am' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            🇪🇹 አማርኛ
          </button>
          <button
            onClick={() => setLanguage('om')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${language === 'om' ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-200'}`}
          >
            🇪🇹 Oromoo
          </button>
        </div>

        {/* Header with Gradient */}
        <div className={`bg-gradient-to-r ${gradient} text-white p-6 text-center relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mt-16 -mr-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -mb-12 -ml-12"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-sm">
              <span className="text-4xl">🎁</span>
            </div>
            <h2 className="text-2xl font-bold">🎉 {language === 'en' ? 'Participation Confirmed!' : language === 'am' ? 'ተሳትፎ ተረጋግጧል!' : 'Hirmaannaa Mirkaneeffame!'}</h2>
            <p className="text-sm opacity-90 mt-1">{language === 'en' ? "You're officially in the draw!" : language === 'am' ? 'በይፋ በእጣው ውስጥ ነዎት!' : 'Hirmaanna badhaasaa keessaa ifaan seentanittu!'}</p>
          </div>
        </div>

        {/* Card Content - Downloadable */}
        <div ref={cardRef} className="p-6 bg-white">
          {/* Premium Badge */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
              {t.badge}
            </div>
          </div>

          {/* Logo & Title */}
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">🎁</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">{t.title}</h3>
                <p className="text-[10px] text-gray-400 -mt-0.5">{t.subtitle}</p>
              </div>
            </div>
          </div>

          {/* Decorative Line */}
          <div className="relative my-3">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-xs text-gray-400">✦ {t.participant.toUpperCase()} ✦</span>
            </div>
          </div>

          {/* Participant Info */}
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-500 text-sm flex items-center gap-1">👤 {t.participant}</span>
              <span className="font-semibold text-gray-800">{user?.full_name || user?.email?.split('@')[0] || 'Anonymous'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-500 text-sm flex items-center gap-1">🎯 {t.prizePool}</span>
              <span className="font-bold text-green-600">{pool.prize_name}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-500 text-sm flex items-center gap-1">💰 {t.entryAmount}</span>
              <span className="font-bold text-gray-800 text-lg">ETB {contribution.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-500 text-sm flex items-center gap-1">🎟️ {t.ticketSeat}</span>
              <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{generateTicketNumbers()}</span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-gray-500 text-sm flex items-center gap-1">🏆 {t.winnerGets}</span>
              <span className="font-bold text-purple-600">ETB {pool.target_amount?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm flex items-center gap-1">📅 {t.dateJoined}</span>
              <span className="text-sm text-gray-600">{formatDate(contribution.created_at)}</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-dashed border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-xs text-gray-400">✦ {t.verification} ✦</span>
            </div>
          </div>

          <div className="text-center">
            <div className="inline-block bg-white p-2 rounded-xl shadow-md border border-gray-100">
              <QRCode value={verificationUrl} size={100} level="H" />
            </div>
            <p className="text-[10px] text-gray-400 mt-2">{t.scanToVerify}</p>
          </div>

          {/* Footer with Charity */}
          <div className="text-center mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-center gap-1 text-xs">
              <span className="text-pink-500">💚</span>
              <span className="text-gray-500">{t.charity}</span>
            </div>
            <p className="text-[9px] text-gray-300 mt-1">{t.footer}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 border-t bg-gray-50 space-y-2">
          <button
            onClick={downloadCard}
            disabled={downloading}
            className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-200 touch-target"
          >
            {downloading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                {language === 'en' ? 'Generating...' : language === 'am' ? 'በማዘጋጀት ላይ...' : 'Irrumeessa...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {language === 'en' ? 'Download Card' : language === 'am' ? 'ካርዱን አውርድ' : 'Kaardii Buufadhu'}
              </>
            )}
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={shareOnWhatsApp}
              className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-green-600 transition-all duration-200 touch-target"
            >
              📱 WhatsApp
            </button>
            <button
              onClick={shareOnTelegram}
              className="flex-1 bg-blue-500 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-all duration-200 touch-target"
            >
              💬 Telegram
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-300 transition-all duration-200 touch-target"
            >
              {language === 'en' ? 'Close' : language === 'am' ? 'ዝጋ' : 'Cufi'}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
