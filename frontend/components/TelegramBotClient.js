// components/TelegramBotClient.js - NEW
import { useEffect, useState } from 'react';

export default function TelegramBotClient({ children }) {
  const [isTelegram, setIsTelegram] = useState(false);
  const [telegramUser, setTelegramUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if running inside Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Initialize WebApp
      webApp.ready();
      setIsTelegram(true);
      setIsReady(true);
      
      const user = webApp.initDataUnsafe?.user;
      if (user) {
        setTelegramUser(user);
      }
      
      // Expand the WebApp to full height
      webApp.expand();
      
      // Set theme colors from Telegram
      document.documentElement.style.setProperty('--tg-bg-color', webApp.backgroundColor || '#ffffff');
      document.documentElement.style.setProperty('--tg-text-color', webApp.textColor || '#000000');
      document.documentElement.style.setProperty('--tg-button-color', webApp.buttonColor || '#2481cc');
      
      // Save user data to sessionStorage for API calls
      if (user) {
        sessionStorage.setItem('telegram_user', JSON.stringify(user));
        sessionStorage.setItem('telegram_init_data', webApp.initData);
      }
      
      // Handle theme changes
      webApp.onEvent('themeChanged', () => {
        document.documentElement.style.setProperty('--tg-bg-color', webApp.backgroundColor);
        document.documentElement.style.setProperty('--tg-text-color', webApp.textColor);
        document.documentElement.style.setProperty('--tg-button-color', webApp.buttonColor);
      });
      
      // Cleanup
      return () => {
        webApp.offEvent('themeChanged');
      };
    }
  }, []);

  // Get user for components
  const getUser = () => {
    if (telegramUser) return telegramUser;
    const stored = sessionStorage.getItem('telegram_user');
    if (stored) return JSON.parse(stored);
    return null;
  };

  // Check if in Telegram
  const isInTelegram = () => {
    return isTelegram || typeof window !== 'undefined' && !!window.Telegram?.WebApp;
  };

  return (
    <div className={isInTelegram() ? 'telegram-app min-h-screen' : ''}>
      {/* Telegram Context Provider */}
      {children}
      
      {/* Telegram Badge */}
      {isInTelegram() && (
        <div className="telegram-badge fixed bottom-20 right-4 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-50 flex items-center gap-1.5">
          <span>📱</span>
          <span>Telegram</span>
        </div>
      )}
    </div>
  );
}

// Hook for using Telegram in components
export function useTelegram() {
  const [webApp, setWebApp] = useState(null);
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const w = window.Telegram.WebApp;
      setWebApp(w);
      
      if (w.initDataUnsafe?.user) {
        setUser(w.initDataUnsafe.user);
      }
      
      setIsReady(true);
    }
  }, []);

  const sendData = (data) => {
    if (webApp) {
      webApp.sendData(JSON.stringify(data));
    }
  };

  const close = () => {
    if (webApp) {
      webApp.close();
    }
  };

  const showAlert = (message) => {
    if (webApp) {
      webApp.showAlert(message);
    } else {
      alert(message);
    }
  };

  const showConfirm = (message) => {
    return new Promise((resolve) => {
      if (webApp) {
        webApp.showConfirm(message, (confirmed) => {
          resolve(confirmed);
        });
      } else {
        resolve(window.confirm(message));
      }
    });
  };

  return {
    webApp,
    user,
    isReady,
    isInTelegram: !!webApp,
    sendData,
    close,
    showAlert,
    showConfirm,
    platform: webApp?.platform || 'unknown',
    theme: {
      backgroundColor: webApp?.backgroundColor || '#ffffff',
      textColor: webApp?.textColor || '#000000',
      buttonColor: webApp?.buttonColor || '#2481cc',
    }
  };
}
