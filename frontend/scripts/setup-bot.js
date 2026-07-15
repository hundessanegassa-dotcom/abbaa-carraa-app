// scripts/setup-bot.js
import { bot, setupBotCommands } from '../lib/bot.js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function setupBot() {
  if (!bot) {
    console.log('❌ Bot not initialized. Check TELEGRAM_BOT_TOKEN in .env.local');
    return;
  }

  try {
    // Set bot commands
    await setupBotCommands();
    console.log('✅ Bot commands set');
    
    // Set webhook
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
    const webhookUrl = `${appUrl}/api/bot/webhook`;
    
    try {
      await bot.telegram.setWebhook(webhookUrl);
      console.log(`✅ Webhook set to: ${webhookUrl}`);
    } catch (webhookError) {
      console.log('⚠️ Webhook setup failed. Using polling mode instead.');
      console.log('ℹ️ To use webhook, make sure your app is publicly accessible.');
    }
    
    // Get webhook info
    try {
      const info = await bot.telegram.getWebhookInfo();
      console.log('📡 Webhook info:', info);
    } catch (e) {
      console.log('ℹ️ Webhook info not available');
    }
    
    console.log('✅ Bot setup complete!');
    console.log('🚀 Run "npm run bot" to start polling mode');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupBot();
