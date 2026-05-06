import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children, user, profile, title, subtitle, icon, bgGradient }) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/');
  };

  const navItems = [
    { href: '/', label: '🏠 Home', description: 'Back to main site' },
    { href: '/listings', label: '🎁 Browse Prizes', description: 'View all active pools' },
    { href: '/winners', label: '🏆 Winners', description: 'See recent winners' },
    { href: '/about', label: '📖 About Us', description: 'Learn about Abbaa Carraa' },
    { href: '/faq', label: '❓ FAQ', description: 'Frequently asked questions' },
    { href: '/contact', label: '📞 Contact', description: 'Get in touch with us' },
  ];

  // Role-specific navigation
  const roleNav = {
    individual: [
      { href: '/dashboard', label: '📊 My Dashboard', description: 'Your activity overview' },
      { href: '/listings', label: '🎁 Join Pools', description: 'Participate in prize pools' },
    ],
    agent: [
      { href: '/agent/dashboard', label: '📊 Agent Dashboard', description: 'Your earnings & pools' },
      { href: '/create-pool', label: '➕ Create Pool', description: 'Start a new prize pool' },
      { href: '/agent/listings', label: '📦 My Listings', description: 'Manage your products' },
    ],
    vendor: [
      { href: '/vendor/dashboard', label: '📊 Vendor Dashboard', description: 'Your products & sales' },
      { href: '/vendor/listings/create', label: '➕ Add Product', description: 'List a new product' },
      { href: '/vendor/listings', label: '📦 My Products', description: 'Manage inventory' },
    ],
    organization: [
      { href: '/organization/dashboard', label: '📊 Org Dashboard', description: 'Member pools & stats' },
      { href: '/create-pool?type=private', label: '🔒 Private Pool', description: 'Create member-only pool' },
      { href: '/organization/members', label: '👥 Members', description: 'Manage members' },
    ],
  };

  const currentRole = profile?.user_type || 'individual';
  const currentNav = roleNav[currentRole] || roleNav.individual;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className={`bg-gradient-to-r ${bgGradient || 'from-green-600 to-blue-600'} text-white`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{icon || '🎯'}</span>
              <div>
                <h1 className="text-3xl font-bold">{title}</h1>
                <p className="opacity-90 text-sm mt-1">{subtitle}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2">
                <span>🏠</span> Back to Home
              </Link>
              <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm font-semibold transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-xl p-3 text-center hover:shadow-md transition group"
            >
              <div className="text-2xl mb-1 group-hover:scale-110 transition">{item.label.split(' ')[0]}</div>
              <p className="text-xs font-medium text-gray-700">{item.label.split(' ').slice(1).join(' ')}</p>
              <p className="text-xs text-gray-400 mt-1 hidden md:block">{item.description}</p>
            </Link>
          ))}
        </div>

        {/* Role-specific Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-3">
          <span className="text-sm text-gray-500 mr-2">Quick Actions:</span>
          {currentNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm bg-gray-100 hover:bg-green-100 px-3 py-1 rounded-full transition"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Main Content */}
        {children}
      </div>

      {/* Footer Info Section */}
      <div className="bg-gray-800 text-white py-8 mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl mb-2">🎁</div>
              <h3 className="font-bold">Win Amazing Prizes</h3>
              <p className="text-sm text-gray-400">Cars, cash, electronics & more</p>
            </div>
            <div>
              <div className="text-3xl mb-2">💰</div>
              <h3 className="font-bold">10% Commission</h3>
              <p className="text-sm text-gray-400">For agents and creators</p>
            </div>
            <div>
              <div className="text-3xl mb-2">💚</div>
              <h3 className="font-bold">2% for Charity</h3>
              <p className="text-sm text-gray-400">Supporting kidney & heart patients</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🔒</div>
              <h3 className="font-bold">100% Guaranteed</h3>
              <p className="text-sm text-gray-400">Cash equivalent guarantee</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
