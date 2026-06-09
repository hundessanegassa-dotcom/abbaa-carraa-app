// components/admin/CityVipModal.js - FULL CRUD with Agent Commission
import { useState, useEffect } from 'react';
import { supabase, compressImage } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function CityVipModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  mode = 'create',  // 'create', 'edit', 'delete'
  cityData = null,
  userId 
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [formData, setFormData] = useState({
    city_id: '',
    city_name: '',
    city_name_am: '',
    region: '',
    icon: '🏙️',
    description: '',
    image_url: '',
    is_active: true,
    daily_pool_enabled: true,
    weekly_pool_enabled: true,
    monthly_pool_enabled: true,
    daily_prize: 1000000,
    weekly_prize: 10000000,
    monthly_prize: 40000000,
    daily_entry: 500,
    weekly_entry: 2500,
    monthly_entry: 5000,
    commission_rate: 10  // Default 10% for agents
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
        
        const role = profile?.user_type || 'individual';
        setUserRole(role);
        
        // Set commission rate based on role (Admin: 20%, Agent/Vendor/Org: 10%)
        const commissionRate = role === 'admin' ? 20 : 10;
        setFormData(prev => ({ ...prev, commission_rate: commissionRate }));
      }
    };
    if (isOpen) fetchUserRole();
  }, [isOpen, userId]);

  // Load data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && cityData) {
      setFormData({
        city_id: cityData.city_id || '',
        city_name: cityData.city_name || cityData.city || '',
        city_name_am: cityData.city_name_am || '',
        region: cityData.region || '',
        icon: cityData.icon || '🏙️',
        description: cityData.description || '',
        image_url: cityData.image_url || '',
        is_active: cityData.is_active !== false,
        daily_pool_enabled: cityData.daily_pool_enabled !== false,
        weekly_pool_enabled: cityData.weekly_pool_enabled !== false,
        monthly_pool_enabled: cityData.monthly_pool_enabled !== false,
        daily_prize: cityData.daily_prize || 1000000,
        weekly_prize: cityData.weekly_prize || 10000000,
        monthly_prize: cityData.monthly_prize || 40000000,
        daily_entry: cityData.daily_entry || 500,
        weekly_entry: cityData.weekly_entry || 2500,
        monthly_entry: cityData.monthly_entry || 5000,
        commission_rate: cityData.commission_rate || 10
      });
    }
  }, [mode, cityData]);

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
      const fileName = `city-${Date.now()}.${fileExt}`;
      const filePath = `city-images/${fileName}`;
      
      const { error } = await supabase.storage
        .from('city-images')
        .upload(filePath, compressedFile);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('city-images')
        .getPublicUrl(filePath);
      
      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('City image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cityId = formData.city_name.toLowerCase().replace(/\s/g, '-');
      
      const { error } = await supabase
        .from('city_vip_config')
        .insert([{
          ...formData,
          city_id: cityId,
          created_by: userId,
          created_by_role: userRole,
          commission_rate: formData.commission_rate,
          created_at: new Date(),
          updated_at: new Date()
        }]);
      
      if (error) throw error;
      
      const commissionMessage = userRole === 'admin' ? '20%' : '10%';
      toast.success(`City VIP program for ${formData.city_name} created! You earn ${commissionMessage} commission.`);
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('city_vip_config')
        .update({
          ...formData,
          updated_by: userId,
          updated_at: new Date()
        })
        .eq('city_id', cityData.city_id);
      
      if (error) throw error;
      
      toast.success(`City VIP program for ${formData.city_name} updated successfully!`);
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
      const { count } = await supabase
        .from('city_vip_participants')
        .select('*', { count: 'exact', head: true })
        .eq('city', cityData.city_name);
      
      if (count && count > 0) {
        toast.error(`Cannot delete: ${count} participants exist in this city's VIP program`);
        setLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('city_vip_config')
        .delete()
        .eq('city_id', cityData.city_id);
      
      if (error) throw error;
      
      toast.success(`City VIP program for ${cityData.city_name} deleted successfully!`);
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
      city_id: '',
      city_name: '',
      city_name_am: '',
      region: '',
      icon: '🏙️',
      description: '',
      image_url: '',
      is_active: true,
      daily_pool_enabled: true,
      weekly_pool_enabled: true,
      monthly_pool_enabled: true,
      daily_prize: 1000000,
      weekly_prize: 10000000,
      monthly_prize: 40000000,
      daily_entry: 500,
      weekly_entry: 2500,
      monthly_entry: 5000,
      commission_rate: userRole === 'admin' ? 20 : 10
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
              Are you sure you want to delete <strong>{cityData?.city_name}</strong> City VIP program?
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
  const modalTitle = isEditMode ? '✏️ Edit City VIP Program' : '➕ Create City VIP Program';
  const submitButtonText = isEditMode ? '💾 Save Changes' : '✨ Create City VIP';
  const submitAction = isEditMode ? handleUpdate : handleCreate;

  const totalCollection = (prize) => prize * 1.2;
  const commissionAmount = (prize) => prize * (formData.commission_rate / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between">
          <h2 className="text-2xl font-bold">{modalTitle}</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl hover:text-gray-700">×</button>
        </div>
        
        <form onSubmit={submitAction} className="p-6 space-y-4">
          {/* Commission Info Banner */}
          <div className={`rounded-xl p-3 text-sm ${userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
            <p className="font-semibold">💰 Your Commission Rate: {formData.commission_rate}%</p>
            <p className="text-xs mt-1">
              {userRole === 'admin' 
                ? 'As an Admin, you earn 20% commission on all pools you create.' 
                : 'As an Agent, you earn 10% commission on all pools you create.'}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City Name (English) *</label>
              <input type="text" required value={formData.city_name} onChange={(e) => setFormData({...formData, city_name: e.target.value})} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City Name (Amharic)</label>
              <input type="text" value={formData.city_name_am} onChange={(e) => setFormData({...formData, city_name_am: e.target.value})} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Region</label>
              <input type="text" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
              <input type="text" value={formData.icon} onChange={(e) => setFormData({...formData, icon: e.target.value})} className="w-full border rounded-lg p-2" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg p-2" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">City Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="w-full border rounded-lg p-2" />
            {uploading && <p className="text-sm text-gray-500 mt-1">Uploading and compressing...</p>}
            {formData.image_url && <img src={formData.image_url} alt="City" className="w-32 h-32 object-cover rounded-lg mt-2" />}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">💰 Prize Configuration ({formData.commission_rate}% Commission)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs block">Daily Prize (ETB)</label>
                <input type="number" value={formData.daily_prize} onChange={(e) => setFormData({...formData, daily_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" />
                <p className="text-[10px] text-green-600 mt-1">You earn: {commissionAmount(formData.daily_prize).toLocaleString()} ETB</p>
              </div>
              <div>
                <label className="text-xs block">Weekly Prize (ETB)</label>
                <input type="number" value={formData.weekly_prize} onChange={(e) => setFormData({...formData, weekly_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" />
                <p className="text-[10px] text-green-600 mt-1">You earn: {commissionAmount(formData.weekly_prize).toLocaleString()} ETB</p>
              </div>
              <div>
                <label className="text-xs block">Monthly Prize (ETB)</label>
                <input type="number" value={formData.monthly_prize} onChange={(e) => setFormData({...formData, monthly_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" />
                <p className="text-[10px] text-green-600 mt-1">You earn: {commissionAmount(formData.monthly_prize).toLocaleString()} ETB</p>
              </div>
              <div>
                <label className="text-xs block">Daily Entry (ETB)</label>
                <input type="number" value={formData.daily_entry} onChange={(e) => setFormData({...formData, daily_entry: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" />
              </div>
              <div>
                <label className="text-xs block">Weekly Entry (ETB)</label>
                <input type="number" value={formData.weekly_entry} onChange={(e) => setFormData({...formData, weekly_entry: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" />
              </div>
              <div>
                <label className="text-xs block">Monthly Entry (ETB)</label>
                <input type="number" value={formData.monthly_entry} onChange={(e) => setFormData({...formData, monthly_entry: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" />
              </div>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Active</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.daily_pool_enabled} onChange={(e) => setFormData({...formData, daily_pool_enabled: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Daily Pool</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.weekly_pool_enabled} onChange={(e) => setFormData({...formData, weekly_pool_enabled: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Weekly Pool</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.monthly_pool_enabled} onChange={(e) => setFormData({...formData, monthly_pool_enabled: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Monthly Pool</span></label>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs text-yellow-800">📌 Commission: {formData.commission_rate}% of total collection goes to you. Winner receives the full prize amount.</p>
            <p className="text-xs text-green-700 mt-1">💚 2% of all contributions supports kidney & heart disease patients.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading || uploading} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Processing...' : submitButtonText}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
