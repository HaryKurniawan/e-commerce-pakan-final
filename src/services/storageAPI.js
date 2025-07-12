import { supabase } from './baseApi'; // Adjust path to your Supabase client

const BUCKET_NAME = 'product-photos'; // Ganti dengan nama bucket Anda

export const storageAPI = {
  /**
   * Generate unique filename for upload
   * @param {string} originalFileName - Original file name
   * @param {string} productId - Product ID
   * @returns {string} - Generated filename
   */
  generateFileName: (originalFileName, productId) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = originalFileName.split('.').pop();
    return `product-${productId}-${timestamp}-${randomString}.${fileExtension}`;
  },

  /**
   * Upload file to Supabase Storage
   * @param {File} file - File object to upload
   * @param {string} fileName - Name for the file in storage
   * @returns {Object} - Upload result with success status and URL
   */
  uploadFile: async (file, fileName) => {
    try {
      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        success: true,
        url: publicUrlData.publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Delete file from Supabase Storage
   * @param {string} fileName - Name of file to delete
   * @returns {Object} - Delete result with success status
   */
  deleteFile: async (fileName) => {
    try {
      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        console.error('Delete error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true
      };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Extract file path from Supabase Storage URL
   * @param {string} url - Full URL from Supabase Storage
   * @returns {string|null} - File path or null if invalid URL
   */
  getFilePathFromUrl: (url) => {
    try {
      if (!url) return null;
      
      // Supabase storage URLs typically have this format:
      // https://[project-id].supabase.co/storage/v1/object/public/[bucket]/[file-path]
      const urlParts = url.split('/');
      const bucketIndex = urlParts.indexOf(BUCKET_NAME);
      
      if (bucketIndex === -1) return null;
      
      // Get everything after the bucket name
      const filePath = urlParts.slice(bucketIndex + 1).join('/');
      return filePath || null;
    } catch (error) {
      console.error('Error extracting file path from URL:', error);
      return null;
    }
  },

  /**
   * Get public URL for a file
   * @param {string} fileName - Name of the file
   * @returns {string} - Public URL
   */
  getPublicUrl: (fileName) => {
    const { data } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);
    
    return data.publicUrl;
  },

  /**
   * Check if file exists in storage
   * @param {string} fileName - Name of the file to check
   * @returns {boolean} - True if file exists
   */
  fileExists: async (fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          search: fileName
        });

      if (error) {
        console.error('Error checking file existence:', error);
        return false;
      }

      return data && data.length > 0;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  },

  /**
   * Get file info
   * @param {string} fileName - Name of the file
   * @returns {Object|null} - File info or null if not found
   */
  getFileInfo: async (fileName) => {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .list('', {
          search: fileName
        });

      if (error) {
        console.error('Error getting file info:', error);
        return null;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }
};