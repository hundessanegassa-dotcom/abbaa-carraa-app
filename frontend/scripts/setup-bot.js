// scripts/setup-bot.js
import { bot, setupBotCommands, handleBotMessages } from '../lib/bot.js';
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
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/bot/webhook`;
    await bot.telegram.setWebhook(webhookUrl);
    console.log(`✅ Webhook set to: ${webhookUrl}`);
    
    // Get webhook info
    const info = await bot.telegram.getWebhookInfo();
    console.log('📡 Webhook info:', info);
    
    console.log('✅ Bot setup complete!');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupBot();
