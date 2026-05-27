import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function VendorApply() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    business_name: '',
    business_type: '',
    tin_number: '',
    business_address: '',
    description: '',
    digital_id_front: null,
    digital_id_back: null,
    business_license: null
  });
  
  const [previews, setPreviews] = useState({
    digital_id_front: null,
    digital_id_back: null,
    business_license: null
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    
    setUser(user);
    setFormData(prev => ({
      ...prev,
      full_name: user.user_metadata?.full_name || '',
      email: user.email
    }));
    
    // Check if already applied
    const { data: existing } = await supabase
      .from('vendors')
      .select('id, verified')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existing) {
      if (existing.verified) {
        toast.success('You are already an approved vendor!');
        router.push('/vendor/dashboard');
      } else {
        toast.loading('Your application is pending review', { duration: 3000 });
      }
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return null;
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_${type}_${Date.now()}.${fileExt}`;
    const filePath = `vendor-documents/${fileName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('verification-docs')
      .upload(filePath, file);
    
    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      setUploading(false);
      return null;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(filePath);
    
    setUploading(false);
    return publicUrl;
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB');
      return;
    }
    
    setFormData(prev => ({ ...prev, [field]: file }));
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.digital_id_front) {
      toast.error('Please upload your Digital ID (Front)');
      return;
    }
    
    if (!formData.digital_id_back) {
      toast.error('Please upload your Digital ID (Back)');
      return;
    }
    
    if (!formData.business_license) {
      toast.error('Please upload your Business License');
      return;
    }
    
    if (!formData.business_name || !formData.tin_number) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    
    try {
      const frontUrl = await handleFileUpload(formData.digital_id_front, 'id_front');
      const backUrl = await handleFileUpload(formData.digital_id_back, 'id_back');
      const licenseUrl = await handleFileUpload(formData.business_license, 'license');
      
      if (!frontUrl || !backUrl || !licenseUrl) throw new Error('Document upload failed');
      
      const { error } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          business_name: formData.business_name,
          business_type: formData.business_type,
          tin_number: formData.tin_number,
          business_address: formData.business_address,
          description: formData.description,
          digital_id_front_url: frontUrl,
          digital_id_back_url: backUrl,
          business_license_url: licenseUrl,
          verified: false,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      await supabase
        .from('profiles')
        .update({ user_type: 'vendor', role: 'vendor' })
        .eq('id', user.id);
      
      toast.success('Application submitted! Admin will review within 24-48 hours.');
      setTimeout(() => router.push('/dashboard'), 2000);
      
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Become a Vendor - Abbaa Carraa</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🏪</span>
                <div>
                  <h1 className="text-2xl font-bold text-white">Become a Vendor</h1>
                  <p className="text-purple-100">List products and earn 10% commission</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Personal Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" value={formData.full_name} disabled className="w-full border rounded-lg px-4 py-2 bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" value={formData.email} disabled className="w-full border rounded-lg px-4 py-2 bg-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input type="tel" required placeholder="09XXXXXXXX" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
              </div>
              
              {/* Business Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Business Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                    <input type="text" required placeholder="Your business name" value={formData.business_name} onChange={(e) => setFormData({...formData, business_name: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                    <select value={formData.business_type} onChange={(e) => setFormData({...formData, business_type: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500">
                      <option value="">Select type</option>
                      <option value="retail">Retail</option>
                      <option value="wholesale">Wholesale</option>
                      <option value="manufacturing">Manufacturing</option>
                      <option value="service">Service</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TIN Number *</label>
                    <input type="text" required placeholder="Your Tax Identification Number" value={formData.tin_number} onChange={(e) => setFormData({...formData, tin_number: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Address</label>
                    <input type="text" placeholder="Location, city, sub-city" value={formData.business_address} onChange={(e) => setFormData({...formData, business_address: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
                  <textarea rows="2" placeholder="Describe what products you sell..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              
              {/* Document Uploads */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Document Verification</h2>
                <p className="text-sm text-gray-500">Please upload clear images of your documents</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Digital ID - Front *</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'digital_id_front')} className="w-full border rounded-lg px-3 py-2" />
                    {previews.digital_id_front && <img src={previews.digital_id_front} alt="ID Front" className="mt-2 max-h-24 rounded border" />}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Digital ID - Back *</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'digital_id_back')} className="w-full border rounded-lg px-3 py-2" />
                    {previews.digital_id_back && <img src={previews.digital_id_back} alt="ID Back" className="mt-2 max-h-24 rounded border" />}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business License *</label>
                    <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'business_license')} className="w-full border rounded-lg px-3 py-2" />
                    {previews.business_license && <img src={previews.business_license} alt="License" className="mt-2 max-h-24 rounded border" />}
                  </div>
                </div>
              </div>
              
              {/* Submit */}
              <div className="pt-4">
                <button type="submit" disabled={loading || uploading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50">
                  {loading ? 'Submitting...' : uploading ? 'Uploading...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
