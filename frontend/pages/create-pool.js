import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { calculateCommission, formatCommission } from '../lib/commission';

export default function CreatePool() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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
      .single();
    setProfile(profile);

    if (!profile?.can_create_pool && profile?.user_type !== 'individual') {
      toast.error('You must accept the agreement before creating pools');
      router.push('/dashboard');
      return;
    }

    setLoading(false);
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const targetAmount = parseFloat(formData.target_amount);
    const isAdmin = profile?.user_type === 'admin';
    const commission = calculateCommission(targetAmount, isAdmin);
    const totalCollection = targetAmount + commission.totalCommission;

    const { data, error } = await supabase
      .from('pools')
      .insert({
        prize_name: formData.prize_name,
        description: formData.description,
        target_amount: targetAmount,
        contribution_amount: parseFloat(formData.contribution_amount),
        total_collection: totalCollection,
        category: formData.category,
        city: formData.city,
        image_url: formData.image_url,
        end_date: formData.end_date,
        status: 'active',
        agent_id: profile?.user_type === 'agent' ? profile.id : null,
        vendor_id: profile?.user_type === 'vendor' ? profile.id : null,
        organization_id: profile?.user_type === 'organization' ? profile.id : null,
        created_by: user.id,
        commission_rate: isAdmin ? 20 : 10,
        platform_rate: isAdmin ? 0 : 10
      });

    if (error) {
      toast.error(error.message);
      setLoading(false);
    } else {
      toast.success('Prize pool created successfully!');
      router.push('/dashboard');
    }
  };

  const targetAmount = parseFloat(formData.target_amount) || 0;
  const isAdmin = profile?.user_type === 'admin';
  const commission = calculateCommission(targetAmount, isAdmin);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <h1 className="text-3xl font-bold mb-8">Create Prize Pool</h1>

        {/* Commission Calculator Display */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 mb-6">
          <h2 className="font-bold text-lg mb-3">💰 Commission Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Winner Gets (Target):</span>
              <span className="font-bold text-green-600">{commission.winnerGets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pool Creator Commission:</span>
              <span className="font-bold text-yellow-600">{commission.creatorGets}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Commission:</span>
              <span className="font-bold text-blue-600">{commission.platformGets}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="font-semibold">Total Collection:</span>
                <span className="font-bold text-purple-600">{commission.totalCollection}</span>
              </div>
            </div>
            {isAdmin && (
              <div className="bg-green-100 p-2 rounded text-center text-xs text-green-800">
                👑 Admin Pool: You receive full 20% commission
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">Prize Name</label>
            <input name="prize_name" required value={formData.prize_name} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Description</label>
            <textarea name="description" rows="3" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Target Amount (Winner Gets)</label>
              <input type="number" name="target_amount" required value={formData.target_amount} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Entry Fee (per seat)</label>
              <input type="number" name="contribution_amount" required value={formData.contribution_amount} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-1">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border rounded-lg">
                <option value="vehicle">Vehicle</option>
                <option value="machinery">Machinery</option>
                <option value="electronics">Electronics</option>
                <option value="property">Property</option>
                <option value="furniture">Furniture</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">City</label>
              <input name="city" value={formData.city} onChange={handleChange} className="w-full p-2 border rounded-lg" />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Image URL</label>
            <input name="image_url" value={formData.image_url} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="https://..." />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">End Date</label>
            <input type="date" name="end_date" required value={formData.end_date} onChange={handleChange} className="w-full p-2 border rounded-lg" />
          </div>

          <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition">
            {loading ? 'Creating...' : 'Create Prize Pool →'}
          </button>
        </form>
      </div>
    </div>
  );
}
