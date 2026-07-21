// pages/admin/creator-applications.js - Admin Approval Panel
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import NoSSR from '../../components/NoSSR';

export default function AdminCreatorApplications() {
  const router = useRouter();
  const [language, setLanguage] = useState('am');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
    checkAdmin();
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const checkAdmin = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role !== 'admin') {
        toast.error('Access denied. Admin only.');
        router.push('/dashboard');
        return;
      }

      setIsAdmin(true);
      loadApplications();
    } catch (error) {
      console.error('Error checking admin:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('pool_creators')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email,
            phone
          )
        `)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast.error('Failed to load applications');
    }
  };

  const handleApprove = async (applicationId) => {
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('pool_creators')
        .update({
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success(language === 'am' 
        ? '✅ ማመልከቻ ጸድቋል!' 
        : '✅ Application approved!');
      
      loadApplications();
      setShowDetail(false);
    } catch (error) {
      console.error('Error approving:', error);
      toast.error('Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (applicationId) => {
    const reason = prompt(language === 'am' 
      ? 'ለምን ውድቅ እንደሚደረግ ያብራሩ:' 
      : 'Please explain why:');
    
    if (reason === null) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('pool_creators')
        .update({
          verification_status: 'rejected',
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast.success(language === 'am' 
        ? '✅ ማመልከቻ ውድቅ ተደርጓል' 
        : '✅ Application rejected');
      
      loadApplications();
      setShowDetail(false);
    } catch (error) {
      console.error('Error rejecting:', error);
      toast.error('Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const t = (am, en) => language === 'am' ? am : en;

  if (loading) {
    return <LoadingSpinner fullPage />;
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <NoSSR>
      <>
        <Head>
          <title>{t('የፈጣሪ ማመልከቻዎች', 'Creator Applications')} - Admin</title>
        </Head>

        <DashboardLayout
          title={t('👑 የፈጣሪ ማመልከቻዎች', '👑 Creator Applications')}
          subtitle={t('የፑል ፈጣሪ ማመልከቻዎችን ይመልከቱ እና ያስተዳድሩ', 'Review and manage pool creator applications')}
          icon="👑"
          bgGradient="from-red-600 to-pink-600"
          user={user}
          profile={profile}
          language={language}
          toggleLanguage={toggleLanguage}
        >
          <div className="max-w-6xl mx-auto">
            {applications.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-2xl shadow-md">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-600">
                  {t('ምንም የተጠባበቁ ማመልከቻዎች የሉም', 'No pending applications')}
                </h3>
                <p className="text-gray-400 mt-2">
                  {t('ሁሉም ማመልከቻዎች ተገምግመዋል', 'All applications have been reviewed')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-200">
                    <div className="p-6">
                      <div className="flex flex-wrap justify-between items-start gap-4">
                        <div>
                          <h3 className="font-bold text-xl text-gray-800">{app.business_name}</h3>
                          <p className="text-sm text-gray-500">{app.full_name} • {app.phone}</p>
                          <p className="text-sm text-gray-500">{app.city || app.location}</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            ⏳ {t('በጥቅስ ላይ', 'Pending')}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500">{t('🏆 ሽልማት', 'Prize')}</p>
                          <p className="font-semibold">ETB {app.default_prize_amount?.toLocaleString() || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('🎫 ክፍያ', 'Entry Fee')}</p>
                          <p className="font-semibold">ETB {app.default_entry_fee?.toLocaleString() || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('💺 መቀመጫዎች', 'Seats')}</p>
                          <p className="font-semibold">{app.default_total_seats?.toLocaleString() || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">{t('📅 የተመለከተ', 'Applied')}</p>
                          <p className="font-semibold">{new Date(app.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setSelectedApp(app);
                            setShowDetail(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                        >
                          👁️ {t('ዝርዝር አሳይ', 'View Details')}
                        </button>
                        <button
                          onClick={() => handleApprove(app.id)}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                          ✅ {t('ጸድቅ', 'Approve')}
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={processing}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                        >
                          ❌ {t('ውድቅ አድርግ', 'Reject')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DashboardLayout>

        {/* Detail Modal */}
        {showDetail && selectedApp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
                <h2 className="text-xl font-bold">{t('📋 የማመልከቻ ዝርዝር', '📋 Application Details')}</h2>
                <button onClick={() => setShowDetail(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
              </div>
              <div className="p-6">
                {/* Banner */}
                {selectedApp.shop_banner_url && (
                  <img 
                    src={selectedApp.shop_banner_url} 
                    alt={selectedApp.business_name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}

                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">{t('🏪 የመደብር ስም', 'Shop Name')}</span>
                    <span className="font-semibold">{selectedApp.business_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">{t('👤 ሙሉ ስም', 'Full Name')}</span>
                    <span className="font-semibold">{selectedApp.full_name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">{t('📱 ስልክ', 'Phone')}</span>
                    <span className="font-semibold">{selectedApp.phone}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">{t('📍 አድራሻ', 'Address')}</span>
                    <span className="font-semibold">{selectedApp.location}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">{t('🏙️ ከተማ', 'City')}</span>
                    <span className="font-semibold">{selectedApp.city || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-500">{t('📝 ስለ መደብሩ', 'About Shop')}</span>
                    <span className="font-semibold">{selectedApp.bio || 'N/A'}</span>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-bold text-gray-700 mb-2">{t('🎯 የፑል ቅንብሮች', 'Pool Settings')}</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">{t('🏆 ሽልማት', 'Prize')}</p>
                        <p className="font-bold text-green-600">ETB {selectedApp.default_prize_amount?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">{t('🎫 ክፍያ', 'Entry Fee')}</p>
                        <p className="font-bold text-blue-600">ETB {selectedApp.default_entry_fee?.toLocaleString() || 'N/A'}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-xs text-gray-500">{t('💺 መቀመጫዎች', 'Seats')}</p>
                        <p className="font-bold text-purple-600">{selectedApp.default_total_seats?.toLocaleString() || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <h4 className="font-bold text-gray-700 mb-2">{t('💳 የክፍያ መረጃ', 'Payment Info')}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">{t('🏦 ባንክ', 'Bank')}</span>
                        <p className="font-semibold">{selectedApp.bank_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('🔢 ሂሳብ ቁጥር', 'Account #')}</span>
                        <p className="font-semibold">{selectedApp.bank_account_number || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('👤 ባለቤት', 'Holder')}</span>
                        <p className="font-semibold">{selectedApp.bank_account_name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">{t('📱 ቴሌብር', 'TeleBirr')}</span>
                        <p className="font-semibold">{selectedApp.telebirr_number || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Documents */}
                  {(selectedApp.digital_id_url || selectedApp.business_license_url) && (
                    <div className="border-t pt-3 mt-3">
                      <h4 className="font-bold text-gray-700 mb-2">{t('📄 ሰነዶች', 'Documents')}</h4>
                      <div className="flex flex-wrap gap-3">
                        {selectedApp.digital_id_url && (
                          <a 
                            href={selectedApp.digital_id_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm hover:bg-blue-100 transition"
                          >
                            🪪 {t('ዲጂታል መታወቂያ አሳይ', 'View Digital ID')}
                          </a>
                        )}
                        {selectedApp.business_license_url && (
                          <a 
                            href={selectedApp.business_license_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-purple-50 text-purple-700 px-4 py-2 rounded-lg text-sm hover:bg-purple-100 transition"
                          >
                            📜 {t('የንግድ ፍቃድ አሳይ', 'View Business License')}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => handleApprove(selectedApp.id)}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
                    >
                      ✅ {t('ጸድቅ', 'Approve')}
                    </button>
                    <button
                      onClick={() => handleReject(selectedApp.id)}
                      disabled={processing}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
                    >
                      ❌ {t('ውድቅ አድርግ', 'Reject')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    </NoSSR>
  );
}
