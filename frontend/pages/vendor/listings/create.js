import BackButton from '../../../components/BackButton';
import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import ImageUpload from '../../../components/ImageUpload';

export default function CreateListing() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimated_value: '',
    image_url: '',
    discount_rate: 0
  });

  useEffect(() => {
    checkVendor();
  }, []);

  async function checkVendor() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile?.user_type !== 'vendor') {
      router.push('/dashboard');
      return;
    }

    setLoading(false);
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

    if (!formData.title) {
      toast.error('Please enter a product title');
      setSubmitting(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const { error } = await supabase
      .from('listings')
      .insert({
        vendor_id: vendor.id,
        title: formData.title,
        description: formData.description,
        estimated_value: parseFloat(formData.estimated_value),
        image_url: formData.image_url,
        discount_rate: formData.discount_rate,
        status: 'active',
        created_at: new Date().toISOString()
      });

    if (error) {
      toast.error('Failed to list product');
      console.error(error);
    } else {
      toast.success('Product listed successfully!');
      router.push('/vendor/dashboard');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-4"><BackButton /></div>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <h1 className="text-2xl font-bold">List a Product</h1>
            <p className="text-sm opacity-90 mt-1">Add products to be used as prizes and earn 10% commission</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <ImageUpload 
              onUpload={handleImageUpload} 
              currentImage={formData.image_url}
              folder="listings"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                rows="3"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Value (ETB) *</label>
              <input
                type="number"
                name="estimated_value"
                value={formData.estimated_value}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                required
              />
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-400 mt-1">Offer 5-50% discount to non-winners to boost participation</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
            >
              {submitting ? 'Listing...' : '📦 List Product'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
