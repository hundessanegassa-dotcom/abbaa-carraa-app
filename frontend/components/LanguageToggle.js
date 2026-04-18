import { useTranslation } from 'react-i18next';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧', nativeName: 'English' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹', nativeName: 'አማርኛ' },
    { code: 'om', name: 'Oromo', flag: '🇪🇹', nativeName: 'Oromoo' },
    { code: 'ti', name: 'Tigrigna', flag: '🇪🇹', nativeName: 'ትግርኛ' },
    { code: 'so', name: 'Somali', flag: '🇸🇴', nativeName: 'Soomaali' }
  ];

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col space-y-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`px-3 py-1.5 rounded transition text-sm whitespace-nowrap ${
              i18n.language === lang.code
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={lang.name}
          >
            <span className="mr-2">{lang.flag}</span>
            <span className="hidden md:inline">{lang.nativeName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
