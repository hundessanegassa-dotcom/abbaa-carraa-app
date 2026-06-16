// components/ThreeDBannerUpload.js - Complete 3D Banner Upload & Viewing System
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function ThreeDBannerUpload({ 
  city, 
  poolType, 
  onBannerUploaded,
  existingBannerUrl,
  title = "3D Banner Upload",
  maxFileSize = 5, // MB
  autoRotate = true,
  rotationSpeed = 0.5 // degrees per frame
}) {
  const [uploading, setUploading] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(existingBannerUrl || null);
  const [is3DMode, setIs3DMode] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(autoRotate);
  const [hovered, setHovered] = useState(false);
  const [flipDirection, setFlipDirection] = useState(1);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);
  const animationRef = useRef(null);

  // Auto-rotation effect
  useEffect(() => {
    if (isRotating && is3DMode) {
      const animate = () => {
        setRotation(prev => (prev + rotationSpeed * flipDirection) % 360);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRotating, is3DMode, rotationSpeed, flipDirection]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WEBP, GIF)');
      e.target.value = '';
      return;
    }

    const maxSize = maxFileSize * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File size must be less than ${maxFileSize}MB`);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setShowUploadModal(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      // Compress image before upload
      const compressedFile = await compressImage(selectedFile);
      
      // Generate unique filename
      const fileName = `city-banners/${city}/${poolType || 'general'}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('city-banners')
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('city-banners')
        .getPublicUrl(fileName);

      // Update state
      setBannerUrl(publicUrl);
      setShowUploadModal(false);
      setPreviewUrl(null);
      setSelectedFile(null);

      // Callback
      if (onBannerUploaded) {
        onBannerUploaded(publicUrl);
      }

      toast.success('Banner uploaded successfully! 🎉');
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload banner: ' + error.message);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height = (height * MAX_SIZE) / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = (width * MAX_SIZE) / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob((blob) => {
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { 
              type: 'image/jpeg' 
            }));
          }, 'image/jpeg', 0.8);
        };
      };
      reader.onerror = () => resolve(file);
    });
  };

  const toggle3DMode = () => {
    setIs3DMode(!is3DMode);
    if (!is3DMode) {
      setIsRotating(true);
    }
  };

  const toggleRotation = () => {
    setIsRotating(!isRotating);
  };

  const handleMouseMove = (e) => {
    if (!is3DMode || isRotating) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    // Calculate rotation based on mouse position
    const rotateX = (y - 0.5) * 40;
    const rotateY = (x - 0.5) * 40;
    
    e.currentTarget.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'rotateX(0deg) rotateY(0deg)';
  };

  const removeBanner = async () => {
    if (confirm('Are you sure you want to remove this banner?')) {
      setBannerUrl(null);
      if (onBannerUploaded) {
        onBannerUploaded(null);
      }
      toast.success('Banner removed');
    }
  };

  const downloadBanner = () => {
    if (bannerUrl) {
      window.open(bannerUrl, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            📸 {title}
          </h3>
          <p className="text-gray-300 text-xs">Upload and preview your banner in 3D carousel view</p>
        </div>
        <div className="flex gap-2">
          {bannerUrl && (
            <>
              <button
                onClick={downloadBanner}
                className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded-lg text-xs transition"
              >
                ⬇️ Download
              </button>
              <button
                onClick={removeBanner}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-xs transition"
              >
                🗑️ Remove
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* 3D Banner Display */}
        <div 
          className="relative w-full rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200"
          style={{ 
            minHeight: '250px',
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          <div 
            className="w-full h-full transition-transform duration-100 ease-linear"
            style={{
              transform: is3DMode 
                ? `rotateY(${rotation}deg) ${hovered ? 'scale(1.02)' : 'scale(1)'}` 
                : 'rotateY(0deg)',
              transformStyle: 'preserve-3d',
              transition: hovered ? 'transform 0.3s ease' : 'none',
              minHeight: '250px'
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={() => setHovered(true)}
            onMouseOut={() => setHovered(false)}
          >
            {bannerUrl ? (
              <img 
                src={bannerUrl} 
                alt="City Banner" 
                className="w-full h-full object-cover"
                style={{
                  backfaceVisibility: 'hidden',
                  minHeight: '250px',
                  maxHeight: '400px'
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 p-8" style={{ minHeight: '250px' }}>
                <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-center">
                  {city ? `Upload a banner for ${city}` : 'No banner uploaded yet'}
                </p>
                <p className="text-sm text-gray-400 mt-1">Click "Upload Banner" below</p>
              </div>
            )}
          </div>

          {/* 3D Controls Overlay */}
          {bannerUrl && (
            <div className="absolute bottom-2 right-2 flex gap-2">
              <button
                onClick={toggle3DMode}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-lg ${
                  is3DMode 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {is3DMode ? '🔄 3D ON' : '🔄 3D OFF'}
              </button>
              {is3DMode && (
                <button
                  onClick={toggleRotation}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-lg ${
                    isRotating 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {isRotating ? '⏸️ Pause' : '▶️ Play'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3D Info */}
        {is3DMode && bannerUrl && (
          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 text-purple-700 text-xs">
              <span>🔮</span>
              <span>
                {isRotating 
                  ? '3D Carousel Mode Active • Banner is auto-rotating' 
                  : '3D Mode Active • Drag to view from different angles'}
              </span>
              <span className="ml-auto text-purple-500 text-[10px]">
                {rotation.toFixed(1)}°
              </span>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-4">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading... {uploadProgress > 0 && `${uploadProgress}%`}
              </>
            ) : (
              <>
                📤 Upload Banner Image
                <span className="text-xs opacity-75">({maxFileSize}MB max)</span>
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Supports JPEG, PNG, WEBP, GIF • Auto-compressed for optimal performance
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg">🔄</div>
            <div className="text-[10px] text-gray-600">3D Rotation</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg">🎨</div>
            <div className="text-[10px] text-gray-600">Carousel View</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg">📱</div>
            <div className="text-[10px] text-gray-600">Responsive</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded-lg">
            <div className="text-lg">⚡</div>
            <div className="text-[10px] text-gray-600">Auto-rotate</div>
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Preview Banner</h3>
                <button 
                  onClick={() => {
                    setShowUploadModal(false);
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              {previewUrl && (
                <div className="relative rounded-xl overflow-hidden mb-4" style={{ minHeight: '200px' }}>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-auto object-contain max-h-80"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    Preview
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">File:</span> {selectedFile?.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Size:</span> {(selectedFile?.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Type:</span> {selectedFile?.type}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setPreviewUrl(null);
                    setSelectedFile(null);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
