
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://your-project.supabase.co'; // Mocked
const supabaseAnonKey = 'your-anon-key'; // Mocked

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
        const maxSide = 1280;

        if (width > height) {
          if (width > maxSide) {
            height *= maxSide / width;
            width = maxSide;
          }
        } else {
          if (height > maxSide) {
            width *= maxSide / height;
            height = maxSide;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                url: URL.createObjectURL(blob)
              });
            } else {
              reject(new Error('Compression failed'));
            }
          },
          'image/jpeg',
          0.75
        );
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Mock de exclusão de arquivo do storage
 */
export const deleteFileFromStorage = async (path: string): Promise<void> => {
  console.log(`Excluindo arquivo: ${path}`);
  // Em um app real: await supabase.storage.from('images').remove([path]);
  return Promise.resolve();
};

/**
 * Helper para organizar o path das fotos
 */
export const getStoragePath = (studentId: string, type: 'meal' | 'body', fileName: string) => {
  const date = new Date().toISOString().split('T')[0];
  return `${studentId}/${date}/${type}/${fileName}`;
};
