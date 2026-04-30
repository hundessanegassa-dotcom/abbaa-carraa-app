import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Use require instead of import for more reliable JSON parsing
const en = require('../locales/en.json');
const am = require('../locales/am.json');
const om = require('../locales/om.json');
const ti = require('../locales/ti.json');
const so = require('../locales/so.json');
const aa = require('../locales/aa.json');
const wal = require('../locales/wal.json');
const hdy = require('../locales/hdy.json');
const sid = require('../locales/sid.json');

const resources = {
  en: { translation: en },
  am: { translation: am },
  om: { translation: om },
  ti: { translation: ti },
  so: { translation: so },
  aa: { translation: aa },
  wal: { translation: wal },
  hdy: { translation: hdy },
  sid: { translation: sid }
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
      order: ['localStorage', 'cookie', 'navigator'],
      caches: ['localStorage']
    },
    react: { useSuspense: false }
  });

export default i18n;
