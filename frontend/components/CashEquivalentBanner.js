import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function CashEquivalentBanner() {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-3 px-4 rounded-lg mb-4">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span className="font-semibold text-sm sm:text-base">
            {t('common.cash_equivalent_banner_title')}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-blue-100 text-center sm:text-left">
          {t('common.cash_equivalent_banner_text')}
        </p>
        <Link href="/about#guarantee">
          <button className="bg-white text-blue-700 px-3 py-1 rounded-full text-xs font-semibold hover:bg-gray-100 transition">
            {t('common.cash_equivalent_banner_button')} →
          </button>
        </Link>
      </div>
    </div>
  );
}
