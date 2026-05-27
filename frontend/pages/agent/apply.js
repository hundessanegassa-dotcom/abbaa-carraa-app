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
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(profile);
    
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

  // Compress image before upload
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          const maxWidth = 1024;
          const maxHeight = 1024;
          
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          }, 'image/jpeg', 0.7);
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  };

  const uploadFile = async (file, userId, type) => {
    const fileExt = 'jpg';
    const fileName = `${userId}_${type}_${Date.now()}.${fileExt}`;
    const filePath = `agent-documents/${fileName}`;
    
    const { error, data } = await supabase.storage
      .from('verification-docs')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('verification-docs')
      .getPublicUrl(filePath);
    
    return publicUrl;
  };

  const handleFileChange = async (e, field) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB');
      return;
    }
    
    toast.loading('Compressing image...', { id: `compress-${field}` });
    
    try {
      const compressedFile = await compressImage(selectedFile);
      setFormData(prev => ({ ...prev, [field]: compressedFile }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(compressedFile);
      
      toast.success('Image ready!', { id: `compress-${field}` });
    } catch (error) {
      console.error('Compression error:', error);
      toast.error('Using original image', { id: `compress-${field}` });
      setFormData(prev => ({ ...prev, [field]: selectedFile }));
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(selectedFile);
    }
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
    setUploadProgress(0);
    
    try {
      setUploadProgress(20);
      const frontUrl = await uploadFile(formData.digital_id_front, user.id, 'id_front');
      setUploadProgress(50);
      const backUrl = await uploadFile(formData.digital_id_back, user.id, 'id_back');
      setUploadProgress(80);
      
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
      
      await supabase
        .from('profiles')
        .update({ user_type: 'agent', role: 'agent' })
        .eq('id', user.id);
      
      setUploadProgress(100);
      toast.success('Application submitted! Admin will review within 24-48 hours.');
      setTimeout(() => router.push('/dashboard'), 2000);
      
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit: ' + error.message);
    } finally {
      setLoading(false);
      setUploadProgress(0);
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
              
              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Uploading documents...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              
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
                  {loading ? 'Submitting...' : 'Submit Application'}
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
