
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UploadResult } from './types';

const findEnvVar = (key: string, fallback: string): string => {
  const keysToTry = [`VITE_${key}`, key];
  const metaEnv = (import.meta as any).env || {};
  const processEnv = (globalThis as any).process?.env || {};
  
  for (const k of keysToTry) {
    const val = metaEnv[k] || processEnv[k];
    if (val && typeof val === 'string') {
      const cleanVal = val.trim().replace(/['"]/g, '');
      if (cleanVal.length > 0) return cleanVal;
    }
  }
  return fallback;
};

const DEFAULT_URL = 'https://gnsencanuyhrkxcjoyva.supabase.co';
const DEFAULT_KEY = 'sb_publishable_8QV6-nlnz7V3NGehTLqE4w__4YZ5LNI';

const supabaseUrl = findEnvVar('SUPABASE_URL', DEFAULT_URL);
const supabaseAnonKey = findEnvVar('SUPABASE_ANON_KEY', DEFAULT_KEY);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

export const compressImage = async (file: File): Promise<{ blob: Blob; url: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxSide = 1200;
        if (width > height) { if (width > maxSide) { height *= maxSide / width; width = maxSide; } }
        else { if (height > maxSide) { width *= maxSide / height; height = maxSide; } }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) resolve({ blob, url: URL.createObjectURL(blob) });
          else reject(new Error('Falha na compressão'));
        }, 'image/jpeg', 0.7);
      };
    };
    reader.onerror = reject;
  });
};

export const uploadCompressedImage = async (file: File, bucket: string, path: string): Promise<UploadResult> => {
  const { blob } = await compressImage(file);
  const { data, error } = await supabase.storage.from(bucket).upload(path, blob, { upsert: true });
  if (error) throw error;
  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return { publicUrl, path: data.path, sizeInBytes: blob.size };
};
