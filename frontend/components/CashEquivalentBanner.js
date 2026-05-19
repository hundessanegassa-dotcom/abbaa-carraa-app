import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function CashEquivalentBanner() {
  const { t } = useTranslation();

  return (
    <div className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white py-2">
      <div className="container mx-auto px-4 text-center">
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span>💰</span>
          <span className="font-medium">
            {t('common.cash_equivalent_banner_title') || '100% Cash Equivalent Guarantee'}
          </span>
          <Link href="/about#guarantee" className="text-yellow-300 hover:text-yellow-200 transition">
            {t('common.learn_more') || 'Learn More'} →
          </Link>
        </div>
      </div>
    </div>
  );
}
