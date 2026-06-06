// pages/become-agent.js - UPDATED FOR UNIFIED AGENT SYSTEM
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import toast from 'react-hot-toast';

// Program types for agent selection
const PROGRAM_TYPES = [
  { value: 'all', label: 'All Programs', labelAm: 'ሁሉም ፕሮግራሞች', description: 'Regular Pools + City VIP + Merkato VIP' },
  { value: 'regular', label: 'Regular Pools Only', labelAm: 'መደበኛ የእጣ መደቦች ብቻ', description: 'Manage regular prize pools' },
  { value: 'city_vip', label: 'City VIP Only', labelAm: 'የከተማ VIP ብቻ', description: 'Manage a specific city\'s VIP program' },
  { value: 'merkato_vip', label: 'Merkato VIP Only', labelAm: 'መርካቶ VIP ብቻ', description: 'Manage Merkato VIP program' },
];

// Ethiopian cities list
const ETHIOPIAN_CITIES = [
  { code: 'addis-ababa', name: 'አዲስ አበባ', nameEn: 'Addis Ababa' },
  { code: 'shaggar', name: 'ሸገር', nameEn: 'Shaggar City' },
  { code: 'dire-dawa', name: 'ድሬ ዳዋ', nameEn: 'Dire Dawa' },
  { code: 'mekelle', name: 'መቀሌ', nameEn: 'Mekelle' },
  { code: 'adama', name: 'አዳማ', nameEn: 'Adama' },
  { code: 'hawassa', name: 'ሀዋሳ', nameEn: 'Hawassa' },
  { code: 'gondar', name: 'ጎንደር', nameEn: 'Gondar' },
  { code: 'bahir-dar', name: 'ባህር ዳር', nameEn: 'Bahir Dar' },
  { code: 'jimma', name: 'ጅማ', nameEn: 'Jimma' },
  { code: 'bishoftu', name: 'ቢሾፍቱ', nameEn: 'Bishoftu' },
  { code: 'dessie', name: 'ደሴ', nameEn: 'Dessie' },
  { code: 'jijiga', name: 'ጅጅጋ', nameEn: 'Jijiga' },
  { code: 'harar', name: 'ሀረር', nameEn: 'Harar' },
  { code: 'arba-minch', name: 'አርባ ምንጭ', nameEn: 'Arba Minch' },
  { code: 'sodo', name: 'ሶዶ', nameEn: 'Sodo' },
  { code: 'assosa', name: 'አሶሳ', nameEn: 'Assosa' },
  { code: 'semera', name: 'ሰሜራ', nameEn: 'Semera' },
  { code: 'gambella', name: 'ጋምቤላ', nameEn: 'Gambella' },
  { code: 'axum', name: 'አክሱም', nameEn: 'Axum' },
  { code: 'adigrat', name: 'አዲግራት', nameEn: 'Adigrat' },
  { code: 'shire', name: 'ሽሬ', nameEn: 'Shire' },
  { code: 'woldia', name: 'ወልዲያ', nameEn: 'Woldia' },
  { code: 'debre-birhan', name: 'ደብረ ብርሃን', nameEn: 'Debre Birhan' },
  { code: 'kombolcha', name: 'ኮምቦልቻ', nameEn: 'Kombolcha' },
  { code: 'robe', name: 'ሮቤ', nameEn: 'Robe' },
  { code: 'nekemte', name: 'ነቀምቴ', nameEn: 'Nekemte' },
  { code: 'ambo', name: 'አምቦ', nameEn: 'Ambo' },
  { code: 'metu', name: 'መቱ', nameEn: 'Metu' },
  { code: 'ziway', name: 'ዚዋይ', nameEn: 'Ziway' },
  { code: 'asella', name: 'አሰላ', nameEn: 'Asella' },
  { code: 'shashemene', name: 'ሻሸመኔ', nameEn: 'Shashemene' },
];

export default function BecomeAgent() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    business_name: '',
    phone: '',
    email: '',
    program_type: 'all',
    city_code: '',
    tin_number: '',
    business_address: '',
    agree_terms: false
  });
  const [digitalIdFile, setDigitalIdFile] = useState(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [previewDigitalId, setPreviewDigitalId] = useState(null);
  const [previewLicense, setPreviewLicense] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/become-agent');
        return;
      }
      setUser(user);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profile);
      
      // Check if already applied as agent
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id, is_approved, status')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existingAgent) {
        if (existingAgent.is_approved) {
          toast.success('You are already an approved agent!');
          router.push('/agent/dashboard');
          return;
        } else {
          toast('Your agent application is pending admin review', { icon: '⏳' });
          router.push('/dashboard');
          return;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        full_name: profile?.full_name || user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: profile?.phone || '',
        business_name: profile?.full_name || '',
      }));
      setLoading(false);
      
    } catch (error) {
      console.error('Error checking user:', error);
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid file (JPEG, PNG, PDF)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'digital_id') {
        setDigitalIdFile(file);
        setPreviewDigitalId(reader.result);
      } else {
        setBusinessLicenseFile(file);
        setPreviewLicense(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file, folder) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('agent-documents')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('agent-documents')
      .getPublicUrl(filePath);
    
    return publicUrl;
  };

  const generateReferralCode = () => {
    const programPrefix = formData.program_type === 'city_vip' ? 'CITY' : 
                          formData.program_type === 'merkato_vip' ? 'MRKT' : 'REG';
    const cityPrefix = formData.city_code ? formData.city_code.substring(0, 3).toUpperCase() : 'ALL';
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${programPrefix}_${cityPrefix}_${randomStr}`;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.agree_terms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    
    if (formData.program_type === 'city_vip' && !formData.city_code) {
      toast.error('Please select a city for City VIP program');
      return;
    }
    
    if (!digitalIdFile) {
      toast.error('Please upload your digital ID / Kebele ID');
      return;
    }
    
    if (!businessLicenseFile) {
      toast.error('Please upload your business license');
      return;
    }
    
    setApplying(true);
    setUploading(true);
    
    try {
      // Upload documents
      const digitalIdUrl = await uploadFile(digitalIdFile, 'digital-ids');
      const businessLicenseUrl = await uploadFile(businessLicenseFile, 'business-licenses');
      
      const referralCode = generateReferralCode();
      const cityInfo = ETHIOPIAN_CITIES.find(c => c.code === formData.city_code);
      
      const { error: insertError } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          program_type: formData.program_type,
          city_code: formData.city_code || null,
          city_name: cityInfo?.name || null,
          business_name: formData.business_name,
          business_address: formData.business_address,
          tin_number: formData.tin_number,
          digital_id_url: digitalIdUrl,
          business_license_url: businessLicenseUrl,
          referral_code: referralCode,
          is_approved: false,
          status: 'pending',
          created_at: new Date().toISOString()
        });
      
      if (insertError) throw insertError;
      
      toast.success('Application submitted successfully! Admin will review your documents.');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
      
    } catch (error) {
      console.error('Submission error:', error);
      toast.error('Failed to submit application: ' + error.message);
    } finally {
      setApplying(false);
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Become an Agent - Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
              <div className="text-4xl mb-2">🤝</div>
              <h1 className="text-2xl font-bold">Become an Agent</h1>
              <p className="opacity-90 mt-1">Earn 10% commission on every successful contribution</p>
            </div>

            {/* Benefits Banner */}
            <div className="p-6 border-b bg-gradient-to-r from-yellow-50 to-orange-50">
              <h2 className="font-bold text-gray-800 mb-3">✨ What You Get:</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <div className="text-2xl mb-1">💰</div>
                  <p className="font-semibold">10% Commission</p>
                  <p className="text-xs text-gray-500">On every successful contribution</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <div className="text-2xl mb-1">🔗</div>
                  <p className="font-semibold">Referral Link</p>
                  <p className="text-xs text-gray-500">Track all your customers</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <div className="text-2xl mb-1">💳</div>
                  <p className="font-semibold">Easy Withdrawal</p>
                  <p className="text-xs text-gray-500">Telebirr or Bank Transfer</p>
                </div>
              </div>
            </div>

            {/* Application Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Personal Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="09xxxxxxxx"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input
                    type="text"
                    name="business_name"
                    required
                    value={formData.business_name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                    placeholder="Your business/shop name"
                  />
                </div>
              </div>

              {/* Program Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Program Type *</label>
                <select
                  name="program_type"
                  required
                  value={formData.program_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                >
                  {PROGRAM_TYPES.map(program => (
                    <option key={program.value} value={program.value}>
                      {program.label} | {program.labelAm}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {PROGRAM_TYPES.find(p => p.value === formData.program_type)?.description}
                </p>
              </div>

              {/* City Selection (for City VIP) */}
              {formData.program_type === 'city_vip' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Your City *</label>
                  <select
                    name="city_code"
                    required
                    value={formData.city_code}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Select a city</option>
                    {ETHIOPIAN_CITIES.map(city => (
                      <option key={city.code} value={city.code}>
                        {city.name} | {city.nameEn}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">You will be the agent for this city's VIP program</p>
                </div>
              )}

              {/* Business Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address *</label>
                <textarea
                  name="business_address"
                  required
                  value={formData.business_address}
                  onChange={handleChange}
                  rows="2"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="Full address of your shop or business location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TIN Number (የግብር ቁጥር) *</label>
                <input
                  type="text"
                  name="tin_number"
                  required
                  value={formData.tin_number}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  placeholder="Your TIN number"
                />
              </div>

              {/* Document Uploads */}
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-800 mb-3">Required Documents</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Digital ID / Kebele ID *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-yellow-500 transition">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'digital_id')}
                      className="hidden"
                      id="digitalId"
                    />
                    <label htmlFor="digitalId" className="cursor-pointer">
                      {previewDigitalId ? (
                        <div>
                          <img src={previewDigitalId} alt="Preview" className="max-h-32 mx-auto mb-2 rounded" />
                          <p className="text-green-600 text-sm">✓ Document uploaded</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-gray-500 mt-2">Click to upload Digital ID</p>
                          <p className="text-xs text-gray-400">JPEG, PNG, PDF (Max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business License *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-yellow-500 transition">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'license')}
                      className="hidden"
                      id="businessLicense"
                    />
                    <label htmlFor="businessLicense" className="cursor-pointer">
                      {previewLicense ? (
                        <div>
                          <img src={previewLicense} alt="Preview" className="max-h-32 mx-auto mb-2 rounded" />
                          <p className="text-green-600 text-sm">✓ License uploaded</p>
                        </div>
                      ) : (
                        <div>
                          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-gray-500 mt-2">Click to upload Business License</p>
                          <p className="text-xs text-gray-400">JPEG, PNG, PDF (Max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={formData.agree_terms}
                  onChange={(e) => setFormData({ ...formData, agree_terms: e.target.checked })}
                  className="w-4 h-4 text-yellow-600"
                />
                <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                  I agree to the <a href="/terms" className="text-yellow-600 hover:underline">Terms and Conditions</a> for Agents
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={applying || uploading}
                className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {applying || uploading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting Application...
                  </span>
                ) : (
                  'Submit Application →'
                )}
              </button>
            </form>

            <div className="p-6 border-t text-center bg-gray-50">
              <p className="text-gray-600 text-sm">
                Already an agent? 
                <Link href="/agent/dashboard" className="text-yellow-600 font-semibold ml-1">Go to Dashboard →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
