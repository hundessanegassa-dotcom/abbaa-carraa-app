import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'am', name: 'አማርኛ', flag: '🇪🇹' },
    { code: 'om', name: 'Oromoo', flag: '🇪🇹' },
  ];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-1 bg-white rounded-lg shadow-lg p-1">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`px-2 py-1 rounded text-xs transition ${
            i18n.language === lang.code
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title={lang.name}
        >
          <span>{lang.flag}</span>
          <span className="ml-1 hidden md:inline">{lang.code.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );
}
