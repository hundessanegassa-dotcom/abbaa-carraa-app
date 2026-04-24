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
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    prize_name: '',
    description: '',
    prize_actual_value: '',
    target_amount: '',
    contribution_amount: '',
    discount_percentage: '',
    discount_terms: '',
    city: 'Addis Ababa',
    duration_days: 60,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    image_file: null,
    image_preview: null
  });

  useEffect(() => {
    checkUser();
    // Set default end date
    const defaultEndDate = new Date();
    defaultEndDate.setDate(defaultEndDate.getDate() + 60);
    setFormData(prev => ({
      ...prev,
      end_date: defaultEndDate.toISOString().split('T')[0]
    }));
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

  // Calculate end date based on duration days
  function handleDurationChange(days) {
    const start = new Date(formData.start_date);
    const end = new Date(start);
    end.setDate(start.getDate() + parseInt(days));
    setFormData({
      ...formData,
      duration_days: parseInt(days),
      end_date: end.toISOString().split('T')[0]
    });
  }

  // Calculate target amount from prize value (add 20% commission)
  function calculateTargetAmount(prizeValue) {
    if (!prizeValue || prizeValue <= 0) return '';
    return Math.ceil(prizeValue / 0.8);
  }

  // Calculate contribution amount (target ÷ 500 participants)
  function calculateContributionAmount(targetAmount) {
    if (!targetAmount || targetAmount <= 0) return '';
    return Math.ceil(targetAmount / 500);
  }

  function handlePrizeValueChange(value) {
    const prizeValue = parseFloat(value) || 0;
    const targetAmount = calculateTargetAmount(prizeValue);
    const contributionAmount = calculateContributionAmount(targetAmount);
    
    setFormData({
      ...formData,
      prize_actual_value: value,
      target_amount: targetAmount,
      contribution_amount: contributionAmount
    });
  }

  async function handleImageUpload(file) {
    if (!file) return null;
    
    setUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `pool-images/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('pool-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('pool-images')
        .getPublicUrl(filePath);
      
      return publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      let imageUrl = null;
      
      if (formData.image_file) {
        imageUrl = await handleImageUpload(formData.image_file);
      }
      
      let creatorCommissionRate = 10;
      let platformCommissionRate = 10;
      
      if (profile.user_type === 'admin' || profile.role === 'admin') {
        creatorCommissionRate = 0;
        platformCommissionRate = 20;
      }
      
      const prizeValue = parseFloat(formData.prize_actual_value);
      const targetAmount = parseFloat(formData.target_amount);
      const contributionAmount = parseFloat(formData.contribution_amount);
      
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .insert([{
          prize_name: formData.prize_name,
          description: formData.description,
          prize_actual_value: prizeValue,
          target_amount: targetAmount,
          contribution_amount: contributionAmount,
          city: formData.city,
          image_url: imageUrl,
          start_date: formData.start_date,
          end_date: formData.end_date,
          created_by: user.id,
          status: 'active',
          creator_commission_rate: creatorCommissionRate,
          platform_commission_rate: platformCommissionRate,
          discount_for_non_winners: profile.user_type === 'vendor' ? parseInt(formData.discount_percentage) : null,
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setFormData({...formData, image_file: file});
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({...prev, image_preview: reader.result}));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Link href="/" className="text-green-600 hover:text-green-700 mb-4 inline-block">
          ← Back to Home
        </Link>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-2">Create a Prize Pool</h1>
          <p className="text-gray-600 mb-6">Fill in the details below to create your prize pool</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Prize Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {formData.image_preview ? (
                  <div className="mb-3">
                    <img src={formData.image_preview} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, image_file: null, image_preview: null})}
                      className="mt-2 text-red-600 text-sm hover:text-red-700"
                    >
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="text-gray-500 text-sm mb-2">Click to upload product image</p>
                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg inline-block transition">
                      Select Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-400 mt-2">Max 5MB. JPG, PNG, or GIF</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Prize Name *</label>
              <input
                type="text"
                required
                value={formData.prize_name}
                onChange={(e) => setFormData({...formData, prize_name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Toyota Vitz 2018"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2 font-medium">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Describe the prize, features, benefits..."
              />
            </div>

            {/* Duration Selection */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="block text-gray-700 mb-2 font-bold text-blue-800">
                📅 Pool Duration
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-1 text-sm">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const end = new Date(newStart);
                      end.setDate(end.getDate() + formData.duration_days);
                      setFormData({
                        ...formData,
                        start_date: newStart,
                        end_date: end.toISOString().split('T')[0]
                      });
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-1 text-sm">Duration (Days)</label>
                  <select
                    value={formData.duration_days}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="30">30 days</option>
                    <option value="45">45 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="120">120 days</option>
                    <option value="180">180 days</option>
                  </select>
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-gray-700 mb-1 text-sm">End Date</label>
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  className="w-full p-2 border rounded bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-blue-600 mt-1">
                  Pool will end on {new Date(formData.end_date).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Prize Value */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <label className="block text-gray-700 mb-2 font-bold text-green-800">
                🎁 Actual Prize Value (ETB) *
              </label>
              <input
                type="number"
                required
                value={formData.prize_actual_value}
                onChange={(e) => handlePrizeValueChange(e.target.value)}
                className="w-full p-3 border border-green-300 rounded-lg"
                placeholder="e.g., 500000"
              />
            </div>

            {/* Calculated Fields */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold mb-3">📊 Pool Calculations</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Target Amount:</span>
                  <span className="font-bold text-green-600">ETB {parseFloat(formData.target_amount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Contribution per Person:</span>
                  <span className="font-bold text-blue-600">ETB {parseFloat(formData.contribution_amount || 0).toLocaleString()}</span>
                </div>
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

            {/* Vendor Discount Section */}
            {profile.user_type === 'vendor' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-800 mb-2">🎁 Discount for Non-Winners</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Discount (%)</label>
                    <input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData({...formData, discount_percentage: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="e.g., 10"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Terms</label>
                    <input
                      type="text"
                      value={formData.discount_terms}
                      onChange={(e) => setFormData({...formData, discount_terms: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="e.g., Valid for 30 days"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 disabled:bg-gray-400 transition"
            >
              {uploading ? 'Uploading Image...' : loading ? 'Creating...' : 'Create Prize Pool'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
