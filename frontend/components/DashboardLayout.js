import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children, title, subtitle, icon, bgGradient, user, profile }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out successfully');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`bg-gradient-to-r ${bgGradient} text-white`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{icon}</span>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
          <Link href="/" className="bg-white rounded-xl p-3 text-center hover:shadow-md transition group"><div className="text-2xl mb-1 group-hover:scale-110 transition">🏠</div><p className="text-xs font-medium text-gray-700">Home</p></Link>
          <Link href="/listings" className="bg-white rounded-xl p-3 text-center hover:shadow-md transition group"><div className="text-2xl mb-1 group-hover:scale-110 transition">🎁</div><p className="text-xs font-medium text-gray-700">Browse Prizes</p></Link>
          <Link href="/winners" className="bg-white rounded-xl p-3 text-center hover:shadow-md transition group"><div className="text-2xl mb-1 group-hover:scale-110 transition">🏆</div><p className="text-xs font-medium text-gray-700">Winners</p></Link>
          <Link href="/about" className="bg-white rounded-xl p-3 text-center hover:shadow-md transition group"><div className="text-2xl mb-1 group-hover:scale-110 transition">📖</div><p className="text-xs font-medium text-gray-700">About Us</p></Link>
          <Link href="/faq" className="bg-white rounded-xl p-3 text-center hover:shadow-md transition group"><div className="text-2xl mb-1 group-hover:scale-110 transition">❓</div><p className="text-xs font-medium text-gray-700">FAQ</p></Link>
        </div>

        {children}
      </div>

      {/* Footer */}
      <div className="bg-gray-800 text-white py-8 mt-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div><div className="text-3xl mb-2">🎁</div><h3 className="font-bold">Win Amazing Prizes</h3><p className="text-sm text-gray-400">Cars, cash, electronics & more</p></div>
            <div><div className="text-3xl mb-2">💰</div><h3 className="font-bold">10% Commission</h3><p className="text-sm text-gray-400">For agents and creators</p></div>
            <div><div className="text-3xl mb-2">💚</div><h3 className="font-bold">2% for Charity</h3><p className="text-sm text-gray-400">Supporting kidney & heart patients</p></div>
            <div><div className="text-3xl mb-2">🔒</div><h3 className="font-bold">100% Guaranteed</h3><p className="text-sm text-gray-400">Cash equivalent guarantee</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
