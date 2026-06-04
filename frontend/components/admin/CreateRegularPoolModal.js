// components/admin/CreateRegularPoolModal.js
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function CreateRegularPoolModal({ isOpen, onClose, onSuccess, userId }) {
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
    is_featured: true
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
    const fileExt = file.name.split('.').pop();
    const fileName = `pool-${Date.now()}.${fileExt}`;
    const filePath = `pools/${fileName}`;
    
    const { error } = await supabase.storage
      .from('pool-images')
      .upload(filePath, file);
    
    if (error) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('pool-images')
      .getPublicUrl(filePath);
    
    setFormData({ ...formData, image_url: publicUrl });
    setUploading(false);
    toast.success('Image uploaded');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.prize_name || !formData.target_amount || !formData.end_date) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('pools')
        .insert({
          prize_name: formData.prize_name,
          description: formData.description,
          target_amount: parseFloat(formData.target_amount),
          entry_fee: parseFloat(formData.entry_fee) || 10,
          ticket_price: parseFloat(formData.ticket_price) || 5,
          current_amount: 0,
          status: 'active',
          is_featured: formData.is_featured,
          image_url: formData.image_url,
          created_by: userId,
          start_date: formData.start_date,
          end_date: formData.end_date,
          admin_commission_rate: 20
        });
      
      if (error) throw error;
      
      toast.success(`Pool "${formData.prize_name}" created! You'll earn 20% commission.`);
      onSuccess?.();
      onClose();
      setFormData({
        prize_name: '',
        description: '',
        target_amount: '',
        entry_fee: '10',
        ticket_price: '5',
        start_date: new Date().toISOString().slice(0, 16),
        end_date: '',
        image_url: '',
        is_featured: true
      });
    } catch (error) {
      console.error('Error creating pool:', error);
      toast.error('Failed to create pool');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold">✨ Create Regular Pool (20% Commission)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Prize Name *</label>
            <input type="text" value={formData.prize_name} onChange={(e) => setFormData({...formData, prize_name: e.target.value})} placeholder="e.g., iPhone 15 Pro Max" className="w-full border rounded-lg p-2" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea rows="3" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} placeholder="Describe the prize and pool rules..." className="w-full border rounded-lg p-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Target Amount (ETB) *</label>
              <input type="number" value={formData.target_amount} onChange={(e) => setFormData({...formData, target_amount: e.target.value})} placeholder="10000" className="w-full border rounded-lg p-2" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Entry Fee (ETB)</label>
              <input type="number" value={formData.entry_fee} onChange={(e) => setFormData({...formData, entry_fee: e.target.value})} placeholder="10" className="w-full border rounded-lg p-2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="datetime-local" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} className="w-full border rounded-lg p-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date *</label>
              <input type="datetime-local" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} className="w-full border rounded-lg p-2" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pool Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="w-full border rounded-lg p-2" />
            {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
            {formData.image_url && <img src={formData.image_url} alt="Preview" className="w-32 h-32 object-cover rounded-lg mt-2" />}
          </div>

          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_featured" checked={formData.is_featured} onChange={(e) => setFormData({...formData, is_featured: e.target.checked})} className="w-5 h-5" />
            <label htmlFor="is_featured" className="text-sm font-medium">⭐ Feature this pool on homepage</label>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-yellow-800">💰 Admin Commission: 20%</p>
            <p className="text-yellow-700 text-xs mt-1">When this pool reaches target, you earn 20% of the total amount.</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading || uploading} className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50">
              {loading ? 'Creating...' : '✨ Create Pool'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
