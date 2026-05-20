import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import BackButton from '../components/BackButton';
export async function getServerSideProps() {
  return { props: {} };
}
export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ contributions: 0, wins: 0, pools: 0 });
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    bio: '',
    location: '',
    telegram_username: '',
    whatsapp_number: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    await fetchProfile(user.id);
    await fetchStats(user.id);
  }

  async function fetchProfile(userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    setProfile(profile);
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || user.email || '',
        bio: profile.bio || '',
        location: profile.location || '',
        telegram_username: profile.telegram_username || '',
        whatsapp_number: profile.whatsapp_number || ''
      });
    }
    setLoading(false);
  }

  async function fetchStats(userId) {
    // Get contributions
    const { data: contributions } = await supabase
      .from('contributions')
      .select('amount')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    // Get wins
    const { data: wins } = await supabase
      .from('pools')
      .select('id')
      .eq('winner_id', userId);
    
    // Get pools created
    const { data: pools } = await supabase
      .from('pools')
      .select('id')
      .eq('created_by', userId);
    
    setStats({
      contributions: contributions?.length || 0,
      total_amount: contributions?.reduce((sum, c) => sum + c.amount, 0) || 0,
      wins: wins?.length || 0,
      pools: pools?.length || 0
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        bio: formData.bio,
        location: formData.location,
        telegram_username: formData.telegram_username,
        whatsapp_number: formData.whatsapp_number,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated successfully!');
      fetchProfile(user.id);
    }
    setSaving(false);
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="My Profile" 
      subtitle="Manage your personal information" 
      icon="👤" 
      bgGradient="from-blue-500 to-indigo-500"
      user={user}
      profile={profile}
    >
      {/* Back Button */}
      <BackButton fallbackHref="/dashboard" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Personal Information</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
                />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  name="bio"
                  rows="3"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tell us about yourself..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="City, Ethiopia"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-bold text-gray-800 mb-3">Account Statistics</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Member since:</span>
                <span className="font-medium">{new Date(profile?.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">User type:</span>
                <span className="font-medium capitalize">{profile?.user_type || 'Individual'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Agreement accepted:</span>
                <span className="font-medium text-green-600">{profile?.agreement_accepted ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-bold text-gray-800 mb-3">Your Activity</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-green-50 rounded-xl p-2">
                <p className="text-2xl font-bold text-green-600">{stats.contributions}</p>
                <p className="text-xs text-gray-500">Contributions</p>
              </div>
              <div className="bg-yellow-50 rounded-xl p-2">
                <p className="text-2xl font-bold text-yellow-600">{stats.wins}</p>
                <p className="text-xs text-gray-500">Wins</p>
              </div>
              <div className="bg-blue-50 rounded-xl p-2">
                <p className="text-2xl font-bold text-blue-600">{stats.pools}</p>
                <p className="text-xs text-gray-500">Pools Created</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-2">
                <p className="text-sm font-bold text-purple-600">ETB {stats.total_amount?.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Total Contributed</p>
              </div>
            </div>
          </div>

          {/* Contact Preferences */}
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-bold text-gray-800 mb-3">Contact Preferences</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Telegram Username</label>
                <input
                  type="text"
                  name="telegram_username"
                  value={formData.telegram_username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">WhatsApp Number</label>
                <input
                  type="tel"
                  name="whatsapp_number"
                  value={formData.whatsapp_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  placeholder="+251XXXXXXXXX"
                />
              </div>
            </div>
            <Link href="/settings" className="inline-block mt-3 text-blue-600 text-sm hover:underline">
              ⚙️ More settings →
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
