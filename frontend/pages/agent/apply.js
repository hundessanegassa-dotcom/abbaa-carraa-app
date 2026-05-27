import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function AgentApply() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    experience: '',
    motivation: '',
    digital_id_front: null,
    digital_id_back: null
  });
  
  const [previews, setPreviews] = useState({
    digital_id_front: null,
    digital_id_back: null
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
      .from('agents')
      .select('id, verified')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existing) {
      if (existing.verified) {
        toast.success('You are already an approved agent!');
        router.push('/agent/dashboard');
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
    const filePath = `agent-documents/${fileName}`;
    
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
    
    // Preview
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
    
    if (!formData.phone) {
      toast.error('Please enter your phone number');
      return;
    }
    
    setLoading(true);
    
    try {
      // Upload documents
      const frontUrl = await handleFileUpload(formData.digital_id_front, 'id_front');
      const backUrl = await handleFileUpload(formData.digital_id_back, 'id_back');
      
      if (!frontUrl || !backUrl) throw new Error('Document upload failed');
      
      // Create agent application
      const { error } = await supabase
        .from('agents')
        .insert({
          user_id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          experience: formData.experience,
          motivation: formData.motivation,
          digital_id_front_url: frontUrl,
          digital_id_back_url: backUrl,
          verified: false,
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Update profile user_type
      await supabase
        .from('profiles')
        .update({ user_type: 'agent', role: 'agent' })
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
        <title>Become an Agent - Abbaa Carraa</title>
      </Head>
      
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 px-6 py-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🤝</span>
                <div>
                  <h1 className="text-2xl font-bold text-white">Become an Agent</h1>
                  <p className="text-yellow-100">Create pools and earn 10% commission</p>
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
                    <input
                      type="text"
                      value={formData.full_name}
                      disabled
                      className="w-full border rounded-lg px-4 py-2 bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full border rounded-lg px-4 py-2 bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="09XXXXXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Experience & Motivation */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Experience & Motivation</h2>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Experience (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Describe your experience with community savings, marketing, or sales..."
                    value={formData.experience}
                    onChange={(e) => setFormData({...formData, experience: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to become an agent? *</label>
                  <textarea
                    rows="3"
                    required
                    placeholder="Tell us why you're interested in creating pools and helping communities..."
                    value={formData.motivation}
                    onChange={(e) => setFormData({...formData, motivation: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>
              
              {/* Digital ID Upload */}
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Digital ID Verification</h2>
                <p className="text-sm text-gray-500">Please upload clear images of your Digital ID (Front and Back)</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Digital ID - Front *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'digital_id_front')}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    {previews.digital_id_front && (
                      <div className="mt-2">
                        <img src={previews.digital_id_front} alt="ID Front" className="max-h-32 rounded border" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Digital ID - Back *</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'digital_id_back')}
                      className="w-full border rounded-lg px-3 py-2"
                    />
                    {previews.digital_id_back && (
                      <div className="mt-2">
                        <img src={previews.digital_id_back} alt="ID Back" className="max-h-32 rounded border" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Commission Info */}
              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                <h3 className="font-bold text-yellow-800 mb-2">💰 Agent Commission Structure</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• You earn <strong>10% commission</strong> on total pool collection</li>
                  <li>• Commission is added on top of target amount (winner gets 100% of target)</li>
                  <li>• Commission paid within 7 days of pool completion</li>
                  <li>• Minimum payout: 500 ETB</li>
                </ul>
              </div>
              
              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
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
