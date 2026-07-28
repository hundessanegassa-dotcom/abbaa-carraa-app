// pages/vendor/register.js - COMPLETE FIXED
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import BackButton from '../../components/BackButton';

export default function VendorRegister() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      setProfile(profile);

      // Check if already registered
      const { data: existing } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        if (existing.verified) {
          router.push('/vendor/dashboard');
        } else {
          router.push('/vendor/apply');
        }
        return;
      }

      setFormData({
        business_name: '',
        description: '',
        city: '',
        phone: profile?.phone || '',
        email: user.email || '',
        business_type: 'vendor'
      });

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
      setLoading(false);
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('vendors')
        .insert({
          user_id: user.id,
          business_name: formData.business_name,
          business_type: 'vendor',
          city: formData.city,
          phone: formData.phone,
          email: formData.email,
          description: formData.description,
          verified: false,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      await supabase
        .from('profiles')
        .update({ user_type: 'vendor' })
        .eq('id', user.id);

      toast.success('Registration successful! Please complete your application.');
      router.push('/vendor/apply');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading..." />;
  }

  return (
    <DashboardLayout 
      title="Become a Vendor" 
      subtitle="List products and earn 10% commission"
      icon="🏪"
      bgGradient="from-purple-600 to-pink-600"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/dashboard" />

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <p className="text-sm text-gray-500 mb-6 text-center">
          Register as a vendor to list products and earn 10% commission on every successful pool.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
            <input
              type="text"
              name="business_name"
              value={formData.business_name}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              placeholder="Your business name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              placeholder="Describe your business..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="Your city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="09XXXXXXXX"
              />
            </div>
          </div>

          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <p className="text-sm font-semibold text-yellow-800">📝 Next Step:</p>
            <p className="text-sm text-yellow-700">
              After registration, you'll need to complete the <Link href="/vendor/apply" className="font-semibold underline">vendor application</Link> with your business details.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {submitting ? 'Registering...' : '🚀 Register as Vendor'}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already registered? <Link href="/vendor/apply" className="text-purple-600 hover:underline">Complete your application →</Link>
          </p>
        </form>
      </div>
    </DashboardLayout>
  );
}
