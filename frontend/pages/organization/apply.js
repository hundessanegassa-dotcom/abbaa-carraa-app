import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function OrganizationApply() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    organization_name: '',
    organization_id_number: '',
    organization_id_image: null,
    reason: ''
  });
  
  const [preview, setPreview] = useState(null);

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
    
    const { data: existing } = await supabase
      .from('organizations')
      .select('id, verified')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existing) {
      if (existing.verified) {
        toast.success('You are already an approved organization!');
        router.push('/organization/dashboard');
      } else {
        toast.loading('Your application is pending review', { duration: 3000 });
      }
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return null;
    
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}_org_id_${Date.now()}.${fileExt}`;
    const filePath = `organization-documents/${fileName}`;
    
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

  const handleFileChange = (e) => {
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
    
    setFormData(prev => ({ ...prev, organization_id_image: file }));
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.organization_name) {
      toast.error('Please enter your organization name');
      return;
    }
    
    if (!formData.organization_id_number) {
      toast.error('Please enter your organization ID number');
      return;
    }
    
    if (!formData.organization_id_image) {
      toast.error('Please upload your organization ID card');
      return;
    }
    
    if (!formData.position) {
      toast.error('Please enter your position in the organization');
      return;
    }
    
    setLoading(true);
    
    try {
      const idUrl = await handleFileUpload(formData.organization_id_image);
      if (!idUrl) throw new Error('Document upload failed');
      
      const { error } = await supabase
        .from('organizations')
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          organization_name: formData.organization_name,
          organization_id_number: formData.organization_id_number,
          organization_id_url: idUrl,
          reason: formData.reason,
          verified: false,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      await supabase
        .from('profiles')
        .update({ user_type: 'organization', role: 'organization' })
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
        <title>Become an Organization - Abbaa Carraa</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🏢</span>
                <div>
                  <h1 className="text-2xl font-bold text-white">Become an Organization</h1>
                  <p className="text-blue-100">Create private pools for your members</p>
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
                    <input type="tel" required placeholder="09XXXXXXXX" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Position *</label>
                    <input type="text" required placeholder="e.g., HR Manager, Director, Team Lead" value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>
              
              {/* Organization Information */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Organization Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
                    <input type="text" required placeholder="Your organization name" value={formData.organization_name} onChange={(e) => setFormData({...formData, organization_name: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID Number *</label>
                    <input type="text" required placeholder="Your employee/organization ID number" value={formData.organization_id_number} onChange={(e) => setFormData({...formData, organization_id_number: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to create private pools for your organization? *</label>
                  <textarea rows="3" required placeholder="Tell us about your organization and how you plan to use private pools for your members..." value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              
              {/* Organization ID Upload */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Verification Document</h2>
                <p className="text-sm text-gray-500">Please upload your organization ID card or employee badge showing you work for this organization</p>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization ID Card / Employee Badge *</label>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border rounded-lg px-3 py-2" />
                  {preview && (
                    <div className="mt-2">
                      <img src={preview} alt="Organization ID" className="max-h-32 rounded border" />
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-1">This proves you are a legitimate member/employee of the organization</p>
                </div>
              </div>
              
              {/* Info Box */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2">🏢 Organization Benefits</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Create <strong>private pools</strong> for your organization members only</li>
                  <li>• Earn <strong>10% commission</strong> on private pool collections</li>
                  <li>• Perfect for employee savings programs, SACCOS, and member associations</li>
                  <li>• Manage member participation and payouts</li>
                </ul>
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : uploading ? 'Uploading...' : 'Submit Application'}
                </button>
                <p className="text-xs text-gray-400 text-center mt-3">
                  Application will be reviewed within 24-48 hours. You'll be notified via email.
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
