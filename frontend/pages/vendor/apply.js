import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function VendorApplication() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_license_number: '',
    tin_number: '',
    phone: '',
    city: '',
    business_address: '',
    business_license_image: null
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
    
    const { data: existing } = await supabase
      .from('vendor_applications')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (existing) {
      toast.info('You have already submitted an application');
      router.push('/dashboard');
      return;
    }
    
    setLoading(false);
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, business_license_image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.business_license_number || !formData.business_license_image) {
      toast.error('Please provide business license number and upload license image');
      return;
    }
    
    setSubmitting(true);
    
    let imageUrl = null;
    if (formData.business_license_image) {
      const fileExt = formData.business_license_image.name.split('.').pop();
      const fileName = `vendor_licenses/${user.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('applications')
        .upload(fileName, formData.business_license_image);
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('applications')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }
    
    const { error } = await supabase
      .from('vendor_applications')
      .insert({
        user_id: user.id,
        business_name: formData.business_name,
        business_license_number: formData.business_license_number,
        tin_number: formData.tin_number,
        phone: formData.phone,
        city: formData.city,
        business_address: formData.business_address,
        business_license_image: imageUrl,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    
    if (error) {
      toast.error('Failed to submit application');
    } else {
      toast.success('Application submitted! Admin will review within 48 hours.');
      router.push('/dashboard');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  return (
    <>
      <Head><title>Vendor Application - Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
              <h1 className="text-2xl font-bold">🏪 Become a Vendor</h1>
              <p className="text-sm opacity-90">Complete your application to start listing products</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Business Name *</label>
                <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} className="w-full border rounded-lg p-3" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Business License Number *</label>
                <input type="text" name="business_license_number" value={formData.business_license_number} onChange={handleChange} className="w-full border rounded-lg p-3" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">TIN Number *</label>
                <input type="text" name="tin_number" value={formData.tin_number} onChange={handleChange} className="w-full border rounded-lg p-3" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg p-3" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <select name="city" value={formData.city} onChange={handleChange} className="w-full border rounded-lg p-3" required>
                  <option value="">Select City</option>
                  <option value="Addis Ababa">Addis Ababa</option>
                  <option value="Adama">Adama</option>
                  <option value="Bahir Dar">Bahir Dar</option>
                  <option value="Dire Dawa">Dire Dawa</option>
                  <option value="Hawassa">Hawassa</option>
                  <option value="Mekelle">Mekelle</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Business Address *</label>
                <input type="text" name="business_address" value={formData.business_address} onChange={handleChange} className="w-full border rounded-lg p-3" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Business License Image *</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border rounded-lg p-2" required />
                {preview && <img src={preview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />}
              </div>
              
              <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
