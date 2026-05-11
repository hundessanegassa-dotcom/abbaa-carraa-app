// Create a Telegram bot via @BotFather on Telegram
// Get your bot token and chat ID

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;

export async function sendTelegramNotification(message, userId) {
  if (!TELEGRAM_BOT_TOKEN) return;
  
  try {
    // Get user's Telegram chat ID from database if stored
    const { data: profile } = await supabase
      .from('profiles')
      .select('telegram_chat_id')
      .eq('id', userId)
      .single();
    
    const chatId = profile?.telegram_chat_id || TELEGRAM_CHAT_ID;
    
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      })
    });
  } catch (error) {
    console.error('Telegram notification error:', error);
  }
}

// Usage when winner is selected:
await sendTelegramNotification(
  `🎉 *WINNER ANNOUNCEMENT!* 🎉\n\n` +
  `Congratulations! You won the *${poolName}* prize!\n` +
  `Prize Value: ETB ${amount}\n` +
  `Contact: ${agentPhone} to claim your prize!\n\n` +
  `Thank you for participating in Abbaa Carraa Ethio! 💚`,
  winnerUserId
);
