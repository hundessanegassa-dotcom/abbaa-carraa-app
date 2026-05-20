import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import MobileMenuSheet from './MobileMenuSheet';
import { supabase } from '../lib/supabase';

export default function MobileBottomNav() {
  const router = useRouter();
  const [showMenu, setShowMenu] = useState(false);
  const [dashboardPath, setDashboardPath] = useState('/dashboard');

  useEffect(() => {
    const getRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        const role = profile?.role || 'individual';
        const paths = {
          agent: '/agent/dashboard',
          vendor: '/vendor/dashboard',
          organization: '/organization/dashboard',
          admin: '/admin/dashboard',
          individual: '/dashboard'
        };
        setDashboardPath(paths[role] || '/dashboard');
      }
    };
    getRole();
  }, []);

  const navItems = [
    { name: 'Home', icon: '🏠', path: '/' },
    { name: 'Pools', icon: '🎁', path: '/listings' },
    { name: 'Winners', icon: '🏆', path: '/winners' },
    { name: 'Profile', icon: '👤', path: dashboardPath },
  ];

  const isActive = (path) => {
    if (path === '/' && router.pathname === '/') return true;
    if (path !== '/' && router.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-2 z-50 shadow-lg pb-safe">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.path}
            className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px] ${
              isActive(item.path)
                ? 'text-green-600 bg-green-50'
                : 'text-gray-500 hover:text-green-500'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs mt-0.5 font-medium">{item.name}</span>
          </Link>
        ))}
        
        <button
          onClick={() => setShowMenu(true)}
          className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px] ${
            showMenu ? 'text-green-600 bg-green-50' : 'text-gray-500'
          }`}
        >
          <span className="text-2xl">☰</span>
          <span className="text-xs mt-0.5 font-medium">Menu</span>
        </button>
      </div>

      <MobileMenuSheet isOpen={showMenu} onClose={() => setShowMenu(false)} />
    </>
  );
}
