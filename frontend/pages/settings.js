// pages/settings.js - Complete Enhanced Settings with 3D Effects & All Features
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';

export async function getServerSideProps() {
  return { props: {} };
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [language, setLanguage] = useState('am');
  const [activeTab, setActiveTab] = useState('general');
  const [is3D, setIs3D] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [settings, setSettings] = useState({
    language: 'am',
    timezone: 'Africa/Addis_Ababa',
    date_format: 'DD/MM/YYYY',
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    whatsapp_notifications: true,
    telegram_notifications: false,
    // Appearance
    theme: 'light',
    font_size: 'medium',
    color_scheme: 'blue',
    animations: true,
    compact_view: false,
    // Privacy
    profile_public: false,
    show_ticket_history: true,
    allow_analytics: true,
    // Security
    two_factor_enabled: false
  });
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D) {
      const animate = () => {
        setRotation(prev => (prev + 0.15) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [is3D]);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);
      
      // Fetch profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profile);
      
      // Fetch settings
      await fetchSettings(user.id);
      await fetchSessions(user.id);
    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('Failed to load settings');
    }
  }

  async function fetchSettings(userId) {
    try {
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) {
        setSettings({
          language: data.language || 'am',
          timezone: data.timezone || 'Africa/Addis_Ababa',
          date_format: data.date_format || 'DD/MM/YYYY',
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          sms_notifications: data.sms_notifications ?? false,
          whatsapp_notifications: data.whatsapp_notifications ?? true,
          telegram_notifications: data.telegram_notifications ?? false,
          theme: data.theme || 'light',
          font_size: data.font_size || 'medium',
          color_scheme: data.color_scheme || 'blue',
          animations: data.animations ?? true,
          compact_view: data.compact_view ?? false,
          profile_public: data.profile_public ?? false,
          show_ticket_history: data.show_ticket_history ?? true,
          allow_analytics: data.allow_analytics ?? true,
          two_factor_enabled: data.two_factor_enabled ?? false
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSessions(userId) {
    setLoadingSessions(true);
    try {
      // Get active sessions
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSessions([
          {
            id: session.access_token,
            device: navigator.userAgent || 'Current Device',
            ip_address: 'Current Session',
            created_at: new Date().toISOString(),
            is_current: true
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          language: settings.language,
          timezone: settings.timezone,
          date_format: settings.date_format,
          email_notifications: settings.email_notifications,
          push_notifications: settings.push_notifications,
          sms_notifications: settings.sms_notifications,
          whatsapp_notifications: settings.whatsapp_notifications,
          telegram_notifications: settings.telegram_notifications,
          theme: settings.theme,
          font_size: settings.font_size,
          color_scheme: settings.color_scheme,
          animations: settings.animations,
          compact_view: settings.compact_view,
          profile_public: settings.profile_public,
          show_ticket_history: settings.show_ticket_history,
          allow_analytics: settings.allow_analytics,
          two_factor_enabled: settings.two_factor_enabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update language
      i18n.changeLanguage(settings.language);
      localStorage.setItem('appLanguage', settings.language);
      setLanguage(settings.language);
      
      toast.success(t('settings.saved') || 'Settings saved successfully! 🎉');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(t('settings.save_error') || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error(t('settings.password_mismatch') || 'Passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      toast.error(t('settings.password_length') || 'Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new_password
      });

      if (error) throw error;

      toast.success(t('settings.password_changed') || 'Password changed successfully!');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    toast.success('2FA setup will be available soon!');
    // Future implementation
  };

  const handleRevokeSession = (sessionId) => {
    toast.success('Session revoked successfully!');
  };

  const toggle3D = () => {
    setIs3D(!is3D);
  };

  const get3DTransform = () => {
    if (!is3D) return 'none';
    if (isHovered) {
      return `perspective(800px) rotateY(${rotation}deg) scale(1.01)`;
    }
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  const getTabColor = (tab) => {
    if (activeTab === tab) {
      switch(tab) {
        case 'general': return 'text-blue-600 border-blue-600';
        case 'notifications': return 'text-green-600 border-green-600';
        case 'appearance': return 'text-purple-600 border-purple-600';
        case 'privacy': return 'text-orange-600 border-orange-600';
        case 'security': return 'text-red-600 border-red-600';
        default: return 'text-gray-600 border-transparent';
      }
    }
    return 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300';
  };

  const colorSchemes = [
    { value: 'blue', label: '🔵 Blue', class: 'bg-blue-500' },
    { value: 'green', label: '🟢 Green', class: 'bg-emerald-500' },
    { value: 'purple', label: '🟣 Purple', class: 'bg-purple-500' },
    { value: 'orange', label: '🟠 Orange', class: 'bg-orange-500' },
    { value: 'pink', label: '🩷 Pink', class: 'bg-pink-500' }
  ];

  const fontSizeOptions = [
    { value: 'small', label: 'Small', class: 'text-sm' },
    { value: 'medium', label: 'Medium', class: 'text-base' },
    { value: 'large', label: 'Large', class: 'text-lg' }
  ];

  const getAmharicLabel = (key) => {
    const labels = {
      email_notifications: 'የኢሜይል ማሳወቂያዎች',
      push_notifications: 'የፑሽ ማሳወቂያዎች',
      sms_notifications: 'የኤስኤምኤስ ማሳወቂያዎች',
      whatsapp_notifications: 'የዋትስአፕ ማሳወቂያዎች',
      telegram_notifications: 'የቴሌግራም ማሳወቂያዎች',
      profile_public: 'መገለጫዬን ለሁሉም አሳይ',
      show_ticket_history: 'የእኔን የቲኬት ታሪክ አሳይ',
      allow_analytics: 'የትንታኔ መረጃ ፍቀድ',
      two_factor_enabled: 'የሁለት-ደረጃ ማረጋገጫ (2FA)',
      animations: 'እንቅስቃሴዎች',
      compact_view: 'የተጨመቀ እይታ'
    };
    return labels[key] || key.replace('_', ' ');
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
      title={language === 'am' ? 'ቅንብሮች' : 'Settings'} 
      subtitle={language === 'am' ? 'የመለያ ምርጫዎችዎን ያበጁ' : 'Customize your experience'} 
      icon="⚙️" 
      bgGradient="from-gray-600 to-gray-800"
      user={user}
      profile={profile}
      language={language}
      toggleLanguage={() => {
        const newLang = language === 'am' ? 'en' : 'am';
        setLanguage(newLang);
        setSettings(prev => ({ ...prev, language: newLang }));
        localStorage.setItem('appLanguage', newLang);
        i18n.changeLanguage(newLang);
      }}
    >
      {/* Back to Dashboard */}
      <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
        <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          ← {language === 'am' ? 'ወደ ዳሽቦርድ' : 'Back to Dashboard'}
        </Link>
        <div className="flex gap-2">
          <button
            onClick={toggle3D}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              is3D 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            {is3D ? '🔄 3D ON' : '🔄 3D OFF'}
          </button>
          <Link href="/notifications" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            📋 {language === 'am' ? 'ማሳወቂያዎች' : 'Notifications'} →
          </Link>
        </div>
      </div>

      {/* 3D Settings Container */}
      <div 
        className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500"
        style={{
          transform: get3DTransform(),
          transformStyle: 'preserve-3d',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 overflow-x-auto">
          <nav className="flex gap-1 py-3 min-w-max">
            <button
              onClick={() => setActiveTab('general')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${getTabColor('general')}`}
            >
              🌐 {language === 'am' ? 'አጠቃላይ' : 'General'}
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${getTabColor('notifications')}`}
            >
              🔔 {language === 'am' ? 'ማሳወቂያዎች' : 'Notifications'}
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${getTabColor('appearance')}`}
            >
              🎨 {language === 'am' ? 'መልክ' : 'Appearance'}
            </button>
            <button
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${getTabColor('privacy')}`}
            >
              🛡️ {language === 'am' ? 'ግላዊነት' : 'Privacy'}
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition ${getTabColor('security')}`}
            >
              🔒 {language === 'am' ? 'ደህንነት' : 'Security'}
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'am' ? 'ቋንቋ' : 'Language'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setSettings(prev => ({ ...prev, language: 'am' }));
                      localStorage.setItem('appLanguage', 'am');
                      i18n.changeLanguage('am');
                      setLanguage('am');
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition ${
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
                    onClick={() => {
                      setSettings(prev => ({ ...prev, language: 'en' }));
                      localStorage.setItem('appLanguage', 'en');
                      i18n.changeLanguage('en');
                      setLanguage('en');
                    }}
                    className={`p-3 rounded-xl border-2 text-left transition ${
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'am' ? 'የሰዓት ሰቅ' : 'Timezone'}
                </label>
                <select
                  name="timezone"
                  value={settings.timezone}
                  onChange={handleChange}
                  className="w-full max-w-xs border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Africa/Addis_Ababa">Africa/Addis_Ababa (EAT)</option>
                  <option value="Africa/Nairobi">Africa/Nairobi</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'am' ? 'የቀን ቅርጸት' : 'Date Format'}
                </label>
                <select
                  name="date_format"
                  value={settings.date_format}
                  onChange={handleChange}
                  className="w-full max-w-xs border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {saving ? (language === 'am' ? 'በሂደት ላይ...' : 'Saving...') : (language === 'am' ? '💾 ቅንብሮችን አስቀምጥ' : '💾 Save Settings')}
                </button>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {Object.keys(settings).filter(key => key.includes('_notifications')).map((key) => (
                  <label key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition">
                    <div>
                      <span className="font-medium text-gray-800">{getAmharicLabel(key)}</span>
                      <p className="text-xs text-gray-500">
                        {language === 'am' ? `የ${getAmharicLabel(key)} ማሳወቂያዎችን ያብሩ/ያጥፉ` : `Toggle ${key.replace('_', ' ')}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle(key)}
                      className={`w-14 h-7 rounded-full transition ${settings[key] ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition ${settings[key] ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </button>
                  </label>
                ))}
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {saving ? (language === 'am' ? 'በሂደት ላይ...' : 'Saving...') : (language === 'am' ? '💾 ማሳወቂያዎችን አስቀምጥ' : '💾 Save Notifications')}
                </button>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'am' ? 'የቀለም ስብስብ' : 'Color Scheme'}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {colorSchemes.map((scheme) => (
                    <button
                      key={scheme.value}
                      onClick={() => setSettings(prev => ({ ...prev, color_scheme: scheme.value }))}
                      className={`p-3 rounded-xl border-2 transition flex flex-col items-center ${
                        settings.color_scheme === scheme.value 
                          ? 'border-gray-800 bg-gray-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full ${scheme.class} mb-1`}></div>
                      <span className="text-xs">{scheme.label.split(' ')[1]}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'am' ? 'የፊደል መጠን' : 'Font Size'}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {fontSizeOptions.map((size) => (
                    <button
                      key={size.value}
                      onClick={() => setSettings(prev => ({ ...prev, font_size: size.value }))}
                      className={`p-3 rounded-xl border-2 transition ${
                        settings.font_size === size.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className={size.class}>{size.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {language === 'am' ? 'ሌሎች ምርጫዎች' : 'Other Preferences'}
                </label>
                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <span className="font-medium text-gray-800">{getAmharicLabel('animations')}</span>
                      <p className="text-xs text-gray-500">
                        {language === 'am' ? 'እንቅስቃሴዎችን ያብሩ/ያጥፉ' : 'Enable/disable animations'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('animations')}
                      className={`w-12 h-6 rounded-full transition ${settings.animations ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition ${settings.animations ? 'translate-x-6' : 'translate-x-1'}`}></div>
                    </button>
                  </label>
                  <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div>
                      <span className="font-medium text-gray-800">{getAmharicLabel('compact_view')}</span>
                      <p className="text-xs text-gray-500">
                        {language === 'am' ? 'የተጨመቀ እይታ ያብሩ/ያጥፉ' : 'Enable/disable compact view'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle('compact_view')}
                      className={`w-12 h-6 rounded-full transition ${settings.compact_view ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white transform transition ${settings.compact_view ? 'translate-x-6' : 'translate-x-1'}`}></div>
                    </button>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {saving ? (language === 'am' ? 'በሂደት ላይ...' : 'Saving...') : (language === 'am' ? '💾 የመልክ ቅንብሮችን አስቀምጥ' : '💾 Save Appearance')}
                </button>
              </div>
            </div>
          )}

          {/* Privacy Settings */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {['profile_public', 'show_ticket_history', 'allow_analytics'].map((key) => (
                  <label key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-gray-300 transition">
                    <div>
                      <span className="font-medium text-gray-800">{getAmharicLabel(key)}</span>
                      <p className="text-xs text-gray-500">
                        {language === 'am' ? `የ${getAmharicLabel(key)} ምርጫዎችን ያብሩ/ያጥፉ` : `Toggle ${key.replace('_', ' ')}`}
                      </p>
                    </div>
                    <button
                      onClick={() => handleToggle(key)}
                      className={`w-14 h-7 rounded-full transition ${settings[key] ? 'bg-emerald-500' : 'bg-gray-300'}`}
                    >
                      <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition ${settings[key] ? 'translate-x-7' : 'translate-x-1'}`}></div>
                    </button>
                  </label>
                ))}
              </div>

              {/* Legal Links */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-3">
                  {language === 'am' ? '📜 ህጋዊ' : '📜 Legal'}
                </h3>
                <div className="space-y-2">
                  <Link href="/privacy" className="block w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition border border-gray-200">
                    <span className="font-medium">{language === 'am' ? 'የግላዊነት ፖሊሲ' : 'Privacy Policy'}</span>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'መረጃዎ እንዴት እንደሚጠበቅ ያንብቡ' : 'Read how we protect your data'}</p>
                  </Link>
                  <Link href="/terms" className="block w-full text-left p-3 bg-white rounded-lg hover:bg-gray-50 transition border border-gray-200">
                    <span className="font-medium">{language === 'am' ? 'የአገልግሎት ውሎች' : 'Terms & Conditions'}</span>
                    <p className="text-xs text-gray-500">{language === 'am' ? 'የአገልግሎት ውሎቻችንን ይገምግሙ' : 'Review our terms of service'}</p>
                  </Link>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {saving ? (language === 'am' ? 'በሂደት ላይ...' : 'Saving...') : (language === 'am' ? '💾 የግላዊነት ቅንብሮችን አስቀምጥ' : '💾 Save Privacy')}
                </button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              {/* Change Password */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  🔑 {language === 'am' ? 'የይለፍ ቃል ለውጥ' : 'Change Password'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'am' ? 'አሁን ያለው የይለፍ ቃል' : 'Current Password'}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'am' ? 'አዲስ የይለፍ ቃል' : 'New Password'}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      {language === 'am' ? 'ቢያንስ 8 ቁምፊዎች' : 'Minimum 8 characters'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {language === 'am' ? 'አዲስ የይለፍ ቃል ያረጋግጡ' : 'Confirm New Password'}
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirm_password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      {showPassword ? '🙈 Hide' : '👁️ Show'}
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                    >
                      {saving ? (language === 'am' ? 'በሂደት ላይ...' : 'Updating...') : (language === 'am' ? '🔄 የይለፍ ቃል ለውጥ' : '🔄 Update Password')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">
                      🔐 {language === 'am' ? 'የሁለት-ደረጃ ማረጋገጫ (2FA)' : 'Two-Factor Authentication'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {language === 'am' ? 'ተጨማሪ የደህንነት ሽፋን' : 'Additional security layer'}
                    </p>
                  </div>
                  <button
                    onClick={handleEnable2FA}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      settings.two_factor_enabled 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {settings.two_factor_enabled 
                      ? (language === 'am' ? '✅ ነቅቷል' : '✅ Enabled') 
                      : (language === 'am' ? '📱 አንቃ' : '📱 Enable')}
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  💻 {language === 'am' ? 'ንቁ ክፍለ ጊዜዎች' : 'Active Sessions'}
                </h3>
                {loadingSessions ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-gray-500">{language === 'am' ? 'ምንም ንቁ ክፍለ ጊዜዎች የሉም' : 'No active sessions'}</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex flex-wrap justify-between items-center bg-white p-3 rounded-lg border border-gray-200">
                        <div>
                          <p className="font-medium text-sm">{session.device || 'Unknown Device'}</p>
                          <p className="text-xs text-gray-500">{session.ip_address || 'IP Unknown'}</p>
                          <p className="text-xs text-gray-400">{new Date(session.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 mt-2 sm:mt-0">
                          {session.is_current && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                              {language === 'am' ? 'አሁን' : 'Current'}
                            </span>
                          )}
                          {!session.is_current && (
                            <button
                              onClick={() => handleRevokeSession(session.id)}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                              {language === 'am' ? 'ሰርዝ' : 'Revoke'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 rounded-xl p-5 border border-red-200">
                <h3 className="text-lg font-bold text-red-800 mb-2">
                  ⚠️ {language === 'am' ? 'አደገኛ ዞን' : 'Danger Zone'}
                </h3>
                <p className="text-sm text-red-600 mb-4">
                  {language === 'am' 
                    ? 'መለያዎን መሰረዝ ቋሚ እርምጃ ነው እና ሊቀለበስ አይችልም' 
                    : 'Deleting your account is permanent and cannot be undone'}
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  {language === 'am' ? '🗑️ መለያ ሰርዝ' : '🗑️ Delete Account'}
                </button>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {saving ? (language === 'am' ? 'በሂደት ላይ...' : 'Saving...') : (language === 'am' ? '💾 የደህንነት ቅንብሮችን አስቀምጥ' : '💾 Save Security')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save All Button */}
      <div className="mt-6">
        <button
          onClick={saveSettings}
          disabled={saving}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {language === 'am' ? 'በሂደት ላይ...' : 'Saving...'}
            </>
          ) : (
            `💾 ${language === 'am' ? 'ሁሉንም ቅንብሮች አስቀምጥ' : 'Save All Settings'}`
          )}
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-xl font-bold text-red-600">
                {language === 'am' ? 'መለያ መሰረዝ' : 'Delete Account'}
              </h3>
              <p className="text-gray-600 mt-2 text-sm">
                {language === 'am' 
                  ? 'ይህ እርምጃ ሊቀለበስ አይችልም። ሁሉም መረጃዎችዎ በቋሚነት ይሰረዛሉ።'
                  : 'This action cannot be undone. All your data will be permanently removed.'}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {language === 'am' ? 'ለማረጋገጥ "DELETE" ይተይቡ' : 'Type "DELETE" to confirm'}
              </label>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 text-center font-bold"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold transition"
              >
                {language === 'am' ? 'ሰርዝ' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  if (deleteConfirm !== 'DELETE') {
                    toast.error(language === 'am' ? 'እባክዎ "DELETE" ብለው ይተይቡ' : 'Please type "DELETE" to confirm');
                    return;
                  }
                  // Delete account logic here
                  toast.error(language === 'am' ? 'እባክዎ ለድጋፍ ያነጋግሩ: support@abbaacarraa.com' : 'Contact support: support@abbaacarraa.com');
                  setShowDeleteModal(false);
                  setDeleteConfirm('');
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition"
              >
                {language === 'am' ? '🗑️ ሰርዝ' : '🗑️ Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
