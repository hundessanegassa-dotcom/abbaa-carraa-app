import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function LogoutButton({ className = "", variant = "default" }) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Show loading toast
      toast.loading('Logging out...', { id: 'logout' });
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      // Clear ALL local storage
      localStorage.clear();
      
      // Clear ALL session storage
      sessionStorage.clear();
      
      // Clear all cookies that might contain session data
      document.cookie.split(";").forEach(function(c) {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
      
      // Clear any Supabase-specific storage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Small delay to ensure everything is cleared
      await new Promise(resolve => setTimeout(resolve, 200));
      
      toast.success('Logged out successfully!', { id: 'logout' });
      
      // Redirect to login page
      router.push('/login');
      
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout', { id: 'logout' });
    }
  };

  // Different button styles based on variant
  const buttonStyles = {
    default: "bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition",
    outline: "border border-red-500 text-red-500 px-4 py-2 rounded-lg hover:bg-red-50 transition",
    ghost: "text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition"
  };

  return (
    <button
      onClick={handleLogout}
      className={className || buttonStyles[variant]}
    >
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        <span>Logout</span>
      </div>
    </button>
  );
}
