// pages/dashboard-telegram.js - SIMPLE REDIRECT
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function DashboardTelegram() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in via Telegram
    const sessionToken = sessionStorage.getItem('telegram_session_token');
    const telegramUser = sessionStorage.getItem('telegram_user');
    
    if (sessionToken && telegramUser) {
      // Redirect to main dashboard
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
