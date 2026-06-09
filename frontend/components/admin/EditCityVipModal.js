// components/admin/EditCityVipModal.js
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function EditCityVipModal({ isOpen, onClose, onSuccess, cityData, userId }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
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
    monthly_entry: 5000
  });

  useEffect(() => {
    if (cityData) {
      setFormData({
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
        monthly_entry: cityData.monthly_entry || 5000
      });
    }
  }, [cityData]);

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
    const fileExt = file.name.split('.').pop();
    const fileName = `city-${Date.now()}.${fileExt}`;
    const filePath = `city-images/${fileName}`;
    
    const { error } = await supabase.storage
      .from('city-images')
      .upload(filePath, file);
    
    if (error) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('city-images')
      .getPublicUrl(filePath);
    
    setFormData({ ...formData, image_url: publicUrl });
    setUploading(false);
    toast.success('City image updated');
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between">
          <h2 className="text-2xl font-bold">Edit City VIP Program - {cityData?.city_name}</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City Name (English)</label>
              <input type="text" value={formData.city_name} onChange={(e) => setFormData({...formData, city_name: e.target.value})} className="w-full border rounded-lg p-2" />
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
            {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
            {formData.image_url && <img src={formData.image_url} alt="City" className="w-32 h-32 object-cover rounded-lg mt-2" />}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Prize Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs block">Daily Prize</label><input type="number" value={formData.daily_prize} onChange={(e) => setFormData({...formData, daily_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
              <div><label className="text-xs block">Weekly Prize</label><input type="number" value={formData.weekly_prize} onChange={(e) => setFormData({...formData, weekly_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
              <div><label className="text-xs block">Monthly Prize</label><input type="number" value={formData.monthly_prize} onChange={(e) => setFormData({...formData, monthly_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
              <div><label className="text-xs block">Daily Entry</label><input type="number" value={formData.daily_entry} onChange={(e) => setFormData({...formData, daily_entry: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
              <div><label className="text-xs block">Weekly Entry</label><input type="number" value={formData.weekly_entry} onChange={(e) => setFormData({...formData, weekly_entry: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
              <div><label className="text-xs block">Monthly Entry</label><input type="number" value={formData.monthly_entry} onChange={(e) => setFormData({...formData, monthly_entry: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Active</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.daily_pool_enabled} onChange={(e) => setFormData({...formData, daily_pool_enabled: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Daily Pool</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.weekly_pool_enabled} onChange={(e) => setFormData({...formData, weekly_pool_enabled: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Weekly Pool</span></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={formData.monthly_pool_enabled} onChange={(e) => setFormData({...formData, monthly_pool_enabled: e.target.checked})} className="w-4 h-4" /><span className="text-sm">Monthly Pool</span></label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading || uploading} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50">
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
