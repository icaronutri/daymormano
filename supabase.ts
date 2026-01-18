import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UploadResult } from './types';

// Acesso seguro às variáveis de ambiente via import.meta.env
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Instanciação condicional para não quebrar o app no preview
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Log de aviso amigável em modo desenvolvimento
if (!supabase && env.DEV) {
  console.warn("⚠️ Supabase: Variáveis de ambiente ausentes. O app está rodando em modo PREVIEW (funções de banco de dados e storage estarão inativas).");
}

/**
 * Lógica de compressão de imagens (Funciona offline/modo preview)
 */
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
 * Realiza a compressão e o upload da imagem para o Supabase Storage.
 */
export const uploadCompressedImage = async (
  file: File, 
  bucket: string, 
  path: string
): Promise<UploadResult> => {
  if (!supabase) {
    throw new Error("Supabase não configurado. Upload indisponível no modo preview.");
  }

  const { blob } = await compressImage(file);
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, blob, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    publicUrl,
    path: data.path,
    sizeInBytes: blob.size
  };
};

/**
 * Remove um arquivo do Supabase Storage.
 */
export const deleteFileFromStorage = async (bucket: string, path: string): Promise<void> => {
  if (!supabase) {
    console.error("Tentativa de exclusão de arquivo em modo preview.");
    return;
  }
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
};

/**
 * Insere uma linha em uma tabela do banco de dados.
 */
export const insertRow = async <T = any>(table: string, data: any): Promise<T> => {
  if (!supabase) {
    throw new Error(`Tentativa de inserção na tabela ${table} em modo preview.`);
  }

  const { data: result, error } = await supabase
    .from(table)
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result as T;
};

/**
 * Remove linhas de uma tabela com base em filtros dinâmicos.
 */
export const deleteRow = async (table: string, filters: Record<string, any>): Promise<void> => {
  if (!supabase) {
    console.error(`Tentativa de exclusão na tabela ${table} em modo preview.`);
    return;
  }

  let query = supabase.from(table).delete();
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });

  const { error } = await query;
  if (error) throw error;
};

/**
 * Helper para organizar o path das fotos no Storage (Funciona offline)
 */
export const getStoragePath = (studentId: string, type: 'meal' | 'body', fileName: string) => {
  const date = new Date().toISOString().split('T')[0];
  const timestamp = Date.now();
  return `${studentId}/${date}/${type}/${timestamp}_${fileName}`;
};
