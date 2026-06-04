// components/admin/CreateCityVipModal.js
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function CreateCityVipModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    city_name: '',
    city_display_name: '',
    slogan: '',
    description: '',
    icon: '🏙️',
    is_active: true,
    daily_prize: 1000000,
    weekly_prize: 10000000,
    monthly_prize: 40000000,
    daily_entry_fee: 500,
    weekly_entry_fee: 2500,
    monthly_entry_fee: 5000
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.city_name || !formData.city_display_name) {
      toast.error('Please fill city name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('city_vip_config')
        .insert({
          city_id: formData.city_name.toLowerCase().replace(/\s/g, '-'),
          city_name: formData.city_display_name,
          slogan: formData.slogan,
          description: formData.description,
          icon: formData.icon,
          is_active: formData.is_active,
          daily_prize: formData.daily_prize,
          weekly_prize: formData.weekly_prize,
          monthly_prize: formData.monthly_prize,
          daily_entry_fee: formData.daily_entry_fee,
          weekly_entry_fee: formData.weekly_entry_fee,
          monthly_entry_fee: formData.monthly_entry_fee,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      
      toast.success(`City VIP program created for ${formData.city_display_name}!`);
      onSuccess?.();
      onClose();
      setFormData({
        city_name: '',
        city_display_name: '',
        slogan: '',
        description: '',
        icon: '🏙️',
        is_active: true,
        daily_prize: 1000000,
        weekly_prize: 10000000,
        monthly_prize: 40000000,
        daily_entry_fee: 500,
        weekly_entry_fee: 2500,
        monthly_entry_fee: 5000
      });
    } catch (error) {
      console.error('Error creating city VIP:', error);
      toast.error('Failed to create city VIP program');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold">🏙️ Create New City VIP Program</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City ID (URL slug) *</label>
              <input
                type="text"
                value={formData.city_name}
                onChange={(e) => setFormData({...formData, city_name: e.target.value})}
                placeholder="addis-ababa"
                className="w-full border rounded-lg p-2"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Example: addis-ababa, dire-dawa</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City Display Name *</label>
              <input
                type="text"
                value={formData.city_display_name}
                onChange={(e) => setFormData({...formData, city_display_name: e.target.value})}
                placeholder="Addis Ababa | አዲስ አበባ"
                className="w-full border rounded-lg p-2"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Icon (Emoji)</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({...formData, icon: e.target.value})}
              placeholder="🏙️"
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Slogan</label>
            <input
              type="text"
              value={formData.slogan}
              onChange={(e) => setFormData({...formData, slogan: e.target.value})}
              placeholder="የኢትዮጵያ የንግድ እና የዲፕሎማሲ ልብ"
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the city and its VIP program..."
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">💰 Prize & Entry Fee Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1">Daily Prize (ETB)</label>
                <input type="number" value={formData.daily_prize} onChange={(e) => setFormData({...formData, daily_prize: parseInt(e.target.value)})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Daily Entry Fee (ETB)</label>
                <input type="number" value={formData.daily_entry_fee} onChange={(e) => setFormData({...formData, daily_entry_fee: parseInt(e.target.value)})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Weekly Prize (ETB)</label>
                <input type="number" value={formData.weekly_prize} onChange={(e) => setFormData({...formData, weekly_prize: parseInt(e.target.value)})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Weekly Entry Fee (ETB)</label>
                <input type="number" value={formData.weekly_entry_fee} onChange={(e) => setFormData({...formData, weekly_entry_fee: parseInt(e.target.value)})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Monthly Prize (ETB)</label>
                <input type="number" value={formData.monthly_prize} onChange={(e) => setFormData({...formData, monthly_prize: parseInt(e.target.value)})} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Monthly Entry Fee (ETB)</label>
                <input type="number" value={formData.monthly_entry_fee} onChange={(e) => setFormData({...formData, monthly_entry_fee: parseInt(e.target.value)})} className="w-full border rounded-lg p-2" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              className="w-5 h-5"
            />
            <label htmlFor="is_active" className="text-sm font-medium">Active (visible to users)</label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-gray-700 to-gray-900 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50">
              {loading ? 'Creating...' : '🏙️ Create City VIP Program'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
