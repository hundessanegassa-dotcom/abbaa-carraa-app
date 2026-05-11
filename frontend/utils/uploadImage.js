import { supabase } from '../lib/supabase';

export async function uploadImage(file, folder = 'pools') {
  if (!file) return null;
  
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('images')
    .upload(filePath, file);
  
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);
  
  return publicUrl;
}

export async function uploadMultipleImages(files, folder = 'pools') {
  const uploadPromises = files.map(file => uploadImage(file, folder));
  return Promise.all(uploadPromises);
}
