// pages/vendor/listings/create.js - COMPLETE FIXED
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import DashboardLayout from '../../../components/DashboardLayout';
import LoadingSpinner from '../../../components/LoadingSpinner';
import BackButton from '../../../components/BackButton';
import ImageUpload from '../../../components/ImageUpload';

export default function CreateListing() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image_url: '',
    discount_rate: 0
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

      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id)
        .eq('verified', true)
        .maybeSingle();

      if (!vendor) {
        toast.error('You need to be a verified vendor');
        router.push('/vendor/apply');
        return;
      }

      setVendorData(vendor);
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

  const handleImageUpload = (url) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.name || !formData.price) {
      toast.error('Please fill all required fields');
      setSubmitting(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert({
          vendor_id: vendorData.id,
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          category: formData.category,
          stock: parseInt(formData.stock) || 0,
          image_url: formData.image_url,
          discount_rate: parseFloat(formData.discount_rate) || 0,
          status: 'active',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Product listed successfully!');
      router.push('/vendor/dashboard');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('Failed to list product: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullPage message="Loading..." />;
  }

  return (
    <DashboardLayout 
      title="Create Listing" 
      subtitle="List a product for prize pools"
      icon="📦"
      bgGradient="from-purple-600 to-pink-600"
      user={user}
      profile={profile}
    >
      <BackButton fallbackHref="/vendor/dashboard" />

      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <ImageUpload 
            onUpload={handleImageUpload} 
            currentImage={formData.image_url}
            folder="products"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., iPhone 15 Pro"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              placeholder="Describe your product..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (ETB) *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="100"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="1000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                min="0"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Select category</option>
                <option value="electronics">📱 Electronics</option>
                <option value="vehicles">🚗 Vehicles</option>
                <option value="property">🏠 Property</option>
                <option value="machinery">🏗️ Machinery</option>
                <option value="furniture">🛋️ Furniture</option>
                <option value="other">🎁 Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount for Non-Winners (%)</label>
              <input
                type="number"
                name="discount_rate"
                value={formData.discount_rate}
                onChange={handleChange}
                min="0"
                max="50"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500"
                placeholder="10"
              />
              <p className="text-xs text-gray-400 mt-1">Offer 5-50% discount to non-winners</p>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 border border-green-200">
            <p className="text-sm font-semibold text-green-800">💡 How It Works</p>
            <ul className="text-xs text-green-700 mt-1 space-y-1 list-disc list-inside">
              <li>Your product will be available as a prize for pools</li>
              <li>Earn 10% commission on every successful pool</li>
              <li>Non-winners can purchase with discount</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
          >
            {submitting ? 'Listing...' : '📦 List Product'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
