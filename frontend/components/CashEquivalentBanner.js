import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function CashEquivalentBanner() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 mt-1 sm:mt-2">
      <div className="bg-gradient-to-r from-gray-600 to-gray-800 text-white py-1.5 px-3 rounded-md shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">💰</span>
            <span className="font-semibold text-xs">
              {t('common.cash_equivalent_banner_title')}
            </span>
          </div>
          <p className="text-xs text-gray-200 text-center sm:text-left">
            {t('common.cash_equivalent_banner_text')}
          </p>
          <Link href="/about#guarantee">
            <button className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full text-xs font-medium transition whitespace-nowrap">
              {t('common.cash_equivalent_banner_button')} →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
