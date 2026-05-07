import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabase';
import { HeartIcon, LogoutIcon, MenuIcon, XIcon } from '@heroicons/react/outline';

export default function DashboardLayout({ children, title, subtitle, icon, bgGradient, user, profile }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${bgGradient || 'from-green-600 to-teal-500'} text-white py-8`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{icon || '📊'}</span>
                <div>
                  <h1 className="text-3xl font-bold">{title || 'Dashboard'}</h1>
                  <p className="opacity-90 mt-1">{subtitle || 'Welcome to your dashboard'}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-sm transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {children}
      </div>

      {/* Footer Charity Section */}
      <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white py-4 mt-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <HeartIcon className="w-5 h-5" />
            <p className="text-sm">2% of every contribution supports Ethiopians fighting kidney & heart disease</p>
          </div>
        </div>
      </div>
    </div>
  );
}
