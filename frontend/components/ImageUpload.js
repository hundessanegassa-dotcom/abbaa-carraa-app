import { useState, useRef } from 'react';
import { uploadPoolImage } from '../lib/upload';
import toast from 'react-hot-toast';

export default function ImageUpload({ onUpload, currentImage = null, folder = 'pools' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }
    
    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    setProgress(10);
    
    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 15, 90));
      }, 200);
      
      const imageUrl = await uploadPoolImage(file, folder);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (onUpload) {
        onUpload(imageUrl);
      }
      
      toast.success('Image uploaded successfully!');
      
      // Reset progress after a moment
      setTimeout(() => setProgress(0), 1000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload image');
      setPreview(currentImage);
      setProgress(0);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const removeImage = () => {
    setPreview(null);
    if (onUpload) {
      onUpload(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Image removed');
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Pool Image <span className="text-red-500">*</span>
      </label>
      
      {preview ? (
        <div className="relative inline-block">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
          />
          <button
            type="button"
            onClick={removeImage}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition shadow-md"
            title="Remove image"
          >
            ×
          </button>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-green-500 transition bg-gray-50 hover:bg-green-50"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl">📸</span>
            <p className="text-sm text-gray-500">Click to upload pool image</p>
            <p className="text-xs text-gray-400">JPEG, PNG, WEBP up to 10MB</p>
            <p className="text-xs text-green-600">✨ Images are automatically optimized for fast loading</p>
          </div>
        </div>
      )}
      
      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">Uploading...</span>
            <span className="text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
