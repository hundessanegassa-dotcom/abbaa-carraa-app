// components/Footer.js - COMPLETE WITH PARTNER PROGRAM (ONLY ONCE)
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Footer() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  const handleRoleSelection = (role) => {
    sessionStorage.removeItem('pendingRole');
    sessionStorage.removeItem('pendingPoolId');
    sessionStorage.setItem('pendingRole', role);
    router.push('/login');
  };

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4">
        
        {/* PARTNER PROGRAM SECTION - ONLY ONCE */}
        <div className="border-t border-gray-800 pt-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">ተባባሪ ፕሮግራም | Partner Program</h2>
            <p className="text-gray-300 text-sm md:text-base">Join our partner program and start earning commissions today!</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => handleRoleSelection('agent')} className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
              <span>🤝</span> ወኪል ይሁኑ | Become an Agent
            </button>
            <button onClick={() => handleRoleSelection('vendor')} className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
              <span>🏪</span> ነጋዴ ይሁኑ | Become a Vendor
            </button>
            <button onClick={() => handleRoleSelection('organization')} className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-full font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center gap-2">
              <span>🏢</span> ድርጅት ይሁኑ | Become an Organization
            </button>
          </div>
          <div className="mt-4 text-center text-xs text-gray-400">
            <p>✓ ምንም የቅድሚያ ክፍያ የለም | No upfront fees ✓ በእያንዳንዱ ስኬታማ የእጣ መደብ 10% ያግኙ | Earn 10% on every successful pool ✓ 24/7 ድጋፍ | 24/7 support</p>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 py-12">
          
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-xl">🎁</span>
              </div>
              <div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">Abbaa Carraa</h3>
                <p className="text-xs text-gray-500">Ethio</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">A community-driven prize and contribution platform</p>
            
            <div className="mt-4 bg-gradient-to-r from-red-900/40 to-pink-900/40 rounded-xl p-3 border border-red-800/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">💚</span>
                <div><p className="text-sm font-semibold text-red-300">2% for Health</p><p className="text-xs text-gray-400">Supporting kidney & heart disease</p></div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span>🔗</span> Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🏠</span> Home</Link></li>
              <li><Link href="/listings" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🎁</span> Browse Prizes</Link></li>
              <li><Link href="/winners" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🏆</span> Winners</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>ℹ️</span> About</Link></li>
              <li><Link href="/faq" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>❓</span> FAQ</Link></li>
            </ul>
          </div>

          {/* For Users */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span>👥</span> For Users</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/register" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>📝</span> Create Account</Link></li>
              <li><Link href="/login" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🔑</span> Login</Link></li>
              <li><Link href="/how-it-works" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🎯</span> How to Win</Link></li>
              <li><Link href="/become-agent" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🤝</span> Become Agent</Link></li>
              <li><Link href="/become-vendor" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🏪</span> Become Vendor</Link></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span>⚖️</span> Legal & Support</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>📜</span> Terms and Conditions</Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>🔒</span> Privacy Policy</Link></li>
              <li><Link href="/about#guarantee" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>💰</span> Cash Guarantee</Link></li>
              <li><Link href="/about#charity" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>❤️</span> Charity</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-green-400 transition flex items-center gap-2"><span>📍</span> Contact</Link></li>
            </ul>
          </div>

          {/* Contact & Payment */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span>📞</span> Contact</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="flex items-center gap-2"><span>📞</span> 0930330323</p>
              <p className="flex items-center gap-2"><span>📞</span> 0913277922</p>
              <p className="flex items-center gap-2 break-all"><span>✉️</span> hundessanegassa@gmail.com</p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-gray-800">
              <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center gap-1">🏦 Bank Transfer</h4>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-300 text-sm">Account: <span className="text-green-400">Abbaa Carraa</span></p>
                <p className="text-xs text-gray-500 mt-1">⏱️ Verification in 24h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Row */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span>📱 Telebirr</span>
            <span className="text-gray-600">•</span>
            <span>🏦 CBE Birr</span>
            <span className="text-gray-600">•</span>
            <span>💳 Bank Transfer</span>
            <span className="text-gray-600">•</span>
            <span>🏧 Cash at Agent</span>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-6 pt-6 text-center">
          <p className="text-gray-500 text-sm">© {currentYear} Abbaa Carraa Ethio. All rights reserved.</p>
          <p className="text-gray-600 text-xs mt-1">🇪🇹 Empowering Ethiopians to win amazing prizes</p>
          <p className="text-green-600 text-xs mt-1">💚 2% of all contributions support kidney & heart disease patients</p>
        </div>
      </div>
    </footer>
  );
}
