// pages/become-vendor.js - UPDATED FOR UNIFIED SYSTEM
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function BecomeVendor() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'individual',
    tin: '',
    phone: '',
    address: '',
    description: '',
    agree_terms: false
  });
  const [businessLicenseFile, setBusinessLicenseFile] = useState(null);
  const [previewLicense, setPreviewLicense] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirect=/become-vendor');
      return;
    }
    setUser(user);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(profile);
    
    // Check if already a vendor
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id, verified')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existingVendor) {
      if (existingVendor.verified) {
        toast.success('You are already a verified vendor!');
        router.push('/vendor/dashboard');
      } else {
        toast('Your vendor application is pending review', { icon: '⏳' });
        router.push('/dashboard');
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      business_name: profile?.full_name || '',
      phone: profile?.phone || ''
    }));
    setLoading(false);
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid file (JPEG, PNG, PDF)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setBusinessLicenseFile(file);
      setPreviewLicense(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file, folder) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('vendor-documents')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('vendor-documents')
      .getPublicUrl(filePath);
    
    return publicUrl;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.agree_terms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    
    if (!businessLicenseFile) {
      toast.error('Please upload your business license');
      return;
    }
    
    setApplying(true);
    setUploading(true);
    
    try {
      const businessLicenseUrl = await uploadFile(businessLicenseFile, 'business-licenses');
      
      const { error } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          business_name: formData.business_name,
          business_type: formData.business_type,
          tin: formData.tin,
          phone: formData.phone,
          address: formData.address,
          description: formData.description,
          business_license_url: businessLicenseUrl,
          verified: false,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success('Application submitted! Admin will review it soon.');
      router.push('/dashboard');
      
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Become a Vendor - Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <div className="text-4xl mb-2">🏪</div>
              <h1 className="text-2xl font-bold">Become a Vendor</h1>
              <p className="opacity-90 mt-1">List your products as prizes and earn commission</p>
            </div>

            <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50">
              <h2 className="font-bold text-gray-800 mb-3">✨ What You Get:</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <div className="text-2xl mb-1">💰</div>
                  <p className="font-semibold">10% Commission</p>
                  <p className="text-xs text-gray-500">On every product sold</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <div className="text-2xl mb-1">🏷️</div>
                  <p className="font-semibold">Discount Offers</p>
                  <p className="text-xs text-gray-500">5-50% to non-winners</p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm">
                  <div className="text-2xl mb-1">📈</div>
                  <p className="font-semibold">Marketing</p>
                  <p className="text-xs text-gray-500">Promoted to all users</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <input type="text" name="business_name" required value={formData.business_name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                  <select name="business_type" value={formData.business_type} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500">
                    <option value="individual">Individual / Sole Proprietor</option>
                    <option value="business">Business / Company</option>
                    <option value="organization">Organization</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TIN Number *</label>
                  <input type="text" name="tin" required value={formData.tin} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Your TIN number" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="09xxxxxxxx" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Address *</label>
                <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="City, Sub-city, Woreda" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Your Business *</label>
                <textarea name="description" rows="3" required value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500" placeholder="Tell us about your products..." />
              </div>

              {/* Business License Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business License *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition">
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" id="businessLicense" />
                  <label htmlFor="businessLicense" className="cursor-pointer">
                    {previewLicense ? (
                      <div>
                        {previewLicense.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={previewLicense} alt="Preview" className="max-h-32 mx-auto mb-2 rounded" />
                        ) : (
                          <div className="text-center">
                            <svg className="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-green-600 text-sm mt-2">✓ License uploaded</p>
                          </div>
                        )}
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

              {/* Terms Agreement */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="agreeTerms" checked={formData.agree_terms} onChange={(e) => setFormData({ ...formData, agree_terms: e.target.checked })} className="w-4 h-4 text-purple-600" />
                <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                  I agree to the <a href="/terms" className="text-purple-600 hover:underline">Terms and Conditions</a> for Vendors
                </label>
              </div>

              <button type="submit" disabled={applying || uploading} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50">
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
                Already a vendor? 
                <Link href="/vendor/dashboard" className="text-purple-600 font-semibold ml-1">Go to Dashboard →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
