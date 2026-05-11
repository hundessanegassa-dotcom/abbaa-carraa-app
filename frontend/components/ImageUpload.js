import { useState } from 'react';
import { uploadImage } from '../utils/uploadImage';
import toast from 'react-hot-toast';

export default function ImageUpload({ onUpload, currentImage, folder = 'pools' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    setUploading(true);
    
    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    // Upload to Supabase
    const publicUrl = await uploadImage(file, folder);
    
    if (publicUrl) {
      onUpload(publicUrl);
      toast.success('Image uploaded successfully');
    } else {
      toast.error('Upload failed. Please try again.');
      setPreview(currentImage || null);
    }
    
    setUploading(false);
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Product/Pool Image
      </label>
      <div className="mt-1 flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="h-24 w-24 object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                onUpload(null);
              }}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            📷
          </div>
        )}
        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition">
          {uploading ? 'Uploading...' : 'Choose Image'}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
      <p className="text-xs text-gray-400">PNG, JPG, JPEG up to 5MB</p>
    </div>
  );
}
