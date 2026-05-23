import { supabase } from './supabase';

// Compress image before upload
async function compressImage(file, maxWidth = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Only resize if image is larger than maxWidth
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
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
          file.type,
          quality
        );
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
}

export async function uploadPoolImage(file, folder = 'pools') {
  if (!file) return null;
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, and WEBP images are allowed');
  }
  
  // Validate size (max 10MB before compression)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image must be less than 10MB');
  }
  
  // Compress image if larger than 500KB
  let uploadFile = file;
  if (file.size > 500 * 1024) {
    try {
      uploadFile = await compressImage(file, 1200, 0.7);
    } catch (compressError) {
      console.warn('Compression failed, using original file:', compressError);
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

// Delete image from storage
export async function deletePoolImage(imageUrl) {
  if (!imageUrl) return;
  
  // Extract path from URL
  const urlParts = imageUrl.split('/storage/v1/object/public/pool-images/');
  if (urlParts.length < 2) return;
  
  const filePath = urlParts[1];
  
  const { error } = await supabase.storage
    .from('pool-images')
    .remove([filePath]);
  
  if (error) {
    console.error('Delete error:', error);
  }
}
