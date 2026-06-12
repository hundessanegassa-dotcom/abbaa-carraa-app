// frontend/components/BankingBottomNav.js - WITH SCROLL SUPPORT
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function BankingBottomNav() {
  const router = useRouter();
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

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const navItems = [
    { name: 'Home', icon: '🏠', action: () => scrollToSection('hero') },
    { name: 'Merkato', icon: '🏪', action: () => scrollToSection('merkato-vip') },
    { name: 'City VIP', icon: '🏙️', action: () => scrollToSection('city-vip') },
    { name: 'Pools', icon: '🎁', action: () => scrollToSection('regular-pools') },
    { name: 'Profile', icon: '👤', path: dashboardPath },
  ];

  const isActive = (item) => {
    if (item.path) {
      if (item.path === '/' && router.pathname === '/') return true;
      if (item.path !== '/' && router.pathname.startsWith(item.path)) return true;
    }
    return false;
  };

  const handleNavClick = (item) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      router.push(item.path);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 px-2 z-50 shadow-lg pb-safe">
      {navItems.map((item) => (
        <button
          key={item.name}
          onClick={() => handleNavClick(item)}
          className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 min-w-[60px] ${
            isActive(item)
              ? 'text-emerald-600 bg-emerald-50'
              : 'text-gray-500 hover:text-emerald-500'
          }`}
        >
          <span className="text-2xl">{item.icon}</span>
          <span className="text-xs mt-0.5 font-medium">{item.name}</span>
        </button>
      ))}
    </div>
  );
}
