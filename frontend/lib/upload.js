// lib/upload.js - ENHANCED with Creator Document Support
import { supabase } from './supabase';

// ============================================
// IMAGE COMPRESSION
// ============================================

/**
 * Compress image before upload
 * @param {File} file - The image file to compress
 * @param {number} maxWidth - Maximum width (default: 1200)
 * @param {number} maxHeight - Maximum height (default: 1200)
 * @param {number} quality - JPEG quality (0-1, default: 0.7)
 * @param {number} maxSizeKB - Maximum size in KB before compression (default: 500)
 * @returns {Promise<Blob>} Compressed image blob
 */
async function compressImage(file, maxWidth = 1200, maxHeight = 1200, quality = 0.7, maxSizeKB = 500) {
  return new Promise((resolve, reject) => {
    // If file is already small enough, return it
    if (file.size <= maxSizeKB * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize if image is larger than max dimensions
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with quality
        canvas.toBlob(
          (blob) => {
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

// ============================================
// POOL IMAGE UPLOAD
// ============================================

/**
 * Upload pool image to Supabase Storage
 * @param {File} file - The image file
 * @param {string} folder - Storage folder (default: 'pools')
 * @returns {Promise<string>} Public URL of uploaded image
 */
export async function uploadPoolImage(file, folder = 'pools') {
  if (!file) return null;
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WEBP, and GIF images are allowed');
  }
  
  // Validate size (max 10MB before compression)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be less than 10MB');
  }
  
  // Compress image if larger than 500KB
  let uploadFile = file;
  if (file.size > 500 * 1024) {
    try {
      uploadFile = await compressImage(file, 1200, 1200, 0.7);
    } catch (compressError) {
      console.warn('Compression failed, using original file:', compressError);
      uploadFile = file;
    }
  }
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('pool-images')
    .upload(fileName, uploadFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });
  
  if (error) {
    console.error('Upload error:', error);
    throw new Error(error.message);
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('pool-images')
    .getPublicUrl(fileName);
  
  return publicUrl;
}

// ============================================
// CREATOR DOCUMENT UPLOAD
// ============================================

/**
 * Upload creator document (ID, License, Banner)
 * @param {File} file - The document file
 * @param {string} folder - Document type folder (banners, ids, licenses)
 * @param {string} userId - User ID for folder organization
 * @param {Object} options - Upload options
 * @returns {Promise<string>} Public URL of uploaded document
 */
export async function uploadCreatorDocument(file, folder, userId, options = {}) {
  if (!file) return null;
  
  const {
    maxSize = 5, // Max size in MB
    compress = true,
    maxWidth = 1200,
    maxHeight = 400,
    quality = 0.8
  } = options;

  // Validate size
  const maxSizeBytes = maxSize * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`File must be less than ${maxSize}MB`);
  }

  // For PDFs, skip compression
  const isPDF = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');

  if (!isPDF && !isImage) {
    throw new Error('Only images and PDF files are allowed');
  }

  // Compress image files
  let uploadFile = file;
  if (isImage && compress && file.size > 500 * 1024) {
    try {
      uploadFile = await compressImage(file, maxWidth, maxHeight, quality);
    } catch (compressError) {
      console.warn('Compression failed, using original file:', compressError);
      uploadFile = file;
    }
  }

  // Get file extension
  const fileExt = isPDF ? 'pdf' : 'jpg';
  
  // Generate unique filename
  const fileName = `${userId}/${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('creator-documents')
    .upload(fileName, uploadFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: isPDF ? 'application/pdf' : 'image/jpeg'
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error(`Failed to upload document: ${error.message}`);
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('creator-documents')
    .getPublicUrl(fileName);

  return publicUrl;
}

/**
 * Upload creator shop banner
 * @param {File} file - The banner image
 * @param {string} userId - User ID
 * @returns {Promise<string>} Public URL of uploaded banner
 */
export async function uploadCreatorBanner(file, userId) {
  return uploadCreatorDocument(file, 'banners', userId, {
    maxSize: 2,
    maxWidth: 1200,
    maxHeight: 400,
    quality: 0.85
  });
}

/**
 * Upload creator digital ID
 * @param {File} file - The ID document (image or PDF)
 * @param {string} userId - User ID
 * @returns {Promise<string>} Public URL of uploaded ID
 */
export async function uploadCreatorID(file, userId) {
  return uploadCreatorDocument(file, 'ids', userId, {
    maxSize: 5,
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8
  });
}

/**
 * Upload creator business license
 * @param {File} file - The license document (image or PDF)
 * @param {string} userId - User ID
 * @returns {Promise<string>} Public URL of uploaded license
 */
export async function uploadCreatorLicense(file, userId) {
  return uploadCreatorDocument(file, 'licenses', userId, {
    maxSize: 5,
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.8
  });
}

// ============================================
// DELETE FUNCTIONS
// ============================================

/**
 * Delete image from storage
 * @param {string} imageUrl - Public URL of the image
 * @param {string} bucket - Storage bucket name
 * @returns {Promise<boolean>} Success status
 */
export async function deleteImage(imageUrl, bucket = 'pool-images') {
  if (!imageUrl) return false;
  
  try {
    // Extract path from URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split(`/storage/v1/object/public/${bucket}/`);
    if (pathParts.length < 2) return false;
    
    const filePath = pathParts[1];
    
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);
    
    if (error) {
      console.error('Delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
}

/**
 * Delete creator document
 * @param {string} documentUrl - Public URL of the document
 * @returns {Promise<boolean>} Success status
 */
export async function deleteCreatorDocument(documentUrl) {
  return deleteImage(documentUrl, 'creator-documents');
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate file type and size
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid, error }
 */
export function validateFile(file, options = {}) {
  const {
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif', 'application/pdf'],
    maxSize = 5 // MB
  } = options;

  const maxSizeBytes = maxSize * 1024 * 1024;

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type not allowed. Allowed: ${allowedTypes.join(', ')}` 
    };
  }

  if (file.size > maxSizeBytes) {
    return { 
      valid: false, 
      error: `File size must be less than ${maxSize}MB` 
    };
  }

  return { valid: true, error: null };
}

/**
 * Get file type category
 * @param {File} file - The file
 * @returns {string} 'image', 'pdf', or 'other'
 */
export function getFileType(file) {
  if (!file) return 'other';
  if (file.type.startsWith('image/')) return 'image';
  if (file.type === 'application/pdf') return 'pdf';
  return 'other';
}

/**
 * Get file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Human-readable size
 */
export function getFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  uploadPoolImage,
  uploadCreatorDocument,
  uploadCreatorBanner,
  uploadCreatorID,
  uploadCreatorLicense,
  deleteImage,
  deleteCreatorDocument,
  validateFile,
  getFileType,
  getFileSize,
  compressImage
};
