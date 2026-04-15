import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      common: {
        welcome: "Welcome to Abbaa Carraa",
        tagline: "A community-driven prize platform",
        join: "Join Pool",
        login: "Login",
        register: "Register",
        logout: "Logout",
        dashboard: "Dashboard"
      },
      pools: {
        activePools: "Active Pools",
        targetAmount: "Target Amount"
      }
    }
  }
};

i18n.use(LanguageDetector).use(initReactI18next).init({
  resources,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;