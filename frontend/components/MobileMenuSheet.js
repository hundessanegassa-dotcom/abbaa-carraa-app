import Link from 'next/link';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function MobileMenuSheet({ isOpen, onClose }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
    router.push('/');
    onClose();
  };

  if (!isOpen) return null;

  const menuItems = [
    { name: 'Dashboard', icon: '📊', path: '/dashboard' },
    { name: 'Create Pool', icon: '➕', path: '/create-pool' },
    { name: 'How It Works', icon: '🎯', path: '/how-it-works' },
    { name: 'FAQ', icon: '❓', path: '/faq' },
    { name: 'About', icon: 'ℹ️', path: '/about' },
    { name: 'Contact', icon: '📞', path: '/contact' },
    { name: 'Settings', icon: '⚙️', path: '/settings' },
  ];

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 animate-slide-up max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white pt-4 pb-2 border-b border-gray-100">
          <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-2" />
          <h3 className="text-lg font-bold text-center">Menu</h3>
          <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 text-2xl">×</button>
        </div>
        
        <div className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              onClick={onClose}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-base font-medium">{item.name}</span>
            </Link>
          ))}
          
          <div className="border-t border-gray-100 my-2 pt-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-red-50 transition w-full text-left text-red-600"
            >
              <span className="text-2xl">🚪</span>
              <span className="text-base font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
