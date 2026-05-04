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

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, user_type')
        .eq('id', user.id)
        .single();
      setUserRole(profile?.role);
      setUserType(profile?.user_type);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success(t('common.logout_success'));
    router.push('/');
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-green-600">
            Abbaa Carraa
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-green-600 transition"> {t('common.home')} </Link>
            <Link href="/listings" className="text-gray-700 hover:text-green-600 transition"> {t('common.browse_prizes')} </Link>
            <Link href="/winners" className="text-gray-700 hover:text-green-600 transition"> {t('common.winners')} </Link>
            <Link href="/about" className="text-gray-700 hover:text-green-600 transition"> {t('common.about')} </Link>
            <Link href="/contact" className="text-gray-700 hover:text-green-600 transition"> {t('common.contact')} </Link>
            <Link href="/faq" className="text-gray-700 hover:text-green-600 transition"> {t('common.faq')} </Link>
            
            {userRole === 'admin' && (
              <Link href="/admin/analytics" className="text-purple-600 hover:text-purple-700 transition"> {t('common.dashboard')} </Link>
            )}
            {user && <Link href="/dashboard" className="text-gray-700 hover:text-green-600 transition"> {t('common.dashboard')} </Link>}
            {userType === 'agent' && <Link href="/agent/dashboard" className="text-blue-600 hover:text-blue-700 transition"> {t('agent.agent_dashboard')} </Link>}
            
            {user && userType !== 'agent' && userType !== 'admin' && userType !== 'vendor' && userType !== 'organization' && (
              <Link href="/agent/register" className="text-yellow-600 hover:text-yellow-700 transition"> {t('common.become_agent')} </Link>
            )}
            {user && userType !== 'vendor' && userType !== 'agent' && userType !== 'admin' && userType !== 'organization' && (
              <Link href="/vendor/register" className="text-orange-600 hover:text-orange-700 transition"> {t('common.become_vendor')} </Link>
            )}
            {user && <Link href="/create-pool" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"> {t('common.create_pool')} </Link>}
          </div>
          
          {/* Right side icons */}
          <div className="flex items-center space-x-3">
            <NotificationBell />
            <LanguageToggle />
            
            {user ? (
              <button onClick={handleLogout} className="text-red-600 hover:text-red-700 transition text-sm font-medium"> {t('common.logout')} </button>
            ) : (
              <div className="flex space-x-2">
                <Link href="/login" className="text-gray-700 hover:text-green-600 transition text-sm font-medium"> {t('common.login')} </Link>
                <Link href="/register" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition text-sm"> {t('common.register')} </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
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

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block py-2 text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}> {t('common.home')} </Link>
            <Link href="/listings" className="block py-2 text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}> {t('common.browse_prizes')} </Link>
            <Link href="/winners" className="block py-2 text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}> {t('common.winners')} </Link>
            <Link href="/about" className="block py-2 text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}> {t('common.about')} </Link>
            <Link href="/contact" className="block py-2 text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}> {t('common.contact')} </Link>
            <Link href="/faq" className="block py-2 text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}> {t('common.faq')} </Link>
            {user && <Link href="/dashboard" className="block py-2 text-gray-700 hover:text-green-600" onClick={() => setMobileMenuOpen(false)}> {t('common.dashboard')} </Link>}
            {user && <Link href="/create-pool" className="block py-2 bg-green-600 text-white text-center rounded-lg hover:bg-green-700" onClick={() => setMobileMenuOpen(false)}> {t('common.create_pool')} </Link>}
            {!user && (
              <div className="flex gap-2 pt-2">
                <Link href="/login" className="flex-1 text-center border border-green-600 text-green-600 py-2 rounded-lg" onClick={() => setMobileMenuOpen(false)}> {t('common.login')} </Link>
                <Link href="/register" className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg" onClick={() => setMobileMenuOpen(false)}> {t('common.register')} </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
