// components/GlobalAnnouncement.js - Global Announcement Component
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GlobalAnnouncement({ autoPlay = true, interval = 5000, showDismiss = true, compact = false, className = '' }) {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          const { data: adminRecord } = await supabase
            .from('admins')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle();
          if (profile?.role === 'admin' || adminRecord) {
            setIsAdmin(true);
          }
        }
      } catch (error) {
        console.error('Error checking admin:', error);
      }
    };
    checkAdmin();
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    if (autoPlay && announcements.length > 1 && !dismissed) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, interval);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [announcements.length, autoPlay, interval, dismissed]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      let query = supabase.from('announcements').select('*').order('created_at', { ascending: false });
      if (!isAdmin) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query;
      if (error) throw error;
      
      const { data: { user } } = await supabase.auth.getUser();
      let filteredData = data || [];
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .maybeSingle();
        const userType = profile?.user_type || 'individual';
        filteredData = data?.filter(a => a.target_audience === 'all' || a.target_audience === userType) || [];
      }
      setAnnouncements(filteredData);
      if (currentIndex >= filteredData.length) setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('announcement_dismissed', 'true');
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
    if (autoPlay) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, interval);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
    if (autoPlay) {
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, interval);
    }
  };

  if (loading) {
    return <div className={`bg-gray-100 py-2 px-4 text-center ${className}`}>
      <div className="animate-pulse h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
    </div>;
  }

  const dismissedStatus = localStorage.getItem('announcement_dismissed');
  if (dismissedStatus === 'true' || dismissed || announcements.length === 0) {
    if (isAdmin) {
      return <div className={`bg-gray-50 border-b border-gray-200 py-2 px-4 text-center ${className}`}>
        <Link href="/admin/announcements" className="text-xs text-gray-500 hover:text-gray-700 transition flex items-center gap-1 mx-auto justify-center">📢 Manage Announcements</Link>
      </div>;
    }
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${currentAnnouncement?.bgcolor || 'from-blue-600 to-purple-600'} text-white ${compact ? 'py-1' : 'py-2'} px-4 text-center ${className}`}>
      <div className="container mx-auto">
        {isAdmin && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 z-20">
            <Link href={`/admin/announcements`} className="text-white/60 hover:text-white text-xs transition">✏️</Link>
          </div>
        )}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-sm sm:text-base">📢</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium truncate">
              <strong>{currentAnnouncement?.title}</strong>
              {!compact && <span className="hidden sm:inline">: {currentAnnouncement?.message}</span>}
              {compact && <span className="inline sm:hidden">: {currentAnnouncement?.message}</span>}
            </p>
          </div>
          {showDismiss && (
            <button onClick={handleDismiss} className="text-white/60 hover:text-white text-sm transition flex-shrink-0">✕</button>
          )}
        </div>
        {announcements.length > 1 && (
          <div className="flex justify-center gap-1 mt-1">
            {announcements.map((_, idx) => (
              <button key={idx} onClick={() => setCurrentIndex(idx)} className={`w-1.5 h-1.5 rounded-full transition ${idx === currentIndex ? 'bg-white' : 'bg-white/40'}`} />
            ))}
          </div>
        )}
      </div>
      {announcements.length > 1 && !compact && (
        <>
          <button onClick={handlePrev} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xl transition">◀</button>
          <button onClick={handleNext} className="absolute right-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xl transition">▶</button>
        </>
      )}
    </div>
  );
}
