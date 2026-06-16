// components/TicketImage.js - Complete with 3D Effects + Enhanced Features
import { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export default function TicketImage({ 
  participant, 
  pool, 
  isVerified = false,
  seatNumbers,
  ticketNumber,
  amount,
  createdAt,
  poolType = 'regular',
  show3D = true,
  onClose
}) {
  const ticketRef = useRef(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [is3D, setIs3D] = useState(show3D);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const animationRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D && !isHovered) {
      const animate = () => {
        setRotation(prev => (prev + 0.3) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [is3D, isHovered]);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
          text: `Check out my ticket #${ticketNumber}! 🎫`,
          files: [file],
        });
      } else {
        // Fallback: Copy link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `ticket-${ticketNumber}.png`;
        link.click();
        toast.success('Ticket downloaded! Share it manually.');
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error('Failed to share ticket');
      }
    }
  };

  const getStatusBadge = () => {
    if (isVerified) {
      return (
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-2 text-center mb-3 shadow-lg">
          <span className="text-white text-sm font-bold flex items-center justify-center gap-2">
            <span className="text-lg">✅</span> VERIFIED TICKET
          </span>
          <p className="text-green-100 text-xs mt-1">✅ Eligible for prize draw</p>
        </div>
      );
    }
    return (
      <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg p-2 text-center mb-3 shadow-lg">
        <span className="text-white text-sm font-bold flex items-center justify-center gap-2">
          <span className="text-lg">⏳</span> UNVERIFIED TICKET
        </span>
        <p className="text-yellow-100 text-xs mt-1">⏳ Pending payment verification</p>
      </div>
    );
  };

  const getProgramName = () => {
    if (poolType === 'merkato') return 'MERKATO VIP PROGRAM';
    if (poolType === 'city') return `${participant?.city || 'CITY'} VIP PROGRAM`;
    return 'REGULAR PRIZE POOL';
  };

  const getProgramIcon = () => {
    if (poolType === 'merkato') return '🏪';
    if (poolType === 'city') return '🏙️';
    return '🎯';
  };

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleString();
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

  // Calculate 3D transform based on mouse position
  const get3DTransform = () => {
    if (!is3D) return 'none';
    
    if (isHovered) {
      const rotateX = (mouseY - 0.5) * 20;
      const rotateY = (mouseX - 0.5) * 20;
      return `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    }
    
    return `rotateY(${rotation}deg)`;
  };

  const toggle3D = () => {
    setIs3D(!is3D);
    if (!is3D) {
      setRotation(0);
    }
  };

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="space-y-4">
      {/* 3D Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={toggle3D}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
            is3D 
              ? 'bg-purple-600 text-white hover:bg-purple-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {is3D ? '🔄 3D ON' : '🔄 3D OFF'}
        </button>
        <button
          onClick={toggleFlip}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          🔄 Flip Ticket
        </button>
        <button
          onClick={handleShareTicket}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
        >
          📤 Share
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700 transition"
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* 3D Ticket Container */}
      <div 
        className="perspective-1000"
        style={{ perspective: '1000px' }}
      >
        <div 
          ref={ticketRef}
          className="relative transition-all duration-300 ease-out"
          style={{
            transform: get3DTransform(),
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
          }}
          onMouseMove={(e) => {
            if (!is3D) return;
            const rect = e.currentTarget.getBoundingClientRect();
            setMouseX((e.clientX - rect.left) / rect.width);
            setMouseY((e.clientY - rect.top) / rect.height);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setMouseX(0.5);
            setMouseY(0.5);
          }}
        >
          {/* Ticket Front */}
          <div 
            className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200"
            style={{
              backfaceVisibility: 'hidden',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transition: 'transform 0.6s',
            }}
          >
            {/* Header with Gradient */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white p-5 text-center relative overflow-hidden">
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full blur-xl animate-pulse delay-700"></div>
              </div>
              
              <div className="relative z-10">
                <div className="text-6xl mb-2 animate-bounce">{getProgramIcon()}</div>
                <h2 className="text-2xl font-bold tracking-wider">ABBAA CARRAA</h2>
                <p className="text-sm opacity-90 mt-1 font-medium">{getProgramName()}</p>
                <div className="mt-2 flex justify-center gap-2">
                  <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs">🎫 VIP</span>
                  <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs">⭐ {poolType.toUpperCase()}</span>
                </div>
              </div>
            </div>
            
            {getStatusBadge()}
            
            <div className="p-5 space-y-4">
              {/* Ticket Number */}
              <div className="text-center border-b border-dashed border-gray-200 pb-3">
                <p className="text-xs text-gray-400 font-medium">TICKET NUMBER</p>
                <p className="font-mono font-bold text-xl tracking-wider text-gray-800">{ticketNumber}</p>
                <p className="text-xs text-gray-400 mt-1">{formatDate(createdAt)}</p>
              </div>
              
              {/* Prize Amount */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-3 text-center border border-amber-200">
                <p className="text-xs text-amber-600 font-medium">🏆 YOU COULD WIN</p>
                <p className="font-bold text-3xl text-amber-700">
                  ETB {getPrizeAmount().toLocaleString()}
                </p>
                <p className="text-xs text-amber-500 mt-1">{getPoolName()}</p>
              </div>
              
              {/* Seat & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-3 text-center border border-emerald-200">
                  <p className="text-xs text-gray-400 font-medium">💺 Seats</p>
                  <p className="font-bold text-emerald-600 text-lg">
                    {seatNumbers?.sort((a,b)=>a-b).join(', ') || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{seatNumbers?.length || 0} seat(s)</p>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 text-center border border-blue-200">
                  <p className="text-xs text-gray-400 font-medium">💰 Amount</p>
                  <p className="font-bold text-blue-600 text-lg">ETB {amount?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-400 mt-1">Paid</p>
                </div>
              </div>
              
              {/* Participant Info */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">👤 Name:</span>
                  <span className="font-semibold text-gray-800">{participant?.user_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-500 font-medium">📧 Email:</span>
                  <span className="text-gray-600 text-xs">{participant?.user_email || 'N/A'}</span>
                </div>
                {participant?.city && (
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500 font-medium">📍 City:</span>
                    <span className="text-gray-600">{participant.city}</span>
                  </div>
                )}
              </div>
              
              {/* QR Code Placeholder or Footer */}
              <div className="flex justify-between items-center border-t border-dashed border-gray-200 pt-3">
                <div className="text-[10px] text-gray-400">
                  <span className="block">Issued: {formatDate(createdAt)}</span>
                  <span className="block">Valid until: {formatDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))}</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                    QR
                  </div>
                  <span className="text-[8px] text-gray-400 mt-1">Scan to verify</span>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-3 text-center text-[10px] text-gray-400 border-t">
              <span className="font-medium">✓ This ticket is proof of participation</span>
              <span className="block mt-0.5">Abbaa Carraa • {new Date().getFullYear()}</span>
            </div>
          </div>

          {/* Ticket Back (Flipped) */}
          <div 
            className="absolute inset-0 bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-200"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              transition: 'transform 0.6s',
            }}
          >
            <div className="p-6 h-full flex flex-col justify-between">
              <div>
                <div className="text-center">
                  <div className="text-4xl mb-2">🎫</div>
                  <h3 className="text-xl font-bold text-gray-800">Ticket Details</h3>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Ticket #</span>
                    <span className="font-mono font-bold">{ticketNumber}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Holder</span>
                    <span className="font-medium">{participant?.user_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Seats</span>
                    <span className="font-medium">{seatNumbers?.sort((a,b)=>a-b).join(', ') || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Amount</span>
                    <span className="font-bold text-emerald-600">ETB {amount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Program</span>
                    <span className="font-medium">{getProgramName()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status</span>
                    <span className={`font-bold ${isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {isVerified ? '✅ Verified' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs text-gray-400 mt-4 border-t pt-2">
                <p>Abbaa Carraa • Secure & Verified</p>
                <p className="mt-0.5">{currentTime.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Download Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
        <button
          onClick={() => handleDownloadImage('png')}
          disabled={isDownloading}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="text-xl">📸</span> Download PNG
        </button>
        <button
          onClick={() => handleDownloadImage('jpg')}
          disabled={isDownloading}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <span className="text-xl">🖼️</span> Download JPEG
        </button>
        <button
          onClick={handleShareTicket}
          className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition flex items-center justify-center gap-2"
        >
          <span className="text-xl">📤</span> Share
        </button>
      </div>

      {/* 3D Info */}
      {is3D && (
        <div className="text-center text-xs text-gray-400">
          <span>🔄 3D Mode Active • </span>
          <span>Hover to tilt • </span>
          <span>Click "Flip Ticket" to see back</span>
        </div>
      )}
    </div>
  );
}
