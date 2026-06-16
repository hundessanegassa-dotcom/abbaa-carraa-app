// components/DashboardLayout.js - Updated with 3D Support, Language Toggle & All Features
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import TopCitySelector from './TopCitySelector';
import NotificationCenter from './NotificationCenter';
import LoadingSpinner from './LoadingSpinner';

export default function DashboardLayout({ 
  children, 
  title, 
  subtitle, 
  icon, 
  bgGradient = 'from-green-600 to-teal-500', 
  user, 
  profile,
  language = 'am',
  toggleLanguage,
  show3D = true,
  hideNavbar = false,
  hideFooter = false,
  hideMobileNav = false
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [agentData, setAgentData] = useState(null);
  const [is3D, setIs3D] = useState(show3D);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const animationRef = useRef(null);

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D) {
      const animate = () => {
        setRotation(prev => (prev + 0.1) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [is3D]);

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

  const toggle3D = () => {
    setIs3D(!is3D);
  };

  const get3DTransform = () => {
    if (!is3D) return 'none';
    if (isHovered) {
      return `perspective(800px) rotateY(${rotation}deg) scale(1.01)`;
    }
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  // Safe access with fallbacks
  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const userInitial = userName?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      {!hideNavbar && (
        <nav className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              {/* Logo/Brand */}
              <Link href="/" className="flex items-center gap-2 group">
                <span className="text-2xl group-hover:scale-110 transition-transform">🎫</span>
                <div>
                  <span className="font-bold text-white text-lg">Abbaa Carraa</span>
                  <span className="text-xs text-gray-400 ml-2 hidden sm:inline">| Ethiopia's Premier Event Hub</span>
                </div>
              </Link>

              {/* Right side: City Selector + Controls + User Menu */}
              <div className="flex items-center gap-2">
                {/* 3D Toggle */}
                <button
                  onClick={toggle3D}
                  className={`hidden sm:block px-2 py-1 rounded-lg text-xs font-medium transition ${
                    is3D 
                      ? 'bg-blue-600/30 text-blue-300 hover:bg-blue-600/40' 
                      : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/40'
                  }`}
                  title={is3D ? '3D ON' : '3D OFF'}
                >
                  {is3D ? '🔄 3D' : '📐 2D'}
                </button>

                {/* Notification Center */}
                {user && (
                  <NotificationCenter 
                    userId={user.id}
                    maxDisplay={5}
                    showSounds={true}
                    autoHide={true}
                    autoHideDuration={5000}
                  />
                )}

                {/* Language Toggle */}
                {toggleLanguage && (
                  <button
                    onClick={toggleLanguage}
                    className="bg-gray-700/50 hover:bg-gray-700 text-white px-2 py-1.5 rounded-lg text-xs font-medium transition"
                  >
                    {language === 'am' ? '🇬🇧 EN' : '🇪🇹 አማ'}
                  </button>
                )}

                {/* City Selector */}
                <TopCitySelector />
                
                {/* User Menu (Desktop) */}
                <div className="hidden md:flex items-center gap-3">
                  {isAgent && (
                    <Link href="/agent/dashboard" className="text-sm bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-300 px-3 py-1.5 rounded-full transition flex items-center gap-1">
                      <span>🤝</span> Agent
                    </Link>
                  )}
                  <Link href="/profile" className="text-sm text-gray-300 hover:text-white transition flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                      {userInitial}
                    </div>
                    <span className="hidden lg:inline">{userName}</span>
                  </Link>
                  <button onClick={handleLogout} className="bg-red-600/20 hover:bg-red-600/30 text-white px-3 py-1.5 rounded-full text-sm transition">
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
      )}

      {/* Dashboard Header */}
      <div className={`bg-gradient-to-r ${bgGradient} text-white shadow-lg`}>
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">{icon || '📊'}</span>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">{title || 'Dashboard'}</h1>
                {subtitle && <p className="text-xs sm:text-sm opacity-90 mt-0.5 sm:mt-1">{subtitle}</p>}
              </div>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex gap-2">
              {user && (
                <>
                  <Link href="/referrals" className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1">
                    🤝 Invite
                  </Link>
                  <Link href="/activity" className="bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm transition hidden sm:flex items-center gap-1">
                    📋 Activity
                  </Link>
                </>
              )}
              {isAgent && (
                <Link href="/agent/dashboard" className="md:hidden bg-yellow-600/30 text-yellow-200 px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  <span>🤝</span> Agent Portal
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg p-4 space-y-2">
          <div className="pb-2 border-b border-gray-200 mb-2">
            <p className="text-sm text-gray-600">Welcome, <span className="font-semibold">{userName}</span></p>
          </div>
          <Link href="/dashboard" className="block py-2 text-gray-700 hover:text-green-600 transition">📊 Dashboard</Link>
          <Link href="/listings" className="block py-2 text-gray-700 hover:text-green-600 transition">🎁 Browse Prizes</Link>
          <Link href="/profile" className="block py-2 text-gray-700 hover:text-green-600 transition">👤 Profile</Link>
          <Link href="/merkato-vip" className="block py-2 text-gray-700 hover:text-yellow-600 transition">🏪 Merkato VIP</Link>
          <Link href="/cities/addis-ababa" className="block py-2 text-gray-700 hover:text-blue-600 transition">🏙️ City VIP</Link>
          <Link href="/notifications" className="block py-2 text-gray-700 hover:text-purple-600 transition">🔔 Notifications</Link>
          <Link href="/settings" className="block py-2 text-gray-700 hover:text-gray-900 transition">⚙️ Settings</Link>
          {isAgent && (
            <Link href="/agent/dashboard" className="block py-2 text-yellow-600 hover:text-yellow-700 transition">🤝 Agent Dashboard</Link>
          )}
          <button onClick={handleLogout} className="block w-full text-left py-2 text-red-600 hover:text-red-700 transition">🚪 Logout</button>
        </div>
      )}

      {/* Main Content with 3D Effect */}
      <div 
        className="container mx-auto px-4 py-6 sm:py-8 transition-all duration-500"
        style={{
          transform: get3DTransform(),
          transformStyle: 'preserve-3d',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {children}
      </div>

      {/* Footer - Charity Section */}
      {!hideFooter && (
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
      )}
    </div>
  );
}
