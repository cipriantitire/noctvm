import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.8,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

/**
 * Compresses an image file before upload.
 */
export async function compressImage(file: File, options: CompressionOptions = {}): Promise<File> {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  try {
    return await imageCompression(file, mergedOptions);
  } catch (error) {
    console.error('Image compression failed:', error);
    return file; // Fallback to original if compression fails
  }
}

/**
 * Uploads a file to a Supabase bucket and returns the public URL.
 * Handles compression if it's an image.
 */
export async function uploadOptimizedImage(
  file: File, 
  bucket: 'post-media' | 'story-media' | 'venue-logos' | 'app-assets',
  path?: string
): Promise<string | null> {
  try {
    let fileToUpload = file;
    
    // Only compress images
    if (file.type.startsWith('image/')) {
      fileToUpload = await compressImage(file);
    }

    const fileName = path || `${Math.random().toString(36).slice(2)}_${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, fileToUpload, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.error('Upload failed:', error);
    return null;
  }
}

/**
 * Generates a Supabase transformation URL.
 * Note: Requires Supabase Pro or certain project settings for some transformations.
 */
export function getOptimizedImageUrl(url: string, width?: number, quality?: number): string {
  if (!url || !url.includes('supabase.co')) return url;
  
  const params = new URLSearchParams();
  if (width) params.append('width', width.toString());
  if (quality) params.append('quality', quality.toString());
  // Supabase Image Transformation format: <url>?width=...&quality=...
  // However, Supabase usually expects this at the storage level or via a specific endpoint 
  // if not using the default public URL.
  // For standard uploads, Next.js Image component is better for this.
  
  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}
