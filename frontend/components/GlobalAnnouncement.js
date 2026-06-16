// components/GlobalAnnouncement.js - Global Announcement Component with Carousel & Admin Controls
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function GlobalAnnouncement({ 
  autoPlay = true,
  interval = 5000,
  showDismiss = true,
  compact = false,
  className = ''
}) {
  const [announcements, setAnnouncements] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    target_audience: 'all',
    is_active: true,
    link_url: '',
    bgColor: 'from-blue-600 to-purple-600'
  });
  const [editingId, setEditingId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const timerRef = useRef(null);

  const colorOptions = [
    { value: 'from-blue-600 to-purple-600', label: 'Blue to Purple' },
    { value: 'from-green-600 to-teal-600', label: 'Green to Teal' },
    { value: 'from-red-600 to-pink-600', label: 'Red to Pink' },
    { value: 'from-yellow-500 to-orange-600', label: 'Yellow to Orange' },
    { value: 'from-indigo-600 to-pink-500', label: 'Indigo to Pink' },
    { value: 'from-emerald-600 to-cyan-600', label: 'Emerald to Cyan' },
    { value: 'from-gray-700 to-gray-900', label: 'Gray to Dark' },
  ];

  // Check if user is admin
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

  // Auto-play carousel
  useEffect(() => {
    if (autoPlay && announcements.length > 1 && !dismissed) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % announcements.length);
      }, interval);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [announcements.length, autoPlay, interval, dismissed]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      // For admins, show all announcements; for users, show only active ones
      let query = supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by target audience (if user is logged in)
      const { data: { user } } = await supabase.auth.getUser();
      let filteredData = data || [];

      if (user) {
        // Get user type from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .maybeSingle();
        
        const userType = profile?.user_type || 'individual';
        
        // Show announcements that target 'all' or match user's type
        filteredData = data?.filter(a => 
          a.target_audience === 'all' || a.target_audience === userType
        ) || [];
      }

      setAnnouncements(filteredData);
      
      // Reset index if out of bounds
      if (currentIndex >= filteredData.length) {
        setCurrentIndex(0);
      }
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

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.content) {
      toast.error('Please fill in title and content');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: newAnnouncement.title,
          content: newAnnouncement.content,
          target_audience: newAnnouncement.target_audience,
          is_active: newAnnouncement.is_active,
          link_url: newAnnouncement.link_url,
          bgColor: newAnnouncement.bgColor,
          created_by: user?.id,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success('Announcement created successfully!');
      setShowCreateModal(false);
      setNewAnnouncement({
        title: '',
        content: '',
        target_audience: 'all',
        is_active: true,
        link_url: '',
        bgColor: 'from-blue-600 to-purple-600'
      });
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error('Failed to create announcement');
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Announcement deleted');
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Announcement ${!currentStatus ? 'activated' : 'deactivated'}`);
      await fetchAnnouncements();
    } catch (error) {
      console.error('Error toggling announcement:', error);
      toast.error('Failed to update announcement');
    }
  };

  // Check if dismissed in localStorage
  useEffect(() => {
    const dismissedStatus = localStorage.getItem('announcement_dismissed');
    if (dismissedStatus === 'true') {
      setDismissed(true);
    }
  }, []);

  if (loading) {
    return (
      <div className={`bg-gray-100 py-2 px-4 text-center ${className}`}>
        <div className="animate-pulse h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
      </div>
    );
  }

  if (dismissed || announcements.length === 0) {
    // Show admin create button if admin and no announcements
    if (isAdmin) {
      return (
        <div className={`bg-gray-50 border-b border-gray-200 py-2 px-4 text-center ${className}`}>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs text-gray-500 hover:text-gray-700 transition flex items-center gap-1 mx-auto"
          >
            <span>➕</span> Create Announcement
          </button>
        </div>
      );
    }
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <>
      <div className={`relative overflow-hidden bg-gradient-to-r ${currentAnnouncement?.bgColor || 'from-blue-600 to-purple-600'} text-white ${compact ? 'py-1' : 'py-2'} px-4 text-center ${className}`}>
        <div className="container mx-auto">
          {/* Admin Controls */}
          {isAdmin && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 z-20">
              <button
                onClick={() => {
                  setEditingId(currentAnnouncement?.id);
                  setNewAnnouncement({
                    title: currentAnnouncement?.title || '',
                    content: currentAnnouncement?.content || '',
                    target_audience: currentAnnouncement?.target_audience || 'all',
                    is_active: currentAnnouncement?.is_active ?? true,
                    link_url: currentAnnouncement?.link_url || '',
                    bgColor: currentAnnouncement?.bgColor || 'from-blue-600 to-purple-600'
                  });
                  setShowCreateModal(true);
                }}
                className="text-white/60 hover:text-white text-xs transition"
                title="Edit"
              >
                ✏️
              </button>
              <button
                onClick={() => handleToggleActive(currentAnnouncement?.id, currentAnnouncement?.is_active)}
                className="text-white/60 hover:text-white text-xs transition"
                title={currentAnnouncement?.is_active ? 'Deactivate' : 'Activate'}
              >
                {currentAnnouncement?.is_active ? '🔊' : '🔇'}
              </button>
              <button
                onClick={() => handleDeleteAnnouncement(currentAnnouncement?.id)}
                className="text-white/60 hover:text-white text-xs transition"
                title="Delete"
              >
                🗑️
              </button>
            </div>
          )}

          {/* Announcement Content */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="text-sm sm:text-base">📢</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium truncate">
                <strong>{currentAnnouncement?.title}</strong>
                {!compact && (
                  <span className="hidden sm:inline">: {currentAnnouncement?.content}</span>
                )}
                {compact && (
                  <span className="inline sm:hidden">: {currentAnnouncement?.content}</span>
                )}
              </p>
              {!compact && currentAnnouncement?.link_url && (
                <Link 
                  href={currentAnnouncement.link_url}
                  className="text-xs text-white/80 hover:text-white underline ml-1"
                >
                  Learn More →
                </Link>
              )}
            </div>
            
            {/* Dismiss Button */}
            {showDismiss && (
              <button
                onClick={handleDismiss}
                className="text-white/60 hover:text-white text-sm transition flex-shrink-0"
                aria-label="Dismiss announcement"
              >
                ✕
              </button>
            )}
          </div>

          {/* Carousel Dots */}
          {announcements.length > 1 && (
            <div className="flex justify-center gap-1 mt-1">
              {announcements.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-1.5 h-1.5 rounded-full transition ${
                    idx === currentIndex ? 'bg-white' : 'bg-white/40'
                  }`}
                  aria-label={`Go to announcement ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Navigation Arrows */}
        {announcements.length > 1 && !compact && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xl transition"
              aria-label="Previous announcement"
            >
              ◀
            </button>
            <button
              onClick={handleNext}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white text-xl transition"
              aria-label="Next announcement"
            >
              ▶
            </button>
          </>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingId ? '✏️ Edit Announcement' : '📢 Create Announcement'}
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newAnnouncement.title}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                  placeholder="Announcement title"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
                <textarea
                  value={newAnnouncement.content}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                  placeholder="Announcement content"
                  rows="3"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select
                  value={newAnnouncement.target_audience}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, target_audience: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                >
                  <option value="all">🌐 All Users</option>
                  <option value="individual">👤 Individuals</option>
                  <option value="agent">🤝 Agents</option>
                  <option value="vendor">🏪 Vendors</option>
                  <option value="organization">🏢 Organizations</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
                <input
                  type="text"
                  value={newAnnouncement.link_url}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, link_url: e.target.value})}
                  placeholder="/dashboard"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                <div className="grid grid-cols-2 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setNewAnnouncement({...newAnnouncement, bgColor: color.value})}
                      className={`p-2 rounded-lg text-xs font-medium transition ${
                        newAnnouncement.bgColor === color.value
                          ? `bg-gradient-to-r ${color.value} text-white ring-2 ring-offset-2 ring-purple-500`
                          : `bg-gradient-to-r ${color.value} text-white opacity-60 hover:opacity-100`
                      }`}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={newAnnouncement.is_active}
                  onChange={(e) => setNewAnnouncement({...newAnnouncement, is_active: e.target.checked})}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAnnouncement}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-2 rounded-lg font-semibold transition"
                >
                  {editingId ? '💾 Update' : '📢 Publish'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
