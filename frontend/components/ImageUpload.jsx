// components/ImageUpload.jsx - ENHANCED for Creator Application
import { useState, useRef, useEffect } from 'react';
import { uploadPoolImage } from '../lib/upload';
import toast from 'react-hot-toast';

export default function ImageUpload({ 
  onUpload, 
  currentImage = null, 
  folder = 'pools',
  id = null,
  name = null,
  accept = 'image/*',
  preview: externalPreview = null,
  onChange: externalOnChange,
  onRemove: externalOnRemove,
  label = null,
  required = false,
  language = 'am',
  maxSize = 5, // MB
  multiple = false,
  className = '',
  showProgress = true,
  compact = false
}) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentImage || externalPreview || null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Sync with external preview if provided
  useEffect(() => {
    if (externalPreview !== undefined && externalPreview !== preview) {
      setPreview(externalPreview);
    }
  }, [externalPreview]);

  const t = (am, en) => language === 'am' ? am : en;

  const validateFile = (file) => {
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.type.startsWith('image/')) {
      setError(t('እባክዎ የምስል ፋይል ይምረጡ', 'Please select an image file'));
      return false;
    }
    
    // Check size
    if (file.size > maxSize * 1024 * 1024) {
      setError(t(`እባክዎ ከ${maxSize}MB ያነሰ ፋይል ይምረጡ`, `Please choose a file smaller than ${maxSize}MB`));
      return false;
    }
    
    setError(null);
    return true;
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!validateFile(file)) return;
    
    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    
    // If external onChange is provided, use it
    if (externalOnChange) {
      externalOnChange(e);
      return;
    }
    
    // Otherwise handle upload internally
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
      
      toast.success(t('ምስል በተሳካ ሁኔታ ተሰቀለ!', 'Image uploaded successfully!'));
      
      setTimeout(() => setProgress(0), 1000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.message || t('ምስል መስቀል አልተቻለም', 'Failed to upload image'));
      setPreview(currentImage || externalPreview || null);
      setProgress(0);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    
    if (externalOnRemove) {
      externalOnRemove();
    } else if (onUpload) {
      onUpload(null);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast.success(t('ምስል ተወግዷል', 'Image removed'));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const syntheticEvent = {
        target: {
          files: [file],
          name: name || 'file'
        }
      };
      handleFileSelect(syntheticEvent);
    }
  };

  // Compact mode for inline use
  if (compact) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {preview ? (
          <>
            <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 flex-shrink-0">
              <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleRemove}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 transition shadow-md"
              >
                ×
              </button>
            </div>
            <span className="text-xs text-gray-500">{t('ምስል ተመርጧል', 'Image selected')}</span>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-green-500 hover:text-green-600 transition"
          >
            📸 {t('ምስል ምረጥ', 'Choose image')}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id={id}
          name={name}
          required={required}
        />
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {maxSize && (
            <span className="text-xs text-gray-400 ml-2">
              (Max {maxSize}MB)
            </span>
          )}
        </label>
      )}
      
      {preview ? (
        <div className="relative inline-block group">
          <img 
            src={preview} 
            alt={t('የምስል ቅድመ-እይታ', 'Preview')} 
            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 shadow-sm group-hover:border-green-500 transition"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition shadow-md"
            title={t('ምስል አስወግድ', 'Remove image')}
          >
            ×
          </button>
          {uploading && showProgress && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-1"></div>
                <span className="text-xs">{progress}%</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
            dragOver 
              ? 'border-green-500 bg-green-50' 
              : error 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300 hover:border-green-500 bg-gray-50 hover:bg-green-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
            id={id}
            name={name}
            required={required}
          />
          <div className="flex flex-col items-center gap-2">
            <span className="text-4xl">{uploading ? '⏳' : '📸'}</span>
            <p className="text-sm text-gray-500">
              {uploading 
                ? t('በላይ እየተሰቀለ ነው...', 'Uploading...')
                : label 
                  ? label 
                  : t('ምስል ለመጫን ጠቅ ያድርጉ', 'Click to upload image')
              }
            </p>
            <p className="text-xs text-gray-400">
              {accept.includes('pdf') ? 'PDF' : 'JPEG, PNG, WEBP'} • Max {maxSize}MB
              {accept.includes('pdf') && ' • PDF files supported'}
            </p>
            <p className="text-xs text-green-600">
              ✨ {t('ምስሎች በራስ-ሰር ይመቻቻሉ', 'Images are automatically optimized')}
            </p>
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>
        </div>
      )}
      
      {uploading && showProgress && progress > 0 && progress < 100 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500">{t('በላይ እየተሰቀለ ነው...', 'Uploading...')}</span>
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
