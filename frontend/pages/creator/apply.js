// pages/creator/apply.js - Pool Creator Application Form
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import ImageUpload from '../../components/ImageUpload';
import NoSSR from '../../components/NoSSR';

export default function CreatorApplication() {
  const router = useRouter();
  const [language, setLanguage] = useState('am');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'individual',
    full_name: '',
    phone: '',
    email: '',
    location: '',
    city: '',
    about: '',

    // Pool settings (what creator sets)
    prize_amount: 100000,
    entry_fee: 100,
    total_seats: 2000,

    // Payment details
    bank_name: '',
    bank_account_number: '',
    bank_account_name: '',
    telebirr_number: '',

    // Files
    shop_banner: null,
    digital_id: null,
    business_license: null,

    // Terms
    terms_accepted: false
  });

  // Preview URLs
  const [previews, setPreviews] = useState({
    shop_banner: null,
    digital_id: null,
    business_license: null
  });

  // Calculations
  const [calculation, setCalculation] = useState({
    total_collection: 0,
    platform_fee: 0,
    charity: 0,
    tax: 0,
    total_deductions: 0,
    remaining: 0,
    creator_earnings: 0
  });

  // Load user
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
    checkUser();
  }, []);

  const toggleLanguage = () => {
    const newLang = language === 'am' ? 'en' : 'am';
    setLanguage(newLang);
    localStorage.setItem('appLanguage', newLang);
  };

  const checkUser = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profileData);

      // Pre-fill form with profile data
      if (profileData) {
        setFormData(prev => ({
          ...prev,
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          location: profileData.location || '',
          city: profileData.city || '',
        }));
      }

      // Check if user already has a creator profile
      const { data: existing } = await supabase
        .from('pool_creators')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        setExistingApplication(existing);
        if (existing.verification_status === 'approved') {
          toast.success(language === 'am' 
            ? '✅ ቀድሞውኑ ፈጣሪ ነዎት! ወደ ዳሽቦርድ ይሂዱ' 
            : '✅ You are already a creator! Go to dashboard');
          router.push('/creator/dashboard');
          return;
        } else if (existing.verification_status === 'pending') {
          router.push('/creator/pending');
          return;
        }
      }

    } catch (error) {
      console.error('Error checking user:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate everything when form changes
  useEffect(() => {
    calculateFinancials();
  }, [formData.prize_amount, formData.entry_fee, formData.total_seats]);

  const calculateFinancials = () => {
    const totalCollection = formData.total_seats * formData.entry_fee;
    const platformFee = totalCollection * 0.10;
    const charity = totalCollection * 0.02;
    const tax = totalCollection * 0.02;
    const totalDeductions = platformFee + charity + tax;
    const remaining = totalCollection - totalDeductions;
    const creatorEarnings = remaining - formData.prize_amount;

    setCalculation({
      total_collection: totalCollection,
      platform_fee: platformFee,
      charity: charity,
      tax: tax,
      total_deductions: totalDeductions,
      remaining: remaining,
      creator_earnings: creatorEarnings
    });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      const file = files[0];
      if (file) {
        setFormData(prev => ({ ...prev, [name]: file }));
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviews(prev => ({ ...prev, [name]: event.target.result }));
        };
        reader.readAsDataURL(file);
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      const numValue = parseFloat(value);
      if (name === 'prize_amount' || name === 'entry_fee' || name === 'total_seats') {
        setFormData(prev => ({ ...prev, [name]: isNaN(numValue) ? 0 : numValue }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleRemoveFile = (fieldName) => {
    setFormData(prev => ({ ...prev, [fieldName]: null }));
    setPreviews(prev => ({ ...prev, [fieldName]: null }));
    const input = document.getElementById(fieldName);
    if (input) input.value = '';
  };

  const compressImage = (file, maxWidth = 1200, maxHeight = 400, quality = 0.8) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
          }, 'image/jpeg', quality);
        };
      };
    });
  };

  const uploadFile = async (file, folder, userId) => {
    if (!file) return null;
    
    const compressedFile = await compressImage(file);
    const fileName = `${userId}/${folder}/${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('creator-documents')
      .upload(fileName, compressedFile, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'image/jpeg'
      });
    
    if (error) {
      console.error('Upload error:', error);
      throw error;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('creator-documents')
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate form
      if (!formData.business_name || !formData.full_name || !formData.phone || !formData.location) {
        toast.error(language === 'am' ? 'እባክዎ ሁሉንም አስፈላጊ መረጃዎች ይሙሉ' : 'Please fill in all required fields');
        setSubmitting(false);
        return;
      }

      if (!formData.digital_id) {
        toast.error(language === 'am' ? 'እባክዎ ዲጂታል መታወቂያዎን ያስገቡ' : 'Please upload your digital ID');
        setSubmitting(false);
        return;
      }

      if (calculation.creator_earnings < 0) {
        toast.error(language === 'am' 
          ? 'የእርስዎ ገቢ አሉታዊ ነው. እባክዎ መቀመጫዎችን ወይም ክፍያን ይጨምሩ' 
          : 'Your earnings are negative. Please increase seats or entry fee');
        setSubmitting(false);
        return;
      }

      if (!formData.terms_accepted) {
        toast.error(language === 'am' ? 'ውሎችን መቀበል አለብዎት' : 'You must accept the terms');
        setSubmitting(false);
        return;
      }

      const loadingToast = toast.loading(language === 'am' ? 'ማመልከቻዎ በላይ እየተሰቀለ ነው...' : 'Submitting your application...');

      // Upload files
      let shopBannerUrl = null;
      let digitalIdUrl = null;
      let businessLicenseUrl = null;

      if (formData.shop_banner) {
        shopBannerUrl = await uploadFile(formData.shop_banner, 'banners', user.id);
      }
      
      digitalIdUrl = await uploadFile(formData.digital_id, 'ids', user.id);
      
      if (formData.business_license) {
        businessLicenseUrl = await uploadFile(formData.business_license, 'licenses', user.id);
      }

      // Create creator profile
      const { data: creator, error: creatorError } = await supabase
        .from('pool_creators')
        .insert({
          user_id: user.id,
          business_name: formData.business_name,
          business_type: formData.business_type,
          phone: formData.phone,
          email: formData.email || user.email,
          location: formData.location,
          city: formData.city,
          bio: formData.about,
          shop_banner_url: shopBannerUrl,
          digital_id_url: digitalIdUrl,
          business_license_url: businessLicenseUrl,
          bank_name: formData.bank_name,
          bank_account_number: formData.bank_account_number,
          bank_account_name: formData.bank_account_name,
          telebirr_number: formData.telebirr_number,
          // Default pool settings
          default_prize_amount: formData.prize_amount,
          default_entry_fee: formData.entry_fee,
          default_total_seats: formData.total_seats,
          verification_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (creatorError) {
        console.error('Creator creation error:', creatorError);
        throw new Error(creatorError.message);
      }

      toast.success(
        language === 'am' 
          ? '✅ ማመልከቻዎ ተልኳል! ለማጽደቅ ለአስተዳዳሪዎች ተልኳል' 
          : '✅ Application submitted! Pending admin approval',
        { id: loadingToast }
      );

      router.push('/creator/pending');

    } catch (error) {
      console.error('Submission error:', error);
      toast.error(
        language === 'am' 
          ? '❌ ማመልከቻ መላክ አልተቻለም. እባክዎ እንደገና ይሞክሩ' 
          : '❌ Failed to submit application. Please try again'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message={language === 'am' ? 'በመጫን ላይ...' : 'Loading...'} />;
  }

  const t = (am, en) => language === 'am' ? am : en;

  return (
    <NoSSR>
      <>
        <Head>
          <title>{t('የፑል ፈጣሪ ማመልከቻ', 'Pool Creator Application')} - Abbaa Carraa</title>
        </Head>

        <DashboardLayout
          title={t('🏪 የፑል ፈጣሪ ይሁኑ', '🏪 Become a Pool Creator')}
          subtitle={t('የራስዎን ፑል ይፍጠሩ እና ኮሚሽን ያግኙ', 'Create your own pools and earn commission')}
          icon="🏪"
          bgGradient="from-green-600 to-teal-500"
          user={user}
          profile={profile}
          language={language}
          toggleLanguage={toggleLanguage}
        >
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 space-y-6">

              {/* ===== SHOP INFORMATION ===== */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {t('🏪 የመደብር መረጃ', '🏪 Shop Information')}
                </h3>

                {/* Shop Banner */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('📸 የመደብር ምስል', '📸 Shop Banner')}
                    <span className="text-xs text-gray-400 ml-2">
                      {t('(የሚመከር: 1200x400px, ከፍተኛ 2MB)', '(Recommended: 1200x400px, Max 2MB)')}
                    </span>
                  </label>
                  <ImageUpload
                    id="shop_banner"
                    name="shop_banner"
                    accept="image/*"
                    preview={previews.shop_banner}
                    onChange={handleInputChange}
                    onRemove={() => handleRemoveFile('shop_banner')}
                    label={t('የመደብር ምስል ምረጥ', 'Choose shop banner')}
                    language={language}
                  />
                </div>

                {/* Business Name */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('🏪 የመደብር/ንግድ ስም', '🏪 Shop/Business Name')} *
                  </label>
                  <input
                    type="text"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    placeholder={t('ለምሳሌ: አበበ መደብር', 'Example: Abebe\'s Shop')}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Business Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('📂 የንግድ አይነት', '📂 Business Type')}
                  </label>
                  <select
                    name="business_type"
                    value={formData.business_type}
                    onChange={handleInputChange}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                  >
                    <option value="individual">{t('ግለሰብ', 'Individual')}</option>
                    <option value="business">{t('ንግድ', 'Business')}</option>
                    <option value="organization">{t('ድርጅት', 'Organization')}</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('👤 ሙሉ ስም', '👤 Full Name')} *
                    </label>
                    <input
                      type="text"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleInputChange}
                      placeholder={t('ሙሉ ስምዎ', 'Your full name')}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('📱 ስልክ ቁጥር', '📱 Phone Number')} *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="09xxxxxxxx"
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('📍 አድራሻ/ከተማ', '📍 Address/City')} *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder={t('አድራሻዎ', 'Your address')}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('🏙️ ከተማ', '🏙️ City')}
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder={t('ከተማዎ', 'Your city')}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                {/* About */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('📝 ስለ መደብርዎ', '📝 About Your Shop')}
                  </label>
                  <textarea
                    name="about"
                    value={formData.about}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder={t('ስለ መደብርዎ ይግለጹ...', 'Describe your shop...')}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* ===== POOL SETTINGS ===== */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {t('🎯 የፑል ቅንብሮች', '🎯 Pool Settings')}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {t('የመጀመሪያ ፑልዎን ቅንብሮች ያዘጋጁ', 'Set your first pool\'s parameters')}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Prize Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('🏆 የሽልማት መጠን (ETB)', '🏆 Prize Amount (ETB)')} *
                    </label>
                    <input
                      type="number"
                      name="prize_amount"
                      value={formData.prize_amount}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                      min="1000"
                      step="1000"
                      required
                    />
                  </div>

                  {/* Entry Fee */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('🎫 የመግቢያ ክፍያ (ETB)', '🎫 Entry Fee (ETB)')} *
                    </label>
                    <input
                      type="number"
                      name="entry_fee"
                      value={formData.entry_fee}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                      min="10"
                      step="10"
                      required
                    />
                  </div>

                  {/* Total Seats */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('💺 ጠቅላላ መቀመጫዎች', '💺 Total Seats')} *
                    </label>
                    <input
                      type="number"
                      name="total_seats"
                      value={formData.total_seats}
                      onChange={handleInputChange}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                      min="10"
                      step="10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* ===== FINANCIAL CALCULATION ===== */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h4 className="font-bold text-gray-700 mb-4">
                  {t('📊 የፋይናንስ ሂሳብ', '📊 Financial Calculation')}
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-500">{t('ጠቅላላ ስብስብ', 'Total Collection')}</p>
                    <p className="font-bold text-lg text-green-600">
                      ETB {calculation.total_collection.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formData.total_seats} × {formData.entry_fee} ETB
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-500">{t('የመድረክ ክፍያ (10%)', 'Platform Fee (10%)')}</p>
                    <p className="font-bold text-lg text-orange-600">
                      ETB {calculation.platform_fee.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-500">{t('ለበጎ አድራጎት (2%)', 'Charity (2%)')}</p>
                    <p className="font-bold text-lg text-red-600">
                      ETB {calculation.charity.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm">
                    <p className="text-gray-500">{t('ግብር (2%)', 'Tax (2%)')}</p>
                    <p className="font-bold text-lg text-red-600">
                      ETB {calculation.tax.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-3 shadow-sm col-span-2">
                    <p className="text-gray-500">{t('የእርስዎ ገቢ', 'Your Earnings')}</p>
                    <p className={`font-bold text-lg ${calculation.creator_earnings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ETB {calculation.creator_earnings.toLocaleString()}
                    </p>
                    {calculation.creator_earnings < 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        ⚠️ {t('እባክዎ መቀመጫዎችን ወይም ክፍያን ይጨምሩ', 'Please increase seats or entry fee')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== PAYMENT DETAILS ===== */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {t('💳 የክፍያ ዝርዝሮች', '💳 Payment Details')}
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('🏦 የባንክ ስም', '🏦 Bank Name')}
                    </label>
                    <input
                      type="text"
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleInputChange}
                      placeholder={t('ለምሳሌ: CBE', 'Example: CBE')}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('🔢 የባንክ ሂሳብ ቁጥር', '🔢 Bank Account Number')}
                    </label>
                    <input
                      type="text"
                      name="bank_account_number"
                      value={formData.bank_account_number}
                      onChange={handleInputChange}
                      placeholder={t('ሂሳብ ቁጥር', 'Account number')}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('👤 የሂሳብ ባለቤት ስም', '👤 Account Holder Name')}
                    </label>
                    <input
                      type="text"
                      name="bank_account_name"
                      value={formData.bank_account_name}
                      onChange={handleInputChange}
                      placeholder={t('ሙሉ ስም', 'Full name')}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('📱 የቴሌብር ቁጥር', '📱 TeleBirr Number')}
                    </label>
                    <input
                      type="tel"
                      name="telebirr_number"
                      value={formData.telebirr_number}
                      onChange={handleInputChange}
                      placeholder="09xxxxxxxx"
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* ===== DOCUMENTS ===== */}
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  {t('📄 ሰነዶች', '📄 Documents')}
                </h3>
                
                {/* Digital ID */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('🪪 ዲጂታል መታወቂያ', '🪪 Digital ID')} *
                    <span className="text-xs text-gray-400 ml-2">
                      {t('(JPG/PNG/PDF, ከፍተኛ 5MB)', '(JPG/PNG/PDF, Max 5MB)')}
                    </span>
                  </label>
                  <ImageUpload
                    id="digital_id"
                    name="digital_id"
                    accept="image/*,application/pdf"
                    preview={previews.digital_id}
                    onChange={handleInputChange}
                    onRemove={() => handleRemoveFile('digital_id')}
                    label={t('ዲጂታል መታወቂያ ምረጥ', 'Choose digital ID')}
                    language={language}
                    required
                  />
                </div>

                {/* Business License */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('📜 የንግድ ፍቃድ', '📜 Business License')}
                    <span className="text-xs text-gray-400 ml-2">
                      {t('(ካለ) (JPG/PNG/PDF, ከፍተኛ 5MB)', '(Optional) (JPG/PNG/PDF, Max 5MB)')}
                    </span>
                  </label>
                  <ImageUpload
                    id="business_license"
                    name="business_license"
                    accept="image/*,application/pdf"
                    preview={previews.business_license}
                    onChange={handleInputChange}
                    onRemove={() => handleRemoveFile('business_license')}
                    label={t('የንግድ ፍቃድ ምረጥ', 'Choose business license')}
                    language={language}
                  />
                </div>
              </div>

              {/* ===== TERMS ===== */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="terms_accepted"
                    checked={formData.terms_accepted}
                    onChange={handleInputChange}
                    className="mt-1"
                    required
                  />
                  <div>
                    <label className="text-sm text-gray-700 font-medium">
                      {t('ውሎችን ተቀብያለሁ', 'I accept the terms')}
                    </label>
                    <p className="text-xs text-gray-500">
                      {t(
                        '10% የመድረክ ክፍያ፣ 2% ለበጎ አድራጎት እና 2% ግብር ከጠቅላላ ስብስብ ላይ ይቀነሳል',
                        '10% platform fee, 2% charity, and 2% tax will be deducted from total collection'
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* ===== SUBMIT ===== */}
              <button
                type="submit"
                disabled={submitting || calculation.creator_earnings < 0}
                className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white py-4 rounded-xl font-bold text-lg transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    {t('በሂደት ላይ...', 'Processing...')}
                  </div>
                ) : (
                  t('📤 ማመልከቻ ላክ', '📤 Submit Application')
                )}
              </button>

              {calculation.creator_earnings < 0 && (
                <p className="text-center text-sm text-red-600">
                  ⚠️ {t('የእርስዎ ገቢ አሉታዊ ነው. እባክዎ መቀመጫዎችን ወይም ክፍያን ይጨምሩ', 'Your earnings are negative. Please increase seats or entry fee')}
                </p>
              )}
            </form>
          </div>
        </DashboardLayout>
      </>
    </NoSSR>
  );
}
