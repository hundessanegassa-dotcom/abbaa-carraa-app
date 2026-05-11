import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import LanguageToggle from './LanguageToggle';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userType, setUserType] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    getUser();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScroll = () => {
    setScrolled(window.scrollY > 20);
  };

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, user_type')
        .eq('id', user.id)
        .maybeSingle(); // Changed from .single() to .maybeSingle() to avoid errors
      setUserRole(profile?.role);
      setUserType(profile?.user_type);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success(t('common.logout_success'));
    router.push('/');
  }

  const getDashboardLink = () => {
    if (userType === 'agent') return '/agent/dashboard';
    if (userType === 'vendor') return '/vendor/dashboard';
    if (userType === 'organization') return '/organization/dashboard';
    if (userRole === 'admin') return '/admin/dashboard';
    return '/dashboard';
  };

  return (
    <>
      {/* Top Announcement Bar - NEW */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white text-center py-2 text-sm">
        <div className="container mx-auto px-4">
          <span>💚 2% of every contribution supports kidney & heart disease treatment</span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-md'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Enhanced */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                <span className="text-white text-xl">🎁</span>
              </div>
              <div>
                <span className="font-bold text-xl bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Abbaa Carraa</span>
                <span className="text-xs text-gray-400 block -mt-1">Win Amazing Prizes</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition"> {t('common.home')} </Link>
              <Link href="/listings" className="px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition"> {t('common.browse_prizes')} </Link>
              <Link href="/winners" className="px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition"> {t('common.winners')} </Link>
              <Link href="/about" className="px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition"> {t('common.about')} </Link>
              <Link href="/contact" className="px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition"> {t('common.contact')} </Link>
              <Link href="/faq" className="px-3 py-2 text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition"> {t('common.faq')} </Link>
              
              {/* Role-specific dashboard links */}
              {userRole === 'admin' && (
                <Link href="/admin/dashboard" className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"> 📊 Admin </Link>
              )}
              {userType === 'agent' && (
                <Link href="/agent/dashboard" className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"> 📊 Agent </Link>
              )}
              {userType === 'vendor' && (
                <Link href="/vendor/dashboard" className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"> 📊 Vendor </Link>
              )}
              {userType === 'organization' && (
                <Link href="/organization/dashboard" className="px-3 py-2 text-cyan-600 hover:bg-cyan-50 rounded-lg transition"> 📊 Organization </Link>
              )}
              
              {/* Become links for users */}
              {user && userType !== 'agent' && userType !== 'admin' && userType !== 'vendor' && userType !== 'organization' && (
                <Link href="/agent/register" className="px-3 py-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition"> 🤝 {t('common.become_agent')} </Link>
              )}
              {user && userType !== 'vendor' && userType !== 'agent' && userType !== 'admin' && userType !== 'organization' && (
                <Link href="/vendor/register" className="px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition"> 🏪 {t('common.become_vendor')} </Link>
              )}
              
              {/* Create Pool Button */}
              {user && (
                <Link href="/create-pool" className="ml-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-5 py-2 rounded-full font-semibold hover:shadow-lg transition transform hover:scale-105">
                  + {t('common.create_pool')}
                </Link>
              )}
            </div>
            
            {/* Right side icons */}
            <div className="flex items-center space-x-2">
              <NotificationBell />
              <LanguageToggle />
              
              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-full hover:bg-gray-200 transition">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden lg:inline text-sm font-medium text-gray-700 max-w-[100px] truncate">
                      {user.email?.split('@')[0]}
                    </span>
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-2">
                      <Link href={getDashboardLink()} className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-green-50 rounded-lg transition">
                        <span>📊</span> Dashboard
                      </Link>
                      <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-green-50 rounded-lg transition">
                        <span>👤</span> Profile
                      </Link>
                      <div className="border-t my-1"></div>
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition">
                        <span>🚪</span> {t('common.logout')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link href="/login" className="text-gray-600 hover:text-green-600 transition text-sm font-medium px-3 py-2"> {t('common.login')} </Link>
                  <Link href="/register" className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-5 py-2 rounded-full font-semibold hover:shadow-lg transition"> {t('common.register')} </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation - Enhanced */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2 animate-fadeIn">
              <Link href="/" className="block py-2 px-3 text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> 🏠 {t('common.home')} </Link>
              <Link href="/listings" className="block py-2 px-3 text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> 🎁 {t('common.browse_prizes')} </Link>
              <Link href="/winners" className="block py-2 px-3 text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> 🏆 {t('common.winners')} </Link>
              <Link href="/about" className="block py-2 px-3 text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> ℹ️ {t('common.about')} </Link>
              <Link href="/contact" className="block py-2 px-3 text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> 📞 {t('common.contact')} </Link>
              <Link href="/faq" className="block py-2 px-3 text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> ❓ {t('common.faq')} </Link>
              
              {user && (
                <>
                  <Link href={getDashboardLink()} className="block py-2 px-3 text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> 📊 Dashboard </Link>
                  <Link href="/create-pool" className="block py-2 px-3 text-center bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg font-semibold" onClick={() => setMobileMenuOpen(false)}> + {t('common.create_pool')} </Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 text-red-600 hover:bg-red-50 rounded-lg">
                    🚪 {t('common.logout')}
                  </button>
                </>
              )}
              
              {!user && (
                <div className="flex gap-2 pt-2">
                  <Link href="/login" className="flex-1 text-center border border-green-600 text-green-600 py-2 rounded-lg" onClick={() => setMobileMenuOpen(false)}> {t('common.login')} </Link>
                  <Link href="/register" className="flex-1 text-center bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 rounded-lg" onClick={() => setMobileMenuOpen(false)}> {t('common.register')} </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}
