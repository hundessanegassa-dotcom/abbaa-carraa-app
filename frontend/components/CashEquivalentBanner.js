import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function CashEquivalentBanner() {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-gradient-to-r from-gray-700 to-gray-900 text-white shadow-md">
      <div className="container mx-auto px-4 py-2 sm:py-2.5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">💰</span>
            <span className="font-semibold">
              {t('common.cash_equivalent_banner_title')}
            </span>
          </div>
          <p className="text-gray-200 text-center sm:text-left text-xs sm:text-sm">
            {t('common.cash_equivalent_banner_text')}
          </p>
          <Link href="/about#guarantee">
            <button className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full text-xs font-medium transition whitespace-nowrap">
              {t('common.cash_equivalent_banner_button')} →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
