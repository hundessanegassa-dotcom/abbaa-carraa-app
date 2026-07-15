// pages/api/bot/webhook.js
import { bot, setupBotCommands, handleBotMessages } from '../../../lib/bot';

let isBotSetup = false;

export default async function handler(req, res) {
  // ✅ Always respond to POST requests from Telegram
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ Setup bot only once
    if (!isBotSetup && bot) {
      await setupBotCommands();
      await handleBotMessages();
      isBotSetup = true;
      console.log('✅ Bot setup complete');
    }

    // ✅ Parse the incoming update from Telegram
    const update = req.body;

    // ✅ Process the update with your bot
    if (bot) {
      await bot.handleUpdate(update);
    }

    // ✅ Always return 200 OK to Telegram
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    // ✅ Even on error, return 200 to prevent Telegram from retrying
    res.status(200).json({ ok: true });
  }
}

// ✅ Note: bodyParser is ON by default in Next.js API routes
