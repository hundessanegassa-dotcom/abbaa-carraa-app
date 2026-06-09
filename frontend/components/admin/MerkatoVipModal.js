// components/admin/MerkatoVipModal.js - FULL CRUD with Agent Commission
import { useState, useEffect } from 'react';
import { supabase, compressImage } from '../../lib/supabase';
import toast from 'react-hot-toast';

export default function MerkatoVipModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  mode = 'create',  // 'create', 'edit', 'delete'
  poolData = null,
  userId 
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [formData, setFormData] = useState({
    tier: 'daily',
    name: 'Daily Millionaire',
    contribution_amount: 500,
    prize_amount: 1000000,
    winner_count: 1,
    draw_time: '20:00',
    draw_frequency: 'daily',
    status: 'active',
    image_url: '',
    description: 'Win 1,000,000 ETB every day!',
    commission_rate: 10
  });

  const tierConfig = {
    daily: {
      name: 'Daily Millionaire',
      contribution: 500,
      prize: 1000000,
      frequency: 'daily',
      winnerCount: 1,
      icon: '⭐',
      slogan: 'Make ONE participant a MILLIONAIRE Today!',
      description: 'Win 1,000,000 ETB every day!'
    },
    weekly: {
      name: 'Weekly Mega Winner',
      contribution: 2500,
      prize: 10000000,
      frequency: 'weekly',
      winnerCount: 1,
      icon: '🏆',
      slogan: 'Make ONE participant a MILLIONAIRE This Week!',
      description: 'Win 10,000,000 ETB every week!'
    },
    monthly: {
      name: 'Monthly Legend',
      contribution: 5000,
      prize: 40000000,
      frequency: 'monthly',
      winnerCount: 1,
      icon: '👑',
      slogan: 'Make ONE participant a MILLIONAIRE This Month!',
      description: 'Win 40,000,000 ETB every month!'
    }
  };

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
      }
    };
    if (isOpen) fetchUserRole();
  }, [isOpen, userId]);

  // Load data when in edit mode
  useEffect(() => {
    if (mode === 'edit' && poolData) {
      setFormData({
        tier: poolData.tier || 'daily',
        name: poolData.name || tierConfig[poolData.tier]?.name || 'Daily Millionaire',
        contribution_amount: poolData.contribution_amount || tierConfig[poolData.tier]?.contribution || 500,
        prize_amount: poolData.prize_amount || tierConfig[poolData.tier]?.prize || 1000000,
        winner_count: poolData.winner_count || 1,
        draw_time: poolData.draw_time ? new Date(poolData.draw_time).toISOString().slice(0, 16) : '20:00',
        draw_frequency: poolData.draw_frequency || poolData.tier || 'daily',
        status: poolData.status || 'active',
        image_url: poolData.image_url || '',
        description: poolData.description || tierConfig[poolData.tier]?.description || '',
        commission_rate: poolData.commission_rate || 10
      });
    }
  }, [mode, poolData]);

  const handleTierChange = (tier) => {
    const config = tierConfig[tier];
    setFormData({
      ...formData,
      tier: tier,
      name: config.name,
      contribution_amount: config.contribution,
      prize_amount: config.prize,
      winner_count: config.winnerCount,
      draw_frequency: tier,
      description: config.description
    });
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
    try {
      const compressedFile = await compressImage(file, 1024, 1024, 0.7);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `merkato-${Date.now()}.${fileExt}`;
      const filePath = `merkato-images/${fileName}`;
      
      const { error } = await supabase.storage
        .from('merkato-images')
        .upload(filePath, compressedFile);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('merkato-images')
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

  const calculateDrawDate = () => {
    let drawDate = new Date();
    if (formData.tier === 'daily') {
      drawDate.setDate(drawDate.getDate() + 1);
    } else if (formData.tier === 'weekly') {
      drawDate.setDate(drawDate.getDate() + (7 - drawDate.getDay()));
    } else {
      drawDate.setMonth(drawDate.getMonth() + 1);
      drawDate.setDate(1);
    }
    
    const [hours, minutes] = formData.draw_time.split(':');
    drawDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return drawDate.toISOString();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const drawDateTime = calculateDrawDate();
      const totalCollection = formData.prize_amount * 1.2;
      const totalSeats = Math.floor(totalCollection / formData.contribution_amount);
      const commissionRate = userRole === 'admin' ? 20 : 10;
      
      const { error } = await supabase
        .from('merkato_vip_pools')
        .insert([{
          tier: formData.tier,
          name: formData.name,
          contribution_amount: formData.contribution_amount,
          prize_amount: formData.prize_amount,
          winner_count: formData.winner_count,
          draw_time: drawDateTime,
          draw_frequency: formData.draw_frequency,
          status: 'active',
          image_url: formData.image_url,
          description: formData.description,
          total_seats: totalSeats,
          total_collection: totalCollection,
          commission_rate: commissionRate,
          created_by: userId,
          created_by_role: userRole,
          created_at: new Date(),
          updated_at: new Date()
        }]);
      
      if (error) throw error;
      
      const commissionMessage = userRole === 'admin' ? '20%' : '10%';
      toast.success(`${formData.name} pool created! You earn ${commissionMessage} commission.`);
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
      const drawDateTime = calculateDrawDate();
      
      const { error } = await supabase
        .from('merkato_vip_pools')
        .update({
          name: formData.name,
          contribution_amount: formData.contribution_amount,
          prize_amount: formData.prize_amount,
          draw_time: drawDateTime,
          image_url: formData.image_url,
          description: formData.description,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', poolData.id);
      
      if (error) throw error;
      
      toast.success(`${formData.name} pool updated successfully!`);
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
        .from('merkato_vip_participants')
        .select('*', { count: 'exact', head: true })
        .eq('pool_type', poolData.tier);
      
      if (count && count > 0) {
        toast.error(`Cannot delete: ${count} participants have joined this pool`);
        setLoading(false);
        return;
      }
      
      const { error } = await supabase
        .from('merkato_vip_pools')
        .delete()
        .eq('id', poolData.id);
      
      if (error) throw error;
      
      toast.success(`${poolData.name} pool deleted successfully!`);
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
      tier: 'daily',
      name: 'Daily Millionaire',
      contribution_amount: 500,
      prize_amount: 1000000,
      winner_count: 1,
      draw_time: '20:00',
      draw_frequency: 'daily',
      status: 'active',
      image_url: '',
      description: 'Win 1,000,000 ETB every day!',
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
              Are you sure you want to delete <strong>{poolData?.name}</strong>?
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
  const modalTitle = isEditMode ? '✏️ Edit Merkato VIP Pool' : '➕ Create Merkato VIP Pool';
  const submitButtonText = isEditMode ? '💾 Save Changes' : '✨ Create Merkato VIP Pool';
  const submitAction = isEditMode ? handleUpdate : handleCreate;

  const commissionRate = userRole === 'admin' ? 20 : 10;
  const totalCollection = formData.prize_amount * 1.2;
  const yourCommission = formData.prize_amount * (commissionRate / 100);
  const totalSeats = Math.floor(totalCollection / formData.contribution_amount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between">
          <h2 className="text-2xl font-bold">{modalTitle}</h2>
          <button onClick={onClose} className="text-gray-500 text-2xl hover:text-gray-700">×</button>
        </div>
        
        <form onSubmit={submitAction} className="p-6 space-y-5">
          {/* Commission Info Banner */}
          <div className={`rounded-xl p-3 text-sm ${userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
            <p className="font-semibold">💰 Your Commission Rate: {commissionRate}%</p>
            <p className="text-xs mt-1">
              {userRole === 'admin' 
                ? 'As an Admin, you earn 20% commission on all Merkato VIP pools.' 
                : 'As an Agent, you earn 10% commission on all Merkato VIP pools.'}
            </p>
          </div>

          {/* Tier Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Pool Tier</label>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(tierConfig).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleTierChange(key)}
                  className={`p-4 rounded-xl text-center transition transform hover:scale-105 ${
                    formData.tier === key
                      ? `bg-gradient-to-r ${key === 'daily' ? 'from-yellow-500 to-orange-600' : key === 'weekly' ? 'from-purple-500 to-pink-600' : 'from-green-600 to-teal-700'} text-white shadow-lg`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div className="text-3xl mb-1">{config.icon}</div>
                  <div className="font-bold text-sm">{config.name}</div>
                  <div className="text-xs">{config.prize.toLocaleString()} ETB</div>
                </button>
              ))}
            </div>
          </div>

          {/* Pool Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pool Image</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="w-full border rounded-lg p-2" />
            {uploading && <p className="text-sm text-gray-500 mt-1">Uploading and compressing...</p>}
            {formData.image_url && <img src={formData.image_url} alt="Merkato VIP" className="w-32 h-32 object-cover rounded-lg mt-2" />}
          </div>

          {/* Pool Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pool Name</label>
            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg p-2" required />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows="2" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border rounded-lg p-2" />
          </div>

          {/* Prize and Entry Fee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prize Amount (ETB)</label>
              <input type="number" value={formData.prize_amount} onChange={(e) => setFormData({...formData, prize_amount: parseInt(e.target.value)})} className="w-full border rounded-lg p-2" required />
              <p className="text-xs text-green-600 mt-1">Your commission: {yourCommission.toLocaleString()} ETB</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (ETB)</label>
              <input type="number" value={formData.contribution_amount} onChange={(e) => setFormData({...formData, contribution_amount: parseInt(e.target.value)})} className="w-full border rounded-lg p-2" required />
            </div>
          </div>

          {/* Draw Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Draw Time (Ethiopia Time)</label>
            <input type="time" value={formData.draw_time} onChange={(e) => setFormData({...formData, draw_time: e.target.value})} className="w-full border rounded-lg p-2" />
            <p className="text-xs text-gray-500 mt-1">
              {formData.tier === 'daily' && 'Draw happens every day at this time'}
              {formData.tier === 'weekly' && 'Draw happens every Sunday at this time'}
              {formData.tier === 'monthly' && 'Draw happens on the last day of month at this time'}
            </p>
          </div>

          {/* Status (Edit mode only) */}
          {isEditMode && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full border rounded-lg p-2">
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}

          {/* Commission Breakdown */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
            <h3 className="font-bold text-gray-800 mb-2">💰 Commission Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>🏆 Winner gets:</span>
                <span className="font-bold text-green-600">{formData.prize_amount.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span>📊 Total Collection (Prize + 20%):</span>
                <span className="font-bold text-purple-600">{totalCollection.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between">
                <span>👑 Your Commission ({commissionRate}%):</span>
                <span className="font-bold text-orange-600">{yourCommission.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span>💺 Total Seats:</span>
                <span className="font-bold text-blue-600">{totalSeats.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">💚 2% supports kidney & heart disease patients</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" disabled={loading || uploading} className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50">
              {loading ? 'Processing...' : submitButtonText}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-lg hover:bg-gray-300 transition">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
