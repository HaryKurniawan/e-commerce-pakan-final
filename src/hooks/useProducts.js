// Update your useProducts hook to include fetchProducts function
// Add this function to your existing useProducts hook

import { useState, useEffect } from 'react';
import { productsAPI } from '../services/productsAPI'; // adjust import path as needed

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getAll();
      console.log('Fetched products:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const createProduct = async (productData) => {
    try {
      setLoading(true);
      console.log('Creating product with data:', productData);
      const newProduct = await productsAPI.create(productData);
      console.log('Created product:', newProduct);
      
      // Refresh the products list after creating
      await fetchProducts();
      
      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId, productData) => {
    try {
      setLoading(true);
      console.log('Updating product:', productId, 'with data:', productData);
      const updatedProduct = await productsAPI.update(productId, productData);
      console.log('Updated product:', updatedProduct);
      
      // Refresh the products list after updating
      await fetchProducts();
      
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    try {
      setLoading(true);
      console.log('Deleting product:', productId);
      await productsAPI.delete(productId);
      
      // Refresh the products list after deleting
      await fetchProducts();
      
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    products,
    loading,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct
  };
};