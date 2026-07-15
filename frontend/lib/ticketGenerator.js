// lib/ticketGenerator.js - Canvas-free version (uses html2canvas)
import html2canvas from 'html2canvas';

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
  // Create a temporary DOM element to render the ticket
  const container = document.createElement('div');
  container.style.cssText = `
    position: fixed;
    top: -9999px;
    left: -9999px;
    width: 800px;
    background: white;
    padding: 20px;
    font-family: Arial, sans-serif;
    border: 4px solid #16a34a;
    border-radius: 16px;
    z-index: -9999;
  `;

  // Build ticket HTML
  container.innerHTML = `
    <div style="text-align: center; background: #16a34a; color: white; padding: 20px; border-radius: 12px 12px 0 0;">
      <div style="font-size: 48px;">${programType === 'merkato' ? '🏪' : programType === 'city' ? '🏙️' : '🎯'}</div>
      <h2 style="font-size: 24px; font-weight: bold; margin: 8px 0;">ABBAA CARRAA</h2>
      <p style="font-size: 14px; opacity: 0.9;">${programType.toUpperCase()} TICKET</p>
      <div style="margin-top: 8px; display: flex; gap: 8px; justify-content: center;">
        <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px;">#${ticketNumber}</span>
        <span style="background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px;">${tier || 'Regular'}</span>
      </div>
    </div>

    <div style="padding: 20px;">
      <div style="background: ${programType === 'merkato' ? '#fef3c7' : programType === 'city' ? '#dbeafe' : '#d1fae5'}; padding: 16px; border-radius: 12px; text-align: center; margin-bottom: 16px;">
        <p style="font-size: 12px; color: #6b7280;">🏆 You Could Win</p>
        <p style="font-size: 28px; font-weight: bold; color: #1f2937;">ETB ${prize?.toLocaleString() || 0}</p>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
          <p style="font-size: 10px; color: #9ca3af;">👤 Participant</p>
          <p style="font-weight: 600; font-size: 14px;">${participant?.user_name || 'Guest'}</p>
        </div>
        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
          <p style="font-size: 10px; color: #9ca3af;">💺 Seats</p>
          <p style="font-weight: 600; font-size: 14px;">${seatNumbers?.join(', ') || 'N/A'}</p>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
          <p style="font-size: 10px; color: #9ca3af;">💰 Amount</p>
          <p style="font-weight: 600; font-size: 14px; color: #16a34a;">ETB ${amount?.toLocaleString() || 0}</p>
        </div>
        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; text-align: center;">
          <p style="font-size: 10px; color: #9ca3af;">✅ Status</p>
          <p style="font-weight: 600; font-size: 14px; color: #16a34a;">VERIFIED</p>
        </div>
      </div>

      <div style="margin-top: 16px; padding-top: 16px; border-top: 2px dashed #e5e7eb; display: flex; justify-content: space-between;">
        <div style="font-size: 10px; color: #9ca3af;">
          <div>🎫 Abbaa Carraa</div>
          <div style="margin-top: 4px;">Terms & conditions apply</div>
        </div>
        <div style="font-size: 10px; color: #9ca3af; text-align: right;">
          <div>Scan to verify</div>
          <div style="margin-top: 4px;">v1.0</div>
        </div>
      </div>

      <div style="margin-top: 12px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 12px;">
        💚 2% supports kidney & heart disease patients
      </div>
    </div>
  `;

  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2.5,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
    });

    document.body.removeChild(container);
    return canvas.toBuffer ? canvas.toBuffer() : canvas.toDataURL('image/png');
  } catch (error) {
    document.body.removeChild(container);
    throw error;
  }
}
