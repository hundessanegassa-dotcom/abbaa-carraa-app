import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function CashEquivalentBanner() {
  const { t } = useTranslation();

  // Fallback text in case translations are missing
  const title = t('common.cash_equivalent_banner_title', '100% Cash Equivalent Guarantee');
  const text = t('common.cash_equivalent_banner_text', 'All prizes are backed by cash equivalent value.');
  const button = t('common.cash_equivalent_banner_button', 'Learn More');

  return (
    <div className="container mx-auto px-4 pt-2 pb-1">
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white py-2 px-4 rounded-md shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-sm">💰</span>
            <span className="font-semibold text-xs sm:text-sm">
              {title}
            </span>
          </div>
          <p className="text-xs text-gray-200 text-center sm:text-left">
            {text}
          </p>
          <Link href="/about#guarantee">
            <button className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-full text-xs font-medium transition whitespace-nowrap">
              {button} →
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
