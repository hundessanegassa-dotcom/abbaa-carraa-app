// components/admin/RegularPoolModal.js - FULL CRUD (Create, Edit, Delete)
// Based on your existing CreatePool.js and PoolDetails.js logic
import { useState, useEffect } from 'react';
import { supabase, compressImage } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function RegularPoolModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  mode = 'create',  // 'create', 'edit', 'delete'
  poolData = null,
  userId 
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState('individual');
  const [formData, setFormData] = useState({
    prize_name: '',
    description: '',
    target_amount: '',
    entry_fee: '',
    category: 'vehicle',
    city: 'Addis Ababa',
    end_date: '',
    image_url: '',
    is_featured: true,
    custom_city: '',
    status: 'active'
  });

  // Fetch user role to determine commission
  useEffect(() => {
    const fetchUserRole = async () => {
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', userId)
          .single();
        setUserRole(profile?.user_type || 'individual');
      }
    };
    if (isOpen) fetchUserRole();
  }, [isOpen, userId]);

  // Load data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && poolData) {
      setFormData({
        prize_name: poolData.prize_name || poolData.name || '',
        description: poolData.description || '',
        target_amount: poolData.target_amount || '',
        entry_fee: poolData.entry_fee || '',
        category: poolData.category || 'vehicle',
        city: poolData.city || 'Addis Ababa',
        end_date: poolData.end_date?.split('T')[0] || '',
        image_url: poolData.image_url || '',
        is_featured: poolData.is_featured || false,
        custom_city: '',
        status: poolData.status || 'active'
      });
    }
  }, [mode, poolData]);

  // Calculate values based on your CreatePool.js logic
  const targetAmount = parseFloat(formData.target_amount) || 0;
  const entryFee = parseFloat(formData.entry_fee) || 0;
  
  // Commission logic from your CreatePool.js:
  // - Admin gets 20% commission
  // - Agents/Vendors/Organizations get 10% commission
  const isAdmin = userRole === 'admin';
  const creatorCommissionRate = isAdmin ? 0.20 : 0.10;
  const platformRate = isAdmin ? 0 : 0.10;
  
  const totalCommission = targetAmount * 0.20; // Always 20% total added
  const creatorCommission = targetAmount * creatorCommissionRate;
  const platformCommission = targetAmount * platformRate;
  const totalCollection = targetAmount + totalCommission;
  const numberOfSeats = entryFee > 0 ? Math.ceil(targetAmount / entryFee) : 0;
  const totalSeats = entryFee > 0 ? Math.ceil(totalCollection / entryFee) : 0;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    setUploading(true);
    try {
      const compressedFile = await compressImage(file, 1024, 1024, 0.7);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `pool-${Date.now()}.${fileExt}`;
      const filePath = `pool-images/${fileName}`;
      
      const { error } = await supabase.storage
        .from('pool-images')
        .upload(filePath, compressedFile);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('pool-images')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCityChange = (e) => {
    const value = e.target.value;
    if (value === 'Other') {
      setFormData(prev => ({ ...prev, city: '', custom_city: '' }));
    } else {
      setFormData(prev => ({ ...prev, city: value, custom_city: '' }));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.prize_name) {
      toast.error('Please enter a prize name');
      return;
    }
    if (!formData.image_url) {
      toast.error('Please upload an image');
      return;
    }
    if (targetAmount <= 0) {
      toast.error('Please enter a valid target amount');
      return;
    }
    if (entryFee <= 0) {
      toast.error('Please enter a valid entry fee');
      return;
    }
    
    const finalCity = formData.city || formData.custom_city;
    if (!finalCity || finalCity.trim() === '') {
      toast.error('Please select or enter a city');
      return;
    }

    setLoading(true);
    
    try {
      // Get user profile to confirm role
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();
      
      const isAdminUser = profile?.user_type === 'admin';
      const commissionRate = isAdminUser ? 20 : 10;
      const platformRateValue = isAdminUser ? 0 : 10;
      
      // Matching your CreatePool.js structure
      const poolDataToInsert = {
        name: formData.prize_name,
        prize_name: formData.prize_name,
        description: formData.description,
        target_amount: targetAmount,
        contribution_amount: entryFee,
        entry_fee: entryFee,
        number_of_seats: numberOfSeats,
        total_collection: totalCollection,
        current_amount: 0,
        category: formData.category,
        city: finalCity,
        image_url: formData.image_url,
        end_date: formData.end_date,
        start_date: new Date().toISOString(),
        status: 'active',
        created_by: userId,
        creator_role: profile?.user_type || 'individual',
        commission_rate: commissionRate,
        platform_rate: platformRateValue,
        is_featured: formData.is_featured,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('pools')
        .insert(poolDataToInsert);

      if (error) throw error;
      
      const commissionMessage = isAdminUser ? '20%' : '10%';
      toast.success(`🎉 Pool "${formData.prize_name}" created successfully! You earn ${commissionMessage} commission.`);
      onSuccess();
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('Error creating pool:', error);
      toast.error(error.message || 'Failed to create pool');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const finalCity = formData.city || formData.custom_city;
      
      const { error } = await supabase
        .from('pools')
        .update({
          prize_name: formData.prize_name,
          description: formData.description,
          target_amount: targetAmount,
          entry_fee: entryFee,
          category: formData.category,
          city: finalCity,
          image_url: formData.image_url,
          end_date: formData.end_date,
          is_featured: formData.is_featured,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', poolData.id);
      
      if (error) throw error;
      
      toast.success(`Pool "${formData.prize_name}" updated successfully!`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Check if there are participants (from your PoolDetails.js logic)
      const { count } = await supabase
        .from('pool_participants')
        .select('*', { count: 'exact', head: true })
        .eq('pool_id', poolData.id);
      
      if (count && count > 0) {
        toast.error(`Cannot delete: ${count} participants have joined this pool`);
        setLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('pools')
        .delete()
        .eq('id', poolData.id);
      
      if (error) throw error;
      
      toast.success(`Pool "${poolData.prize_name}" deleted successfully!`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      prize_name: '',
      description: '',
      target_amount: '',
      entry_fee: '',
      category: 'vehicle',
      city: 'Addis Ababa',
      end_date: '',
      image_url: '',
      is_featured: true,
      custom_city: '',
      status: 'active'
    });
  };

  if (!isOpen) return null;

  // Delete Confirmation View
  if (mode === 'delete') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">🗑️</div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Confirm Delete</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{poolData?.prize_name}</strong>?
            </p>
            <p className="text-sm text-red-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={loading} className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700">
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button onClick={onClose} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEditMode = mode === 'edit';
  const modalTitle = isEditMode ? '✏️ Edit Regular Pool' : '➕ Create Regular Pool';
  const submitButtonText = isEditMode ? '💾 Save Changes' : '🚀 Create Pool';
  const submitAction = isEditMode ? handleUpdate : handleCreate;
  
  const isAdminUser = userRole === 'admin';
  const commissionRate = isAdminUser ? 20 : 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold">{modalTitle}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        
        <form onSubmit={submitAction} className="p-6 space-y-5">
          {/* Commission Info Banner - Matches your CreatePool.js style */}
          <div className={`rounded-xl p-3 text-sm ${isAdminUser ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
            <p className="font-semibold">💰 Your Commission Rate: {commissionRate}%</p>
            <p className="text-xs mt-1">
              {isAdminUser 
                ? 'As an Admin, you earn 20% commission on all pools you create.' 
                : 'As an Agent/Vendor/Organization, you earn 10% commission on all pools you create.'}
            </p>
          </div>

          {/* Image Upload - With compression */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prize Image *</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="w-full border rounded-lg p-2" />
            {uploading && <p className="text-sm text-gray-500 mt-1">Uploading and compressing...</p>}
            {formData.image_url && (
              <img src={formData.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-lg mt-2" />
            )}
          </div>

          {/* Prize Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Prize/Product Name *</label>
            <input
              type="text"
              value={formData.prize_name}
              onChange={(e) => setFormData(prev => ({ ...prev, prize_name: e.target.value }))}
              placeholder="e.g., Toyota V8 2024, Modern Villa, iPhone 15 Pro"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows="3"
              placeholder="Describe the prize in detail..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Target Amount & Entry Fee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Winner Gets (Target) *</label>
              <input
                type="number"
                value={formData.target_amount}
                onChange={(e) => setFormData(prev => ({ ...prev, target_amount: e.target.value }))}
                placeholder="e.g., 500000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (per seat) *</label>
              <input
                type="number"
                value={formData.entry_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, entry_fee: e.target.value }))}
                placeholder="e.g., 100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
              {numberOfSeats > 0 && (
                <p className="text-xs text-gray-400 mt-1">~{numberOfSeats.toLocaleString()} seats to reach target</p>
              )}
            </div>
          </div>

          {/* Category & City */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
              <select
                value={formData.city === '' ? 'Other' : formData.city}
                onChange={handleCityChange}
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
                <option value="Dessie">Dessie</option>
                <option value="Harar">Harar</option>
                <option value="Other">Other (type below)</option>
              </select>
              {formData.city === '' && (
                <input
                  type="text"
                  placeholder="Enter your city name"
                  value={formData.custom_city}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_city: e.target.value, city: e.target.value }))}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  required
                />
              )}
            </div>
          </div>

          {/* End Date & Featured */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">⭐ Feature this pool on homepage</span>
              </label>
            </div>
          </div>

          {/* Status (Edit mode only) */}
          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Commission Breakdown - Matches your CreatePool.js exactly */}
          {targetAmount > 0 && (
            <div className="bg-green-50 rounded-xl p-4">
              <h3 className="font-bold text-gray-800 mb-2">💰 Commission Breakdown</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Winner gets:</span>
                  <span className="font-bold text-green-600">ETB {targetAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Your commission ({commissionRate}%):</span>
                  <span className="font-bold text-yellow-600">ETB {creatorCommission.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform fee ({platformRate * 100}%):</span>
                  <span className="font-bold text-blue-600">ETB {platformCommission.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total to collect (Prize + 20%):</span>
                    <span className="font-bold text-purple-600">ETB {totalCollection.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">💚 2% of all contributions supports kidney & heart disease patients.</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading || uploading}
              className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : submitButtonText}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
