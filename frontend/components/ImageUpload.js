import { useState } from 'react';
import { uploadPoolImage } from '../lib/upload';
import toast from 'react-hot-toast';

export default function ImageUpload({ onImageUploaded, currentImage = null, label = 'Pool Image' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    setUploading(true);
    try {
      const imageUrl = await uploadPoolImage(file);
      onImageUploaded(imageUrl);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload image');
      setPreview(currentImage);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      {preview && (
        <div className="relative w-32 h-32">
          <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-lg border" />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onImageUploaded(null);
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
          >
            ×
          </button>
        </div>
      )}
      
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={uploading}
        className="w-full border rounded-lg p-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
      />
      
      {uploading && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
          Uploading...
        </div>
      )}
    </div>
  );
}
