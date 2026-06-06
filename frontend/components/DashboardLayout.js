// components/DashboardLayout.js
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import TopCitySelector from './TopCitySelector';

export default function DashboardLayout({ children, title, subtitle, icon, bgGradient, user, profile }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [agentData, setAgentData] = useState(null);

  useEffect(() => {
    checkIfAgent();
  }, [user]);

  const checkIfAgent = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_approved', true)
      .single();
    
    if (data && !error) {
      setIsAgent(true);
      setAgentData(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Safe access with fallbacks
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitial = userName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar with Logo and City Selector */}
      <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl group-hover:scale-110 transition-transform">🎫</span>
              <div>
                <span className="font-bold text-white text-lg">Merkato VIP</span>
                <span className="text-xs text-gray-400 ml-2 hidden sm:inline">| Ethiopia's Premier Event Hub</span>
              </div>
            </Link>

            {/* Right side: City Selector + User Menu */}
            <div className="flex items-center gap-3">
              {/* City Selector */}
              <TopCitySelector />
              
              {/* User Menu (Desktop) */}
              <div className="hidden md:flex items-center gap-3">
                {isAgent && (
                  <Link href="/agent/dashboard" className="text-sm bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 px-3 py-1.5 rounded-full transition flex items-center gap-1">
                    <span>🤝</span> Agent
                  </Link>
                )}
                <span className="text-sm text-gray-300">Welcome, {userName}</span>
                <button onClick={handleLogout} className="bg-red-600/20 hover:bg-red-600/30 text-white px-4 py-1.5 rounded-full text-sm transition">
                  Logout
                </button>
              </div>
              
              {/* Mobile menu button */}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden bg-gray-800 p-2 rounded-lg text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Original Dashboard Header */}
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
            
            {/* Agent Badge (Mobile) */}
            {isAgent && (
              <Link href="/agent/dashboard" className="md:hidden bg-yellow-600/30 text-yellow-200 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                <span>🤝</span> Agent Portal
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg p-4 space-y-2">
          <div className="pb-2 border-b border-gray-200 mb-2">
            <p className="text-sm text-gray-600">Welcome, <span className="font-semibold">{userName}</span></p>
          </div>
          <Link href="/dashboard" className="block py-2 text-gray-700">📊 Dashboard</Link>
          <Link href="/listings" className="block py-2 text-gray-700">🎁 Browse Prizes</Link>
          <Link href="/profile" className="block py-2 text-gray-700">👤 Profile</Link>
          <Link href="/merkato-vip" className="block py-2 text-gray-700">🏪 Merkato VIP</Link>
          <Link href="/cities/addis-ababa" className="block py-2 text-gray-700">🏙️ City VIP</Link>
          {isAgent && (
            <Link href="/agent/dashboard" className="block py-2 text-yellow-600">🤝 Agent Dashboard</Link>
          )}
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
