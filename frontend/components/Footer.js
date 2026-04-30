import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-gray-900 text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-3 text-green-400">Abbaa Carraa</h3>
            <p className="text-gray-400 text-sm">{t('common.tagline')}</p>
          </div>
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
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('footer.support')}</h3>
            <ul className="space-y-1 text-sm">
              <li><Link href="/terms" className="text-gray-400 hover:text-green-400">{t('footer.terms')}</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-green-400">{t('footer.privacy')}</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-green-400">{t('footer.contact_us')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-3">{t('footer.contact_us')}</h3>
            <p className="text-gray-400 text-sm">Negassa Hundessa</p>
            <p className="text-gray-400 text-sm">📍 Ambo, Ethiopia</p>
            <p className="text-gray-400 text-sm">📞 0930330323</p>
            <p className="text-gray-400 text-sm break-all">✉️ hundessanegassa@gmail.com</p>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-6 pt-4 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Abbaa Carraa. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}
