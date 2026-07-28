// pages/vendor/register.js - FIXED with correct table
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function VendorRegister() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    description: '',
    city: '',
    phone: '',
    email: '',
    business_type: 'vendor'
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
      // ✅ FIXED: Use 'vendors' table instead of 'agents'
      const { error } = await supabase
        .from('vendors')
        .insert([{
          user_id: user.id,
          business_name: formData.business_name,
          business_type: 'vendor',
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          description: formData.description,
          verified: false,
          status: 'pending'
        }]);

      if (error) throw error;

      // Update profile user_type
      await supabase
        .from('profiles')
        .update({ user_type: 'vendor' })
        .eq('id', user.id);

      toast.success('Vendor registration submitted! We will review within 24-48 hours.');
      router.push('/vendor/apply');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-6">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🏪</span>
              <div>
                <h1 className="text-2xl font-bold text-white">Become a Vendor</h1>
                <p className="text-purple-100 text-sm">List your products as prizes and reach more customers</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
              <input 
                type="text" 
                required 
                value={formData.business_name} 
                onChange={e => setFormData({...formData, business_name: e.target.value})} 
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="Your business name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
              <textarea 
                rows={3} 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="Describe what products you offer..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input 
                type="text" 
                required 
                value={formData.city} 
                onChange={e => setFormData({...formData, city: e.target.value})} 
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="Your city"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input 
                type="tel" 
                required 
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})} 
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="09XXXXXXXX"
              />
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4 text-sm">
              <p className="font-semibold text-blue-800">📝 Next Steps:</p>
              <ul className="text-blue-700 text-xs mt-1 space-y-1 list-disc list-inside">
                <li>After registration, you'll need to complete verification</li>
                <li>Upload your Digital ID and Business License</li>
                <li>Once verified, you can list products and create pools</li>
                <li>Earn 10% commission on every successful pool</li>
              </ul>
            </div>
            
            <button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : '🚀 Register as Vendor'}
            </button>
            
            <p className="text-center text-sm text-gray-500">
              Already submitted? <Link href="/vendor/apply" className="text-purple-600 hover:underline">Complete verification →</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
