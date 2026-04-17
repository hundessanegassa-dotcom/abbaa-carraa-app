import React from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success('Logged out');
    router.push('/');
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-green-600">
            Abbaa Carraa
          </Link>
          
          <div className="hidden md:flex space-x-6">
            <Link href="/" className="text-gray-700 hover:text-green-600">Home</Link>
            {user && (
              <Link href="/dashboard" className="text-gray-700 hover:text-green-600">Dashboard</Link>
            )}
          </div>
          
          <div className="flex space-x-4">
            {user ? (
              <button onClick={handleLogout} className="text-red-600 hover:text-red-700">
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-green-600">Login</Link>
                <Link href="/register" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Register
                </Link>
            <Link href="/winners" className="text-gray-700 hover:text-green-600 transition">
  Winners
</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
