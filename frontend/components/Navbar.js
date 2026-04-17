import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    getUser();
  }, []);

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      setUserRole(profile?.role);
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
            <Link href="/" className="text-gray-700 hover:text-green-600 transition">Home</Link>
            <Link href="/listings" className="text-gray-700 hover:text-green-600 transition">Prizes</Link>
            <Link href="/winners" className="text-gray-700 hover:text-green-600 transition">Winners</Link>
            <Link href="/about" className="text-gray-700 hover:text-green-600 transition">About</Link>
            <Link href="/contact" className="text-gray-700 hover:text-green-600 transition">Contact</Link>
            
            {/* Admin Analytics Link */}
            {userRole === 'admin' && (
              <Link href="/admin/analytics" className="text-purple-600 hover:text-purple-700 transition">
                📊 Analytics
              </Link>
            )}
            
            {user && (
              <Link href="/dashboard" className="text-gray-700 hover:text-green-600 transition">Dashboard</Link>
            )}
            
            {/* Agent Dashboard Link */}
            {userRole === 'agent' && (
              <Link href="/agent/dashboard" className="text-blue-600 hover:text-blue-700 transition">Agent Portal</Link>
            )}
            
            {/* Become Agent Link - only for regular users */}
            {user && userRole !== 'agent' && userRole !== 'admin' && (
              <Link href="/agent/register" className="text-yellow-600 hover:text-yellow-700 transition">Become Agent</Link>
            )}
          </div>
          
          {/* Auth Buttons */}
          <div className="flex space-x-4">
            {user ? (
              <button onClick={handleLogout} className="text-red-600 hover:text-red-700 transition">
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-green-600 transition">
                  Login
                </Link>
                <Link href="/register" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
