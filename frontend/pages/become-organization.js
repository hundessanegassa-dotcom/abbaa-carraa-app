// pages/become-organization.js - UPDATED FOR UNIFIED SYSTEM
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function BecomeOrganization() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: '',
    organization_type: 'association',
    registration_number: '',
    tin: '',
    phone: '',
    email: '',
    address: '',
    description: '',
    website: '',
    agree_terms: false
  });
  const [registrationDocFile, setRegistrationDocFile] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirect=/become-organization');
      return;
    }
    setUser(user);
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(profile);
    
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id, verified')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existingOrg) {
      if (existingOrg.verified) {
        toast.success('You are already a verified organization!');
        router.push('/organization/dashboard');
      } else {
        toast('Your organization application is pending review', { icon: '⏳' });
        router.push('/dashboard');
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      organization_name: profile?.full_name || '',
      phone: profile?.phone || '',
      email: user.email || ''
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
      setRegistrationDocFile(file);
      setPreviewDoc(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadFile = async (file, folder) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('organization-documents')
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('organization-documents')
      .getPublicUrl(filePath);
    
    return publicUrl;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.agree_terms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }
    
    if (!registrationDocFile) {
      toast.error('Please upload your organization registration document');
      return;
    }
    
    const { data: existing } = await supabase
      .from('organizations')
      .select('id')
      .eq('business_name', formData.organization_name)
      .maybeSingle();
    
    if (existing) {
      toast.error('An organization with this name already exists');
      return;
    }
    
    setApplying(true);
    setUploading(true);
    
    try {
      const registrationDocUrl = await uploadFile(registrationDocFile, 'registration-docs');
      
      const { error } = await supabase
        .from('organizations')
        .insert({
          user_id: user.id,
          business_name: formData.organization_name,
          organization_type: formData.organization_type,
          registration_number: formData.registration_number,
          registration_document_url: registrationDocUrl,
          tin: formData.tin,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          description: formData.description,
          website: formData.website,
          verified: false,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      toast.success('Organization application submitted! Admin will review it soon.');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Become an Organization - Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white">
              <div className="text-4xl mb-2">🏢</div>
              <h1 className="text-2xl font-bold">Become an Organization</h1>
              <p className="opacity-90 mt-1">Create private pools for your members and earn 10% commission</p>
            </div>

            <div className="p-6 bg-blue-50 border-b border-blue-100">
              <h2 className="font-bold text-blue-800 mb-3 flex items-center gap-2"><span>💰</span> How You Earn</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="font-semibold text-green-600 text-lg">10% Commission</p>
                  <p className="text-sm text-gray-600">You earn 10% commission on every private pool you create</p>
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Example:</p>
                    <p className="text-sm font-semibold">500,000 ETB pool → You earn 50,000 ETB</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <p className="font-semibold text-blue-600 text-lg">🏊 Private Pools</p>
                  <p className="text-sm text-gray-600">Create pools visible only to your organization members</p>
                  <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Perfect for:</p>
                    <p className="text-sm">Staff savings, member engagement, team building</p>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                  <input type="text" name="organization_name" required value={formData.organization_name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Type *</label>
                  <select name="organization_type" value={formData.organization_type} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" required>
                    <option value="association">Association / Union</option>
                    <option value="cooperative">Cooperative</option>
                    <option value="ngo">NGO / Non-profit</option>
                    <option value="business">Business / Company</option>
                    <option value="religious">Religious Organization</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number *</label>
                  <input type="text" name="registration_number" required value={formData.registration_number} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="License / Registration No" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">TIN (Tax ID) *</label>
                  <input type="text" name="tin" required value={formData.tin} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="For payouts above 10,000 ETB" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input type="tel" name="phone" required value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="09xxxxxxxx" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="organization@example.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="City, Sub-city, Woreda" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website (Optional)</label>
                <input type="url" name="website" value={formData.website} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="https://..." />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Your Organization *</label>
                <textarea name="description" rows="3" required value={formData.description} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Tell us about your organization..." />
              </div>

              {/* Registration Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Registration Document *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-500 transition">
                  <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className="hidden" id="registrationDoc" />
                  <label htmlFor="registrationDoc" className="cursor-pointer">
                    {previewDoc ? (
                      <div>
                        {previewDoc.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={previewDoc} alt="Preview" className="max-h-32 mx-auto mb-2 rounded" />
                        ) : (
                          <div className="text-center">
                            <svg className="w-12 h-12 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-green-600 text-sm mt-2">✓ Document uploaded</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 mt-2">Click to upload Registration Document</p>
                        <p className="text-xs text-gray-400">JPEG, PNG, PDF (Max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Terms Agreement */}
              <div className="flex items-center gap-2">
                <input type="checkbox" id="agreeTerms" checked={formData.agree_terms} onChange={(e) => setFormData({ ...formData, agree_terms: e.target.checked })} className="w-4 h-4 text-blue-600" />
                <label htmlFor="agreeTerms" className="text-sm text-gray-600">
                  I agree to the <a href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</a> for Organizations
                </label>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <p className="text-sm text-yellow-800 flex items-start gap-2">
                  <span>ℹ️</span>
                  <span>Your application will be reviewed within 2-3 business days. Once approved, you can create private pools and start earning 10% commission!</span>
                </p>
              </div>

              <button type="submit" disabled={applying || uploading} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50">
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
                Already have an organization account? 
                <Link href="/organization/dashboard" className="text-blue-600 font-semibold ml-1">Go to Dashboard →</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
