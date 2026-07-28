// pages/vendor/apply.js - COMPLETE FIXED
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabase';
import Head from 'next/head';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import BackButton from '../../components/BackButton';

export default function VendorApply() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingApplication, setExistingApplication] = useState(null);
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

      // Check if already applied
      const { data: existing } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        setExistingApplication(existing);
        if (existing.verified) {
          toast.success('You are already a verified vendor!');
          router.push('/vendor/dashboard');
          return;
        } else {
          toast.loading('Your application is pending review', { duration: 3000 });
        }
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

      // Update profile
      await supabase
        .from('profiles')
        .update({ user_type: 'vendor' })
        .eq('id', user.id);

      toast.success('Application submitted! Admin will review within 24-48 hours.');
      router.push('/vendor/dashboard');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading..." />;
  }

  if (existingApplication) {
    return (
      <DashboardLayout 
        title="Vendor Application" 
        subtitle="Application status"
        icon="📝"
        bgGradient="from-purple-600 to-pink-600"
        user={user}
        profile={profile}
      >
        <BackButton fallbackHref="/dashboard" />
        
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          {existingApplication.verified ? (
            <>
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">You are a Verified Vendor!</h2>
              <p className="text-gray-500 mb-6">Your vendor account is active and verified.</p>
              <Link href="/vendor/dashboard" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition">
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-yellow-600 mb-2">Application Pending</h2>
              <p className="text-gray-500 mb-6">Your vendor application is under review. You will be notified once approved.</p>
              <p className="text-sm text-gray-400">Submitted on: {new Date(existingApplication.created_at).toLocaleDateString()}</p>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Apply as Vendor" 
      subtitle="List products and earn commission"
      icon="🏪"
      bgGradient="from-purple-600 to-pink-600"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/dashboard" />

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Business Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              placeholder="Describe your business, products, and services..."
            />
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <p className="text-sm font-semibold text-blue-800">📝 What happens next?</p>
            <ul className="text-xs text-blue-700 mt-1 space-y-1 list-disc list-inside">
              <li>Your application will be reviewed by our team</li>
              <li>You will receive a notification once approved</li>
              <li>After approval, you can list products and create pools</li>
              <li>Earn 10% commission on every successful pool</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : '📤 Submit Application'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
