// lib/ticketGenerator.js - Server-Compatible with Sharp
import sharp from 'sharp';
import QRCode from 'qrcode';

export async function generateTicketImage({
  participant,
  programType,
  tier,
  seatNumbers,
  ticketNumber,
  amount,
  prize,
  language = 'am',
  isVerified = true
}) {
  // Build QR code data
  const qrData = JSON.stringify({
    ticketNumber,
    participant: participant?.user_email || 'N/A',
    program: programType,
    tier: tier || 'regular',
    seats: seatNumbers || [],
    status: isVerified ? 'verified' : 'unverified',
    issuedAt: new Date().toISOString()
  });

  // Generate QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(qrData, { 
    width: 150,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  const qrBase64 = qrBuffer.toString('base64');

  // Get program colors
  const colors = getProgramColors(programType);

  // Create SVG ticket template
  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${colors.secondary};stop-opacity:1" />
        </linearGradient>
        <linearGradient id="statusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${isVerified ? '#22c55e' : '#eab308'};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${isVerified ? '#16a34a' : '#ca8a04'};stop-opacity:1" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="800" height="600" fill="#f8fafc" rx="16" ry="16"/>
      
      <!-- Border -->
      <rect x="10" y="10" width="780" height="580" fill="none" stroke="${colors.primary}" stroke-width="4" rx="12" ry="12"/>

      <!-- Header -->
      <rect x="0" y="0" width="800" height="100" fill="url(#headerGrad)" rx="12" ry="12"/>
      <text x="30" y="50" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="white">🎫 ABBAA CARRAA</text>
      <text x="30" y="78" font-family="Arial, sans-serif" font-size="14" fill="rgba(255,255,255,0.8)">${programType.toUpperCase()} VIP TICKET</text>
      
      <!-- Ticket Number -->
      <text x="600" y="50" font-family="monospace" font-size="18" font-weight="bold" fill="white">#${ticketNumber}</text>
      <text x="600" y="78" font-family="Arial, sans-serif" font-size="12" fill="rgba(255,255,255,0.6)">${tier ? tier.toUpperCase() : 'REGULAR'}</text>

      <!-- Status Badge -->
      <rect x="620" y="20" width="140" height="30" rx="15" fill="url(#statusGrad)"/>
      <text x="650" y="40" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white">${isVerified ? '✅ VERIFIED' : '⏳ PENDING'}</text>

      <!-- Prize Amount -->
      <rect x="30" y="130" width="740" height="80" rx="12" fill="${colors.light}" stroke="${colors.primary}30" stroke-width="1"/>
      <text x="400" y="160" font-family="Arial, sans-serif" font-size="14" fill="#6b7280" text-anchor="middle">🏆 YOU COULD WIN</text>
      <text x="400" y="195" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#1f2937" text-anchor="middle">ETB ${prize?.toLocaleString() || 0}</text>

      <!-- Participant Info -->
      <rect x="30" y="230" width="360" height="80" rx="8" fill="white" stroke="#e5e7eb" stroke-width="1"/>
      <text x="50" y="255" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af">👤 PARTICIPANT</text>
      <text x="50" y="278" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">${participant?.user_name || 'Guest'}</text>
      <text x="50" y="298" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">${participant?.user_email || ''}</text>

      <!-- Seat Info -->
      <rect x="410" y="230" width="360" height="80" rx="8" fill="white" stroke="#e5e7eb" stroke-width="1"/>
      <text x="430" y="255" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af">💺 SEATS</text>
      <text x="430" y="278" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">${seatNumbers?.join(', ') || 'N/A'}</text>
      <text x="430" y="298" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">${seatNumbers?.length || 0} seat(s)</text>

      <!-- Amount & Draw Date -->
      <rect x="30" y="330" width="360" height="60" rx="8" fill="white" stroke="#e5e7eb" stroke-width="1"/>
      <text x="50" y="355" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af">💰 AMOUNT PAID</text>
      <text x="50" y="378" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#16a34a">ETB ${amount?.toLocaleString() || 0}</text>

      <rect x="410" y="330" width="360" height="60" rx="8" fill="white" stroke="#e5e7eb" stroke-width="1"/>
      <text x="430" y="355" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af">📅 DRAW DATE</text>
      <text x="430" y="378" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1f2937">${participant?.drawDate || participant?.draw_time || participant?.end_date || 'TBD'}</text>

      <!-- QR Code -->
      <image x="620" y="410" width="120" height="120" href="data:image/png;base64,${qrBase64}"/>
      <text x="680" y="545" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle">SCAN TO VERIFY</text>

      <!-- Footer -->
      <text x="30" y="555" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af">🎫 Abbaa Carraa • Terms & conditions apply</text>
      <text x="750" y="555" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af" text-anchor="end">v2.0</text>
      <text x="400" y="580" font-family="Arial, sans-serif" font-size="10" fill="#9ca3af" text-anchor="middle">💚 2% supports kidney & heart disease patients</text>
    </svg>
  `;

  // Convert SVG to PNG using sharp
  const imageBuffer = await sharp(Buffer.from(svgTemplate))
    .png()
    .toBuffer();

  return imageBuffer;
}

function getProgramColors(programType) {
  if (programType === 'merkato') {
    return {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      light: '#fef3c7',
      text: '#1f2937'
    };
  } else if (programType === 'city') {
    return {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      light: '#dbeafe',
      text: '#1f2937'
    };
  } else {
    return {
      primary: '#10b981',
      secondary: '#34d399',
      light: '#d1fae5',
      text: '#1f2937'
    };
  }
}
