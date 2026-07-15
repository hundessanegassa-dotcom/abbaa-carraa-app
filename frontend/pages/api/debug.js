// pages/api/debug.js - Debug Bot Webhook
import { bot } from '../../lib/bot';

export default async function handler(req, res) {
  const results = {
    botInitialized: !!bot,
    telegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
    tokenLength: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
  };

  // ✅ Try to get bot info if token exists
  if (bot) {
    try {
      const botInfo = await bot.telegram.getMe();
      results.botInfo = {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name,
        is_bot: botInfo.is_bot,
      };
      results.botInfoSuccess = true;
    } catch (error) {
      results.botInfoError = error.message;
      results.botInfoSuccess = false;
    }
  }

  console.log('🔍 Debug Results:', JSON.stringify(results, null, 2));

  res.status(200).json({
    status: 'success',
    timestamp: new Date().toISOString(),
    results,
  });
}
