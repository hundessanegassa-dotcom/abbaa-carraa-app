// components/admin/RegularPoolModal.js - Unified Regular Pool Modal (Create, Edit, Delete)
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function RegularPoolModal({ isOpen, onClose, onSuccess, mode, poolData, userId }) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    prize_name: '',
    description: '',
    target_amount: '',
    entry_fee: '10',
    ticket_price: '5',
    start_date: new Date().toISOString().slice(0, 16),
    end_date: '',
    image_url: '',
    is_featured: true,
    category: 'other',
    status: 'active'
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (isOpen && mode === 'edit' && poolData) {
      setFormData({
        id: poolData.id,
        prize_name: poolData.prize_name || '',
        description: poolData.description || '',
        target_amount: poolData.target_amount || '',
        entry_fee: poolData.entry_fee || '10',
        ticket_price: poolData.ticket_price || '5',
        start_date: poolData.start_date ? new Date(poolData.start_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
        end_date: poolData.end_date ? new Date(poolData.end_date).toISOString().slice(0, 16) : '',
        image_url: poolData.image_url || '',
        is_featured: poolData.is_featured !== undefined ? poolData.is_featured : true,
        category: poolData.category || 'other',
        status: poolData.status || 'active'
      });
    } else if (isOpen && mode === 'create') {
      setFormData({
        prize_name: '',
        description: '',
        target_amount: '',
        entry_fee: '10',
        ticket_price: '5',
        start_date: new Date().toISOString().slice(0, 16),
        end_date: '',
        image_url: '',
        is_featured: true,
        category: 'other',
        status: 'active'
      });
    }
    setDeleteConfirm('');
  }, [isOpen, mode, poolData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

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
    const fileName = `pool-${Date.now()}.${fileExt}`;
    const filePath = `pools/${fileName}`;

    const { error } = await supabase.storage
      .from('pool-images')
      .upload(filePath, file);

    if (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed.');
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('pool-images')
      .getPublicUrl(filePath);

    setFormData(prev => ({ ...prev, image_url: publicUrl }));
    setUploading(false);
    toast.success('Image uploaded');
  };

  const handleSubmit = async () => {
    if (mode === 'delete') {
      await handleDelete();
      return;
    }

    if (!formData.prize_name || !formData.target_amount || !formData.end_date) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const poolDataToSave = {
        prize_name: formData.prize_name,
        description: formData.description,
        target_amount: parseFloat(formData.target_amount),
        entry_fee: parseFloat(formData.entry_fee) || 10,
        ticket_price: parseFloat(formData.ticket_price) || 5,
        current_amount: 0,
        status: formData.status || 'active',
        is_featured: formData.is_featured,
        image_url: formData.image_url,
        category: formData.category || 'other',
        start_date: formData.start_date,
        end_date: formData.end_date,
        admin_commission_rate: 20,
        updated_at: new Date().toISOString()
      };

      if (mode === 'create') {
        poolDataToSave.created_by = userId;
        poolDataToSave.created_at = new Date().toISOString();

        const { error } = await supabase
          .from('pools')
          .insert(poolDataToSave);

        if (error) throw error;
        toast.success('✅ Pool created successfully! You earn 20% commission.');
      } else if (mode === 'edit') {
        poolDataToSave.updated_by = userId;

        const { error } = await supabase
          .from('pools')
          .update(poolDataToSave)
          .eq('id', formData.id);

        if (error) throw error;
        toast.success('✅ Pool updated successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save pool');
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
      const { error } = await supabase
        .from('pools')
        .delete()
        .eq('id', formData.id);

      if (error) throw error;
      toast.success('🗑️ Pool deleted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete pool');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: 'vehicle', label: '🚗 Vehicles' },
    { value: 'machinery', label: '🏭 Machinery' },
    { value: 'electronics', label: '💻 Electronics' },
    { value: 'property', label: '🏠 Property' },
    { value: 'furniture', label: '🛋️ Furniture' },
    { value: 'cash', label: '💰 Cash Prize' },
    { value: 'other', label: '🎁 Other' }
  ];

  if (!isOpen) return null;

  const modalTitle = mode === 'create' ? '➕ Create Regular Pool (20% Commission)' 
    : mode === 'edit' ? '✏️ Edit Regular Pool' 
    : '🗑️ Delete Regular Pool';

  const modalIcon = mode === 'create' ? '🎯' 
    : mode === 'edit' ? '✏️' 
    : '🗑️';

  const totalCommission = parseFloat(formData.target_amount || 0) * 0.20;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>{modalIcon}</span> {modalTitle}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>

        <div className="p-6">
          {mode === 'delete' ? (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <div className="text-5xl mb-3">⚠️</div>
                <p className="text-lg font-bold text-red-800">Delete Pool</p>
                <p className="text-sm text-red-600 mt-2">
                  Are you sure you want to delete <strong>{formData.prize_name}</strong>?
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
                  {loading ? 'Processing...' : '🗑️ Delete Pool'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Prize Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prize Name *</label>
                <input
                  type="text"
                  name="prize_name"
                  value={formData.prize_name}
                  onChange={handleChange}
                  placeholder="e.g., iPhone 15 Pro Max"
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe the prize and pool rules..."
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Target & Entry Fee */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (ETB) *</label>
                  <input
                    type="number"
                    name="target_amount"
                    value={formData.target_amount}
                    onChange={handleChange}
                    placeholder="10000"
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (ETB)</label>
                  <input
                    type="number"
                    name="entry_fee"
                    value={formData.entry_fee}
                    onChange={handleChange}
                    placeholder="10"
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="datetime-local"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pool Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full border rounded-lg px-4 py-2"
                />
                {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
                {formData.image_url && (
                  <div className="mt-2">
                    <img src={formData.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-lg border" />
                  </div>
                )}
              </div>

              {/* Featured & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name="is_featured"
                    checked={formData.is_featured}
                    onChange={handleChange}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <label className="text-sm font-medium text-gray-700">⭐ Feature on homepage</label>
                </div>
                {mode === 'edit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500"
                    >
                      <option value="active">🟢 Active</option>
                      <option value="paused">🟡 Paused</option>
                      <option value="completed">🔴 Completed</option>
                      <option value="pending">⏳ Pending</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Commission Info */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
                <p className="font-semibold text-yellow-800 mb-1">💰 Admin Commission: 20%</p>
                <p className="text-sm text-yellow-700">
                  When this pool reaches target, you earn 20% of the total amount.
                  Target: ETB {parseFloat(formData.target_amount || 0).toLocaleString()} 
                  → Your commission: <strong className="text-green-600">ETB {totalCommission.toLocaleString()}</strong>
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold transition">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={loading || uploading} className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50">
                  {loading ? 'Creating...' : (mode === 'create' ? '✨ Create Pool (20%)' : '💾 Save Changes')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
