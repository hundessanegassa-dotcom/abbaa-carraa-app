import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function CashEquivalentBanner() {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-3 py-1.5">
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm">
          <span className="text-sm sm:text-base">💰</span>
          <span className="font-medium">
            {t('common.cash_equivalent_banner_title')}
          </span>
          <span className="hidden sm:inline text-gray-400">•</span>
          {/* Updated link to go to /about#guarantee section */}
          <Link href="/about#guarantee" className="text-yellow-300 hover:text-yellow-200 transition">
            {t('common.cash_equivalent_banner_button')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
