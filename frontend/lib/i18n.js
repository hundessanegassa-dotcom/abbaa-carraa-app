import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Use require for JSON files (works better in some Next.js versions)
const resources = {
  en: { translation: require('../locales/en.json') },
  am: { translation: require('../locales/am.json') },
  om: { translation: require('../locales/om.json') },
  ti: { translation: require('../locales/ti.json') },
  so: { translation: require('../locales/so.json') },
  aa: { translation: require('../locales/aa.json') },
  wal: { translation: require('../locales/wal.json') },
  hdy: { translation: require('../locales/hdy.json') },
  sid: { translation: require('../locales/sid.json') }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    react: { useSuspense: false }
  });

export default i18n;
