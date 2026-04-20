import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en.json';
import am from '../locales/am.json';
import ti from '../locales/ti.json';
import so from '../locales/so.json';
import aa from '../locales/aa.json';
import wal from '../locales/wal.json';
import hdy from '../locales/hdy.json';
import sid from '../locales/sid.json';

const resources = {
  en: { translation: en },
  am: { translation: am },
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
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    }
  });

export default i18n;
