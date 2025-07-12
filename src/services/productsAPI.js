import { api } from './baseApi.js';
import { storageAPI } from './storageAPI.js'; // Add this line

export const productsAPI = {
  getAll: async () => {
    const response = await api.get('/products?select=*,product_photos(*)&order=id.asc');
    return response.data || [];
  },

  create: async (productData) => {
    try {
      // Extract file data from productData
      const { foto_file, foto_file_1, foto_file_2, ...productFields } = productData;
      
      // Create the product first
      const productResponse = await api.post('/products', productFields);
      const newProduct = productResponse.data[0];

      // Upload photos if they exist
      const photoData = {
        product_id: newProduct.id,
        url_foto: '',
        url_foto_1: '',
        url_foto_2: ''
      };

      // Upload main photo
      if (foto_file) {
        const fileName = storageAPI.generateFileName(foto_file.name, newProduct.id);
        const uploadResult = await storageAPI.uploadFile(foto_file, fileName);
        if (uploadResult.success) {
          photoData.url_foto = uploadResult.url;
        }
      }

      // Upload additional photo 1
      if (foto_file_1) {
        const fileName = storageAPI.generateFileName(foto_file_1.name, newProduct.id);
        const uploadResult = await storageAPI.uploadFile(foto_file_1, fileName);
        if (uploadResult.success) {
          photoData.url_foto_1 = uploadResult.url;
        }
      }

      // Upload additional photo 2
      if (foto_file_2) {
        const fileName = storageAPI.generateFileName(foto_file_2.name, newProduct.id);
        const uploadResult = await storageAPI.uploadFile(foto_file_2, fileName);
        if (uploadResult.success) {
          photoData.url_foto_2 = uploadResult.url;
        }
      }

      // Create photo record if any photos were uploaded
      if (photoData.url_foto || photoData.url_foto_1 || photoData.url_foto_2) {
        await api.post('/product_photos', photoData);
      }

      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  update: async (productId, productData) => {
    try {
      // Extract file data from productData
      const { foto_file, foto_file_1, foto_file_2, ...productFields } = productData;
      
      console.log('Updating product:', productId, productFields);
      
      // Update the product first
      const productResponse = await api.patch(`/products?id=eq.${productId}`, productFields);
      console.log('Product updated:', productResponse);
      
      // Get existing photo record
      const existingPhotosResponse = await api.get(`/product_photos?product_id=eq.${productId}`);
      const existingPhotos = existingPhotosResponse.data[0];
      
      // Prepare photo data
      const photoData = {
        url_foto: existingPhotos?.url_foto || '',
        url_foto_1: existingPhotos?.url_foto_1 || '',
        url_foto_2: existingPhotos?.url_foto_2 || ''
      };

      // Handle main photo upload
      if (foto_file) {
        // Delete old photo if exists
        if (existingPhotos?.url_foto) {
          const oldFileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto);
          if (oldFileName) {
            await storageAPI.deleteFile(oldFileName);
          }
        }
        
        // Upload new photo
        const fileName = storageAPI.generateFileName(foto_file.name, productId);
        const uploadResult = await storageAPI.uploadFile(foto_file, fileName);
        if (uploadResult.success) {
          photoData.url_foto = uploadResult.url;
        }
      }

      // Handle additional photo 1
      if (foto_file_1) {
        // Delete old photo if exists
        if (existingPhotos?.url_foto_1) {
          const oldFileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto_1);
          if (oldFileName) {
            await storageAPI.deleteFile(oldFileName);
          }
        }
        
        // Upload new photo
        const fileName = storageAPI.generateFileName(foto_file_1.name, productId);
        const uploadResult = await storageAPI.uploadFile(foto_file_1, fileName);
        if (uploadResult.success) {
          photoData.url_foto_1 = uploadResult.url;
        }
      }

      // Handle additional photo 2
      if (foto_file_2) {
        // Delete old photo if exists
        if (existingPhotos?.url_foto_2) {
          const oldFileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto_2);
          if (oldFileName) {
            await storageAPI.deleteFile(oldFileName);
          }
        }
        
        // Upload new photo
        const fileName = storageAPI.generateFileName(foto_file_2.name, productId);
        const uploadResult = await storageAPI.uploadFile(foto_file_2, fileName);
        if (uploadResult.success) {
          photoData.url_foto_2 = uploadResult.url;
        }
      }

      // Update or create photo record
      if (existingPhotos) {
        // Update existing photo record
        await api.patch(`/product_photos?product_id=eq.${productId}`, photoData);
      } else if (photoData.url_foto || photoData.url_foto_1 || photoData.url_foto_2) {
        // Create new photo record
        const newPhotoData = {
          product_id: productId,
          ...photoData
        };
        await api.post('/product_photos', newPhotoData);
      }

      return productResponse.data?.[0] || productResponse.data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  delete: async (productId) => {
    try {
      // Get existing photos to delete from storage
      const existingPhotosResponse = await api.get(`/product_photos?product_id=eq.${productId}`);
      const existingPhotos = existingPhotosResponse.data[0];
      
      // Delete photos from storage
      if (existingPhotos) {
        if (existingPhotos.url_foto) {
          const fileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto);
          if (fileName) await storageAPI.deleteFile(fileName);
        }
        if (existingPhotos.url_foto_1) {
          const fileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto_1);
          if (fileName) await storageAPI.deleteFile(fileName);
        }
        if (existingPhotos.url_foto_2) {
          const fileName = storageAPI.getFilePathFromUrl(existingPhotos.url_foto_2);
          if (fileName) await storageAPI.deleteFile(fileName);
        }
      }
      
      // Delete related photos record
      await api.delete(`/product_photos?product_id=eq.${productId}`);
      
      // Then delete the product
      await api.delete(`/products?id=eq.${productId}`);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  updateStock: async (productId, newStock) => {
    await api.patch(`/products?id=eq.${productId}`, { stok: newStock });
  }
};
