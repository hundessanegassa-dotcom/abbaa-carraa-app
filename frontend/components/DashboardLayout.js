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

  // Safe access with fallbacks
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitial = userName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${bgGradient || 'from-green-600 to-teal-500'} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">{icon || '📊'}</span>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{title || 'Dashboard'}</h1>
                {subtitle && <p className="text-xs sm:text-sm opacity-90 mt-0.5 sm:mt-1">{subtitle}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden md:inline text-sm">Welcome, {userName}</span>
              <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm transition">
                Logout
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden bg-white/20 p-1.5 sm:p-2 rounded-lg">
                ☰
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg p-4 space-y-2">
          <Link href="/dashboard" className="block py-2 text-gray-700">📊 Dashboard</Link>
          <Link href="/listings" className="block py-2 text-gray-700">🎁 Browse Prizes</Link>
          <Link href="/profile" className="block py-2 text-gray-700">👤 Profile</Link>
          <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600">🚪 Logout</button>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {children}
      </div>

      {/* Footer - Charity Section */}
      <footer className="bg-gradient-to-r from-red-600 to-pink-600 text-white py-4 sm:py-6 mt-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">💚</span>
            <p className="text-xs sm:text-sm md:text-base">
              2% of every contribution supports Ethiopians fighting <strong>kidney disease</strong> and <strong>heart disease</strong>
            </p>
            <span className="text-xl sm:text-2xl">❤️</span>
          </div>
          <p className="text-[10px] sm:text-xs opacity-75 mt-2">Every contribution saves a life</p>
        </div>
      </footer>
    </div>
  );
}
