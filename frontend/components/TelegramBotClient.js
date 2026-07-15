// components/TelegramBotClient.js - ENHANCED with full Telegram support
import { useEffect, useState, createContext, useContext } from 'react';

// Create Telegram Context
const TelegramContext = createContext(null);

export function useTelegram() {
  const context = useContext(TelegramContext);
  if (!context) {
    // Return default values if not in Telegram context
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
      theme: { backgroundColor: '#ffffff', textColor: '#000000', buttonColor: '#2481cc' },
      // VIP Tiers for Telegram
      vipTiers: {
        merkato: [
          { id: 'silver', name: 'Silver', nameAm: 'ብር', nameOm: 'Silver', prize: '100K ETB', seats: 1200, icon: '🥈' },
          { id: 'gold', name: 'Gold', nameAm: 'ወርቅ', nameOm: 'Gold', prize: '500K ETB', seats: 1200, icon: '🥇' },
          { id: 'platinum', name: 'Platinum', nameAm: 'ፕላቲኒየም', nameOm: 'Platinum', prize: '1M ETB', seats: 2400, icon: '💎' },
          { id: 'diamond', name: 'Diamond', nameAm: 'አልማዝ', nameOm: 'Diamond', prize: '2M ETB', seats: 2400, icon: '💠' },
          { id: 'royal', name: 'Royal', nameAm: 'ንጉሣዊ', nameOm: 'Royal', prize: '5M ETB', seats: 2400, icon: '👑' },
          { id: 'emperor', name: 'Emperor', nameAm: 'ንጉሠ ነገሥት', nameOm: 'Emperor', prize: '10M ETB', seats: 2400, icon: '🏆' }
        ],
        city: [
          { id: 'silver', name: 'Silver', nameAm: 'ብር', nameOm: 'Silver', prize: '100K ETB', seats: 1200, icon: '🥈' },
          { id: 'gold', name: 'Gold', nameAm: 'ወርቅ', nameOm: 'Gold', prize: '500K ETB', seats: 1200, icon: '🥇' },
          { id: 'platinum', name: 'Platinum', nameAm: 'ፕላቲኒየም', nameOm: 'Platinum', prize: '1M ETB', seats: 2400, icon: '💎' },
          { id: 'diamond', name: 'Diamond', nameAm: 'አልማዝ', nameOm: 'Diamond', prize: '2M ETB', seats: 2400, icon: '💠' },
          { id: 'royal', name: 'Royal', nameAm: 'ንጉሣዊ', nameOm: 'Royal', prize: '5M ETB', seats: 2400, icon: '👑' },
          { id: 'emperor', name: 'Emperor', nameAm: 'ንጉሠ ነገሥት', nameOm: 'Emperor', prize: '10M ETB', seats: 2400, icon: '🏆' }
        ]
      }
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
    // Check if running inside Telegram
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const webApp = window.Telegram.WebApp;
      
      // Initialize WebApp
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
        sessionStorage.setItem('telegram_user_id', user.id);
      }
      
      // Handle theme changes
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
      
      // Handle back button
      webApp.onEvent('backButtonClicked', () => {
        if (window.history.length > 1) {
          window.history.back();
        }
      });
      
      // Cleanup
      return () => {
        webApp.offEvent('themeChanged');
        webApp.offEvent('backButtonClicked');
      };
    } else {
      // Not in Telegram - still provide basic functionality
      setState(prev => ({
        ...prev,
        isReady: true,
        isInTelegram: false
      }));
    }
  }, []);

  // VIP Tiers Data
  const vipTiers = {
    merkato: [
      { id: 'silver', name: 'Silver', nameAm: 'ብር', nameOm: 'Silver', prize: '100K ETB', seats: 1200, icon: '🥈' },
      { id: 'gold', name: 'Gold', nameAm: 'ወርቅ', nameOm: 'Gold', prize: '500K ETB', seats: 1200, icon: '🥇' },
      { id: 'platinum', name: 'Platinum', nameAm: 'ፕላቲኒየም', nameOm: 'Platinum', prize: '1M ETB', seats: 2400, icon: '💎' },
      { id: 'diamond', name: 'Diamond', nameAm: 'አልማዝ', nameOm: 'Diamond', prize: '2M ETB', seats: 2400, icon: '💠' },
      { id: 'royal', name: 'Royal', nameAm: 'ንጉሣዊ', nameOm: 'Royal', prize: '5M ETB', seats: 2400, icon: '👑' },
      { id: 'emperor', name: 'Emperor', nameAm: 'ንጉሠ ነገሥት', nameOm: 'Emperor', prize: '10M ETB', seats: 2400, icon: '🏆' }
    ],
    city: [
      { id: 'silver', name: 'Silver', nameAm: 'ብር', nameOm: 'Silver', prize: '100K ETB', seats: 1200, icon: '🥈' },
      { id: 'gold', name: 'Gold', nameAm: 'ወርቅ', nameOm: 'Gold', prize: '500K ETB', seats: 1200, icon: '🥇' },
      { id: 'platinum', name: 'Platinum', nameAm: 'ፕላቲኒየም', nameOm: 'Platinum', prize: '1M ETB', seats: 2400, icon: '💎' },
      { id: 'diamond', name: 'Diamond', nameAm: 'አልማዝ', nameOm: 'Diamond', prize: '2M ETB', seats: 2400, icon: '💠' },
      { id: 'royal', name: 'Royal', nameAm: 'ንጉሣዊ', nameOm: 'Royal', prize: '5M ETB', seats: 2400, icon: '👑' },
      { id: 'emperor', name: 'Emperor', nameAm: 'ንጉሠ ነገሥት', nameOm: 'Emperor', prize: '10M ETB', seats: 2400, icon: '🏆' }
    ]
  };

  // Context value
  const contextValue = {
    ...state,
    vipTiers,
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
    showPopup: (params) => {
      if (state.webApp) {
        state.webApp.showPopup(params);
      }
    },
    showScanQrPopup: (params) => {
      if (state.webApp) {
        state.webApp.showScanQrPopup(params);
      }
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
        
        {/* Telegram Badge */}
        {state.isInTelegram && (
          <div className="telegram-badge fixed bottom-20 right-4 bg-blue-500 text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-50 flex items-center gap-1.5">
            <span>📱</span>
            <span>Telegram</span>
          </div>
        )}
      </div>
    </TelegramContext.Provider>
  );
}
