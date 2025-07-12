import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

const api = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
});

// Storage API for file uploads
// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Storage API using Supabase client - RECOMMENDED APPROACH
export const storageAPI = {
  // Upload file to Supabase Storage
  uploadFile: async (file, fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('product-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-photos')
        .getPublicUrl(fileName);

      return { 
        success: true, 
        url: publicUrl, 
        path: fileName,
        data: data 
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  },

  // Delete file from Supabase Storage
  deleteFile: async (fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('product-photos')
        .remove([fileName]);

      if (error) {
        console.error('Supabase delete error:', error);
        throw new Error(`Delete failed: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Delete error:', error);
      throw error;
    }
  },

  // Generate unique filename
  generateFileName: (originalName, productId = null) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const baseName = originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');
    
    if (productId) {
      return `product_${productId}_${timestamp}_${randomStr}.${extension}`;
    }
    
    return `${baseName}_${timestamp}_${randomStr}.${extension}`;
  },

  // Get file path from URL
  getFilePathFromUrl: (url) => {
    if (!url) return null;
    const publicUrlBase = `${supabaseUrl}/storage/v1/object/public/product-photos/`;
    return url.replace(publicUrlBase, '');
  },

  // List files in bucket (bonus utility)
  listFiles: async () => {
    try {
      const { data, error } = await supabase.storage
        .from('product-photos')
        .list('', {
          limit: 100,
          offset: 0
        });

      if (error) {
        throw new Error(`List failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('List error:', error);
      throw error;
    }
  }
};

export default api;