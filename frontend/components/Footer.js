import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-3 sm:px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-8">
          
          {/* Brand Section - Mobile Responsive */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-base sm:text-xl">🎁</span>
              </div>
              <div>
                <h3 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                  Abbaa Carraa
                </h3>
                <p className="text-[9px] sm:text-xs text-gray-500">Ethio</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{t('common.tagline')}</p>
            
            {/* Charity Badge */}
            <div className="mt-3 sm:mt-4 bg-gradient-to-r from-red-900/40 to-pink-900/40 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-red-800/30">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-xl">💚</span>
                <div>
                  <p className="text-[10px] sm:text-sm font-semibold text-red-300">2% for Health</p>
                  <p className="text-[8px] sm:text-xs text-gray-400">Supporting kidney & heart disease</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center gap-1 sm:gap-2">
              <span className="text-sm">🔗</span> {t('footer.quick_links')}
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>🏠</span> {t('common.home')}</Link></li>
              <li><Link href="/listings" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>🎁</span> {t('common.browse_prizes')}</Link></li>
              <li><Link href="/winners" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>🏆</span> {t('common.winners')}</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>ℹ️</span> {t('common.about')}</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>❓</span> {t('common.faq')}</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center gap-1 sm:gap-2">
              <span className="text-sm">👥</span> For Users
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li><Link href="/register" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>📝</span> Create Account</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>🔑</span> Login</Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>🎯</span> How to Win</Link></li>
              <li><Link href="/become-agent" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>🤝</span> Become Agent</Link></li>
              <li><Link href="/become-vendor" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>🏪</span> Become Vendor</Link></li>
            </ul>
          </div>

          {/* Support / Legal */}
          <div>
            <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center gap-1 sm:gap-2">
              <span className="text-sm">⚖️</span> Legal & Support
            </h3>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li><Link href="/terms" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>📜</span> {t('footer.terms')}</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>🔒</span> {t('footer.privacy')}</Link></li>
              <li><Link href="/about#guarantee" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>💰</span> Cash Guarantee</Link></li>
              <li><Link href="/about#charity" className="text-gray-400 hover:text-green-400 transition flex items-center gap-1 sm:gap-2"><span>❤️</span> Charity</Link></li>
            </ul>
          </div>

          {/* Contact & Payment */}
          <div>
            <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center gap-1 sm:gap-2">
              <span className="text-sm">📍</span> Contact
            </h3>
            <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-400">
              <p className="flex items-center gap-1 sm:gap-2"><span>📞</span> 0930330323</p>
              <p className="flex items-center gap-1 sm:gap-2 break-all"><span>✉️</span> hundessanegassa@gmail.com</p>
            </div>
            
            {/* Bank Transfer Details */}
            <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-gray-800">
              <h4 className="text-[10px] sm:text-sm font-semibold text-green-400 mb-1 sm:mb-2 flex items-center gap-1">
                🏦 Bank Transfer
              </h4>
              <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 space-y-0.5 sm:space-y-1">
                <p className="text-gray-300 text-[9px] sm:text-xs">Account: <span className="text-green-400">Abbaa Carraa</span></p>
                <p className="text-xs text-gray-500">⏱️ Verification in 24h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Row */}
        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-4 sm:pt-6">
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <span className="text-gray-400 text-[10px] sm:text-sm">📱 Telebirr</span>
            <span className="text-gray-500 text-[8px] sm:text-xs">•</span>
            <span className="text-gray-400 text-[10px] sm:text-sm">🏦 CBE Birr</span>
            <span className="text-gray-500 text-[8px] sm:text-xs">•</span>
            <span className="text-gray-400 text-[10px] sm:text-sm">💳 Bank Transfer</span>
            <span className="text-gray-500 text-[8px] sm:text-xs">•</span>
            <span className="text-gray-400 text-[10px] sm:text-sm">🏧 Cash at Agent</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-4 sm:mt-6 pt-4 sm:pt-6 text-center">
          <p className="text-gray-500 text-[10px] sm:text-sm">
            © {currentYear} Abbaa Carraa Ethio. {t('footer.rights')}
          </p>
          <p className="text-gray-600 text-[8px] sm:text-xs mt-1">
            🇪🇹 Empowering Ethiopians to win amazing prizes
          </p>
        </div>
      </div>
    </footer>
  );
}
