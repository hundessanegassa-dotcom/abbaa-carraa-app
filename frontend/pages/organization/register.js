import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function OrganizationRegister() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    organization_name: '',
    description: '',
    city: '',
    phone: '',
    email: ''
  });

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
    setFormData(prev => ({ ...prev, email: user.email }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('agents')
        .insert([{
          user_id: user.id,
          business_name: formData.organization_name,
          business_type: 'organization',
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          description: formData.description,
          is_active: true,
          verified: false
        }]);

      if (error) throw error;

      toast.success('Organization registered! We will review within 24-48 hours.');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">Register Your Organization</h1>
        <p className="text-center text-gray-600 mb-8">Create private pools for your members</p>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Organization Name *</label>
            <input 
              type="text" 
              required 
              value={formData.organization_name} 
              onChange={e => setFormData({...formData, organization_name: e.target.value})} 
              className="w-full p-2 border rounded" 
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea 
              rows={3} 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})} 
              className="w-full p-2 border rounded" 
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">City *</label>
            <input 
              type="text" 
              required 
              value={formData.city} 
              onChange={e => setFormData({...formData, city: e.target.value})} 
              className="w-full p-2 border rounded" 
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Phone *</label>
            <input 
              type="tel" 
              required 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              className="w-full p-2 border rounded" 
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            {loading ? 'Submitting...' : 'Register Organization'}
          </button>
        </form>
      </div>
    </div>
  );
}
