// components/admin/CreateCityVipModal.js
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function CreateCityVipModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    city_id: '',
    city_name: '',
    city_name_am: '',
    region: '',
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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('city_vip_config')
        .insert([{
          ...formData,
          city_id: formData.city_id.toLowerCase().replace(/\s/g, '-'),
          created_at: new Date(),
          updated_at: new Date()
        }]);
      
      if (error) throw error;
      toast.success('City VIP program created successfully!');
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
          <button onClick={onClose} className="text-gray-500 text-2xl">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">City Name (English) *</label><input type="text" required value={formData.city_name} onChange={(e) => setFormData({...formData, city_name: e.target.value, city_id: e.target.value})} className="w-full border rounded-lg p-2" /></div>
            <div><label className="block text-sm font-medium mb-1">City Name (Amharic)</label><input type="text" value={formData.city_name_am} onChange={(e) => setFormData({...formData, city_name_am: e.target.value})} className="w-full border rounded-lg p-2" /></div>
            <div><label className="block text-sm font-medium mb-1">Region</label><input type="text" value={formData.region} onChange={(e) => setFormData({...formData, region: e.target.value})} className="w-full border rounded-lg p-2" /></div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-bold mb-2">Prize Configuration</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-xs">Daily Prize (ETB)</label><input type="number" value={formData.daily_prize} onChange={(e) => setFormData({...formData, daily_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
              <div><label className="text-xs">Weekly Prize (ETB)</label><input type="number" value={formData.weekly_prize} onChange={(e) => setFormData({...formData, weekly_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
              <div><label className="text-xs">Monthly Prize (ETB)</label><input type="number" value={formData.monthly_prize} onChange={(e) => setFormData({...formData, monthly_prize: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
              <div><label className="text-xs">Daily Entry (ETB)</label><input type="number" value={formData.daily_entry} onChange={(e) => setFormData({...formData, daily_entry: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
              <div><label className="text-xs">Weekly Entry (ETB)</label><input type="number" value={formData.weekly_entry} onChange={(e) => setFormData({...formData, weekly_entry: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
              <div><label className="text-xs">Monthly Entry (ETB)</label><input type="number" value={formData.monthly_entry} onChange={(e) => setFormData({...formData, monthly_entry: parseInt(e.target.value)})} className="w-full border rounded p-1 text-sm" /></div>
            </div>
          </div>
          <div className="flex gap-3"><button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-2 rounded-lg">{loading ? 'Creating...' : 'Create City VIP'}</button><button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-2 rounded-lg">Cancel</button></div>
        </form>
      </div>
    </div>
  );
}
