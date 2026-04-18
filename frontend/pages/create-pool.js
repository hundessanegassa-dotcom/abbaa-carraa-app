import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function CreatePool() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    prize_name: '',
    description: '',
    target_amount: '',
    contribution_amount: '',
    discount_percentage: '',
    discount_terms: '',
    city: '',
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
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setProfile(data);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create the Pool
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .insert([{
          prize_name: formData.prize_name,
          description: formData.description,
          target_amount: parseFloat(formData.target_amount),
          contribution_amount: parseFloat(formData.contribution_amount),
          city: formData.city,
          created_by: user.id,
          status: 'active',
          // If user is an agent, they get commission
          agent_id: profile.user_type === 'agent' ? user.id : null,
          // For suppliers: store discount info
          discount_for_non_winners: profile.user_type === 'supplier' ? parseInt(formData.discount_percentage) : null,
          discount_terms: formData.discount_terms || null
        }]).select().single();

      if (poolError) throw poolError;

      toast.success('Prize pool created successfully!');
      router.push('/');
    } catch (error) {
      console.error('Create pool error:', error);
      toast.error(error.message || 'Failed to create pool');
    } finally {
      setLoading(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Different heading based on user type
  const getHeading = () => {
    switch (profile.user_type) {
      case 'agent':
        return 'Create a Prize Pool (Earn 10% Commission)';
      case 'supplier':
        return 'List Your Product & Offer Discounts to Non-Winners';
      case 'organization':
        return 'Create Internal Pool for Your Members';
      default:
        return 'Create a Prize Pool';
    }
  };

  const getDescription = () => {
    switch (profile.user_type) {
      case 'agent':
        return 'As an Agent, you will earn 10% commission when this pool completes. List products from local businesses.';
      case 'supplier':
        return 'As a Supplier/Manufacturer: The WINNER gets the product for FREE. All OTHER participants get a DISCOUNT from you if they want to buy the product. This helps you sell multiple units!';
      case 'organization':
        return 'Create a private pool for your organization members. No commission - just community saving for a common goal.';
      default:
        return 'Create a pool and invite others to participate.';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/" className="text-green-600 hover:text-green-700 mb-4 inline-block">
          ← Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-2">{getHeading()}</h1>
          <p className="text-gray-600 mb-6">{getDescription()}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Prize/Product Name *</label>
              <input
                type="text"
                required
                value={formData.prize_name}
                onChange={(e) => setFormData({...formData, prize_name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Washing Machine X-5000"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Product Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Describe the product, features, benefits..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Target Amount (ETB) *</label>
                <input
                  type="number"
                  required
                  value={formData.target_amount}
                  onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="e.g., 500000"
                />
                <p className="text-xs text-gray-500 mt-1">Total value of the prize</p>
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Contribution per Person (ETB) *</label>
                <input
                  type="number"
                  required
                  value={formData.contribution_amount}
                  onChange={(e) => setFormData({...formData, contribution_amount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="e.g., 1000"
                />
                <p className="text-xs text-gray-500 mt-1">Amount each participant pays</p>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="e.g., Addis Ababa"
              />
            </div>

            {/* Supplier-Specific Fields */}
            {profile.user_type === 'supplier' && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-800 mb-2">💰 Discount for Non-Winners</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    When someone participates but does NOT win, they can buy this product from you at a discount.
                    This encourages participation and helps you sell more units!
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">Discount Percentage (%)</label>
                      <input
                        type="number"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="e.g., 10"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-2 font-medium">Discount Terms (Optional)</label>
                      <input
                        type="text"
                        value={formData.discount_terms}
                        onChange={(e) => setFormData({...formData, discount_terms: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg"
                        placeholder="e.g., Valid for 30 days"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Example: Set 10% discount. Non-winners can buy the ETB {formData.target_amount || '500,000'} product for ETB {formData.target_amount ? (parseFloat(formData.target_amount) * 0.9).toLocaleString() : '450,000'}!
                  </p>
                </div>
              </>
            )}

            {/* Agent Commission Note */}
            {profile.user_type === 'agent' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  🤝 As an Agent, you will earn <strong>10% commission</strong> (ETB {(parseFloat(formData.target_amount) * 0.1).toLocaleString() || '0'}) when this pool completes successfully.
                </p>
              </div>
            )}

            {/* Organization Note */}
            {profile.user_type === 'organization' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  🏢 This pool is for your organization members only. No commission - everyone contributes to help one member win.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {loading ? 'Creating...' : 'Create Prize Pool'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
