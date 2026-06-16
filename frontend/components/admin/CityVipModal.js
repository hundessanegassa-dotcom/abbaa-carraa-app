// components/admin/CityVipModal.js - Unified City VIP Modal (Create, Edit, Delete)
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function CityVipModal({ isOpen, onClose, onSuccess, mode, cityData, userId }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    city_name: '',
    city_id: '',
    pool_type: 'daily',
    contribution_amount: 500,
    prize_amount: 1000000,
    description: '',
    is_active: true
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (isOpen && mode === 'edit' && cityData) {
      setFormData({
        city_name: cityData.city || cityData.city_name || '',
        city_id: cityData.city_id || cityData.id || '',
        pool_type: cityData.pool_type || 'daily',
        contribution_amount: cityData.contribution_amount || 500,
        prize_amount: cityData.prize_amount || 1000000,
        description: cityData.description || '',
        is_active: cityData.is_active !== undefined ? cityData.is_active : true
      });
    } else if (isOpen && mode === 'create') {
      setFormData({
        city_name: '',
        city_id: '',
        pool_type: 'daily',
        contribution_amount: 500,
        prize_amount: 1000000,
        description: '',
        is_active: true
      });
    }
    setDeleteConfirm('');
  }, [isOpen, mode, cityData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    if (mode === 'delete') {
      await handleDelete();
      return;
    }

    if (!formData.city_name) {
      toast.error('Please enter a city name');
      return;
    }

    setLoading(true);
    try {
      const cityId = formData.city_id || formData.city_name.toLowerCase().replace(/\s/g, '-');
      
      if (mode === 'create') {
        // Check if city already exists
        const { data: existing } = await supabase
          .from('city_vip_config')
          .select('id')
          .eq('city_id', cityId)
          .maybeSingle();

        if (existing) {
          toast.error('This city already has a VIP program');
          setLoading(false);
          return;
        }

        const { error } = await supabase
          .from('city_vip_config')
          .insert({
            city_id: cityId,
            city_name: formData.city_name,
            pool_type: formData.pool_type,
            contribution_amount: formData.contribution_amount,
            prize_amount: formData.prize_amount,
            description: formData.description,
            is_active: true,
            created_by: userId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success(`✅ City VIP program created for ${formData.city_name}!`);
      } else if (mode === 'edit') {
        const { error } = await supabase
          .from('city_vip_config')
          .update({
            city_name: formData.city_name,
            contribution_amount: formData.contribution_amount,
            prize_amount: formData.prize_amount,
            description: formData.description,
            is_active: formData.is_active,
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('city_id', cityId);

        if (error) throw error;
        toast.success(`✅ City VIP program updated for ${formData.city_name}!`);
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save City VIP program');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setLoading(true);
    try {
      const cityId = formData.city_id || formData.city_name.toLowerCase().replace(/\s/g, '-');
      
      const { error } = await supabase
        .from('city_vip_config')
        .delete()
        .eq('city_id', cityId);

      if (error) throw error;
      
      toast.success(`🗑️ City VIP program deleted for ${formData.city_name}`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete City VIP program');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = mode === 'create' ? '➕ Create City VIP Program' 
    : mode === 'edit' ? '✏️ Edit City VIP Program' 
    : '🗑️ Delete City VIP Program';

  const modalIcon = mode === 'create' ? '🏙️' 
    : mode === 'edit' ? '✏️' 
    : '🗑️';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>{modalIcon}</span> {modalTitle}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mode === 'delete' ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <div className="text-5xl mb-3">⚠️</div>
                <p className="text-lg font-bold text-red-800">Delete City VIP Program</p>
                <p className="text-sm text-red-600 mt-2">
                  Are you sure you want to delete the City VIP program for <strong>{formData.city_name}</strong>?
                  This action cannot be undone. All participant data will be removed.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <strong>"DELETE"</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 text-center font-bold"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold transition">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50">
                  {loading ? 'Processing...' : '🗑️ Delete City VIP'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* City Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City Name *</label>
                <input
                  type="text"
                  name="city_name"
                  value={formData.city_name}
                  onChange={handleChange}
                  placeholder="e.g., Addis Ababa"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  disabled={mode === 'edit'}
                />
                {mode === 'edit' && (
                  <p className="text-xs text-gray-400 mt-1">City name cannot be changed after creation</p>
                )}
              </div>

              {/* Pool Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pool Type</label>
                <select
                  name="pool_type"
                  value={formData.pool_type}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">⭐ Daily (1M ETB)</option>
                  <option value="weekly">🏆 Weekly (10M ETB)</option>
                  <option value="monthly">👑 Monthly (40M ETB)</option>
                </select>
              </div>

              {/* Contribution & Prize */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (ETB)</label>
                  <input
                    type="number"
                    name="contribution_amount"
                    value={formData.contribution_amount}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prize Amount (ETB)</label>
                  <input
                    type="number"
                    name="prize_amount"
                    value={formData.prize_amount}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe the City VIP program..."
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Active</label>
              </div>

              {/* Preview */}
              {formData.city_name && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 mb-2">📋 Preview</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">City:</span> <span className="font-medium">{formData.city_name}</span></div>
                    <div><span className="text-gray-500">Type:</span> <span className="font-medium">{formData.pool_type}</span></div>
                    <div><span className="text-gray-500">Entry Fee:</span> <span className="font-bold text-green-600">ETB {formData.contribution_amount.toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Prize:</span> <span className="font-bold text-yellow-600">ETB {formData.prize_amount.toLocaleString()}</span></div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold transition">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50">
                  {loading ? 'Saving...' : (mode === 'create' ? '✨ Create City VIP' : '💾 Save Changes')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
