// pages/api/bot/webhook.js
import { bot, setupBotCommands, handleBotMessages } from '../../../lib/bot';

let isBotSetup = false;

export default async function handler(req, res) {
  // ✅ 1. Always respond to POST requests from Telegram
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // ✅ 2. Setup bot only once
    if (!isBotSetup && bot) {
      await setupBotCommands();
      await handleBotMessages();
      isBotSetup = true;
    }

    // ✅ 3. Parse the incoming update from Telegram
    const update = req.body; // bodyParser is ON by default in Next.js API routes

    // ✅ 4. Process the update with your bot
    if (bot) {
      await bot.handleUpdate(update);
    }

    // ✅ 5. Always return 200 OK to Telegram
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    // ✅ 6. Even on error, return 200 to prevent Telegram from retrying
    res.status(200).json({ ok: true });
  }
}

// ✅ Note: Do NOT disable bodyParser for this simple version
// export const config = { api: { bodyParser: true } }; // This is the default
