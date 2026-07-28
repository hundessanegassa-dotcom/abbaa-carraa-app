// pages/create-shop.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';
import { createShop } from '../lib/shop';
import toast from 'react-hot-toast';

export default function CreateShop() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    shopUsername: '',
    description: '',
    prizeType: 'cash',
    prizeValue: '',
    prizeDescription: '',
    city: '',
    category: '',
    shopImageUrl: ''
  });

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setUser(user);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await createShop({
      ownerId: user.id,
      shopName: formData.shopName,
      shopUsername: formData.shopUsername.toLowerCase().replace(/\s/g, ''),
      description: formData.description,
      prizeType: formData.prizeType,
      prizeValue: parseFloat(formData.prizeValue),
      prizeDescription: formData.prizeDescription,
      city: formData.city,
      category: formData.category,
      shopImageUrl: formData.shopImageUrl
    });

    if (result.success) {
      toast.success('Shop created successfully!');
      router.push(`/shops/${formData.shopUsername}`);
    } else {
      toast.error(result.error || 'Failed to create shop');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-center mb-6">🏪 Open Your Shop</h1>
          <p className="text-center text-gray-500 mb-8">
            Create your own prize shop and let your community participate!
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
              <input
                type="text"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                placeholder="My Shop Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shop Username *</label>
              <div className="flex items-center">
                <span className="bg-gray-100 border border-r-0 rounded-l-lg px-3 py-2 text-gray-500">abbaacarraa.com/shops/</span>
                <input
                  type="text"
                  name="shopUsername"
                  value={formData.shopUsername}
                  onChange={handleChange}
                  required
                  className="flex-1 border rounded-r-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                  placeholder="myshop"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                placeholder="Describe your shop..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prize Type *</label>
                <select
                  name="prizeType"
                  value={formData.prizeType}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                >
                  <option value="cash">Cash</option>
                  <option value="material">Material</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prize Value (ETB) *</label>
                <input
                  type="number"
                  name="prizeValue"
                  value={formData.prizeValue}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                  placeholder="1000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prize Description</label>
              <input
                type="text"
                name="prizeDescription"
                value={formData.prizeDescription}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                placeholder="Describe the prize..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                  placeholder="Addis Ababa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-green-500"
                  placeholder="General"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : '🚀 Open Shop'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
