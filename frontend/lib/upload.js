import { supabase } from './supabase';

export async function uploadPoolImage(file, folder = 'pools') {
  if (!file) return null;
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WEBP images are allowed');
  }
  
  // Validate size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be less than 5MB');
  }
  
  // Generate unique filename
  const fileExt = file.name.split('.').pop();
  const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('pool-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
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
