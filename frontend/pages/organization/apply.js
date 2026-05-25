import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function OrganizationApplication() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: '',
    registration_number: '',
    tin_number: '',
    organization_type: '',
    phone: '',
    city: '',
    address: '',
    organization_id_image: null,
    letter_of_authorization: null
  });
  const [previewId, setPreviewId] = useState(null);
  const [previewLetter, setPreviewLetter] = useState(null);

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
      .from('organization_applications')
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

  const handleIdFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, organization_id_image: file });
      setPreviewId(URL.createObjectURL(file));
    }
  };

  const handleLetterFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, letter_of_authorization: file });
      setPreviewLetter(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.organization_id_image || !formData.letter_of_authorization) {
      toast.error('Please upload organization ID and letter of authorization');
      return;
    }
    
    setSubmitting(true);
    
    let orgImageUrl = null;
    if (formData.organization_id_image) {
      const fileExt = formData.organization_id_image.name.split('.').pop();
      const fileName = `org_ids/${user.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('applications')
        .upload(fileName, formData.organization_id_image);
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('applications')
          .getPublicUrl(fileName);
        orgImageUrl = publicUrl;
      }
    }
    
    let letterUrl = null;
    if (formData.letter_of_authorization) {
      const fileExt = formData.letter_of_authorization.name.split('.').pop();
      const fileName = `org_letters/${user.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('applications')
        .upload(fileName, formData.letter_of_authorization);
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('applications')
          .getPublicUrl(fileName);
        letterUrl = publicUrl;
      }
    }
    
    const { error } = await supabase
      .from('organization_applications')
      .insert({
        user_id: user.id,
        organization_name: formData.organization_name,
        registration_number: formData.registration_number,
        tin_number: formData.tin_number,
        organization_type: formData.organization_type,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
        organization_id_image: orgImageUrl,
        letter_of_authorization: letterUrl,
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
      <Head><title>Organization Application - Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white">
              <h1 className="text-2xl font-bold">🏢 Become an Organization</h1>
              <p className="text-sm opacity-90">Register your organization to create private pools for members</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Organization Name *</label>
                <input type="text" name="organization_name" value={formData.organization_name} onChange={handleChange} className="w-full border rounded-lg p-3" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Registration Number *</label>
                <input type="text" name="registration_number" value={formData.registration_number} onChange={handleChange} className="w-full border rounded-lg p-3" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">TIN Number *</label>
                <input type="text" name="tin_number" value={formData.tin_number} onChange={handleChange} className="w-full border rounded-lg p-3" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Organization Type *</label>
                <select name="organization_type" value={formData.organization_type} onChange={handleChange} className="w-full border rounded-lg p-3" required>
                  <option value="">Select Type</option>
                  <option value="company">Private Limited Company (PLC)</option>
                  <option value="ngo">Non-Governmental Organization (NGO)</option>
                  <option value="cooperative">Cooperative</option>
                  <option value="association">Association</option>
                  <option value="other">Other</option>
                </select>
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
                <label className="block text-sm font-medium mb-1">Organization Address *</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border rounded-lg p-3" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Organization ID/Certificate *</label>
                <input type="file" accept="image/*" onChange={handleIdFileChange} className="w-full border rounded-lg p-2" required />
                {previewId && <img src={previewId} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Letter of Authorization *</label>
                <input type="file" accept="image/*" onChange={handleLetterFileChange} className="w-full border rounded-lg p-2" required />
                {previewLetter && <img src={previewLetter} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />}
                <p className="text-xs text-gray-400 mt-1">Official letter authorizing you to represent the organization</p>
              </div>
              
              <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
