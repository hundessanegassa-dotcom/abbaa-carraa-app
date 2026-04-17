import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

export default function AgentRegister() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'individual',
    city: '',
    region: '',
    phone: '',
    email: ''
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login?redirect=/agent/register');
      return;
    }
    setUser(user);
    setFormData(prev => ({ ...prev, email: user.email }));
    
    // Check if already an agent
    const { data: existing } = await supabase
      .from('agents')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (existing) {
      toast.success('You are already registered as an agent!');
      router.push('/agent/dashboard');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('agents')
        .insert([{
          user_id: user.id,
          business_name: formData.business_name,
          business_type: formData.business_type,
          city: formData.city,
          region: formData.region,
          phone: formData.phone,
          email: formData.email,
          verified: false
        }]);

      if (error) throw error;

      toast.success('Registration submitted! Admin will verify your account.');
      router.push('/agent/pending');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">Become an Agent</h1>
        <p className="text-center text-gray-600 mb-8">
          List prizes, earn commissions, and help your community win!
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Business Name *</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="Your business or organization name"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Business Type *</label>
              <select
                required
                value={formData.business_type}
                onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                className="w-full p-2 border rounded-lg"
              >
                <option value="individual">Individual</option>
                <option value="enterprise">Enterprise</option>
                <option value="lister">Lister (Car/Real Estate/House)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Addis Ababa"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Region</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  className="w-full p-2 border rounded-lg"
                  placeholder="Sheger"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full p-2 border rounded-lg"
                placeholder="09XXXXXXXX"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                className="w-full p-2 border rounded-lg bg-gray-100"
                readOnly
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Benefits of becoming an agent:</strong><br/>
                - Earn 10% commission on pools you create<br/>
                - Offer discounts to your participants<br/>
                - List your products as prizes<br/>
                - Build community trust
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Submitting...' : 'Register as Agent'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
