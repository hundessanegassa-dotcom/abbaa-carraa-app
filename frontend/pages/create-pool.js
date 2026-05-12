import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';

export default function CreatePool() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    prize_name: '',
    description: '',
    target_amount: '',
    contribution_amount: '',
    category: 'vehicle',
    city: 'Addis Ababa',
    image_url: '',
    end_date: ''
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    setProfile(profile);

    // Check if user can create pools (Agent, Vendor, Organization, Admin)
    const canCreatePool = ['agent', 'vendor', 'organization', 'admin'].includes(profile?.user_type);
    
    if (!canCreatePool) {
      toast.error('Only Agents, Vendors, Organizations, and Admins can create pools');
      router.push('/dashboard');
      return;
    }

    if (!profile?.agreement_accepted) {
      toast.error('Please accept the agreement first');
      router.push('/register');
      return;
    }

    setLoading(false);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (url) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    if (!formData.prize_name) {
      toast.error('Please enter a prize name');
      setSubmitting(false);
      return;
    }
    
    if (!formData.image_url) {
      toast.error('Please upload an image');
      setSubmitting(false);
      return;
    }

    const targetAmount = parseFloat(formData.target_amount);
    const contributionAmount = parseFloat(formData.contribution_amount);
    
    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast.error('Please enter a valid target amount');
      setSubmitting(false);
      return;
    }
    
    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      toast.error('Please enter a valid entry fee');
      setSubmitting(false);
      return;
    }

    const isAdmin = profile?.user_type === 'admin';
    const totalCommission = targetAmount * 0.20;
    const creatorCommission = targetAmount * (isAdmin ? 0.20 : 0.10);
    const platformCommission = targetAmount * (isAdmin ? 0 : 0.10);
    const totalCollection = targetAmount + totalCommission;
    const numberOfSeats = Math.ceil(targetAmount / contributionAmount);

    const poolData = {
      prize_name: formData.prize_name,
      description: formData.description,
      target_amount: targetAmount,
      contribution_amount: contributionAmount,
      number_of_seats: numberOfSeats,
      total_collection: totalCollection,
      current_amount: 0,
      category: formData.category,
      city: formData.city,
      image_url: formData.image_url,
      end_date: formData.end_date,
      status: 'active',
      created_by: user.id,
      creator_role: profile?.user_type,
      commission_rate: isAdmin ? 20 : 10,
      platform_rate: isAdmin ? 0 : 10,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('pools')
      .insert(poolData)
      .select()
      .single();

    if (error) {
      console.error('Pool creation error:', error);
      toast.error(error.message || 'Failed to create pool');
      setSubmitting(false);
    } else {
      toast.success(`🎉 Pool created successfully! Total to collect: ETB ${totalCollection.toLocaleString()}`);
      
      // Redirect to role-specific dashboard
      setTimeout(() => {
        router.push(`/${profile?.user_type}/dashboard`);
      }, 1500);
    }
  };

  const targetAmount = parseFloat(formData.target_amount) || 0;
  const isAdmin = profile?.user_type === 'admin';
  const totalCommission = targetAmount * 0.20;
  const creatorCommission = targetAmount * (isAdmin ? 0.20 : 0.10);
  const platformCommission = targetAmount * (isAdmin ? 0 : 0.10);
  const totalCollection = targetAmount + totalCommission;
  const numberOfSeats = targetAmount > 0 && parseFloat(formData.contribution_amount) > 0 
    ? Math.ceil(targetAmount / parseFloat(formData.contribution_amount)) 
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-teal-500 p-6 text-white">
            <h1 className="text-2xl font-bold">Create Prize Pool</h1>
            <p className="text-sm opacity-90 mt-1">
              {profile?.user_type === 'agent' && 'As an Agent, you earn 10% commission'}
              {profile?.user_type === 'vendor' && 'As a Vendor, you earn 10% commission'}
              {profile?.user_type === 'organization' && 'As an Organization, you earn 10% commission'}
              {profile?.user_type === 'admin' && 'As an Admin, you earn 20% commission'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <ImageUpload 
              onUpload={handleImageUpload} 
              currentImage={formData.image_url}
              folder="pools"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prize/Product Name *
              </label>
              <input
                type="text"
                name="prize_name"
                value={formData.prize_name}
                onChange={handleChange}
                placeholder="e.g., Toyota V8 2024, Modern Villa, iPhone 15 Pro"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Describe the prize in detail..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Winner Gets (Target) *
                </label>
                <input
                  type="number"
                  name="target_amount"
                  value={formData.target_amount}
                  onChange={handleChange}
                  placeholder="e.g., 500000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Entry Fee (per seat) *
                </label>
                <input
                  type="number"
                  name="contribution_amount"
                  value={formData.contribution_amount}
                  onChange={handleChange}
                  placeholder="e.g., 100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
                {numberOfSeats > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    This pool will have ~{numberOfSeats} seats
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="vehicle">🚗 Vehicle</option>
                  <option value="machinery">🏗️ Machinery</option>
                  <option value="electronics">📱 Electronics</option>
                  <option value="property">🏠 Property</option>
                  <option value="furniture">🛋️ Furniture</option>
                  <option value="other">🎁 Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="Addis Ababa">Addis Ababa</option>
                  <option value="Adama">Adama</option>
                  <option value="Bahir Dar">Bahir Dar</option>
                  <option value="Dire Dawa">Dire Dawa</option>
                  <option value="Hawassa">Hawassa</option>
                  <option value="Mekelle">Mekelle</option>
                  <option value="Jimma">Jimma</option>
                  <option value="Gondar">Gondar</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {targetAmount > 0 && (
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-bold text-gray-800 mb-2">💰 Commission Breakdown</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Winner gets:</span>
                    <span className="font-bold text-green-600">ETB {targetAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Your commission ({isAdmin ? 20 : 10}%):</span>
                    <span className="font-bold text-yellow-600">ETB {creatorCommission.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Platform fee:</span>
                    <span className="font-bold text-blue-600">ETB {platformCommission.toLocaleString()}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold">Total to collect:</span>
                      <span className="font-bold text-purple-600">ETB {totalCollection.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">💚 2% supports kidney & heart disease</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:bg-gray-400"
            >
              {submitting ? 'Creating...' : '🚀 Create Prize Pool'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
