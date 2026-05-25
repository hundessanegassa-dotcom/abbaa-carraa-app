import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Head from 'next/head';
import toast from 'react-hot-toast';

export default function AgentApplication() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    city: '',
    digital_id_number: '',
    digital_id_image: null,
    experience: '',
    motivation: ''
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
    
    // Check if already applied
    const { data: existing } = await supabase
      .from('agent_applications')
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
      setFormData({ ...formData, digital_id_image: file });
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.digital_id_number || !formData.digital_id_image) {
      toast.error('Please provide your Digital ID number and upload image');
      return;
    }
    
    setSubmitting(true);
    
    // Upload digital ID image
    let imageUrl = null;
    if (formData.digital_id_image) {
      const fileExt = formData.digital_id_image.name.split('.').pop();
      const fileName = `agent_ids/${user.id}-${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('applications')
        .upload(fileName, formData.digital_id_image);
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from('applications')
          .getPublicUrl(fileName);
        imageUrl = publicUrl;
      }
    }
    
    const { error } = await supabase
      .from('agent_applications')
      .insert({
        user_id: user.id,
        full_name: formData.full_name || user.user_metadata?.full_name,
        phone: formData.phone,
        city: formData.city,
        digital_id_number: formData.digital_id_number,
        digital_id_image: imageUrl,
        experience: formData.experience,
        motivation: formData.motivation,
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
      <Head><title>Agent Application - Abbaa Carraa</title></Head>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 text-white">
              <h1 className="text-2xl font-bold">🤝 Become an Agent</h1>
              <p className="text-sm opacity-90">Complete your application to start earning 10% commission</p>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="w-full border rounded-lg p-3" placeholder={user?.user_metadata?.full_name || 'Your full name'} />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full border rounded-lg p-3" placeholder="09xxxxxxxx" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
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
                <label className="block text-sm font-medium mb-1">Digital ID Number *</label>
                <input type="text" name="digital_id_number" value={formData.digital_id_number} onChange={handleChange} className="w-full border rounded-lg p-3" placeholder="e.g., ETH-XXXXXXXXXX" required />
                <p className="text-xs text-gray-400 mt-1">Your Ethiopian Digital ID or Passport number</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Digital ID Image *</label>
                <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border rounded-lg p-2" required />
                {preview && <img src={preview} alt="Preview" className="mt-2 w-32 h-32 object-cover rounded-lg" />}
                <p className="text-xs text-gray-400 mt-1">Upload a clear photo of your ID</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Previous Experience (Optional)</label>
                <textarea name="experience" value={formData.experience} onChange={handleChange} rows="3" className="w-full border rounded-lg p-3" placeholder="Tell us about your sales or community experience..." />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Why do you want to become an agent?</label>
                <textarea name="motivation" value={formData.motivation} onChange={handleChange} rows="3" className="w-full border rounded-lg p-3" placeholder="Share your motivation..." required />
              </div>
              
              <button type="submit" disabled={submitting} className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition">
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
              
              <p className="text-xs text-gray-400 text-center">Your application will be reviewed within 48 hours</p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
