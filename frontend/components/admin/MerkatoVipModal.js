// components/admin/MerkatoVipModal.js - Unified Merkato VIP Modal (Create, Edit, Delete)
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const tierConfig = {
  daily: { name: 'Daily Millionaire', contribution: 500, prize: 1000000, icon: '⭐' },
  weekly: { name: 'Weekly Mega Winner', contribution: 2500, prize: 10000000, icon: '🏆' },
  monthly: { name: 'Monthly Legend', contribution: 5000, prize: 40000000, icon: '👑' }
};

export default function MerkatoVipModal({ isOpen, onClose, onSuccess, mode, poolData, userId }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tier: 'daily',
    name: 'Daily Millionaire',
    contribution_amount: 500,
    prize_amount: 1000000,
    draw_time: '20:00',
    status: 'active'
  });
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (isOpen && mode === 'edit' && poolData) {
      const drawDate = poolData.draw_time ? new Date(poolData.draw_time) : new Date();
      setFormData({
        id: poolData.id,
        tier: poolData.tier || 'daily',
        name: poolData.name || tierConfig[poolData.tier]?.name || 'Daily Millionaire',
        contribution_amount: poolData.contribution_amount || 500,
        prize_amount: poolData.prize_amount || 1000000,
        draw_time: drawDate.toISOString().slice(0, 16),
        status: poolData.status || 'active'
      });
    } else if (isOpen && mode === 'create') {
      setFormData({
        tier: 'daily',
        name: 'Daily Millionaire',
        contribution_amount: 500,
        prize_amount: 1000000,
        draw_time: new Date().toISOString().slice(0, 16),
        status: 'active'
      });
    }
    setDeleteConfirm('');
  }, [isOpen, mode, poolData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTierChange = (tier) => {
    const config = tierConfig[tier];
    setFormData(prev => ({
      ...prev,
      tier: tier,
      name: config.name,
      contribution_amount: config.contribution,
      prize_amount: config.prize
    }));
  };

  const handleSubmit = async () => {
    if (mode === 'delete') {
      await handleDelete();
      return;
    }

    if (!formData.name) {
      toast.error('Please enter a pool name');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'create') {
        const drawDate = new Date(formData.draw_time);
        const config = tierConfig[formData.tier];

        const { error } = await supabase
          .from('merkato_vip_pools')
          .insert({
            tier: formData.tier,
            name: formData.name,
            contribution_amount: formData.contribution_amount,
            prize_amount: formData.prize_amount,
            draw_time: drawDate.toISOString(),
            draw_frequency: formData.tier,
            status: 'active',
            created_by: userId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
        toast.success(`✅ ${config.name} pool created successfully!`);
      } else if (mode === 'edit') {
        const drawDate = new Date(formData.draw_time);

        const { error } = await supabase
          .from('merkato_vip_pools')
          .update({
            name: formData.name,
            contribution_amount: formData.contribution_amount,
            prize_amount: formData.prize_amount,
            draw_time: drawDate.toISOString(),
            status: formData.status,
            updated_at: new Date().toISOString(),
            updated_by: userId
          })
          .eq('id', formData.id);

        if (error) throw error;
        toast.success('✅ Merkato pool updated successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to save Merkato pool');
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
        .from('merkato_vip_pools')
        .delete()
        .eq('id', formData.id);

      if (error) throw error;
      toast.success('🗑️ Merkato pool deleted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete Merkato pool');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalTitle = mode === 'create' ? '➕ Create Merkato VIP Pool' 
    : mode === 'edit' ? '✏️ Edit Merkato VIP Pool' 
    : '🗑️ Delete Merkato VIP Pool';

  const modalIcon = mode === 'create' ? '🏪' 
    : mode === 'edit' ? '✏️' 
    : '🗑️';

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
                <p className="text-lg font-bold text-red-800">Delete Merkato VIP Pool</p>
                <p className="text-sm text-red-600 mt-2">
                  Are you sure you want to delete <strong>{formData.name}</strong>?
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
              {/* Tier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Tier</label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.entries(tierConfig).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTierChange(key)}
                      className={`p-4 rounded-xl text-center transition transform hover:scale-105 ${
                        formData.tier === key 
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <div className="text-3xl">{config.icon}</div>
                      <div className="font-bold text-sm mt-1">{config.name}</div>
                      <div className="text-xs">{config.prize.toLocaleString()} ETB</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pool Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pool Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                />
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
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prize Amount (ETB)</label>
                  <input
                    type="number"
                    name="prize_amount"
                    value={formData.prize_amount}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              </div>

              {/* Draw Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Draw Time</label>
                <input
                  type="datetime-local"
                  name="draw_time"
                  value={formData.draw_time}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                />
              </div>

              {/* Status (Edit only) */}
              {mode === 'edit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="active">🟢 Active</option>
                    <option value="paused">🟡 Paused</option>
                    <option value="completed">🔴 Completed</option>
                  </select>
                </div>
              )}

              {/* Preview */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-800 mb-2">📋 Preview</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="text-gray-500">Tier:</span> <span className="font-medium">{formData.tier}</span></div>
                  <div><span className="text-gray-500">Name:</span> <span className="font-medium">{formData.name}</span></div>
                  <div><span className="text-gray-500">Entry Fee:</span> <span className="font-bold text-green-600">ETB {formData.contribution_amount.toLocaleString()}</span></div>
                  <div><span className="text-gray-500">Prize:</span> <span className="font-bold text-yellow-600">ETB {formData.prize_amount.toLocaleString()}</span></div>
                  <div><span className="text-gray-500">Draw:</span> <span className="font-medium">{new Date(formData.draw_time).toLocaleString()}</span></div>
                  <div><span className="text-gray-500">Total Seats:</span> <span className="font-medium">{Math.floor((formData.prize_amount * 1.2) / formData.contribution_amount).toLocaleString()}</span></div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold transition">
                  Cancel
                </button>
                <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white py-2 rounded-lg font-semibold transition disabled:opacity-50">
                  {loading ? 'Saving...' : (mode === 'create' ? '✨ Create Merkato Pool' : '💾 Save Changes')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
