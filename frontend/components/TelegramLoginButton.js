// components/TelegramLoginButton.js - FIXED WITH CORRECT BOT USERNAME
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useTelegram } from './TelegramBotClient';

export default function TelegramLoginButton({ onSuccess, onError, className }) {
  const [loading, setLoading] = useState(false);
  const { isInTelegram, user } = useTelegram();
  const router = useRouter();

  // ✅ CORRECT BOT USERNAME
  const BOT_USERNAME = 'abaa_carraa_ethiopia_bot';

  const handleTelegramLogin = async () => {
    setLoading(true);
    
    try {
      // If already in Telegram WebApp and user data is available
      if (isInTelegram && user) {
        // Direct authentication via API
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_id: user.id,
            username: user.username,
            first_name: user.first_name,
            last_name: user.last_name,
            init_data: sessionStorage.getItem('telegram_init_data')
          })
        });

        const result = await response.json();
        
        if (result.success) {
          sessionStorage.setItem('telegram_session_token', result.sessionToken);
          toast.success(`Welcome ${user.first_name}! 🎉`);
          
          const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectPath);
          
          if (onSuccess) onSuccess(result);
        } else {
          throw new Error('Authentication failed');
        }
      } else {
        // ✅ Open Telegram bot with login parameter
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://abbaacarraa.com';
        
        // Store the redirect URL for after login
        const currentPath = window.location.pathname;
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        
        // ✅ Open the CORRECT bot with login payload
        window.open(`https://t.me/${BOT_USERNAME}?start=login`, '_blank');
        
        toast.info('Please login in the Telegram bot and click "Return to App"');
        
        // Listen for login success via URL (polling)
        const checkLogin = setInterval(() => {
          const sessionToken = sessionStorage.getItem('telegram_session_token');
          if (sessionToken) {
            clearInterval(checkLogin);
            const redirectPath = sessionStorage.getItem('redirectAfterLogin') || '/dashboard';
            router.push(redirectPath);
            if (onSuccess) onSuccess();
          }
        }, 2000);
        
        // Clean up interval after 5 minutes
        setTimeout(() => clearInterval(checkLogin), 300000);
      }
    } catch (error) {
      console.error('Telegram login error:', error);
      toast.error('Failed to login with Telegram');
      if (onError) onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleTelegramLogin}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0088cc] hover:bg-[#0077b3] text-white rounded-xl transition font-medium ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
      <span>{loading ? 'Connecting...' : 'Continue with Telegram'}</span>
    </button>
  );
}
