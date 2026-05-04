import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <h3 className="text-xl font-bold mb-3 text-green-400">Abbaa Carraa</h3>
            <p className="text-gray-400 text-sm">{t('common.tagline')}</p>
            <div className="mt-3 bg-red-900/30 rounded-lg p-2 text-center">
              <p className="text-xs text-red-300">
                ❤️ 2% of income supports kidney & heart disease patients
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('footer.quick_links')}</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-green-400">{t('common.home')}</Link></li>
              <li><Link href="/listings" className="text-gray-400 hover:text-green-400">{t('common.browse_prizes')}</Link></li>
              <li><Link href="/winners" className="text-gray-400 hover:text-green-400">{t('common.winners')}</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-green-400">{t('common.about')}</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-green-400">{t('common.contact')}</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-green-400">{t('common.faq')}</Link></li>
            </ul>
          </div>

          {/* Support / Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('footer.support')}</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/terms" className="text-gray-400 hover:text-green-400">{t('footer.terms')}</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-green-400">{t('footer.privacy')}</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-green-400">{t('footer.contact_us')}</Link></li>
              <li><Link href="/about#guarantee" className="text-gray-400 hover:text-green-400">💰 Cash Equivalent Guarantee</Link></li>
              <li><Link href="/about#charity" className="text-gray-400 hover:text-green-400">❤️ Charity Program</Link></li>
            </ul>
          </div>

          {/* Contact & Bank Transfer */}
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('footer.contact_us')}</h3>
            <p className="text-gray-400 text-sm">Negassa Hundessa</p>
            <p className="text-gray-400 text-sm">📍 Ambo, Ethiopia</p>
            <p className="text-gray-400 text-sm">📞 0930330323</p>
            <p className="text-gray-400 text-sm break-all">✉️ hundessanegassa@gmail.com</p>
            
            {/* Bank Transfer Details */}
            <div className="mt-4 pt-3 border-t border-gray-800">
              <h4 className="text-sm font-semibold text-green-400 mb-2">🏦 Bank Transfer</h4>
              <p className="text-gray-400 text-xs">CBE - Abbaa Carraa PLC</p>
              <p className="text-gray-400 text-xs">Acc: 1000XXXXXXX</p>
              <p className="text-gray-400 text-xs">Ref: Use your email</p>
              <p className="text-xs text-gray-500 mt-1">⏱️ Verification within 24h</p>
            </div>
          </div>
        </div>

        {/* Payment Methods Row */}
        <div className="border-t border-gray-800 mt-6 pt-4">
          <div className="flex flex-wrap justify-center gap-6">
            <span className="text-gray-400 text-sm">📱 Telebirr</span>
            <span className="text-gray-400 text-sm">🏦 CBE Birr</span>
            <span className="text-gray-400 text-sm">💳 Bank Transfer</span>
            <span className="text-gray-400 text-sm">🏧 Cash at Agent</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-4 pt-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Abbaa Carraa. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
