import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { t } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userType, setUserType] = useState(null);

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
    toast.success('Logged out successfully');
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
            <Link href="/" className="text-gray-700 hover:text-green-600 transition">
              {t('common.home')}
            </Link>
            <Link href="/listings" className="text-gray-700 hover:text-green-600 transition">
              {t('common.browse_prizes')}
            </Link>
            <Link href="/winners" className="text-gray-700 hover:text-green-600 transition">
              {t('common.winners')}
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-green-600 transition">
              {t('common.about')}
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-green-600 transition">
              {t('common.contact')}
            </Link>
            <Link href="/faq" className="text-gray-700 hover:text-green-600 transition">
              {t('common.faq')}
            </Link>
            
            {/* Admin Analytics Link */}
            {userRole === 'admin' && (
              <Link href="/admin/analytics" className="text-purple-600 hover:text-purple-700 transition">
                Analytics
              </Link>
            )}
            
            {user && (
              <Link href="/dashboard" className="text-gray-700 hover:text-green-600 transition">
                {t('common.dashboard')}
              </Link>
            )}
            
            {/* Agent Dashboard Link */}
            {userType === 'agent' && (
              <Link href="/agent/dashboard" className="text-blue-600 hover:text-blue-700 transition">
                {t('agent.agent_dashboard')}
              </Link>
            )}
            
            {/* Become Agent Link */}
            {user && userType !== 'agent' && userType !== 'admin' && userType !== 'vendor' && userType !== 'organization' && (
              <Link href="/agent/register" className="text-yellow-600 hover:text-yellow-700 transition">
                {t('common.become_agent')}
              </Link>
            )}
            
            {/* Become Vendor Link */}
            {user && userType !== 'vendor' && userType !== 'agent' && userType !== 'admin' && userType !== 'organization' && (
              <Link href="/vendor/register" className="text-orange-600 hover:text-orange-700 transition">
                {t('common.become_vendor')}
              </Link>
            )}
            
            {/* Create Pool Link */}
            {user && (
              <Link href="/create-pool" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                {t('common.create_pool')}
              </Link>
            )}
          </div>
          
          {/* Auth Buttons */}
          <div className="flex space-x-4">
            {user ? (
              <button onClick={handleLogout} className="text-red-600 hover:text-red-700 transition">
                {t('common.logout')}
              </button>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-green-600 transition">
                  {t('common.login')}
                </Link>
                <Link href="/register" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                  {t('common.register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
