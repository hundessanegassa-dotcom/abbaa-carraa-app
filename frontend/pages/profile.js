// pages/profile.js - Complete Profile Management with 3D Effects, Image Upload & Enhanced Features
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [user, setUser] = useState(null);
  const [language, setLanguage] = useState('am');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    full_name: '',
    full_name_am: '',
    phone: '',
    location: '',
    address: '',
    address_am: '',
    city: '',
    city_am: '',
    profile_image: '',
    bio: '',
    bio_am: '',
    birth_date: '',
    gender: '',
    occupation: '',
    occupation_am: '',
    id_number: '',
    emergency_contact: '',
    emergency_phone: '',
    telegram: '',
    instagram: '',
    twitter: '',
    facebook: '',
    notification_preferences: {
      email: true,
      sms: true,
      push: true
    }
  });
  const [is3D, setIs3D] = useState(true);
  const [rotation, setRotation] = useState(0);
  const animationRef = useRef(null);

  // Load language preference
  useEffect(() => {
    const savedLang = localStorage.getItem('appLanguage');
    if (savedLang === 'am' || savedLang === 'en') {
      setLanguage(savedLang);
    }
  }, []);

  // Auto-rotation for 3D effect
  useEffect(() => {
    if (is3D) {
      const animate = () => {
        setRotation(prev => (prev + 0.2) % 360);
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (data) {
        setProfile({
          full_name: data.full_name || user.user_metadata?.full_name || '',
          full_name_am: data.full_name_am || '',
          phone: data.phone || '',
          location: data.location || '',
          address: data.address || '',
          address_am: data.address_am || '',
          city: data.city || '',
          city_am: data.city_am || '',
          profile_image: data.profile_image || '',
          bio: data.bio || '',
          bio_am: data.bio_am || '',
          birth_date: data.birth_date || '',
          gender: data.gender || '',
          occupation: data.occupation || '',
          occupation_am: data.occupation_am || '',
          id_number: data.id_number || '',
          emergency_contact: data.emergency_contact || '',
          emergency_phone: data.emergency_phone || '',
          telegram: data.telegram || '',
          instagram: data.instagram || '',
          twitter: data.twitter || '',
          facebook: data.facebook || '',
          notification_preferences: data.notification_preferences || {
            email: true,
            sms: true,
            push: true
          }
        });
        if (data.profile_image) {
          setPreviewUrl(data.profile_image);
        }
      } else {
        // Create profile if doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || '',
            created_at: new Date().toISOString()
          });
        
        if (insertError) console.error('Error creating profile:', insertError);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setProfile({
        ...profile,
        notification_preferences: {
          ...profile.notification_preferences,
          [name]: checked
        }
      });
    } else {
      setProfile({
        ...profile,
        [name]: value
      });
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WEBP, GIF)');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const uploadProfileImage = async () => {
    if (!selectedFile) return null;

    try {
      const compressedFile = await compressImage(selectedFile);
      const fileName = `profile-images/${user.id}/${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload profile image');
      return null;
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width, height = img.height;
          const maxSize = 500;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { 
              type: 'image/jpeg' 
            }));
          }, 'image/jpeg', 0.8);
        };
      };
      reader.onerror = () => resolve(file);
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let profileImage = profile.profile_image;
      
      if (selectedFile) {
        const uploadedUrl = await uploadProfileImage();
        if (uploadedUrl) {
          profileImage = uploadedUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          full_name_am: profile.full_name_am,
          phone: profile.phone,
          location: profile.location,
          address: profile.address,
          address_am: profile.address_am,
          city: profile.city,
          city_am: profile.city_am,
          profile_image: profileImage,
          bio: profile.bio,
          bio_am: profile.bio_am,
          birth_date: profile.birth_date,
          gender: profile.gender,
          occupation: profile.occupation,
          occupation_am: profile.occupation_am,
          id_number: profile.id_number,
          emergency_contact: profile.emergency_contact,
          emergency_phone: profile.emergency_phone,
          telegram: profile.telegram,
          instagram: profile.instagram,
          twitter: profile.twitter,
          facebook: profile.facebook,
          notification_preferences: profile.notification_preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, profile_image: profileImage }));
      toast.success('Profile updated successfully! 🎉');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggle3D = () => {
    setIs3D(!is3D);
  };

  const get3DTransform = () => {
    if (!is3D) return 'none';
    return `perspective(800px) rotateY(${rotation}deg)`;
  };

  const isComplete = () => {
    return profile.full_name && profile.phone && profile.city;
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading profile..." />;
  }

  return (
    <>
      <Head>
        <title>My Profile - Abbaa Carraa</title>
      </Head>

      <DashboardLayout 
        title={language === 'am' ? 'የእኔ መገለጫ' : 'My Profile'} 
        subtitle={language === 'am' ? 'የግል መረጃዎን ያስተዳድሩ' : 'Manage your personal information'}
        icon="👤"
        bgGradient="from-blue-600 to-cyan-500"
        user={user}
        profile={profile}
        language={language}
        toggleLanguage={() => {
          const newLang = language === 'am' ? 'en' : 'am';
          setLanguage(newLang);
          localStorage.setItem('appLanguage', newLang);
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* 3D Profile Card */}
          <div 
            className="bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500"
            style={{
              transform: get3DTransform(),
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {language === 'am' ? 'የግል መረጃ' : 'Personal Information'}
                </h2>
                <p className="text-blue-100 text-sm">
                  {language === 'am' ? 'የመገለጫ ዝርዝሮችዎን ያዘምኑ' : 'Update your profile details'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggle3D}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    is3D 
                      ? 'bg-white/20 text-white hover:bg-white/30' 
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  {is3D ? '🔄 3D ON' : '🔄 3D OFF'}
                </button>
                <button
                  onClick={() => {
                    const newLang = language === 'am' ? 'en' : 'am';
                    setLanguage(newLang);
                    localStorage.setItem('appLanguage', newLang);
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
                >
                  {language === 'am' ? '🇬🇧 English' : '🇪🇹 አማርኛ'}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Image */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-5xl">
                        {profile.full_name ? profile.full_name[0].toUpperCase() : '👤'}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition"
                  >
                    📷
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {language === 'am' ? 'ምስል ለመለወጥ ጠቅ ያድርጉ' : 'Click to change image'}
                </p>
                {selectedFile && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {language === 'am' ? 'አዲስ ምስል ተመርጧል' : 'New image selected'} ✅
                  </p>
                )}
              </div>

              {/* Profile Completion */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {language === 'am' ? 'የመገለጫ ሙሌት' : 'Profile Completion'}
                  </span>
                  <span className="text-sm font-bold text-blue-600">
                    {isComplete() ? '100%' : '67%'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      isComplete() ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: isComplete() ? '100%' : '67%' }}
                  />
                </div>
                {!isComplete() && (
                  <p className="text-xs text-amber-600 mt-2">
                    ⚠️ {language === 'am' ? 'እባክዎ ሙሉ ስም፣ ስልክ ቁጥር እና ከተማ ይሙሉ' : 'Please fill in full name, phone, and city'}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ኢሜይል' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full border rounded-lg px-4 py-2 bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'am' ? 'ኢሜይል መለወጥ አይቻልም' : 'Email cannot be changed'}
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ሙሉ ስም' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleChange}
                    placeholder={language === 'am' ? 'ሙሉ ስምዎን ያስገቡ' : 'Enter your full name'}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Full Name (Amharic) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ሙሉ ስም (አማርኛ)' : 'Full Name (Amharic)'}
                  </label>
                  <input
                    type="text"
                    name="full_name_am"
                    value={profile.full_name_am || ''}
                    onChange={handleChange}
                    placeholder="ሙሉ ስም በአማርኛ"
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-amharic"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    placeholder="09XXXXXXXX"
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {language === 'am' ? 'ለሽልማት አስፈላጊ' : 'Required for prize delivery'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'አካባቢ / ክፍለ ከተማ' : 'Location / Sub-city'}
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    placeholder={language === 'am' ? 'ለምሳሌ ቦሌ፣ ኪርኮስ፣ ሊደታ' : 'e.g., Bole, Kirkos, Lideta'}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ከተማ' : 'City'}
                  </label>
                  <select
                    name="city"
                    value={profile.city}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{language === 'am' ? 'ከተማ ይምረጡ' : 'Select City'}</option>
                    <option value="Addis Ababa">Addis Ababa</option>
                    <option value="Adama">Adama</option>
                    <option value="Bahir Dar">Bahir Dar</option>
                    <option value="Dire Dawa">Dire Dawa</option>
                    <option value="Gondar">Gondar</option>
                    <option value="Hawassa">Hawassa</option>
                    <option value="Jimma">Jimma</option>
                    <option value="Mekelle">Mekelle</option>
                    <option value="Other">{language === 'am' ? 'ሌላ' : 'Other'}</option>
                  </select>
                </div>

                {/* City (Amharic) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ከተማ (አማርኛ)' : 'City (Amharic)'}
                  </label>
                  <input
                    type="text"
                    name="city_am"
                    value={profile.city_am || ''}
                    onChange={handleChange}
                    placeholder="ከተማ በአማርኛ"
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-amharic"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ሙሉ አድራሻ' : 'Full Address'}
                  </label>
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleChange}
                    rows="2"
                    placeholder={language === 'am' ? 'ለሽልማት አድራሻዎ...' : 'Your complete address for prize delivery...'}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ስለ እርስዎ' : 'Bio'}
                  </label>
                  <textarea
                    name="bio"
                    value={profile.bio || ''}
                    onChange={handleChange}
                    rows="2"
                    placeholder={language === 'am' ? 'ስለ እርስዎ ትንሽ...' : 'Tell us about yourself...'}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Bio (Amharic) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ስለ እርስዎ (አማርኛ)' : 'Bio (Amharic)'}
                  </label>
                  <textarea
                    name="bio_am"
                    value={profile.bio_am || ''}
                    onChange={handleChange}
                    rows="2"
                    placeholder="ስለ እርስዎ በአማርኛ..."
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-amharic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Birth Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'የትውልድ ቀን' : 'Birth Date'}
                  </label>
                  <input
                    type="date"
                    name="birth_date"
                    value={profile.birth_date || ''}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ጾታ' : 'Gender'}
                  </label>
                  <select
                    name="gender"
                    value={profile.gender || ''}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">{language === 'am' ? 'ይምረጡ' : 'Select'}</option>
                    <option value="Male">{language === 'am' ? 'ወንድ' : 'Male'}</option>
                    <option value="Female">{language === 'am' ? 'ሴት' : 'Female'}</option>
                    <option value="Other">{language === 'am' ? 'ሌላ' : 'Other'}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ሙያ' : 'Occupation'}
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={profile.occupation || ''}
                    onChange={handleChange}
                    placeholder={language === 'am' ? 'ሙያዎ' : 'Your occupation'}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Occupation (Amharic) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'ሙያ (አማርኛ)' : 'Occupation (Amharic)'}
                  </label>
                  <input
                    type="text"
                    name="occupation_am"
                    value={profile.occupation_am || ''}
                    onChange={handleChange}
                    placeholder="ሙያ በአማርኛ"
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-amharic"
                  />
                </div>
              </div>

              {/* ID Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'am' ? 'የመታወቂያ ቁጥር' : 'ID Number'}
                </label>
                <input
                  type="text"
                  name="id_number"
                  value={profile.id_number || ''}
                  onChange={handleChange}
                  placeholder={language === 'am' ? 'የመታወቂያ ቁጥርዎ' : 'Your ID number'}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {language === 'am' ? 'ለደህንነት አላማ' : 'For security purposes'}
                </p>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'የአደጋ ጊዜ እውቂያ' : 'Emergency Contact'}
                  </label>
                  <input
                    type="text"
                    name="emergency_contact"
                    value={profile.emergency_contact || ''}
                    onChange={handleChange}
                    placeholder={language === 'am' ? 'ስም' : 'Name'}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {language === 'am' ? 'የአደጋ ጊዜ ስልክ' : 'Emergency Phone'}
                  </label>
                  <input
                    type="tel"
                    name="emergency_phone"
                    value={profile.emergency_phone || ''}
                    onChange={handleChange}
                    placeholder="09XXXXXXXX"
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Social Media */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {language === 'am' ? 'ማህበራዊ ሚዲያ' : 'Social Media'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Telegram</label>
                    <input
                      type="text"
                      name="telegram"
                      value={profile.telegram || ''}
                      onChange={handleChange}
                      placeholder="@username"
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Instagram</label>
                    <input
                      type="text"
                      name="instagram"
                      value={profile.instagram || ''}
                      onChange={handleChange}
                      placeholder="@username"
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Twitter/X</label>
                    <input
                      type="text"
                      name="twitter"
                      value={profile.twitter || ''}
                      onChange={handleChange}
                      placeholder="@username"
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Facebook</label>
                    <input
                      type="text"
                      name="facebook"
                      value={profile.facebook || ''}
                      onChange={handleChange}
                      placeholder="Profile URL"
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {language === 'am' ? 'የማሳወቂያ ምርጫዎች' : 'Notification Preferences'}
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="email"
                      checked={profile.notification_preferences?.email !== false}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {language === 'am' ? 'የኢሜይል ማሳወቂያዎች' : 'Email Notifications'}
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="sms"
                      checked={profile.notification_preferences?.sms !== false}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {language === 'am' ? 'የኤስኤምኤስ ማሳወቂያዎች' : 'SMS Notifications'}
                    </span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="push"
                      checked={profile.notification_preferences?.push !== false}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      {language === 'am' ? 'የፑሽ ማሳወቂያዎች' : 'Push Notifications'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <span className="text-yellow-600 text-xl">⚠️</span>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800">
                      {language === 'am' ? 'አስፈላጊ' : 'Important'}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      {language === 'am' 
                        ? 'ለሽልማት አስረካቢ መረጃ መሙላት አስፈላጊ ነው። አሸናፊዎች በ7 ቀናት ውስጥ ሙሉ መረጃ ማቅረብ አለባቸው።'
                        : 'Complete your profile to ensure smooth prize delivery. Winners must provide valid address and phone number within 7 days of winning notification.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-4">
                <button
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving || uploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {language === 'am' ? 'በሂደት ላይ...' : 'Saving...'}
                    </>
                  ) : (
                    <>
                      💾 {language === 'am' ? 'ለውጦችን አስቀምጥ' : 'Save Changes'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
