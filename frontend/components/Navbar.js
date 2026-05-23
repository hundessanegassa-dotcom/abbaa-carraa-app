import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import LanguageToggle from './LanguageToggle';
import NotificationBell from './NotificationBell';
import { checkAdminStatus } from '../lib/adminCheck'; // NEW: Only addition

// Check if running on client side
const isClient = typeof window !== 'undefined';

export default function Navbar() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userType, setUserType] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hasAgentApplication, setHasAgentApplication] = useState(false);
  const [hasVendorApplication, setHasVendorApplication] = useState(false);
  const [hasOrgApplication, setHasOrgApplication] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // NEW: Admin state

  useEffect(() => {
    if (isClient) {
      getUser();
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleScroll = () => {
    setScrolled(window.scrollY > 20);
  };

  async function getUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, user_type')
          .eq('id', user.id)
          .maybeSingle();
        setUserRole(profile?.role || null);
        setUserType(profile?.user_type || null);
        
        // NEW: Check if user is admin
        const { isAdmin: adminStatus } = await checkAdminStatus();
        setIsAdmin(adminStatus);
        
        const { data: agentCheck } = await supabase
          .from('agents')
          .select('id, verified')
          .eq('user_id', user.id)
          .maybeSingle();
        setHasAgentApplication(!!agentCheck);
        
        const { data: vendorCheck } = await supabase
          .from('vendors')
          .select('id, verified')
          .eq('user_id', user.id)
          .maybeSingle();
        setHasVendorApplication(!!vendorCheck);
        
        const { data: orgCheck } = await supabase
          .from('organizations')
          .select('id, verified')
          .eq('user_id', user.id)
          .maybeSingle();
        setHasOrgApplication(!!orgCheck);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoading(true);
      
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setUserRole(null);
      setUserType(null);
      setIsAdmin(false);
      
      toast.success('Logged out successfully');
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
      setIsLoading(false);
    }
  };

  const getDashboardLink = () => {
    if (userType === 'agent') return '/agent/dashboard';
    if (userType === 'vendor') return '/vendor/dashboard';
    if (userType === 'organization') return '/organization/dashboard';
    if (userRole === 'admin') return '/admin/dashboard';
    return '/dashboard';
  };

  const getCreateAction = () => {
    if (!user) return null;
    if (userType === 'agent') return { text: 'Create Pool', link: '/create-pool', icon: '📦' };
    if (userType === 'vendor') return { text: 'List Product', link: '/vendor/listings/create', icon: '🏪' };
    if (userType === 'organization') return { text: 'Create Private Pool', link: '/create-pool?type=private', icon: '🏊' };
    if (userRole === 'admin') return { text: 'Create Pool (20%)', link: '/create-pool', icon: '👑' };
    return null;
  };

  const getBecomeLinks = () => {
    const links = [];
    if (!user) return links;
    const isIndividual = !userType || userType === 'individual';
    
    if (isIndividual && !hasAgentApplication) {
      links.push({ text: '🤝 Become Agent', link: '/become-agent', color: 'text-yellow-600' });
    }
    if (isIndividual && !hasVendorApplication) {
      links.push({ text: '🏪 Become Vendor', link: '/become-vendor', color: 'text-purple-600' });
    }
    if (isIndividual && !hasOrgApplication) {
      links.push({ text: '🏢 Become Organization', link: '/become-organization', color: 'text-cyan-600' });
    }
    return links;
  };

  const createAction = getCreateAction();
  const becomeLinks = getBecomeLinks();

  if (isLoading) {
    return <div className="bg-white shadow-md h-14 sm:h-16"></div>;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white text-center py-1.5 sm:py-2 text-[10px] sm:text-sm">
        <div className="container mx-auto px-2 sm:px-4">
          <span>💚 2% of every contribution supports kidney & heart disease treatment</span>
        </div>
      </div>

      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-white shadow-md'}`}>
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
              <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                <span className="text-white text-base sm:text-xl">🎁</span>
              </div>
              <div>
                <span className="font-bold text-sm sm:text-xl bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Abbaa Carraa
                </span>
                <span className="text-[8px] sm:text-[10px] text-gray-400 block -mt-0.5 sm:-mt-1">Ethio</span>
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-2 lg:px-3 py-2 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition"> 🏠 {t('common.home') || 'Home'} </Link>
              <Link href="/listings" className="px-2 lg:px-3 py-2 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition"> 🎁 Browse Prizes </Link>
              <Link href="/winners" className="px-2 lg:px-3 py-2 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition"> 🏆 Winners </Link>
              <Link href="/how-it-works" className="px-2 lg:px-3 py-2 text-sm text-gray-700 hover:text-green-600 hover:bg-green-50 rounded-lg transition"> 🎯 How It Works </Link>
              
              {/* NEW: Admin Panel Link - Only visible to admin users */}
              {isAdmin && (
                <Link href="/admin/dashboard" className="ml-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-red-700 transition flex items-center gap-1">
                  👑 Admin
                </Link>
              )}
              
              {user && createAction && (
                <Link href={createAction.link} className="ml-2 bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-1.5 rounded-full text-sm font-semibold hover:shadow-lg transition transform hover:scale-105 flex items-center gap-1">
                  <span>+</span> {createAction.text}
                </Link>
              )}
            </div>
            
            {/* Right side icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              <NotificationBell />
              <LanguageToggle />
              
              {user ? (
                <div className="relative group">
                  <button className="flex items-center gap-1 sm:gap-2 bg-gray-100 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-gray-200 transition">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="hidden lg:inline text-xs sm:text-sm font-medium text-gray-700 max-w-[80px] truncate capitalize">
                      {userType || 'User'}
                    </span>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-2">
                      <div className="px-3 py-2 border-b mb-1">
                        <p className="text-sm font-semibold text-gray-800 capitalize">{userType || 'Individual'}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      
                      {/* NEW: Admin quick links in dropdown */}
                      {isAdmin && (
                        <>
                          <Link href="/admin/dashboard" className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                            <span>👑</span> Admin Dashboard
                          </Link>
                          <Link href="/admin/bank-transfers" className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                            <span>🏦</span> Verify Payments
                          </Link>
                          <div className="border-t my-1"></div>
                        </>
                      )}
                      
                      <Link href={getDashboardLink()} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-lg transition">
                        <span>📊</span> Dashboard
                      </Link>
                      <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-lg transition">
                        <span>👤</span> Profile
                      </Link>
                      <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-lg transition">
                        <span>⚙️</span> Settings
                      </Link>
                      <Link href="/notifications" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-green-50 rounded-lg transition">
                        <span>🔔</span> Notifications
                      </Link>
                      
                      {becomeLinks.length > 0 && (
                        <>
                          <div className="border-t my-1"></div>
                          {becomeLinks.map((link, idx) => (
                            <Link key={idx} href={link.link} className={`flex items-center gap-2 px-3 py-2 text-sm ${link.color} hover:bg-gray-50 rounded-lg transition`}>
                              <span>{link.text.split(' ')[0]}</span> {link.text}
                            </Link>
                          ))}
                        </>
                      )}
                      
                      {createAction && (
                        <Link href={createAction.link} className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition mt-1 border-t pt-2">
                          <span>➕</span> {createAction.text}
                        </Link>
                      )}
                      
                      <div className="border-t my-1"></div>
                      <button onClick={handleLogout} className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                        <span>🚪</span> {t('common.logout') || 'Logout'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-1 sm:gap-2">
                  <Link href="/login" className="text-xs sm:text-sm text-gray-600 hover:text-green-600 transition px-2 py-1"> Login </Link>
                  <Link href="/register" className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold hover:shadow-lg transition"> Register </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-3 space-y-1 animate-fadeIn">
              <Link href="/" className="block py-2 px-3 text-sm text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> 🏠 Home </Link>
              <Link href="/listings" className="block py-2 px-3 text-sm text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> 🎁 Browse Prizes </Link>
              <Link href="/winners" className="block py-2 px-3 text-sm text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> 🏆 Winners </Link>
              <Link href="/how-it-works" className="block py-2 px-3 text-sm text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> 🎯 How It Works </Link>
              
              {/* NEW: Mobile Admin Link */}
              {isAdmin && (
                <Link href="/admin/dashboard" className="block py-2 px-3 text-sm bg-red-100 text-red-600 rounded-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  👑 Admin Panel
                </Link>
              )}
              
              {user && (
                <>
                  <Link href={getDashboardLink()} className="block py-2 px-3 text-sm text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> 📊 Dashboard </Link>
                  
                  {createAction && (
                    <Link href={createAction.link} className="block py-2 px-3 text-center bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg text-sm font-semibold mt-2" onClick={() => setMobileMenuOpen(false)}>
                      + {createAction.text}
                    </Link>
                  )}
                  
                  {becomeLinks.map((link, idx) => (
                    <Link key={idx} href={link.link} className={`block py-2 px-3 text-sm ${link.color} hover:bg-gray-50 rounded-lg`} onClick={() => setMobileMenuOpen(false)}>
                      {link.text}
                    </Link>
                  ))}
                  
                  <Link href="/profile" className="block py-2 px-3 text-sm text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> 👤 Profile </Link>
                  <Link href="/settings" className="block py-2 px-3 text-sm text-gray-700 hover:bg-green-50 rounded-lg" onClick={() => setMobileMenuOpen(false)}> ⚙️ Settings </Link>
                  
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block w-full text-left py-2 px-3 text-sm text-red-600 hover:bg-red-50 rounded-lg mt-1">
                    🚪 Logout
                  </button>
                </>
              )}
              
              {!user && (
                <div className="flex gap-2 pt-2">
                  <Link href="/login" className="flex-1 text-center border border-green-600 text-green-600 py-2 rounded-lg text-sm" onClick={() => setMobileMenuOpen(false)}> Login </Link>
                  <Link href="/register" className="flex-1 text-center bg-gradient-to-r from-green-500 to-teal-500 text-white py-2 rounded-lg text-sm font-semibold" onClick={() => setMobileMenuOpen(false)}> Register </Link>
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
