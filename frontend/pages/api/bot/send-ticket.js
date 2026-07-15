// pages/api/bot/send-ticket.js
import { bot } from '../../../lib/bot';
import { supabase } from '../../../lib/supabase';
import { generateTicketImage } from '../../../lib/ticketGenerator';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    telegramId, 
    participant, 
    programType, 
    tier, 
    seatNumbers, 
    ticketNumber, 
    amount, 
    prize,
    language = 'am'
  } = req.body;

  if (!telegramId || !participant) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Generate ticket image using sharp
    const ticketImageBuffer = await generateTicketImage({
      participant,
      programType,
      tier,
      seatNumbers,
      ticketNumber,
      amount,
      prize,
      language,
      isVerified: true
    });

    // Get translations
    const translations = getTranslations(language);

    // Send ticket as photo
    await bot.telegram.sendPhoto(
      telegramId,
      { source: ticketImageBuffer },
      {
        caption: getTicketCaption(participant, programType, tier, seatNumbers, ticketNumber, amount, prize, language)
      }
    );

    // Send success message with buttons
    await bot.telegram.sendMessage(
      telegramId,
      translations.successMessage,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📊 My Tickets', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` } }],
            [{ text: '🏠 Home', web_app: { url: process.env.NEXT_PUBLIC_APP_URL } }],
            [{ text: '📱 View Ticket', web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}/tickets/${ticketNumber}` } }]
          ]
        }
      }
    );

    // Log delivery
    await supabase
      .from('ticket_delivery_logs')
      .insert({
        ticket_number: ticketNumber,
        delivery_type: 'telegram',
        delivered_to: telegramId,
        success: true,
        metadata: { programType, tier }
      });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error sending ticket:', error);
    
    await supabase
      .from('ticket_delivery_logs')
      .insert({
        ticket_number: ticketNumber,
        delivery_type: 'telegram',
        delivered_to: telegramId,
        success: false,
        error_message: error.message,
        metadata: { programType, tier }
      });

    res.status(500).json({ error: 'Failed to send ticket' });
  }
}

function getTranslations(language) {
  const translations = {
    am: {
      successMessage: `✅ *ቲኬትዎ ተረጋግጧል!*\n\n` +
        `🎉 ቲኬትዎ በአስተዳዳሪዎቻችን ተረጋግጧል.\n\n` +
        `🍀 መልካም እድል!`,
      verified: 'የተረጋገጠ'
    },
    en: {
      successMessage: `✅ *Your ticket is verified!*\n\n` +
        `🎉 Your ticket has been verified by our admin team.\n\n` +
        `🍀 Best of luck!`,
      verified: 'VERIFIED'
    },
    om: {
      successMessage: `✅ *Tikkeettiin keessan mirkaneessifame!*\n\n` +
        `🎉 Tikkeettiin keessan adminiin mirkaneessifame.\n\n` +
        `🍀 Carraa gaarii!`,
      verified: 'MIRKANEEFFAME'
    }
  };

  return translations[language] || translations.en;
}

function getTicketCaption(participant, programType, tier, seatNumbers, ticketNumber, amount, prize, language) {
  const t = getTranslations(language);
  
  return `🎫 *Your Abbaa Carraa Ticket*\n\n` +
    `🏆 Program: ${programType}\n` +
    `🎯 Tier: ${tier}\n` +
    `💺 Seats: ${seatNumbers?.join(', ') || 'N/A'}\n` +
    `💰 Amount: ETB ${amount?.toLocaleString()}\n` +
    `🏅 Prize: ETB ${prize?.toLocaleString()}\n` +
    `🎟️ Ticket: #${ticketNumber}\n` +
    `✅ Status: ${t.verified}\n\n` +
    `📱 View and download full ticket in the app!`;
}
