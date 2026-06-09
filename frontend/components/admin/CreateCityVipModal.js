// components/admin/CreateCityVipModal.js
import { useState } from 'react';
import { supabase, compressImage } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function CreateCityVipModal({ isOpen, onClose, onSuccess, userId }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
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
    monthly_entry: 5000
  });

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
      // Compress image before upload
      const compressedFile = await compressImage(file, 1200, 800, 0.8);
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
      
      setFormData({ ...formData, image_url: publicUrl });
      toast.success('City image uploaded');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cityId = formData.city_id.toLowerCase().replace(/\s/g, '-');
      
      const { error } = await supabase
        .from('city_vip_config')
        .insert([{
          ...formData,
          city_id: cityId,
          created_by: userId,
          created_at: new Date(),
          updated_at: new Date()
        }]);
      
      if (error) throw error;
      
      toast.success(`City VIP program for ${formData.city_name} created successfully!`);
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
          <h2 className="text-2xl font-bold">Create City VIP Program</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl hover:text-gray-700">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City Name (English) *</label>
              <input type="text" required value={formData.city_name} onChange={(e) => setFormData({...formData, city_name: e.target.value, city_id: e.target.value})} className="w-full border rounded-lg p-2" placeholder="e.g., Addis Ababa" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City Name (Amharic)</label>
              <input type="text" value={formData.city_name_am} onChange={(e) => setFormData({...formData, city_name_am: e.target.value})} className="w-full border rounded-lg p-2" placeholder="አዲስ አበባ" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Region</label>
              <input type="text" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} className="w-full border rounded-lg p-2" placeholder="e.g., Central" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon (emoji)</label>
              <input type="text" value={formData.icon} onChange={(e) => setFormData({...formData, icon: e.target.value})} className="w-full border rounded-lg p-2" placeholder="🏙️" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg p-2" placeholder="Describe the City VIP program..." />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">City Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="w-full border rounded-lg p-2" />
            {uploading && <p className="text-sm text-gray-500 mt-1">Uploading and compressing...</p>}
            {formData.image_url && <img src={formData.image_url} alt="City" className="w-32 h-32 object-cover rounded-lg mt-2" />}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Prize Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs block">Daily Prize (ETB)</label>
                <input type="number" value={formData.daily_prize} onChange={(e) => setFormData({...formData, daily_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" />
              </div>
              <div>
                <label className="text-xs block">Weekly Prize (ETB)</label>
                <input type="number" value={formData.weekly_prize} onChange={(e) => setFormData({...formData, weekly_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" />
              </div>
              <div>
                <label className="text-xs block">Monthly Prize (ETB)</label>
                <input type="number" value={formData.monthly_prize} onChange={(e) => setFormData({...formData, monthly_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" />
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
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.daily_pool_enabled} onChange={(e) => setFormData({...formData, daily_pool_enabled: e.target.checked})} className="w-4 h-4" />
              <span className="text-sm">Daily Pool</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.weekly_pool_enabled} onChange={(e) => setFormData({...formData, weekly_pool_enabled: e.target.checked})} className="w-4 h-4" />
              <span className="text-sm">Weekly Pool</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.monthly_pool_enabled} onChange={(e) => setFormData({...formData, monthly_pool_enabled: e.target.checked})} className="w-4 h-4" />
              <span className="text-sm">Monthly Pool</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading || uploading} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
              {loading ? 'Creating...' : '✨ Create City VIP'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
