import { supabase } from './index';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads an image to Supabase Storage and returns the public URL.
 * 
 * @param {File} file - The file to upload.
 * @param {string} bucketName - The storage bucket (e.g. 'pool_images').
 * @param {string} folderPath - Optional folder path inside the bucket.
 * @returns {Promise<string>} - The public URL of the uploaded image.
 */
export const uploadImage = async (file, bucketName = 'pool_images', folderPath = '') => {
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (e.g. max 5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new Error('Image must be less than 5MB');
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
};

/**
 * Specifically uploads a pool image.
 */
export const uploadPoolImage = async (file) => {
  return uploadImage(file, 'pool_images', 'public');
};
