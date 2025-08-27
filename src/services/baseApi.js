import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

// Base API instance
export const api = axios.create({
  baseURL: `${supabaseUrl}/rest/v1`,
  headers: {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
});

// Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Storage API for file uploads
export const storageAPI = {
  // Upload file to product-photos bucket
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

  // ✅ Upload payment proof to payment-proofs bucket (fixed)
  uploadPaymentProof: async (file, orderId, userId) => {
    try {
      console.log('Uploading payment proof:', { orderId, userId, fileName: file.name });

      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split('.').pop();

      // ✅ simpan di folder "payment_<orderId>/..."
      const fileName = `payment_${orderId}/${userId}_${timestamp}_${randomStr}.${extension}`;

      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false // jangan overwrite
        });

      if (error) {
        console.error('Supabase payment proof upload error:', error);
        throw new Error(`Payment proof upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName);

      console.log('Payment proof uploaded successfully:', { fileName, publicUrl });

      return { 
        success: true, 
        url: publicUrl, 
        path: fileName,
        data: data 
      };
    } catch (error) {
      console.error('Payment proof upload error:', error);
      throw error;
    }
  },

  // Delete file from product-photos bucket
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

  // Delete payment proof
  deletePaymentProof: async (fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .remove([fileName]);

      if (error) {
        console.error('Supabase payment proof delete error:', error);
        throw new Error(`Payment proof delete failed: ${error.message}`);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Payment proof delete error:', error);
      throw error;
    }
  },

  // Generate unique filename for products
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

  // ✅ Generate unique filename for payment proofs (fixed)
  generatePaymentProofFileName: (originalName, orderId, userId) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    
    return `payment_${orderId}/${userId}_${timestamp}_${randomStr}.${extension}`;
  },

  // Get file path from product-photos URL
  getFilePathFromUrl: (url) => {
    if (!url) return null;
    const publicUrlBase = `${supabaseUrl}/storage/v1/object/public/product-photos/`;
    return url.replace(publicUrlBase, '');
  },

  // Get file path from payment-proofs URL
  getPaymentProofPathFromUrl: (url) => {
    if (!url) return null;
    const publicUrlBase = `${supabaseUrl}/storage/v1/object/public/payment-proofs/`;
    return url.replace(publicUrlBase, '');
  },

  // List files in product-photos bucket
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
  },

  // List files in payment-proofs bucket
  listPaymentProofs: async () => {
    try {
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .list('', {
          limit: 100,
          offset: 0
        });

      if (error) {
        throw new Error(`Payment proofs list failed: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Payment proofs list error:', error);
      throw error;
    }
  }
};

export { supabaseUrl, supabaseKey };
export default api;
