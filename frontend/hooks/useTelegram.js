// hooks/useTelegram.js
import { useContext, createContext, useState, useEffect } from 'react';

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
