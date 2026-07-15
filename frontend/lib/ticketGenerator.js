// lib/ticketGenerator.js - NEW
import { createCanvas, loadImage } from 'canvas';
import QRCode from 'qrcode';

export async function generateTicketImage({
  participant,
  programType,
  tier,
  seatNumbers,
  ticketNumber,
  amount,
  prize,
  language = 'am'
}) {
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  // Get colors based on program type
  const colors = getProgramColors(programType);

  // Background
  const gradient = ctx.createLinearGradient(0, 0, 0, 600);
  gradient.addColorStop(0, '#f0fdf4');
  gradient.addColorStop(1, '#ffffff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 600);

  // Green border
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 780, 580);

  // Header
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(0, 0, 800, 80);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 32px Arial';
  ctx.fillText('🎫 ABBAA CARRAA', 30, 50);

  ctx.font = '14px Arial';
  ctx.fillText(`#${ticketNumber}`, 600, 50);

  // Program label
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  const label = programType === 'merkato' ? 'MERKATO VIP' : 
                programType === 'city' ? 'CITY VIP' : 
                'REGULAR POOL';
  ctx.fillText(label, 600, 72);

  // Ticket info
  ctx.fillStyle = '#1f2937';
  ctx.font = '20px Arial';
  
  const yStart = 140;
  const lineHeight = 40;
  let y = yStart;

  const fields = [
    ['Program', programType],
    ['Tier', tier || 'N/A'],
    ['Seats', seatNumbers?.join(', ') || 'N/A'],
    ['Amount', `ETB ${amount?.toLocaleString()}`],
    ['Prize', `ETB ${prize?.toLocaleString()}`],
    ['Date', new Date().toLocaleDateString()]
  ];

  fields.forEach(([label, value]) => {
    ctx.fillStyle = '#4b5563';
    ctx.font = '14px Arial';
    ctx.fillText(`${label}:`, 30, y);
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(value, 150, y);
    y += lineHeight;
  });

  // Participant
  ctx.fillStyle = '#4b5563';
  ctx.font = '14px Arial';
  ctx.fillText('Participant:', 30, y);
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 16px Arial';
  ctx.fillText(participant?.user_name || 'Guest', 150, y);

  y += lineHeight;
  ctx.fillStyle = '#4b5563';
  ctx.font = '14px Arial';
  ctx.fillText('Email:', 30, y);
  ctx.fillStyle = '#1f2937';
  ctx.font = '14px Arial';
  ctx.fillText(participant?.user_email || 'N/A', 150, y);

  // Status
  y += lineHeight + 20;
  ctx.fillStyle = '#16a34a';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('✅ VERIFIED', 30, y);

  // QR Code
  const qrData = JSON.stringify({
    ticketNumber,
    participant: participant?.user_email,
    program: programType,
    tier,
    seats: seatNumbers,
    status: 'verified'
  });

  try {
    const qrBuffer = await QRCode.toBuffer(qrData, { width: 120 });
    const qrImage = createCanvas(120, 120);
    const qrCtx = qrImage.getContext('2d');
    const img = new Image();
    img.src = qrBuffer;
    qrCtx.drawImage(img, 0, 0, 120, 120);
    ctx.drawImage(qrImage, 620, 140, 120, 120);
  } catch (e) {
    console.error('QR generation error:', e);
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(620, 140, 120, 120);
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.fillText('QR CODE', 660, 210);
  }

  // Footer
  ctx.fillStyle = '#9ca3af';
  ctx.font = '12px Arial';
  ctx.fillText('💚 2% supports kidney & heart disease patients', 30, 540);
  ctx.fillText('Download ticket in app for full details', 30, 565);

  // Decorative border
  ctx.strokeStyle = '#16a34a';
  ctx.lineWidth = 1;
  ctx.strokeRect(20, 20, 760, 560);

  return canvas.toBuffer();
}

function getProgramColors(programType) {
  if (programType === 'merkato') {
    return {
      primary: '#f59e0b',
      secondary: '#fbbf24',
      text: '#1f2937'
    };
  } else if (programType === 'city') {
    return {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      text: '#1f2937'
    };
  } else {
    return {
      primary: '#10b981',
      secondary: '#34d399',
      text: '#1f2937'
    };
  }
}
