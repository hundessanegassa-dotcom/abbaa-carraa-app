import { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function AdminAnnouncementModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_audience: 'all',
    type: 'info',
    link_url: '',
    link_text: '',
    expires_at: '',
    banner_image: ''
  });
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }
    
    setUploading(true);
    setPreview(URL.createObjectURL(file));
    
    const fileExt = file.name.split('.').pop();
    const fileName = `announcements/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('announcement-images')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
      setUploading(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('announcement-images')
      .getPublicUrl(fileName);
    
    setFormData({ ...formData, banner_image: publicUrl });
    setUploading(false);
    toast.success('Banner uploaded!');
  };

  const removeImage = () => {
    setPreview(null);
    setFormData({ ...formData, banner_image: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast.error('Please fill title and content');
      return;
    }
    
    setSubmitting(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('announcements')
      .insert({
        title: formData.title,
        content: formData.content,
        target_audience: formData.target_audience,
        type: formData.type,
        link_url: formData.link_url,
        link_text: formData.link_text,
        expires_at: formData.expires_at || null,
        banner_image: formData.banner_image || null,
        created_by: user?.id,
        is_active: true,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Insert error:', error);
      toast.error('Failed to create announcement: ' + error.message);
    } else {
      toast.success('Announcement published!');
      setFormData({
        title: '', content: '', target_audience: 'all', type: 'info',
        link_url: '', link_text: '', expires_at: '', banner_image: ''
      });
      setPreview(null);
      if (onSuccess) onSuccess();
      onClose();
    }
    setSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex justify-between items-center">
          <h2 className="text-xl font-bold">📢 Create Beautiful Announcement</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
        </div>
        
        <div className="p-6 space-y-5">
          {/* Banner Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🖼️ Banner Image (Optional) - 1200x400px recommended
            </label>
            {preview || formData.banner_image ? (
              <div className="relative inline-block">
                <img 
                  src={preview || formData.banner_image} 
                  alt="Banner preview" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                >
                  ×
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-500 transition"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-4xl">🖼️</span>
                  <p className="text-sm text-gray-500">Click to upload banner image</p>
                  <p className="text-xs text-gray-400">PNG, JPG, WEBP up to 2MB</p>
                </div>
              </div>
            )}
            {uploading && <p className="text-sm text-gray-500 mt-1">Uploading...</p>}
          </div>
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., 🎉 Special Promotion!"
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="4"
              placeholder="Announcement message..."
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Type & Audience */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Announcement Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              >
                <option value="info">ℹ️ Info (Blue)</option>
                <option value="warning">⚠️ Warning (Yellow)</option>
                <option value="success">✅ Success (Green)</option>
                <option value="alert">🔴 Alert (Red)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
              <select
                name="target_audience"
                value={formData.target_audience}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              >
                <option value="all">📢 All Users</option>
                <option value="agents">🤝 Agents Only</option>
                <option value="vendors">🏪 Vendors Only</option>
                <option value="individuals">👤 Individuals Only</option>
              </select>
            </div>
          </div>
          
          {/* Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (Optional)</label>
              <input
                type="text"
                name="link_url"
                value={formData.link_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link Text</label>
              <input
                type="text"
                name="link_text"
                value={formData.link_text}
                onChange={handleChange}
                placeholder="Learn More →"
                className="w-full border rounded-lg p-3"
              />
            </div>
          </div>
          
          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
            <input
              type="date"
              name="expires_at"
              value={formData.expires_at}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />
            <p className="text-xs text-gray-400 mt-1">Leave empty for no expiry</p>
          </div>
          
          {/* Preview Section */}
          {(formData.banner_image || formData.title || formData.content) && (
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-700 mb-3">📱 Preview</h4>
              <div className={`bg-gradient-to-r ${formData.type === 'warning' ? 'from-yellow-500 to-orange-500' : formData.type === 'success' ? 'from-green-500 to-teal-500' : formData.type === 'alert' ? 'from-red-500 to-pink-500' : 'from-blue-500 to-indigo-500'} rounded-xl overflow-hidden`}>
                {formData.banner_image && (
                  <img src={formData.banner_image} alt="Preview" className="w-full h-24 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white text-xl">
                      {formData.type === 'warning' ? '⚠️' : formData.type === 'success' ? '🎉' : formData.type === 'alert' ? '🔴' : '📢'}
                    </span>
                    <h3 className="font-bold text-white">{formData.title || 'Title'}</h3>
                  </div>
                  <p className="text-white/80 text-sm">{formData.content || 'Content preview...'}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSubmit}
              disabled={submitting || uploading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : '📢 Publish Announcement'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 py-3 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
