// pages/api/bot/status.js - Check Bot Status
import { bot } from '../../../lib/bot';

export default async function handler(req, res) {
  const status = {
    bot: {
      initialized: !!bot,
      tokenSet: !!process.env.TELEGRAM_BOT_TOKEN,
      tokenLength: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
    },
    app: {
      url: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
      environment: process.env.NODE_ENV || 'Not set',
      vercelEnv: process.env.VERCEL_ENV || 'Not set',
    },
    timestamp: new Date().toISOString(),
  };

  // ✅ Try to get bot info
  if (bot) {
    try {
      const botInfo = await bot.telegram.getMe();
      status.bot.info = {
        id: botInfo.id,
        username: botInfo.username,
        first_name: botInfo.first_name,
      };
      status.bot.connected = true;
    } catch (error) {
      status.bot.connected = false;
      status.bot.error = error.message;
    }
  }

  // ✅ Get webhook info
  if (bot) {
    try {
      const webhookInfo = await bot.telegram.getWebhookInfo();
      status.webhook = {
        url: webhookInfo.url,
        pendingUpdates: webhookInfo.pending_update_count,
        lastError: webhookInfo.last_error_message,
        lastErrorDate: webhookInfo.last_error_date,
      };
    } catch (error) {
      status.webhook = { error: error.message };
    }
  }

  res.status(200).json(status);
}
