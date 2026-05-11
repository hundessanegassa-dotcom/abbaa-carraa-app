import Link from 'next/link';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Brand Section - Enhanced */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🎁</span>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">Abbaa Carraa</h3>
                <p className="text-xs text-gray-500">Win Amazing Prizes</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">{t('common.tagline')}</p>
            
            {/* Charity Badge */}
            <div className="mt-4 bg-gradient-to-r from-red-900/40 to-pink-900/40 rounded-xl p-3 border border-red-800/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">💚</span>
                <div>
                  <p className="text-sm font-semibold text-red-300">2% for Health</p>
                  <p className="text-xs text-gray-400">Supporting kidney & heart disease treatment</p>
                </div>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex gap-3 mt-4">
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition text-gray-400 hover:text-white">📘</a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition text-gray-400 hover:text-white">📸</a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition text-gray-400 hover:text-white">🐦</a>
              <a href="#" className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center hover:bg-green-600 transition text-gray-400 hover:text-white">💬</a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🔗</span> {t('footer.quick_links')}
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🏠</span> {t('common.home')}</Link></li>
              <li><Link href="/listings" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🎁</span> {t('common.browse_prizes')}</Link></li>
              <li><Link href="/winners" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🏆</span> {t('common.winners')}</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>ℹ️</span> {t('common.about')}</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>📞</span> {t('common.contact')}</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>❓</span> {t('common.faq')}</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>👥</span> For Users
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>📝</span> Create Account</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🔑</span> Login</Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🎯</span> How to Win</Link></li>
              <li><Link href="/become-agent" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🤝</span> Become an Agent</Link></li>
              <li><Link href="/become-vendor" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🏪</span> Become a Vendor</Link></li>
            </ul>
          </div>

          {/* Support / Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚖️</span> Legal & Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>📜</span> {t('footer.terms')}</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🔒</span> {t('footer.privacy')}</Link></li>
              <li><Link href="/about#guarantee" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>💰</span> Cash Equivalent Guarantee</Link></li>
              <li><Link href="/about#charity" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>❤️</span> Charity Program</Link></li>
              <li><Link href="/disputes" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>⚖️</span> Dispute Resolution</Link></li>
            </ul>
          </div>

          {/* Contact & Bank Transfer */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📍</span> Contact & Payment
            </h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="flex items-center gap-2"><span>👤</span> Negassa Hundessa</p>
              <p className="flex items-center gap-2"><span>📍</span> Ambo, Ethiopia</p>
              <p className="flex items-center gap-2"><span>📞</span> 0930330323</p>
              <p className="flex items-center gap-2 break-all"><span>✉️</span> hundessanegassa@gmail.com</p>
            </div>
            
            {/* Bank Transfer Details - Enhanced */}
            <div className="mt-4 pt-3 border-t border-gray-800">
              <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1">
                🏦 Bank Transfer <span className="text-xs text-gray-500">(CBE)</span>
              </h4>
              <div className="bg-gray-800/50 rounded-lg p-3 space-y-1">
                <p className="text-gray-300 text-xs">Account: <span className="text-green-400">Abbaa Carraa PLC</span></p>
                <p className="text-gray-300 text-xs">Account No: <span className="font-mono">1000XXXXXXX</span></p>
                <p className="text-gray-300 text-xs">Reference: <span className="text-yellow-400">Your Email Address</span></p>
                <p className="text-xs text-gray-500 mt-1">⏱️ Verification within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Row - Enhanced */}
        <div className="border-t border-gray-800 mt-8 pt-6">
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <span className="text-gray-400 text-sm flex items-center gap-1">📱 Telebirr</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 text-sm flex items-center gap-1">🏦 CBE Birr</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 text-sm flex items-center gap-1">💳 Bank Transfer</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 text-sm flex items-center gap-1">🏧 Cash at Agent</span>
            <span className="text-gray-500">•</span>
            <span className="text-gray-400 text-sm flex items-center gap-1">📱 Chapa Pay</span>
          </div>
        </div>

        {/* Copyright - Enhanced */}
        <div className="border-t border-gray-800 mt-6 pt-6 text-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} Abbaa Carraa. {t('footer.rights')}
          </p>
          <p className="text-gray-600 text-xs mt-1">
            🇪🇹 Empowering Ethiopians to win amazing prizes while saving lives
          </p>
        </div>
      </div>
    </footer>
  );
}
