import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import BackButton from '../components/BackButton';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    language: 'am',
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    whatsapp_notifications: true,
    telegram_notifications: false
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
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(profile);
    
    await fetchSettings(user.id);
  }

  async function fetchSettings(userId) {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) {
      setSettings({
        language: data.language || 'am',
        email_notifications: data.email_notifications ?? true,
        push_notifications: data.push_notifications ?? true,
        sms_notifications: data.sms_notifications ?? false,
        whatsapp_notifications: data.whatsapp_notifications ?? true,
        telegram_notifications: data.telegram_notifications ?? false
      });
    }
    setLoading(false);
  }

  async function saveSettings() {
    setSaving(true);
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        language: settings.language,
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        sms_notifications: settings.sms_notifications,
        whatsapp_notifications: settings.whatsapp_notifications,
        telegram_notifications: settings.telegram_notifications,
        updated_at: new Date().toISOString()
      });

    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Settings saved!');
      i18n.changeLanguage(settings.language);
    }
    setSaving(false);
  }

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      title="Settings" 
      subtitle="Customize your experience" 
      icon="⚙️" 
      bgGradient="from-gray-600 to-gray-800"
      user={user}
      profile={profile}
    >
      {/* Back to Dashboard */}
      <div className="mb-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← Back to Dashboard
        </Link>
        <Link href="/notifications" className="text-sm text-blue-600 hover:underline">
          📋 View notifications →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Language Settings */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🌐</span> Language / ቋንቋ
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => setSettings(prev => ({ ...prev, language: 'am' }))}
              className={`w-full p-3 rounded-xl border-2 text-left transition ${
                settings.language === 'am' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇪🇹</span>
                <div>
                  <p className="font-semibold">አማርኛ (Amharic)</p>
                  <p className="text-xs text-gray-500">ቋንቋዎን ወደ አማርኛ ይቀይሩ</p>
                </div>
                {settings.language === 'am' && <span className="ml-auto text-green-600">✓</span>}
              </div>
            </button>
            <button
              onClick={() => setSettings(prev => ({ ...prev, language: 'en' }))}
              className={`w-full p-3 rounded-xl border-2 text-left transition ${
                settings.language === 'en' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇬🇧</span>
                <div>
                  <p className="font-semibold">English</p>
                  <p className="text-xs text-gray-500">Switch to English</p>
                </div>
                {settings.language === 'en' && <span className="ml-auto text-green-600">✓</span>}
              </div>
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔔</span> Notifications
          </h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><span className="font-medium">📧 Email Notifications</span><p className="text-xs text-gray-500">Receive updates via email</p></div>
              <button
                onClick={() => handleToggle('email_notifications')}
                className={`w-12 h-6 rounded-full transition ${settings.email_notifications ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition ${settings.email_notifications ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><span className="font-medium">📱 Push Notifications</span><p className="text-xs text-gray-500">Get instant alerts on your device</p></div>
              <button
                onClick={() => handleToggle('push_notifications')}
                className={`w-12 h-6 rounded-full transition ${settings.push_notifications ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition ${settings.push_notifications ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><span className="font-medium">💬 WhatsApp Notifications</span><p className="text-xs text-gray-500">Get winner alerts on WhatsApp</p></div>
              <button
                onClick={() => handleToggle('whatsapp_notifications')}
                className={`w-12 h-6 rounded-full transition ${settings.whatsapp_notifications ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition ${settings.whatsapp_notifications ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </label>
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><span className="font-medium">📨 Telegram Notifications</span><p className="text-xs text-gray-500">Get updates on Telegram</p></div>
              <button
                onClick={() => handleToggle('telegram_notifications')}
                className={`w-12 h-6 rounded-full transition ${settings.telegram_notifications ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transform transition ${settings.telegram_notifications ? 'translate-x-6' : 'translate-x-1'}`}></div>
              </button>
            </label>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>🔒</span> Privacy & Security
          </h3>
          <div className="space-y-3">
            <Link href="/privacy" className="block w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="font-medium">📜 Privacy Policy</span>
              <p className="text-xs text-gray-500">Read how we protect your data</p>
            </Link>
            <Link href="/terms" className="block w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
              <span className="font-medium">⚖️ Terms & Conditions</span>
              <p className="text-xs text-gray-500">Review our terms of service</p>
            </Link>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>⚠️</span> Account Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={async () => {
                if (confirm('Download your data?')) {
                  toast.success('Data export requested. You will receive an email shortly.');
                }
              }}
              className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <span className="font-medium">📥 Download My Data</span>
              <p className="text-xs text-gray-500">Export your account information</p>
            </button>
            <button
              onClick={async () => {
                if (confirm('Are you sure you want to delete your account? This cannot be undone. All your data will be permanently removed.')) {
                  toast.error('Contact support to delete account: support@abbaacarraa.com');
                }
              }}
              className="w-full text-left p-3 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              <span className="font-medium text-red-600">🗑️ Delete Account</span>
              <p className="text-xs text-red-400">Permanently remove your account</p>
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </DashboardLayout>
  );
}
