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
    target_amount: '',
    contribution_amount: '',
    discount_percentage: '',
    discount_terms: '',
    city: '',
    image_url: '',
    image_file: null
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

  // Handle image upload to Supabase Storage
  async function handleImageUpload(file) {
    if (!file) return null;
    
    setUploading(true);
    
    try {
      // Create unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `pool-images/${fileName}`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('pool-images')
        .upload(filePath, file);
      
      if (uploadError) throw uploadError;
      
      // Get public URL
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
      let imageUrl = formData.image_url;
      
      // Upload image if selected
      if (formData.image_file) {
        const uploadedUrl = await handleImageUpload(formData.image_file);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }
      
      // Create the Pool
      const { data: pool, error: poolError } = await supabase
        .from('pools')
        .insert([{
          prize_name: formData.prize_name,
          description: formData.description,
          target_amount: parseFloat(formData.target_amount),
          contribution_amount: parseFloat(formData.contribution_amount),
          city: formData.city,
          image_url: imageUrl,
          created_by: user.id,
          status: 'active',
          agent_id: profile.user_type === 'agent' ? user.id : null,
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

  // Handle file selection
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
      // Preview
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
        return 'As a Supplier/Manufacturer: The WINNER gets the product for FREE. All OTHER participants get a DISCOUNT from you if they want to buy the product.';
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
            {/* Image Upload */}
            <div>
              <label className="block text-gray-700 mb-2 font-medium">Product/Prize Image</label>
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
                    <p className="text-gray-500 text-sm mb-2">Click or drag to upload product image</p>
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

            {profile.user_type === 'supplier' && (
              <>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-800 mb-2">💰 Discount for Non-Winners</h3>
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
                      <label className="block text-gray-700 mb-2 font-medium">Discount Terms</label>
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
              </>
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
