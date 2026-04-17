import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function AgentRegister() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    business_name: '',
    business_type: 'individual',
    city: '',
    region: '',
    phone: '',
    email: '',
    description: ''
  });

  // Check if user is logged in
  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('Please login first to register as an agent');
        router.push('/login?redirect=/agent/register');
        return;
      }
      
      setUser(user);
      setFormData(prev => ({ ...prev, email: user.email }));
      
      // Check if already an agent
      const { data: existing, error } = await supabase
        .from('agents')
        .select('id, business_name')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (existing) {
        toast.success(`You are already registered as an agent for ${existing.business_name}`);
        router.push('/agent/dashboard');
        return;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      toast.error('Authentication error. Please try again.');
    } finally {
      setCheckingAuth(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.business_name || !formData.city || !formData.phone) {
        toast.error('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Insert agent record
      const { error: insertError } = await supabase
        .from('agents')
        .insert([{
          user_id: user.id,
          business_name: formData.business_name,
          business_type: formData.business_type,
          city: formData.city,
          region: formData.region || null,
          phone: formData.phone,
          email: formData.email,
          description: formData.description || null,
          is_active: true,
          verified: false
        }]);

      if (insertError) {
        console.error('Insert error:', insertError);
        
        if (insertError.code === '23505') {
          toast.error('You have already submitted an agent application');
        } else {
          toast.error(insertError.message || 'Registration failed. Please try again.');
        }
        return;
      }

      toast.success('Agent registration submitted successfully!');
      toast.success('Our team will review your application within 24-48 hours.');
      
      // Redirect to pending page
      router.push('/agent/pending');
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Become an Agent</h1>
          <p className="text-gray-600">
            Partner with Abbaa Carraa to list prizes, earn commissions, and grow your business
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-2">💰</div>
            <h3 className="font-bold">10% Commission</h3>
            <p className="text-sm text-gray-600">Earn on every pool you create</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-2">🎁</div>
            <h3 className="font-bold">Offer Discounts</h3>
            <p className="text-sm text-gray-600">Attract more participants</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl mb-2">📈</div>
            <h3 className="font-bold">Grow Business</h3>
            <p className="text-sm text-gray-600">Reach thousands of customers</p>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="space-y-4">
            {/* Business Name */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                Business/Organization Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Your business or organization name"
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                Business Type <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.business_type}
                onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="individual">Individual / Sole Proprietor</option>
                <option value="enterprise">Enterprise / Company</option>
                <option value="lister">Lister (Car/Real Estate/House Dealer)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {formData.business_type === 'lister' && '✓ You can list cars, real estate, or houses as prizes'}
                {formData.business_type === 'enterprise' && '✓ Suitable for registered businesses and organizations'}
                {formData.business_type === 'individual' && '✓ Suitable for small businesses and individual agents'}
              </p>
            </div>

            {/* Location Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="e.g., Addis Ababa"
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Region / Sub-city
                </label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({...formData, region: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="e.g., Bole, Kazanchis"
                />
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="09XXXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">For winner notifications and support</p>
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Linked to your account</p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">
                Business Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Tell us about your business, products, and why you want to become an agent..."
              />
            </div>

            {/* Terms Agreement */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 w-4 h-4 text-green-600"
                />
                <span className="text-sm text-gray-700">
                  I confirm that all information provided is accurate. I agree to the 
                  <Link href="/terms" className="text-green-600 mx-1">Terms & Conditions</Link>
                  and 
                  <Link href="/privacy" className="text-green-600 mx-1">Privacy Policy</Link>
                  . I understand that my application will be reviewed before approval.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Submitting Application...' : 'Submit Agent Application'}
            </button>

            {/* Note */}
            <p className="text-center text-sm text-gray-500 pt-4">
              After submission, our team will review your application within 24-48 hours.
              You will receive an email notification once approved.
            </p>
          </div>
        </form>

        {/* Already have account? */}
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Want to just participate? 
            <Link href="/" className="text-green-600 ml-1 hover:underline">Browse Prize Pools</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
