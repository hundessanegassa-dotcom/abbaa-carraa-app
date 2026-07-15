// pages/api/bot/webhook.js - FIXED
import { bot, setupBotCommands, handleBotMessages } from '../../../lib/bot';

// Setup bot on first run
let isBotSetup = false;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Setup bot only once
    if (!isBotSetup && bot) {
      await setupBotCommands();
      await handleBotMessages();
      isBotSetup = true;
      
      // Set webhook
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com'}/api/bot/webhook`;
      await bot.telegram.setWebhook(webhookUrl);
      console.log('✅ Webhook set to:', webhookUrl);
    }

    // ✅ FIX: Parse the raw body
    const rawBody = await parseRawBody(req);
    
    // Handle update with parsed body
    await bot?.handleUpdate(rawBody);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

// Disable bodyParser for webhook (needed for raw body)
export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper to parse raw body
function parseRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}
