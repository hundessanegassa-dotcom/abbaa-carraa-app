// pages/api/test-env.js - Test Environment Variables
export default function handler(req, res) {
  // ✅ Check all environment variables
  const envStatus = {
    // Telegram Bot
    hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
    telegramTokenLength: process.env.TELEGRAM_BOT_TOKEN?.length || 0,
    telegramTokenPrefix: process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10) || 'Not set',
    
    // App URL
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'Not set',
    
    // Supabase
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    
    // Server time
    serverTime: new Date().toISOString(),
    
    // Environment
    nodeEnv: process.env.NODE_ENV || 'Not set',
    vercelEnv: process.env.VERCEL_ENV || 'Not set',
  };

  // ✅ Log to Vercel logs
  console.log('🔍 Environment Check:', JSON.stringify(envStatus, null, 2));
  
  res.status(200).json({
    status: 'success',
    env: envStatus,
    message: 'Environment variables check completed'
  });
}
