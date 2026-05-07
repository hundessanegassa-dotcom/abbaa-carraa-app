import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';

export default function DashboardLayout({ children, title, subtitle, icon, bgGradient, user, profile }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Browse Prizes', href: '/listings', icon: '🎁' },
    { name: 'My Profile', href: '/profile', icon: '👤' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${bgGradient || 'from-green-600 to-teal-500'} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{icon || '📊'}</span>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{title || 'Dashboard'}</h1>
                {subtitle && <p className="text-sm opacity-90 mt-1">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm">Welcome, {profile?.full_name || user?.email?.split('@')[0] || 'User'}</span>
                <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition">
                  Logout
                </button>
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden bg-white/20 p-2 rounded-lg">
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg">
          <div className="container mx-auto px-4 py-3 space-y-2">
            {navigation.map(item => (
              <Link key={item.name} href={item.href} className="block py-2 text-gray-700 hover:text-green-600">
                <span className="mr-2">{item.icon}</span> {item.name}
              </Link>
            ))}
            <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600">
              🚪 Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>

      {/* Footer - Charity Section */}
      <footer className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-3">
            <span className="text-2xl">💚</span>
            <p className="text-sm md:text-base">
              2% of every contribution supports Ethiopians fighting <strong>kidney disease</strong> and <strong>heart disease</strong>
            </p>
            <span className="text-2xl">❤️</span>
          </div>
          <p className="text-xs opacity-75 mt-2">Every contribution saves a life</p>
        </div>
      </footer>
    </div>
  );
}
