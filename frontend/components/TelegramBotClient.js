// components/TelegramBotClient.js - COMPLETE WITH FULL TELEGRAM SUPPORT
import { useEffect, useState, createContext, useContext } from 'react';

const TelegramContext = createContext(null);

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    return {
      webApp: null,
      user: null,
      isReady: false,
      isInTelegram: false,
      sendData: () => {},
      close: () => {},
      showAlert: (msg) => alert(msg),
      showConfirm: (msg) => window.confirm(msg),
      platform: 'unknown',
      theme: { backgroundColor: '#ffffff', textColor: '#000000', buttonColor: '#2481cc' }
    };
  }
  return context;
}

export default function TelegramBotClient({ children }) {
  const [state, setState] = useState({
    webApp: null,
    user: null,
    isReady: false,
    isInTelegram: false,
    platform: 'unknown',
    theme: {
      backgroundColor: '#ffffff',
      textColor: '#000000',
      buttonColor: '#2481cc'
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      webApp.ready();
      
      const user = webApp.initDataUnsafe?.user;
      
      setState({
        webApp,
        user: user || null,
        isReady: true,
        isInTelegram: true,
        platform: webApp.platform || 'unknown',
        theme: {
          backgroundColor: webApp.backgroundColor || '#ffffff',
          textColor: webApp.textColor || '#000000',
          buttonColor: webApp.buttonColor || '#2481cc'
        }
      });
      
      webApp.expand();
      
      document.documentElement.style.setProperty('--tg-bg-color', webApp.backgroundColor || '#ffffff');
      document.documentElement.style.setProperty('--tg-text-color', webApp.textColor || '#000000');
      document.documentElement.style.setProperty('--tg-button-color', webApp.buttonColor || '#2481cc');
      
      if (user) {
        sessionStorage.setItem('telegram_user', JSON.stringify(user));
        sessionStorage.setItem('telegram_init_data', webApp.initData);
        sessionStorage.setItem('telegram_user_id', user.id);
        
        // ✅ Auto-login via API
        fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            initData: webApp.initData,
            user: user
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            sessionStorage.setItem('telegram_session_token', data.sessionToken);
            console.log('✅ Telegram user authenticated');
          }
        })
        .catch(err => console.error('Telegram auth error:', err));
      }
      
      webApp.onEvent('themeChanged', () => {
        setState(prev => ({
          ...prev,
          theme: {
            backgroundColor: webApp.backgroundColor || '#ffffff',
            textColor: webApp.textColor || '#000000',
            buttonColor: webApp.buttonColor || '#2481cc'
          }
        }));
        document.documentElement.style.setProperty('--tg-bg-color', webApp.backgroundColor);
        document.documentElement.style.setProperty('--tg-text-color', webApp.textColor);
        document.documentElement.style.setProperty('--tg-button-color', webApp.buttonColor);
      });
      
      webApp.onEvent('backButtonClicked', () => {
        if (window.history.length > 1) {
          window.history.back();
        }
      });
      
      return () => {
        webApp.offEvent('themeChanged');
        webApp.offEvent('backButtonClicked');
      };
    } else {
      setState(prev => ({
        ...prev,
        isReady: true,
        isInTelegram: false
      }));
    }
  }, []);

  const contextValue = {
    ...state,
    sendData: (data) => {
      if (state.webApp) {
        state.webApp.sendData(JSON.stringify(data));
      }
    },
    close: () => {
      if (state.webApp) {
        state.webApp.close();
      }
    },
    showAlert: (message) => {
      if (state.webApp) {
        state.webApp.showAlert(message);
      } else {
        alert(message);
      }
    },
    showConfirm: (message) => {
      return new Promise((resolve) => {
        if (state.webApp) {
          state.webApp.showConfirm(message, (confirmed) => {
            resolve(confirmed);
          });
        } else {
          resolve(window.confirm(message));
        }
      });
    },
    openLink: (url) => {
      if (state.webApp) {
        state.webApp.openLink(url);
      } else {
        window.open(url, '_blank');
      }
    },
    openTelegramLink: (url) => {
      if (state.webApp) {
        state.webApp.openTelegramLink(url);
      } else {
        window.open(url, '_blank');
      }
    }
  };

  return (
    <TelegramContext.Provider value={contextValue}>
      <div className={state.isInTelegram ? 'telegram-app min-h-screen' : ''}>
        {children}
      </div>
    </TelegramContext.Provider>
  );
}
